import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';

export default function CreateCard({ swimlanes, onClose }: { swimlanes: any[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const role = localStorage.getItem('role');
  // Org swimlane: only via API. Unit swimlane: only via Senior Manager push.
  const allowedSwimlanes = swimlanes.filter((s: any) => {
    if (s.type === 'org') return false;
    if (s.type === 'unit' && role !== 'senior_manager') return false;
    return true;
  });
  const [title, setTitle] = useState('');
  const [swimlaneId, setSwimlaneId] = useState(allowedSwimlanes[0]?.id || '');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [frequency, setFrequency] = useState('weekly');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState(1);

  const createCard = useMutation({
    mutationFn: () => {
      const sl = allowedSwimlanes.find((s: any) => s.id === swimlaneId);
      const cardType = sl?.type === 'person' ? 'people' : 'org';
      return api.post('/cards', { swimlaneId, title, cardType, priority, dueDate: dueDate || undefined });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['board'] }); onClose(); },
  });

  const createRecurrence = useMutation({
    mutationFn: () => api.post('/recurrence-rules', { swimlaneId, templateTitle: title, templatePriority: priority, frequency, dayOfWeek: frequency === 'weekly' || frequency === 'biweekly' ? dayOfWeek : undefined, dayOfMonth: frequency === 'monthly' || frequency === 'quarterly' ? dayOfMonth : undefined }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['board'] }); onClose(); },
  });

  const handleSubmit = () => {
    if (!title.trim()) return;
    if (recurring) createRecurrence.mutate();
    else createCard.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl p-6 w-[420px]">
        <h2 className="text-lg font-bold text-gray-800 mb-4">➕ Create Task</h2>

        <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
        <input className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Prepare weekly team sync agenda" />

        <label className="block text-sm font-medium text-gray-600 mb-1">Swimlane</label>
        <select className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" value={swimlaneId} onChange={(e) => setSwimlaneId(e.target.value)}>
          {allowedSwimlanes.map((s: any) => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Priority</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Recurring toggle */}
        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} className="rounded" />
            <span className="text-sm font-medium text-gray-700">🔄 Make this recurring</span>
          </label>

          {recurring && (
            <div className="mt-3 space-y-2">
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Every 2 weeks</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>

              {(frequency === 'weekly' || frequency === 'biweekly') && (
                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))}>
                  <option value={1}>Every Monday</option>
                  <option value={2}>Every Tuesday</option>
                  <option value={3}>Every Wednesday</option>
                  <option value={4}>Every Thursday</option>
                  <option value={5}>Every Friday</option>
                </select>
              )}

              {(frequency === 'monthly' || frequency === 'quarterly') && (
                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={dayOfMonth} onChange={(e) => setDayOfMonth(Number(e.target.value))}>
                  {Array.from({ length: 28 }, (_, i) => <option key={i + 1} value={i + 1}>Day {i + 1}</option>)}
                </select>
              )}

              <p className="text-xs text-gray-400">A new card will auto-appear in "To Do" on each cycle.</p>
            </div>
          )}
        </div>

        {/* Due date only for one-time tasks */}
        {!recurring && (
          <>
            <label className="block text-sm font-medium text-gray-600 mb-1">Due Date (optional)</label>
            <input type="date" className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </>
        )}

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          <button onClick={handleSubmit} disabled={!title.trim()} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {recurring ? '🔄 Create Recurring' : '➕ Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
