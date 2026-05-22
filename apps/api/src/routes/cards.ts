import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const cardsRouter = Router();

// Create card
cardsRouter.post('/', async (req: Request, res: Response) => {
  const { swimlaneId, title, description, cardType, priority, reporteeId, dueDate } = req.body;
  const card = await prisma.card.create({
    data: { swimlaneId, title, description, cardType: cardType || 'org', priority: priority || 'medium', reporteeId, dueDate: dueDate ? new Date(dueDate) : undefined, source: 'self' },
  });
  res.status(201).json(card);
});

// Get card detail with notes and action items
cardsRouter.get('/:id', async (req: Request, res: Response) => {
  const card = await prisma.card.findUnique({
    where: { id: req.params.id },
    include: { notes: { orderBy: { createdAt: 'desc' } }, actionItems: true },
  });
  if (!card) return res.status(404).json({ error: 'Not found' });
  res.json(card);
});

// Move card (change status)
cardsRouter.patch('/:id/move', async (req: Request, res: Response) => {
  const { status } = req.body;
  const card = await prisma.card.findUnique({ where: { id: req.params.id } });
  if (!card) return res.status(404).json({ error: 'Not found' });

  // Only unit_manager tasks can be cancelled by the manager
  if (status === 'cancelled') {
    return res.status(403).json({ error: 'Tasks cannot be cancelled' });
  }

  const update: any = { status };
  // Auto-acknowledge pushed cards when moved from incoming
  if (card.source && card.source !== 'self' && card.status === 'todo' && status !== 'todo') {
    update.acknowledgedAt = new Date();
  }
  if (status === 'done') update.completedAt = new Date();
  if (status === 'cancelled') update.completedAt = new Date();

  const updated = await prisma.card.update({ where: { id: req.params.id }, data: update });
  res.json(updated);
});

// Update card
cardsRouter.patch('/:id', async (req: Request, res: Response) => {
  const { title, description, priority, dueDate } = req.body;
  const existing = await prisma.card.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Not found' });

  // Prevent due date modification on externally pushed cards
  const isPushed = existing.source && existing.source !== 'self';
  const card = await prisma.card.update({
    where: { id: req.params.id },
    data: { title, description, priority, dueDate: isPushed ? undefined : (dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined) },
  });
  res.json(card);
});

// Add note
cardsRouter.post('/:id/notes', async (req: Request, res: Response) => {
  const { content, noteType } = req.body;
  const note = await prisma.cardNote.create({
    data: { cardId: req.params.id, content, noteType: noteType || 'note' },
  });
  res.status(201).json(note);
});

// Add action item
cardsRouter.post('/:id/action-items', async (req: Request, res: Response) => {
  const { description, dueDate } = req.body;
  const item = await prisma.actionItem.create({
    data: { cardId: req.params.id, description, dueDate: dueDate ? new Date(dueDate) : undefined },
  });
  res.status(201).json(item);
});

// Toggle action item
cardsRouter.patch('/action-items/:id', async (req: Request, res: Response) => {
  const item = await prisma.actionItem.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ error: 'Not found' });
  const updated = await prisma.actionItem.update({ where: { id: req.params.id }, data: { isDone: !item.isDone } });
  res.json(updated);
});

// Delete card (only self-created)
cardsRouter.delete('/:id', async (req: Request, res: Response) => {
  const card = await prisma.card.findUnique({ where: { id: req.params.id } });
  if (!card) return res.status(404).json({ error: 'Not found' });
  if (card.source && card.source !== 'self') return res.status(403).json({ error: 'Cannot delete pushed tasks. Use cancel instead.' });
  await prisma.card.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
