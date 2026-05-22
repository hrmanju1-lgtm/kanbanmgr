import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const peopleRouter = Router();

// List reportees with health
peopleRouter.get('/', async (req: Request, res: Response) => {
  const managerId = (req as any).managerId;
  const reportees = await prisma.reportee.findMany({
    where: { managerId },
    include: { _count: { select: { cards: { where: { status: { not: 'done' } } } } } },
  });

  const now = Date.now();
  const result = reportees.map((r) => {
    const daysSince = r.last1on1Date ? Math.floor((now - r.last1on1Date.getTime()) / 86400000) : 999;
    const health = daysSince <= 7 ? 'green' : daysSince <= 14 ? 'yellow' : 'red';
    return { ...r, daysSinceLast1on1: daysSince, health, openCards: r._count.cards };
  });
  res.json(result);
});

// Log interaction
peopleRouter.post('/:id/interactions', async (req: Request, res: Response) => {
  const managerId = (req as any).managerId;
  const { interactionType, notes, sentiment } = req.body;

  const interaction = await prisma.interactionLog.create({
    data: { managerId, reporteeId: req.params.id, interactionType, notes, sentiment },
  });

  // Update last1on1Date if it's a 1on1
  if (interactionType === '1on1') {
    await prisma.reportee.update({ where: { id: req.params.id }, data: { last1on1Date: new Date() } });
  }
  res.status(201).json(interaction);
});

// Get interactions for a reportee
peopleRouter.get('/:id/interactions', async (req: Request, res: Response) => {
  const interactions = await prisma.interactionLog.findMany({
    where: { reporteeId: req.params.id },
    orderBy: { occurredAt: 'desc' },
    take: 20,
  });
  res.json(interactions);
});
