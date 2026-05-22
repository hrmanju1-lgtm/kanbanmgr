import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function startRecurrenceCron() {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    console.log('[Recurrence] Checking for due rules...');
    const now = new Date();

    const dueRules = await prisma.recurrenceRule.findMany({
      where: { isActive: true, nextGenerateAt: { lte: now } },
    });

    for (const rule of dueRules) {
      // Create card from template
      await prisma.card.create({
        data: {
          swimlaneId: rule.swimlaneId,
          title: rule.templateTitle,
          cardType: 'org',
          status: 'todo',
          priority: rule.templatePriority,
          recurrenceRuleId: rule.id,
          source: 'self',
        },
      });

      // Calculate next generation date
      const next = new Date(now);
      switch (rule.frequency) {
        case 'daily': next.setDate(next.getDate() + 1); break;
        case 'weekly': next.setDate(next.getDate() + 7); break;
        case 'biweekly': next.setDate(next.getDate() + 14); break;
        case 'monthly': next.setMonth(next.getMonth() + 1); break;
        case 'quarterly': next.setMonth(next.getMonth() + 3); break;
      }
      next.setHours(9, 0, 0, 0);

      await prisma.recurrenceRule.update({ where: { id: rule.id }, data: { nextGenerateAt: next } });
      console.log(`[Recurrence] Generated: "${rule.templateTitle}", next: ${next.toISOString()}`);
    }
  });

  console.log('⏰ Recurrence cron scheduled (every hour)');
}
