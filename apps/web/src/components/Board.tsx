import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import api from '../api/client';
import Card, { CardOverlay } from './Card';
import CardDetail from './CardDetail';
import CreateCard from './CreateCard';
import Log1on1 from './Log1on1';

const COLUMNS = ['todo', 'in_progress', 'waiting', 'done'];
const COLUMN_LABELS: Record<string, string> = { todo: 'To Do', in_progress: 'In Progress', waiting: 'Waiting', done: 'Done' };

function DroppableCell({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <td ref={setNodeRef} className={`p-1 align-top transition-colors ${isOver ? 'bg-indigo-50' : ''}`}>
      <div className="min-h-[60px] space-y-1 rounded-lg p-1">
        {children}
      </div>
    </td>
  );
}

export default function Board({ highlightedCard }: { highlightedCard?: string | null }) {
  const queryClient = useQueryClient();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [activeCard, setActiveCard] = useState<any>(null);
  const [log1on1, setLog1on1] = useState<{ reportee: any; swimlaneId: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const { data: board, isLoading } = useQuery({ queryKey: ['board'], queryFn: () => api.get('/boards').then((r) => r.data) });

  const moveMutation = useMutation({
    mutationFn: ({ cardId, status }: { cardId: string; status: string }) => api.patch(`/cards/${cardId}/move`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board'] }),
  });

  if (isLoading) return <div className="p-6 text-gray-500">Loading board...</div>;
  if (!board) return <div className="p-6 text-red-500">No board found</div>;

  const swimlanes = board.swimlanes as any[];
  const allCards = swimlanes.flatMap((s: any) => s.cards);

  const getHealth = (swimlane: any) => {
    if (swimlane.type !== 'person' || !swimlane.reportee) return null;
    const days = swimlane.reportee.last1on1Date
      ? Math.floor((Date.now() - new Date(swimlane.reportee.last1on1Date).getTime()) / 86400000)
      : 999;
    if (days <= 7) return { color: 'bg-green-400', label: `${days}d ago` };
    if (days <= 14) return { color: 'bg-yellow-400', label: `${days}d ago` };
    return { color: 'bg-red-400', label: `${days}d ago` };
  };

  const handleDragStart = (event: DragStartEvent) => {
    const card = allCards.find((c: any) => c.id === event.active.id);
    setActiveCard(card || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;

    // droppable id format: "swimlaneId:status"
    const newStatus = (over.id as string).split(':')[1];
    const card = allCards.find((c: any) => c.id === active.id);
    if (card && card.status !== newStatus) {
      moveMutation.mutate({ cardId: card.id, status: newStatus });
    }
  };

  return (
    <div className="px-6 pb-6">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-1 bg-amber-500 rounded"></span> Org (API)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-1 bg-purple-500 rounded"></span> Unit (Sr. Manager)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-1 bg-blue-400 rounded"></span> Team (self)</span>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">➕ Create Task</button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="w-40 p-2 text-left text-xs font-semibold text-gray-500 uppercase">Swimlane</th>
                {COLUMNS.map((col) => (
                  <th key={col} className="p-2 text-center text-xs font-semibold text-gray-500 uppercase min-w-[180px]">{COLUMN_LABELS[col]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {swimlanes.map((swimlane) => {
                const health = getHealth(swimlane);
                return (
                  <tr key={swimlane.id} className="border-t">
                    <td className="p-2 align-top">
                      <div className="flex items-center gap-2">
                        {health && <span className={`w-3 h-3 rounded-full ${health.color}`} title={health.label}></span>}
                        <span className="text-sm font-medium text-gray-700">{swimlane.title}</span>
                        {swimlane.type === 'person' && swimlane.reportee && (
                          <button onClick={() => setLog1on1({ reportee: swimlane.reportee, swimlaneId: swimlane.id })} className="text-xs text-indigo-500 hover:text-indigo-700" title="Log 1-on-1">📝</button>
                        )}
                      </div>
                      {health && <span className="text-xs text-gray-400 ml-5">{health.label}</span>}
                    </td>
                    {COLUMNS.map((col) => {
                      const cards = swimlane.cards.filter((c: any) => c.status === col);
                      return (
                        <DroppableCell key={col} id={`${swimlane.id}:${col}`}>
                          {cards.map((card: any) => (
                            <Card key={card.id} card={card} onClick={() => setSelectedCard(card.id)} highlighted={card.id === highlightedCard} />
                          ))}
                        </DroppableCell>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <DragOverlay>
          {activeCard ? <CardOverlay card={activeCard} /> : null}
        </DragOverlay>
      </DndContext>

      {selectedCard && <CardDetail cardId={selectedCard} onClose={() => setSelectedCard(null)} />}
      {showCreate && <CreateCard swimlanes={swimlanes} onClose={() => setShowCreate(false)} />}
      {log1on1 && <Log1on1 reportee={log1on1.reportee} swimlaneId={log1on1.swimlaneId} onClose={() => setLog1on1(null)} />}
    </div>
  );
}
