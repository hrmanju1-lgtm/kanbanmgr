import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const teamDashboardRouter = Router();

// Get line managers under this senior manager
teamDashboardRouter.get('/line-managers', async (req: Request, res: Response) => {
  const managerId = (req as any).managerId;
  const lineManagers = await prisma.manager.findMany({
    where: { seniorManagerId: managerId },
    select: { id: true, name: true, email: true, orgUnit: true },
  });
  res.json(lineManagers);
});

// Get org/unit-level cards from all line managers' boards (senior manager)
// OR reportees' cards from person swimlanes (line manager)
teamDashboardRouter.get('/overview', async (req: Request, res: Response) => {
  const managerId = (req as any).managerId;
  const showDone = req.query.showDone === 'true';
  const manager = await prisma.manager.findUnique({ where: { id: managerId } });

  if (manager?.role === 'senior_manager') {
    const statusFilter = showDone ? {} : { status: { not: 'done' } };
    const lineManagers = await prisma.manager.findMany({
      where: { seniorManagerId: managerId },
      include: {
        boards: {
          include: {
            swimlanes: {
              include: {
                cards: {
                  where: { ...statusFilter, source: { in: ['unit_manager', 'organization'] } },
                  orderBy: { createdAt: 'desc' },
                  include: { notes: { orderBy: { createdAt: 'desc' }, take: 5 } },
                },
              },
            },
          },
        },
      },
    });

    const getLayer = (source: string | null) => {
      if (source === 'organization') return 'org';
      if (source === 'unit_manager') return 'unit';
      return 'team';
    };

    const result = lineManagers.map((lm) => ({
      managerId: lm.id,
      managerName: lm.name,
      orgUnit: lm.orgUnit,
      cards: lm.boards.flatMap((b) =>
        b.swimlanes.flatMap((s) =>
          s.cards.map((c) => ({
            id: c.id,
            title: c.title,
            status: c.status,
            priority: c.priority,
            cardType: c.cardType,
            dueDate: c.dueDate,
            createdAt: c.createdAt,
            source: c.source,
            layer: getLayer(c.source),
            acknowledgedAt: c.acknowledgedAt,
            swimlaneType: s.type,
            notes: c.notes,
          }))
        )
      ),
    }));

    return res.json(result);
  }

  // Line manager: show reportees and their cards
  const statusFilter = showDone ? {} : { status: { not: 'done' } };
  const reportees = await prisma.reportee.findMany({
    where: { managerId },
    include: {
      cards: {
        where: statusFilter,
        orderBy: { createdAt: 'desc' },
        include: { notes: { orderBy: { createdAt: 'desc' }, take: 5 } },
      },
    },
  });

  const getLayer = (source: string | null) => {
    if (source === 'organization') return 'org';
    if (source === 'unit_manager') return 'unit';
    return 'team';
  };

  const result = reportees.map((r) => ({
    managerId: r.id,
    managerName: r.name,
    orgUnit: r.role,
    cards: r.cards.map((c) => ({
      id: c.id,
      title: c.title,
      status: c.status,
      priority: c.priority,
      cardType: c.cardType,
      dueDate: c.dueDate,
      createdAt: c.createdAt,
      source: c.source,
      layer: getLayer(c.source),
      acknowledgedAt: c.acknowledgedAt,
      swimlaneType: 'person',
      notes: c.notes,
    })),
  }));

  res.json(result);
});

// Push initiative to one or more line managers
teamDashboardRouter.post('/push-initiative', async (req: Request, res: Response) => {
  const managerId = (req as any).managerId;
  const { title, description, priority, dueDate, targetManagerIds } = req.body;

  if (!title || !dueDate || !targetManagerIds?.length) {
    return res.status(400).json({ error: 'title, dueDate, and targetManagerIds required' });
  }

  // Verify targets are actual line managers of this senior manager
  const validTargets = await prisma.manager.findMany({
    where: { id: { in: targetManagerIds }, seniorManagerId: managerId },
    include: { boards: { include: { swimlanes: { where: { type: 'unit' } } } } },
  });

  const pusher = await prisma.manager.findUnique({ where: { id: managerId }, select: { name: true } });

  const created = [];
  for (const target of validTargets) {
    const swimlaneId = target.boards[0]?.swimlanes[0]?.id;
    if (!swimlaneId) continue;

    const card = await prisma.card.create({
      data: {
        swimlaneId,
        title,
        description,
        cardType: 'org',
        status: 'todo',
        priority: priority || 'high',
        dueDate: dueDate ? new Date(dueDate) : undefined,
        source: 'unit_manager',
        sourceId: managerId,
        sourceMeta: { pushedBy: pusher?.name || 'Senior Manager' },
      },
    });
    created.push({ managerId: target.id, managerName: target.name, cardId: card.id });
  }

  res.status(201).json({ pushed: created.length, details: created });
});

// Heatmap data
teamDashboardRouter.get('/heatmap', async (req: Request, res: Response) => {
  const managerId = (req as any).managerId;
  const manager = await prisma.manager.findUnique({ where: { id: managerId } });

  if (manager?.role === 'senior_manager') {
    // Senior Manager: show line managers' health
    const lineManagers = await prisma.manager.findMany({
      where: { seniorManagerId: managerId },
      include: {
        reportees: { select: { last1on1Date: true } },
        boards: { include: { swimlanes: { include: { cards: { where: { status: { not: 'done' } } } } } } },
      },
    });

    const result = lineManagers.map(lm => {
      const allCards = lm.boards.flatMap(b => b.swimlanes.flatMap(s => s.cards));
      const orgUnitCards = allCards.filter(c => c.source === 'organization' || c.source === 'unit_manager');
      const unacked = orgUnitCards.filter(c => !c.acknowledgedAt).length;
      const staleReportees = lm.reportees.filter(r => {
        const days = r.last1on1Date ? Math.floor((Date.now() - r.last1on1Date.getTime()) / 86400000) : 999;
        return days > 14;
      }).length;
      return {
        name: lm.name,
        orgUnit: lm.orgUnit,
        staleReportees,
        totalReportees: lm.reportees.length,
        openOrgUnitTasks: orgUnitCards.length,
        unacknowledged: unacked,
      };
    });
    return res.json(result);
  }

  // Line Manager: show reportees' health
  const reportees = await prisma.reportee.findMany({
    where: { managerId },
    include: {
      cards: { where: { status: { not: 'done' } } },
      interactions: { orderBy: { occurredAt: 'desc' }, take: 3, select: { sentiment: true } },
    },
  });

  const result = reportees.map(r => {
    const days = r.last1on1Date ? Math.floor((Date.now() - r.last1on1Date.getTime()) / 86400000) : 999;
    const health = days <= 7 ? 'green' : days <= 14 ? 'yellow' : 'red';
    const sentiments = r.interactions.map(i => i.sentiment);
    const sentimentStatus = sentiments.length >= 3 && sentiments.every(s => s === 'concern') ? 'concern' : sentiments[0] || 'none';
    return {
      name: r.name,
      role: r.role,
      daysSince1on1: days,
      health,
      openTasks: r.cards.length,
      riskLevel: r.riskLevel,
      sentiment: sentimentStatus,
    };
  });
  res.json(result);
});
