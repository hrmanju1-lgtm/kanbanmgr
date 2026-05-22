import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const recurrenceRouter = Router();

// List rules
recurrenceRouter.get('/', async (req: Request, res: Response) => {
  const managerId = (req as any).managerId;
  const rules = await prisma.recurrenceRule.findMany({ where: { managerId } });
  res.json(rules);
});

// Create rule
recurrenceRouter.post('/', async (req: Request, res: Response) => {
  const managerId = (req as any).managerId;
  const { swimlaneId, frequency, dayOfWeek, dayOfMonth, templateTitle, templatePriority } = req.body;

  const nextGenerateAt = new Date();
  nextGenerateAt.setDate(nextGenerateAt.getDate() + 1);

  const rule = await prisma.recurrenceRule.create({
    data: { managerId, swimlaneId, frequency, dayOfWeek, dayOfMonth, templateTitle, templatePriority: templatePriority || 'medium', nextGenerateAt },
  });
  res.status(201).json(rule);
});

// Delete (deactivate) rule
recurrenceRouter.delete('/:id', async (req: Request, res: Response) => {
  await prisma.recurrenceRule.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.status(204).send();
});
