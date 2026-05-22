import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';

export default function Log1on1({ reportee, swimlaneId, onClose }: { reportee: any; swimlaneId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  const [sentiment, setSentiment] = useState('neutral');
  const [actionItems, setActionItems] = useState<string[]>(['']);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // 1. Log interaction
      await api.post(`/people/${reportee.id}/interactions`, { interactionType: '1on1', notes, sentiment });

      // 2. Create cards for each non-empty action item
      const items = actionItems.filter(a => a.trim());
      for (const item of items) {
        await api.post('/cards', { swimlaneId, title: item, cardType: 'people', priority: 'medium', reporteeId: reportee.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
      onClose();
    },
  });

  const addItem = () => setActionItems([...actionItems, '']);
  const updateItem = (i: number, val: string) => { const copy = [...actionItems]; copy[i] = val; setActionItems(copy); };
  const removeItem = (i: number) => setActionItems(actionItems.filter((_, idx) => idx !== i));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl p-6 w-[480px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-800 mb-1">📝 Log 1-on-1</h2>
        <p className="text-sm text-gray-500 mb-4">with <strong>{reportee.name}</strong></p>

        <label className="block text-sm font-medium text-gray-600 mb-1">Notes</label>
        <textarea className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What was discussed..." />

        <label className="block text-sm font-medium text-gray-600 mb-1">Sentiment</label>
        <select className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" value={sentiment} onChange={(e) => setSentiment(e.target.value)}>
          <option value="positive">😊 Positive</option>
          <option value="neutral">😐 Neutral</option>
          <option value="concern">😟 Concern</option>
        </select>

        <label className="block text-sm font-medium text-gray-600 mb-2">Action Items → become cards</label>
        <div className="space-y-2 mb-3">
          {actionItems.map((item, i) => (
            <div key={i} className="flex gap-2">
              <input className="flex-1 border rounded-lg px-3 py-1.5 text-sm" value={item} onChange={(e) => updateItem(i, e.target.value)} placeholder="e.g. Follow up with HR on promotion" />
              {actionItems.length > 1 && <button onClick={() => removeItem(i)} className="text-gray-400 hover:text-red-500 text-sm">✕</button>}
            </div>
          ))}
          <button onClick={addItem} className="text-xs text-indigo-600 hover:underline">+ Add action item</button>
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          <button onClick={() => saveMutation.mutate()} disabled={!notes.trim()} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            💾 Save & Generate Cards
          </button>
        </div>
      </div>
    </div>
  );
}
