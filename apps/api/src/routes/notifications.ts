import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const notificationsRouter = Router();

// Get recent pushed cards (last 7 days)
notificationsRouter.get('/', async (req: Request, res: Response) => {
  const managerId = (req as any).managerId;
  const manager = await prisma.manager.findUnique({ where: { id: managerId }, include: { boards: true } });
  if (!manager) return res.status(404).json({ error: 'Not found' });

  const boardIds = manager.boards.map((b: any) => b.id);
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

  const cards = await prisma.card.findMany({
    where: {
      createdAt: { gt: sevenDaysAgo },
      source: { in: ['unit_manager', 'organization'] },
      swimlane: { boardId: { in: boardIds } },
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, source: true, priority: true, createdAt: true },
  });

  res.json(cards);
});
