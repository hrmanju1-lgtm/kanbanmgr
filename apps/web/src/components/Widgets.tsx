import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

export default function Widgets() {
  const { data: board } = useQuery({ queryKey: ['board'], queryFn: () => api.get('/boards').then((r) => r.data) });

  if (!board) return null;

  const allCards = board.swimlanes.flatMap((s: any) => s.cards);
  const overdueCards = allCards.filter((c: any) => c.dueDate && new Date(c.dueDate) < new Date() && c.status !== 'done');
  const orgLevel = allCards.filter((c: any) => c.source === 'organization' && c.status !== 'done').length;
  const unitLevel = allCards.filter((c: any) => c.source === 'unit_manager' && c.status !== 'done').length;
  const teamLevel = allCards.filter((c: any) => (!c.source || c.source === 'self') && c.status !== 'done').length;
  const unacked = allCards.filter((c: any) => c.source && c.source !== 'self' && !c.acknowledgedAt).length;

  const staleReportees = board.swimlanes
    .filter((s: any) => s.type === 'person' && s.reportee)
    .map((s: any) => ({ name: s.title, days: s.reportee.last1on1Date ? Math.floor((Date.now() - new Date(s.reportee.last1on1Date).getTime()) / 86400000) : 999 }))
    .filter((r: any) => r.days > 14);

  const needsAttention = overdueCards.length > 0 || staleReportees.length > 0;

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

      {needsAttention && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-red-800 mb-2">⚠️ Needs Attention</h3>
          <div className="flex flex-wrap gap-3">
            {overdueCards.map((c: any) => (
              <span key={c.id} className="inline-flex items-center gap-1 bg-white border border-red-200 rounded-full px-3 py-1 text-xs text-red-700">
                📅 <span className="font-medium truncate max-w-[200px]">{c.title}</span>
                <span className="text-red-400">({Math.floor((Date.now() - new Date(c.dueDate).getTime()) / 86400000)}d overdue)</span>
              </span>
            ))}
            {staleReportees.map((r: any) => (
              <span key={r.name} className="inline-flex items-center gap-1 bg-white border border-red-200 rounded-full px-3 py-1 text-xs text-red-700">
                👤 <span className="font-medium">{r.name}</span>
                <span className="text-red-400">(no 1-on-1 in {r.days}d)</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
