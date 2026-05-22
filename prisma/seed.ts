import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.actionItem.deleteMany();
  await prisma.cardNote.deleteMany();
  await prisma.card.deleteMany();
  await prisma.recurrenceRule.deleteMany();
  await prisma.swimlane.deleteMany();
  await prisma.board.deleteMany();
  await prisma.interactionLog.deleteMany();
  await prisma.reportee.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.manager.deleteMany();

  // Create admin
  await prisma.manager.create({
    data: {
      email: 'admin@demo.com',
      name: 'Admin',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'admin',
    },
  });

  // Create senior manager
  const seniorManager = await prisma.manager.create({
    data: {
      email: 'ramesh@demo.com',
      name: 'Ramesh K',
      passwordHash: await bcrypt.hash('demo123', 10),
      orgUnit: 'Engineering',
      role: 'senior_manager',
    },
  });

  // Create line manager (under senior manager)
  const manager = await prisma.manager.create({
    data: {
      email: 'manju@demo.com',
      name: 'Manju R',
      passwordHash: await bcrypt.hash('demo123', 10),
      orgUnit: 'Network Operations',
      role: 'line_manager',
      seniorManagerId: seniorManager.id,
    },
  });

  // Create a second line manager
  const manager2 = await prisma.manager.create({
    data: {
      email: 'suresh@demo.com',
      name: 'Suresh P',
      passwordHash: await bcrypt.hash('demo123', 10),
      orgUnit: 'Cloud Platform',
      role: 'line_manager',
      seniorManagerId: seniorManager.id,
    },
  });

  // Create board for senior manager with line managers as reportees
  const now = new Date();
  const smReportee1 = await prisma.reportee.create({ data: { managerId: seniorManager.id, name: 'Manju R', email: 'manju@demo.com', role: 'Line Manager - Network Operations', last1on1Date: new Date(now.getTime() - 4 * 86400000), riskLevel: 'none' } });
  const smReportee2 = await prisma.reportee.create({ data: { managerId: seniorManager.id, name: 'Suresh P', email: 'suresh@demo.com', role: 'Line Manager - Cloud Platform', last1on1Date: new Date(now.getTime() - 11 * 86400000), riskLevel: 'low' } });

  await prisma.board.create({
    data: {
      managerId: seniorManager.id,
      title: 'My Board',
      swimlanes: {
        create: [
          { type: 'org', title: 'Org Tasks', position: 0 },
          { type: 'unit', title: 'Unit Tasks', position: 1 },
          { type: 'team', title: 'Team Tasks', position: 2 },
          { type: 'person', title: 'Manju R', reporteeId: smReportee1.id, position: 3 },
          { type: 'person', title: 'Suresh P', reporteeId: smReportee2.id, position: 4 },
        ],
      },
    },
  });

  // Create board
  const board = await prisma.board.create({
    data: { managerId: manager.id, title: 'My Board' },
  });

  // Create reportees
  const reportees = await Promise.all([
    prisma.reportee.create({ data: { managerId: manager.id, name: 'Rahul S', role: 'Senior Engineer', email: 'rahul@demo.com', last1on1Date: new Date(now.getTime() - 3 * 86400000), riskLevel: 'none' } }),
    prisma.reportee.create({ data: { managerId: manager.id, name: 'Priya M', role: 'Tech Lead', email: 'priya@demo.com', last1on1Date: new Date(now.getTime() - 18 * 86400000), riskLevel: 'medium' } }),
    prisma.reportee.create({ data: { managerId: manager.id, name: 'Anil K', role: 'Engineer', email: 'anil@demo.com', last1on1Date: new Date(now.getTime() - 9 * 86400000), riskLevel: 'high' } }),
    prisma.reportee.create({ data: { managerId: manager.id, name: 'Neha T', role: 'Senior Engineer', email: 'neha@demo.com', last1on1Date: new Date(now.getTime() - 5 * 86400000), riskLevel: 'none' } }),
    prisma.reportee.create({ data: { managerId: manager.id, name: 'Vikram D', role: 'Engineer', email: 'vikram@demo.com', last1on1Date: new Date(now.getTime() - 12 * 86400000), riskLevel: 'low' } }),
  ]);

  // Create swimlanes
  const orgSwimlane = await prisma.swimlane.create({ data: { boardId: board.id, type: 'org', title: 'Org Tasks', position: 0 } });
  const unitSwimlane = await prisma.swimlane.create({ data: { boardId: board.id, type: 'unit', title: 'Unit Tasks', position: 1 } });
  const teamSwimlane = await prisma.swimlane.create({ data: { boardId: board.id, type: 'team', title: 'Team Tasks', position: 2 } });

  const reporteeSwimlanes = await Promise.all(
    reportees.map((r, i) =>
      prisma.swimlane.create({ data: { boardId: board.id, type: 'person', reporteeId: r.id, title: r.name, position: i + 3 } })
    )
  );

  // Create sample cards
  await prisma.card.createMany({
    data: [
      { swimlaneId: orgSwimlane.id, title: 'Submit team utilization report', cardType: 'org', status: 'todo', priority: 'medium', dueDate: new Date(now.getTime() + 2 * 86400000), source: 'organization' },
      { swimlaneId: orgSwimlane.id, title: 'Compliance training follow-up', cardType: 'org', status: 'done', priority: 'medium', completedAt: new Date(now.getTime() - 86400000), source: 'organization' },
      { swimlaneId: unitSwimlane.id, title: 'Budget input for Q3', cardType: 'org', status: 'todo', priority: 'high', dueDate: new Date(now.getTime() + 7 * 86400000), source: 'unit_manager' },
      { swimlaneId: reporteeSwimlanes[0].id, title: '1-on-1 with Rahul - Growth plan', cardType: 'people', status: 'todo', priority: 'medium', reporteeId: reportees[0].id, source: 'self' },
      { swimlaneId: reporteeSwimlanes[1].id, title: 'Promotion case for Priya', cardType: 'people', status: 'todo', priority: 'high', reporteeId: reportees[1].id, source: 'self' },
      { swimlaneId: reporteeSwimlanes[1].id, title: 'Waiting on HR input - Priya', cardType: 'people', status: 'waiting', priority: 'medium', reporteeId: reportees[1].id, source: 'self' },
      { swimlaneId: reporteeSwimlanes[2].id, title: 'Burnout monitoring - Anil', cardType: 'people', status: 'in_progress', priority: 'critical', reporteeId: reportees[2].id, source: 'self' },
      { swimlaneId: reporteeSwimlanes[3].id, title: 'Skill development plan - Neha', cardType: 'people', status: 'in_progress', priority: 'low', reporteeId: reportees[3].id, source: 'self' },
      { swimlaneId: reporteeSwimlanes[4].id, title: 'Onboarding checklist - Vikram', cardType: 'people', status: 'waiting', priority: 'medium', reporteeId: reportees[4].id, source: 'self' },
      { swimlaneId: teamSwimlane.id, title: 'Team B conflict resolution', cardType: 'people', status: 'todo', priority: 'critical', source: 'self' },
    ],
  });

  // Create recurrence rules
  await prisma.recurrenceRule.createMany({
    data: [
      { managerId: manager.id, swimlaneId: orgSwimlane.id, frequency: 'weekly', dayOfWeek: 1, templateTitle: 'Submit weekly utilization report', templatePriority: 'medium', nextGenerateAt: getNextWeekday(1) },
      { managerId: manager.id, swimlaneId: orgSwimlane.id, frequency: 'monthly', dayOfMonth: 1, templateTitle: 'Monthly team review submission', templatePriority: 'high', nextGenerateAt: getNextMonthDay(1) },
      { managerId: manager.id, swimlaneId: orgSwimlane.id, frequency: 'quarterly', dayOfMonth: 15, templateTitle: 'Quarterly goals update', templatePriority: 'high', nextGenerateAt: getNextQuarterDay(15) },
    ],
  });

  // Create demo API keys
  // Unit-level key (Senior Manager pushing to line managers)
  await prisma.apiKey.create({
    data: {
      managerId: seniorManager.id,
      keyHash: await bcrypt.hash('demo-push-key-12345', 10),
      name: 'Senior Manager - Ramesh K',
      sourceType: 'unit_manager',
      sourceId: seniorManager.id,
    },
  });
  // Org-level key (Organization pushing via API)
  await prisma.apiKey.create({
    data: {
      managerId: null,
      keyHash: await bcrypt.hash('demo-org-key-99999', 10),
      name: 'Organization - HR Systems',
      sourceType: 'organization',
      sourceId: 'org-hr-system',
    },
  });

  // Create board for second line manager
  const board2 = await prisma.board.create({
    data: { managerId: manager2.id, title: 'My Board' },
  });
  const orgSwimlane2 = await prisma.swimlane.create({ data: { boardId: board2.id, type: 'org', title: 'Org Tasks', position: 0 } });
  await prisma.swimlane.create({ data: { boardId: board2.id, type: 'unit', title: 'Unit Tasks', position: 1 } });
  await prisma.swimlane.create({ data: { boardId: board2.id, type: 'team', title: 'Team Tasks', position: 2 } });
  await prisma.card.createMany({
    data: [
      { swimlaneId: orgSwimlane2.id, title: 'Cloud migration status report', cardType: 'org', status: 'in_progress', priority: 'high', source: 'organization' },
      { swimlaneId: orgSwimlane2.id, title: 'Platform SLA review', cardType: 'org', status: 'todo', priority: 'medium', dueDate: new Date(now.getTime() + 5 * 86400000), source: 'organization' },
    ],
  });

  console.log('✅ Seed complete!');
  console.log(`   Senior Manager: ramesh@demo.com / demo123 (ID: ${seniorManager.id})`);
  console.log(`   Line Manager 1: manju@demo.com / demo123 (ID: ${manager.id})`);
  console.log(`   Line Manager 2: suresh@demo.com / demo123 (ID: ${manager2.id})`);
  console.log(`   Unit API Key: demo-push-key-12345 (pushes as Senior Manager)`);
  console.log(`   Org API Key:  demo-org-key-99999 (pushes as Organization)`);
}

function getNextWeekday(day: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + ((day - d.getDay() + 7) % 7 || 7));
  d.setHours(9, 0, 0, 0);
  return d;
}

function getNextMonthDay(day: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, day);
  d.setHours(9, 0, 0, 0);
  return d;
}

function getNextQuarterDay(day: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + 3, day);
  d.setHours(9, 0, 0, 0);
  return d;
}

main().catch(console.error).finally(() => prisma.$disconnect());
