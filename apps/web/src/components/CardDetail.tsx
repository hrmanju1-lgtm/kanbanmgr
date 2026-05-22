import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../api/client';

function isSelfCreated(card: any) {
  return !card.source || card.source === 'self';
}

export default function CardDetail({ cardId, onClose }: { cardId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [noteText, setNoteText] = useState('');
  const [editingDueDate, setEditingDueDate] = useState(false);
  const [dueDate, setDueDate] = useState('');

  const { data: card } = useQuery({
    queryKey: ['card', cardId],
    queryFn: () => api.get(`/cards/${cardId}`).then((r) => r.data),
    onSuccess: (data: any) => { if (data.dueDate) setDueDate(data.dueDate.slice(0, 10)); },
  } as any);

  const addNote = useMutation({
    mutationFn: (content: string) => api.post(`/cards/${cardId}/notes`, { content, noteType: 'note' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['card', cardId] }); setNoteText(''); },
  });

  const toggleAction = useMutation({
    mutationFn: (id: string) => api.patch(`/cards/action-items/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['card', cardId] }),
  });

  const updateCard = useMutation({
    mutationFn: (data: any) => api.patch(`/cards/${cardId}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['card', cardId] }); queryClient.invalidateQueries({ queryKey: ['board'] }); setEditingDueDate(false); },
  });

  const deleteCard = useMutation({
    mutationFn: () => api.delete(`/cards/${cardId}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['board'] }); onClose(); },
  });

  const cancelCard = useMutation({
    mutationFn: () => api.patch(`/cards/${cardId}/move`, { status: 'cancelled' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['board'] }); onClose(); },
  });

  if (!card) return null;

  const selfCreated = isSelfCreated(card);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/20" onClick={onClose}></div>
      <div className="w-[420px] bg-white shadow-xl p-6 overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-bold text-gray-800">{card.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        {/* Source badge */}
        {card.source === 'organization' && (
          <div className="bg-amber-50 border border-amber-200 rounded p-2 mb-4 text-xs">
            🏢 Org-level task pushed via API
            {card.sourceMeta?.pushedBy && <span className="ml-1">by <strong>{card.sourceMeta.pushedBy}</strong></span>}
            {card.acknowledgedAt && <span className="ml-2 text-green-600">✓ Acknowledged</span>}
          </div>
        )}
        {card.source === 'unit_manager' && (
          <div className="bg-purple-50 border border-purple-200 rounded p-2 mb-4 text-xs">
            📥 Unit-level task from: <strong>{card.sourceMeta?.pushedBy || card.sourceId}</strong>
            {card.acknowledgedAt && <span className="ml-2 text-green-600">✓ Acknowledged</span>}
          </div>
        )}
        {selfCreated && (
          <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-4 text-xs text-blue-700">
            ✏️ Team-level task (self-created)
          </div>
        )}

        <div className="text-sm text-gray-500 mb-4 space-y-2">
          <div>Status: <span className="font-medium text-gray-700">{card.status}</span></div>
          <div>Priority: <span className="font-medium text-gray-700">{card.priority}</span></div>

          {/* Due Date - editable only for self-created */}
          <div className="flex items-center gap-2">
            <span>Due:</span>
            {selfCreated ? (
              editingDueDate ? (
                <span className="flex items-center gap-1">
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="border rounded px-2 py-0.5 text-sm" />
                  <button onClick={() => updateCard.mutate({ dueDate: dueDate || null })} className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded">Save</button>
                  <button onClick={() => setEditingDueDate(false)} className="text-xs text-gray-400">Cancel</button>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <span className="font-medium text-gray-700">{card.dueDate ? new Date(card.dueDate).toLocaleDateString() : 'Not set'}</span>
                  <button onClick={() => { setDueDate(card.dueDate ? card.dueDate.slice(0, 10) : ''); setEditingDueDate(true); }} className="text-xs text-indigo-600 hover:underline">✏️ Edit</button>
                </span>
              )
            ) : (
              <span className="font-medium text-gray-700">
                {card.dueDate ? new Date(card.dueDate).toLocaleDateString() : 'Not set'}
                <span className="text-xs text-gray-400 ml-1">(🔒 set by source)</span>
              </span>
            )}
          </div>
        </div>

        {card.description && <p className="text-sm text-gray-600 mb-4">{card.description}</p>}

        {/* Action Items */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Action Items</h3>
          {card.actionItems?.map((item: any) => (
            <label key={item.id} className="flex items-center gap-2 text-sm py-1 cursor-pointer">
              <input type="checkbox" checked={item.isDone} onChange={() => toggleAction.mutate(item.id)} className="rounded" />
              <span className={item.isDone ? 'line-through text-gray-400' : ''}>{item.description}</span>
            </label>
          ))}
        </div>

        {/* Notes */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
          <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
            {card.notes?.map((note: any) => (
              <div key={note.id} className="bg-gray-50 rounded p-2 text-sm">
                <div className="text-gray-700">{note.content}</div>
                <div className="text-xs text-gray-400 mt-1">{new Date(note.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input className="flex-1 border rounded px-3 py-1.5 text-sm" placeholder="Add a note..." value={noteText} onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && noteText.trim()) addNote.mutate(noteText.trim()); }} />
            <button onClick={() => { if (noteText.trim()) addNote.mutate(noteText.trim()); }} className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm hover:bg-indigo-700">Add</button>
          </div>
        </div>

        {/* Delete action - only for self-created */}
        {selfCreated && card.status !== 'done' && (
          <div className="mt-6 pt-4 border-t">
            <button onClick={() => { if (confirm('Delete this task?')) deleteCard.mutate(); }} className="text-sm text-red-500 hover:text-red-700">🗑️ Delete Task</button>
          </div>
        )}
      </div>
    </div>
  );
}
