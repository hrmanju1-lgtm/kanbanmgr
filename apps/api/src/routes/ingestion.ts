import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticateApiKey } from '../middleware/auth';

const prisma = new PrismaClient();
export const ingestionRouter = Router();

const pushTaskSchema = z.object({
  title: z.string().max(255),
  description: z.string().max(2000).optional(),
  cardType: z.enum(['org', 'people']).default('org'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  dueDate: z.string().min(1, 'dueDate is required for org/unit tasks'),
  reporteeId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Push task to a manager's board
ingestionRouter.post('/managers/:managerId/tasks', authenticateApiKey, async (req: Request, res: Response) => {
  const { managerId } = req.params;
  const apiKey = (req as any).apiKey;

  // Validate body
  const parsed = pushTaskSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });

  const data = parsed.data;

  // Find manager's board
  const board = await prisma.board.findFirst({ where: { managerId }, include: { swimlanes: true } });
  if (!board) return res.status(404).json({ error: 'Manager not found' });

  // Resolve swimlane
  let swimlaneId: string;
  if (data.reporteeId) {
    swimlaneId = board.swimlanes.find((s) => s.reporteeId === data.reporteeId)?.id || board.swimlanes[0].id;
  } else if (apiKey.sourceType === 'unit_manager') {
    swimlaneId = board.swimlanes.find((s) => s.type === 'unit')?.id || board.swimlanes[0].id;
  } else {
    swimlaneId = board.swimlanes.find((s) => s.type === 'org')?.id || board.swimlanes[0].id;
  }

  // Create card
  const card = await prisma.card.create({
    data: {
      swimlaneId,
      title: data.title,
      description: data.description,
      cardType: data.cardType,
      status: 'todo',
      priority: data.priority,
      reporteeId: data.reporteeId,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      source: apiKey.sourceType,
      sourceId: apiKey.sourceId,
      sourceMeta: (data.metadata || { pushedBy: apiKey.name }) as any,
    },
  });

  res.status(201).json({ cardId: card.id, status: card.status, acknowledged: false, boardId: board.id });
});

// Query task status
ingestionRouter.get('/tasks/:cardId/status', authenticateApiKey, async (req: Request, res: Response) => {
  const card = await prisma.card.findUnique({ where: { id: req.params.cardId } });
  if (!card) return res.status(404).json({ error: 'Not found' });

  res.json({
    cardId: card.id,
    acknowledged: !!card.acknowledgedAt,
    acknowledgedAt: card.acknowledgedAt,
    currentStatus: card.status,
    createdAt: card.createdAt,
    dueDate: card.dueDate,
  });
});

// Bulk push to ALL managers (org-level broadcast)
ingestionRouter.post('/org/broadcast', authenticateApiKey, async (req: Request, res: Response) => {
  const apiKey = (req as any).apiKey;
  if (apiKey.sourceType !== 'organization') return res.status(403).json({ error: 'Only organization keys can broadcast' });

  const parsed = pushTaskSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });

  const data = parsed.data;

  const boards = await prisma.board.findMany({ include: { swimlanes: true } });

  const created = [];
  for (const board of boards) {
    const swimlaneId = board.swimlanes.find((s) => s.type === 'org')?.id;
    if (!swimlaneId) continue;

    const card = await prisma.card.create({
      data: {
        swimlaneId,
        title: data.title,
        description: data.description,
        cardType: data.cardType,
        status: 'todo',
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        source: 'organization',
        sourceId: apiKey.sourceId,
        sourceMeta: (data.metadata || { pushedBy: apiKey.name }) as any,
      },
    });
    created.push({ managerId: board.managerId, cardId: card.id });
  }

  res.status(201).json({ pushed: created.length, details: created });
});
