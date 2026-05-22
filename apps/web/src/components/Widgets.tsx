import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

export default function Widgets() {
  const { data: board } = useQuery({ queryKey: ['board'], queryFn: () => api.get('/boards').then((r) => r.data) });

  if (!board) return null;

  const now = Date.now();
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(23, 59, 59, 999);

  const allCards = board.swimlanes.flatMap((s: any) => s.cards);
  const activeCards = allCards.filter((c: any) => c.status !== 'done');
  const overdueCards = activeCards.filter((c: any) => c.dueDate && new Date(c.dueDate) < new Date());
  const orgLevel = activeCards.filter((c: any) => c.source === 'organization').length;
  const unitLevel = activeCards.filter((c: any) => c.source === 'unit_manager').length;
  const teamLevel = activeCards.filter((c: any) => !c.source || c.source === 'self').length;
  const unacked = activeCards.filter((c: any) => c.source && c.source !== 'self' && !c.acknowledgedAt).length;

  const staleReportees = board.swimlanes
    .filter((s: any) => s.type === 'person' && s.reportee)
    .map((s: any) => ({ name: s.title, days: s.reportee.last1on1Date ? Math.floor((now - new Date(s.reportee.last1on1Date).getTime()) / 86400000) : 999 }))
    .filter((r: any) => r.days > 14);

  // --- Today's Focus: generate nudges ---
  const nudges: { icon: string; text: string; priority: number }[] = [];

  const unackedCards = activeCards.filter((c: any) => c.source && c.source !== 'self' && !c.acknowledgedAt);
  if (unackedCards.length > 0) {
    nudges.push({ icon: '📥', text: `${unackedCards.length} unacknowledged task${unackedCards.length > 1 ? 's' : ''} — review and start`, priority: 1 });
  }

  overdueCards.forEach((c: any) => {
    const days = Math.floor((now - new Date(c.dueDate).getTime()) / 86400000);
    nudges.push({ icon: '🔥', text: `"${c.title}" is ${days}d overdue`, priority: 2 });
  });

  activeCards.filter((c: any) => c.dueDate && new Date(c.dueDate) > new Date() && new Date(c.dueDate) <= tomorrow).forEach((c: any) => {
    nudges.push({ icon: '⏰', text: `"${c.title}" is due ${new Date(c.dueDate).toDateString() === new Date().toDateString() ? 'today' : 'tomorrow'}`, priority: 3 });
  });

  staleReportees.forEach((r: any) => {
    nudges.push({ icon: '🔴', text: `${r.name} — no 1-on-1 in ${r.days} days`, priority: 4 });
  });

  activeCards.filter((c: any) => c.status === 'waiting' && c.createdAt).forEach((c: any) => {
    const days = Math.floor((now - new Date(c.createdAt).getTime()) / 86400000);
    if (days > 5) nudges.push({ icon: '⏳', text: `"${c.title}" stuck in Waiting for ${days}d`, priority: 5 });
  });

  // Reportees with last 3 sentiments all "concern"
  board.swimlanes
    .filter((s: any) => s.type === 'person' && s.reportee?.interactions?.length >= 3)
    .forEach((s: any) => {
      const allConcern = s.reportee.interactions.every((i: any) => i.sentiment === 'concern');
      if (allConcern) nudges.push({ icon: '😟', text: `${s.title} — concern flagged in last 3 meetings`, priority: 3 });
    });

  const topNudges = nudges.sort((a, b) => a.priority - b.priority).slice(0, 5);

  return (
    <div className="px-6 py-4 space-y-3">
      <div className="grid grid-cols-6 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-red-400">
          <div className="text-2xl font-bold text-red-600">{overdueCards.length}</div>
          <div className="text-sm text-gray-500">Overdue</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-rose-400">
          <div className="text-2xl font-bold text-rose-600">{staleReportees.length}</div>
          <div className="text-sm text-gray-500">🚨 Stale 1-on-1s</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-amber-400">
          <div className="text-2xl font-bold text-amber-600">{orgLevel}</div>
          <div className="text-sm text-gray-500">🏢 Org Level</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-purple-400">
          <div className="text-2xl font-bold text-purple-600">{unitLevel}</div>
          <div className="text-sm text-gray-500">📥 Unit Level</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-400">
          <div className="text-2xl font-bold text-blue-600">{teamLevel}</div>
          <div className="text-sm text-gray-500">✏️ Team Level</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-yellow-400">
          <div className="text-2xl font-bold text-yellow-600">{unacked}</div>
          <div className="text-sm text-gray-500">⏳ Unacknowledged</div>
        </div>
      </div>

      {topNudges.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-indigo-800 mb-2">🎯 Today's Focus</h3>
          <ul className="space-y-1.5">
            {topNudges.map((n, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-indigo-900">
                <span>{n.icon}</span>
                <span>{n.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
