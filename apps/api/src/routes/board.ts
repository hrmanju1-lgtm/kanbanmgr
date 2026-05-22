import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const boardRouter = Router();

// Get manager's board with all swimlanes and cards
// Auto-archives: hides Done cards older than 7 days
boardRouter.get('/', async (req: Request, res: Response) => {
  const managerId = (req as any).managerId;
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

  const board = await prisma.board.findFirst({
    where: { managerId },
    include: {
      swimlanes: {
        orderBy: { position: 'asc' },
        include: {
          reportee: { include: { interactions: { orderBy: { occurredAt: 'desc' }, take: 3, select: { sentiment: true } } } },
          cards: {
            where: {
              OR: [
                { status: { not: 'done' } },
                { completedAt: { gte: sevenDaysAgo } },
                { completedAt: null, status: 'done' },
              ],
            },
            orderBy: { position: 'asc' },
            include: { actionItems: true },
          },
        },
      },
    },
  });
  if (!board) return res.status(404).json({ error: 'No board found' });
  res.json(board);
});
