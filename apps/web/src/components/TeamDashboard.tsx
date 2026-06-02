import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../api/client';

const STATUS_ORDER = ['todo', 'in_progress', 'waiting', 'done', 'cancelled'];
const STATUS_LABELS: Record<string, string> = { todo: 'To Do', in_progress: 'In Progress', waiting: 'Waiting', done: 'Done', cancelled: 'Cancelled' };
const STATUS_COLORS: Record<string, string> = {
  todo: 'bg-gray-200 text-gray-700',
  in_progress: 'bg-yellow-100 text-yellow-800',
  waiting: 'bg-orange-100 text-orange-700',
  done: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};
const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};
const LAYER_LABELS: Record<string, string> = { org: '🏢 Org', unit: '📥 Unit', team: '✏️ Team' };
const LAYER_COLORS: Record<string, string> = { org: 'bg-amber-50 text-amber-700', unit: 'bg-purple-50 text-purple-700', team: 'bg-blue-50 text-blue-700' };

export default function TeamDashboard({ role }: { role: string | null }) {
  const queryClient = useQueryClient();
  const [showPush, setShowPush] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);

  const { data: overview } = useQuery({
    queryKey: ['team-overview', showDone],
    queryFn: () => api.get(`/team/overview?showDone=${showDone}`).then((r) => r.data),
  });

  const { data: lineManagers } = useQuery({
    queryKey: ['line-managers'],
    queryFn: () => api.get('/team/line-managers').then((r) => r.data),
  });

  const { data: heatmap } = useQuery({
    queryKey: ['team-heatmap'],
    queryFn: () => api.get('/team/heatmap').then((r) => r.data),
  });

  return (
    <div className="px-6 py-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-gray-800">📊 Team Dashboard</h2>
          <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer">
            <input type="checkbox" checked={showDone} onChange={e => setShowDone(e.target.checked)} className="rounded" />
            Show completed
          </label>
        </div>
        {role === 'senior_manager' && (
          <button onClick={() => setShowPush(true)} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700">📤 Push Initiative</button>
        )}
      </div>

      {heatmap && heatmap.length > 0 && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h3 className="text-sm font-semibold text-gray-700">🔥 Team Heatmap</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-xs text-gray-500 uppercase">
                <th className="px-4 py-2 text-left">Name</th>
                {role === 'senior_manager' ? (
                  <>
                    <th className="px-4 py-2 text-center">Stale Reportees</th>
                    <th className="px-4 py-2 text-center">Open Org/Unit Tasks</th>
                    <th className="px-4 py-2 text-center">Unacknowledged</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-2 text-center">Last 1-on-1</th>
                    <th className="px-4 py-2 text-center">Open Tasks</th>
                    <th className="px-4 py-2 text-center">Sentiment</th>
                    <th className="px-4 py-2 text-center">Risk</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {heatmap.map((row: any) => (
                <tr key={row.name} className="border-b last:border-0">
                  <td className="px-4 py-2 font-medium text-gray-800">{row.name} {row.role && <span className="text-xs text-gray-400 ml-1">({row.role})</span>}{row.orgUnit && <span className="text-xs text-gray-400 ml-1">({row.orgUnit})</span>}</td>
                  {role === 'senior_manager' ? (
                    <>
                      <td className="px-4 py-2 text-center"><HeatCell value={row.staleReportees} thresholds={[0, 1, 2]} labels={[`${row.staleReportees}/${row.totalReportees}`]} /></td>
                      <td className="px-4 py-2 text-center"><HeatCell value={row.openOrgUnitTasks} thresholds={[0, 3, 6]} /></td>
                      <td className="px-4 py-2 text-center"><HeatCell value={row.unacknowledged} thresholds={[0, 1, 3]} /></td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2 text-center"><HeatCell value={row.daysSince1on1} thresholds={[7, 14, 21]} labels={[`${row.daysSince1on1}d`]} /></td>
                      <td className="px-4 py-2 text-center"><HeatCell value={row.openTasks} thresholds={[0, 4, 7]} /></td>
                      <td className="px-4 py-2 text-center">{row.sentiment === 'concern' ? <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs">😟 Concern</span> : <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs">😊 OK</span>}</td>
                      <td className="px-4 py-2 text-center">{row.riskLevel === 'high' ? <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs">High</span> : row.riskLevel === 'medium' ? <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 text-xs">Medium</span> : <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs">None</span>}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {overview?.map((lm: any) => (
        <div key={lm.managerId} className="mb-6 bg-white rounded-lg shadow-sm border">
          {/* Manager header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b bg-gray-50 rounded-t-lg">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700">
              {lm.managerName.charAt(0)}
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-800">{lm.managerName}</span>
              {lm.orgUnit && <span className="text-xs text-gray-400 ml-2">• {lm.orgUnit}</span>}
            </div>
            <div className="ml-auto flex gap-2">
              {/* Status summary pills */}
              {STATUS_ORDER.filter(s => s !== 'done').map(status => {
                const count = lm.cards.filter((c: any) => c.status === status).length;
                if (!count) return null;
                return <span key={status} className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[status]}`}>{count} {STATUS_LABELS[status]}</span>;
              })}
            </div>
          </div>

          {/* Cards */}
          <div className="p-4">
            {lm.cards.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No active org/unit tasks</p>
            ) : (
              <div className="space-y-2">
                {lm.cards.map((card: any) => (
                  <div key={card.id}>
                    {/* Card row */}
                    <div
                      onClick={() => setExpandedCard(expandedCard === card.id ? null : card.id)}
                      className="flex items-center gap-3 text-sm border rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      {/* Status indicator */}
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[card.status].replace('text-', 'bg-').split(' ')[0]}`}></span>
                        <span className="text-[10px] text-gray-400">{STATUS_LABELS[card.status]}</span>
                      </div>

                      {/* Title & meta */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800 truncate">{card.title}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {card.layer && (
                            <span className={`text-xs px-1.5 py-0.5 rounded ${LAYER_COLORS[card.layer]}`}>{LAYER_LABELS[card.layer]}</span>
                          )}
                          {card.notes?.length > 0 && (
                            <span className="text-xs text-gray-400">💬 {card.notes.length} note{card.notes.length > 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>

                      {/* Priority */}
                      <span className={`text-xs px-2 py-0.5 rounded ${PRIORITY_COLORS[card.priority]}`}>{card.priority}</span>

                      {/* Acknowledgment */}
                      {card.layer !== 'team' && (
                        <span className={`text-xs px-2 py-0.5 rounded ${card.acknowledgedAt ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {card.acknowledgedAt ? '✓ Acknowledged' : '⏳ Pending'}
                        </span>
                      )}

                      {/* Due date */}
                      {card.dueDate && (
                        <span className={`text-xs ${new Date(card.dueDate) < new Date() ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                          📅 {new Date(card.dueDate).toLocaleDateString()}
                        </span>
                      )}

                      {/* Expand arrow */}
                      <span className={`text-gray-400 transition-transform ${expandedCard === card.id ? 'rotate-180' : ''}`}>▾</span>
                    </div>

                    {/* Expanded detail */}
                    {expandedCard === card.id && (
                      <div className="ml-8 mr-4 mt-1 mb-2 border-l-2 border-indigo-200 pl-4 py-2">
                        {/* Status timeline */}
                        <div className="mb-3">
                          <div className="text-xs font-medium text-gray-500 mb-1.5">Status Progress</div>
                          <div className="flex items-center gap-1">
                            {STATUS_ORDER.map((s, i) => {
                              const currentIdx = STATUS_ORDER.indexOf(card.status);
                              const isPast = i < currentIdx;
                              const isCurrent = i === currentIdx;
                              return (
                                <div key={s} className="flex items-center">
                                  <div className={`px-2 py-0.5 rounded text-[10px] font-medium ${isCurrent ? STATUS_COLORS[s] + ' ring-2 ring-offset-1 ring-indigo-300' : isPast ? 'bg-green-50 text-green-600 line-through' : 'bg-gray-50 text-gray-300'}`}>
                                    {STATUS_LABELS[s]}
                                  </div>
                                  {i < STATUS_ORDER.length - 1 && <span className={`mx-0.5 text-xs ${isPast ? 'text-green-400' : 'text-gray-200'}`}>→</span>}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Created date */}
                        <div className="text-xs text-gray-400 mb-2">
                          Created: {new Date(card.createdAt).toLocaleString()}
                          {card.acknowledgedAt && <span className="ml-3">Acknowledged: {new Date(card.acknowledgedAt).toLocaleString()}</span>}
                        </div>

                        {/* Notes */}
                        {card.notes?.length > 0 ? (
                          <div>
                            <div className="text-xs font-medium text-gray-500 mb-1.5">💬 Notes from Line Manager</div>
                            <div className="space-y-1.5">
                              {card.notes.map((note: any) => (
                                <div key={note.id} className="bg-gray-50 rounded px-3 py-2 text-sm">
                                  <div className="text-gray-700">{note.content}</div>
                                  <div className="text-[10px] text-gray-400 mt-1">{new Date(note.createdAt).toLocaleString()}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-300 italic">No notes yet</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      {showPush && lineManagers && (
        <PushInitiativeModal lineManagers={lineManagers} onClose={() => { setShowPush(false); queryClient.invalidateQueries({ queryKey: ['team-overview'] }); }} />
      )}
    </div>
  );
}

function HeatCell({ value, thresholds, labels }: { value: number; thresholds: number[]; labels?: string[] }) {
  const display = labels?.[0] || String(value);
  const color = value <= thresholds[0] ? 'bg-green-100 text-green-700' : value <= thresholds[1] ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>{display}</span>;
}

function PushInitiativeModal({ lineManagers, onClose }: { lineManagers: any[]; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('high');
  const [dueDate, setDueDate] = useState('');
  const [selected, setSelected] = useState<string[]>(lineManagers.map((m) => m.id));

  const pushMutation = useMutation({
    mutationFn: () => api.post('/team/push-initiative', { title, description: description || undefined, priority, dueDate: dueDate || undefined, targetManagerIds: selected }),
    onSuccess: () => onClose(),
  });

  const toggleAll = () => setSelected(selected.length === lineManagers.length ? [] : lineManagers.map((m) => m.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl p-6 w-[480px]">
        <h2 className="text-lg font-bold text-gray-800 mb-4">📤 Push Initiative to Line Managers</h2>

        <label className="block text-sm font-medium text-gray-600 mb-1">Initiative Title</label>
        <input className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Submit Q3 headcount plan by Friday" />

        <label className="block text-sm font-medium text-gray-600 mb-1">Description (optional)</label>
        <textarea className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Priority</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Due Date <span className="text-red-500">*</span></label>
            <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>

        <label className="block text-sm font-medium text-gray-600 mb-2">Push to:</label>
        <div className="border rounded-lg p-3 mb-4 max-h-40 overflow-y-auto">
          <label className="flex items-center gap-2 text-sm mb-2 cursor-pointer font-medium">
            <input type="checkbox" checked={selected.length === lineManagers.length} onChange={toggleAll} className="rounded" />
            Select All
          </label>
          {lineManagers.map((m) => (
            <label key={m.id} className="flex items-center gap-2 text-sm py-1 cursor-pointer">
              <input type="checkbox" checked={selected.includes(m.id)} onChange={() => setSelected(selected.includes(m.id) ? selected.filter((id) => id !== m.id) : [...selected, m.id])} className="rounded" />
              {m.name} {m.orgUnit && <span className="text-gray-400">({m.orgUnit})</span>}
            </label>
          ))}
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          <button onClick={() => pushMutation.mutate()} disabled={!title.trim() || !selected.length || !dueDate} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
            📤 Push to {selected.length} manager{selected.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
