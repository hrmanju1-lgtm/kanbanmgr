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
