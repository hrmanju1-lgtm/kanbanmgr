import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import express from 'express';
import cors from 'cors';
import { boardRouter } from './routes/board';
import { cardsRouter } from './routes/cards';
import { peopleRouter } from './routes/people';
import { ingestionRouter } from './routes/ingestion';
import { recurrenceRouter } from './routes/recurrence';
import { teamDashboardRouter } from './routes/team-dashboard';
import { notificationsRouter } from './routes/notifications';
import { adminRouter } from './routes/admin';
import { authRouter, authenticateJwt } from './middleware/auth';
import { startRecurrenceCron } from './cron/recurrence';

const app = express();
app.use(cors());
app.use(express.json());

// Public routes
app.use('/api/auth', authRouter);

// External push API (API key auth - handled inside)
app.use('/api/v1', ingestionRouter);

// Protected routes (JWT)
app.use('/api/boards', authenticateJwt, boardRouter);
app.use('/api/cards', authenticateJwt, cardsRouter);
app.use('/api/people', authenticateJwt, peopleRouter);
app.use('/api/recurrence-rules', authenticateJwt, recurrenceRouter);
app.use('/api/team', authenticateJwt, teamDashboardRouter);
app.use('/api/notifications', authenticateJwt, notificationsRouter);
app.use('/api/admin', authenticateJwt, adminRouter);

// Serve React frontend in production
const frontendPath = path.resolve(__dirname, '../../../apps/web/dist');
app.use(express.static(frontendPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Start recurrence cron
startRecurrenceCron();

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ API running on http://localhost:${PORT}`));
