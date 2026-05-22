import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'managerflow-demo-secret-change-in-prod';

export const authRouter = Router();

// Login
authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const manager = await prisma.manager.findUnique({ where: { email } });
  if (!manager || !(await bcrypt.compare(password, manager.passwordHash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ managerId: manager.id }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, manager: { id: manager.id, name: manager.name, email: manager.email, role: manager.role } });
});

// JWT middleware
export function authenticateJwt(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as { managerId: string };
    (req as any).managerId = payload.managerId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// API Key validation (for external push)
export async function authenticateApiKey(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'No API key' });
  const key = auth.slice(7);

  const apiKeys = await prisma.apiKey.findMany({ where: { isActive: true } });
  for (const ak of apiKeys) {
    if (await bcrypt.compare(key, ak.keyHash)) {
      (req as any).apiKey = ak;
      return next();
    }
  }
  res.status(401).json({ error: 'Invalid API key' });
}
