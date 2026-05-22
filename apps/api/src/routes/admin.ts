import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
export const adminRouter = Router();

// --- Senior Managers ---

adminRouter.get('/senior-managers', async (_req: Request, res: Response) => {
  const managers = await prisma.manager.findMany({
    where: { role: 'senior_manager' },
    select: { id: true, name: true, email: true, orgUnit: true, createdAt: true, lineManagers: { select: { id: true, name: true } } },
  });
  res.json(managers);
});

adminRouter.post('/senior-managers', async (req: Request, res: Response) => {
  const { name, email, password, orgUnit } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });

  const manager = await prisma.manager.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 10), orgUnit, role: 'senior_manager' },
  });

  // Auto-create board with swimlanes
  await prisma.board.create({
    data: {
      managerId: manager.id,
      title: 'My Board',
      swimlanes: { create: [
        { type: 'org', title: 'Org Tasks', position: 0 },
        { type: 'unit', title: 'Unit Tasks', position: 1 },
        { type: 'team', title: 'Team Tasks', position: 2 },
      ]},
    },
  });

  res.status(201).json({ id: manager.id, name: manager.name, email: manager.email });
});

adminRouter.delete('/senior-managers/:id', async (req: Request, res: Response) => {
  await prisma.manager.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// --- Line Managers ---

adminRouter.get('/line-managers', async (_req: Request, res: Response) => {
  const managers = await prisma.manager.findMany({
    where: { role: 'line_manager' },
    select: { id: true, name: true, email: true, orgUnit: true, seniorManagerId: true, createdAt: true,
      seniorManager: { select: { name: true } },
      reportees: { select: { id: true, name: true } },
    },
  });
  res.json(managers);
});

adminRouter.post('/line-managers', async (req: Request, res: Response) => {
  const { name, email, password, orgUnit, seniorManagerId } = req.body;
  if (!name || !email || !password || !seniorManagerId) return res.status(400).json({ error: 'name, email, password, seniorManagerId required' });

  const manager = await prisma.manager.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 10), orgUnit, role: 'line_manager', seniorManagerId },
  });

  // Auto-create board with swimlanes
  await prisma.board.create({
    data: {
      managerId: manager.id,
      title: 'My Board',
      swimlanes: { create: [
        { type: 'org', title: 'Org Tasks', position: 0 },
        { type: 'unit', title: 'Unit Tasks', position: 1 },
        { type: 'team', title: 'Team Tasks', position: 2 },
      ]},
    },
  });

  // Also create a person swimlane on the senior manager's board
  const smBoard = await prisma.board.findFirst({ where: { managerId: seniorManagerId } });
  if (smBoard) {
    const maxPos = await prisma.swimlane.findFirst({ where: { boardId: smBoard.id }, orderBy: { position: 'desc' } });
    await prisma.reportee.create({
      data: { managerId: seniorManagerId, name, email, role: `Line Manager - ${orgUnit || ''}` },
    }).then(async (reportee) => {
      await prisma.swimlane.create({
        data: { boardId: smBoard.id, type: 'person', title: name, reporteeId: reportee.id, position: (maxPos?.position || 0) + 1 },
      });
    });
  }

  res.status(201).json({ id: manager.id, name: manager.name, email: manager.email });
});

adminRouter.delete('/line-managers/:id', async (req: Request, res: Response) => {
  await prisma.manager.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// --- Reportees ---

adminRouter.get('/reportees', async (_req: Request, res: Response) => {
  const reportees = await prisma.reportee.findMany({
    where: { manager: { role: 'line_manager' } },
    include: { manager: { select: { name: true, id: true } } },
  });
  res.json(reportees);
});

adminRouter.post('/reportees', async (req: Request, res: Response) => {
  const { name, email, role, managerId } = req.body;
  if (!name || !managerId) return res.status(400).json({ error: 'name, managerId required' });

  const reportee = await prisma.reportee.create({
    data: { name, email, role, managerId },
  });

  // Auto-create person swimlane on the manager's board
  const board = await prisma.board.findFirst({ where: { managerId } });
  if (board) {
    const maxPos = await prisma.swimlane.findFirst({ where: { boardId: board.id }, orderBy: { position: 'desc' } });
    await prisma.swimlane.create({
      data: { boardId: board.id, type: 'person', title: name, reporteeId: reportee.id, position: (maxPos?.position || 0) + 1 },
    });
  }

  res.status(201).json(reportee);
});

adminRouter.delete('/reportees/:id', async (req: Request, res: Response) => {
  await prisma.reportee.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// --- Org Tree ---

adminRouter.get('/org-tree', async (_req: Request, res: Response) => {
  const tree = await prisma.manager.findMany({
    where: { role: 'senior_manager' },
    select: {
      id: true, name: true, email: true, orgUnit: true,
      lineManagers: {
        select: {
          id: true, name: true, email: true, orgUnit: true,
          reportees: { select: { id: true, name: true, role: true, email: true } },
        },
      },
    },
  });
  res.json(tree);
});
