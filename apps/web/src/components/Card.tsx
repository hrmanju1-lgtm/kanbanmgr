import { useDraggable } from '@dnd-kit/core';

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

const SOURCE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  self: { label: 'Team', color: 'bg-blue-100 text-blue-700', icon: '✏️' },
  unit_manager: { label: 'Unit', color: 'bg-purple-100 text-purple-700', icon: '📥' },
  organization: { label: 'Org', color: 'bg-amber-100 text-amber-700', icon: '🏢' },
};

function getSource(card: any) {
  return SOURCE_LABELS[card.source] || SOURCE_LABELS.self;
}

function CardContent({ card, highlighted }: { card: any; highlighted?: boolean }) {
  const source = getSource(card);
  return (
    <>
      <div className="flex items-start justify-between gap-1">
        <span className="font-medium text-gray-800 leading-tight">{card.title}</span>
      </div>
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        <span className={`text-xs px-1.5 py-0.5 rounded ${PRIORITY_COLORS[card.priority]}`}>{card.priority}</span>
        <span className={`text-xs px-1.5 py-0.5 rounded ${source.color}`}>{source.icon} {source.label}</span>
        {card.dueDate && (
          <span className={`text-xs ${new Date(card.dueDate) < new Date() && card.status !== 'done' ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
            📅 {new Date(card.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
    </>
  );
}

function cardClasses(card: any, highlighted?: boolean, isDragging?: boolean) {
  return `bg-white border border-l-4 ${card.source === 'organization' ? 'border-l-amber-500' : card.source === 'unit_manager' ? 'border-l-purple-500' : 'border-l-blue-400'} rounded-lg p-2 shadow-sm text-sm ${highlighted ? 'ring-2 ring-indigo-500 animate-pulse' : ''} ${isDragging ? 'opacity-30' : ''}`;
}

export function CardOverlay({ card }: { card: any }) {
  return (
    <div className={`${cardClasses(card)} rotate-2 scale-105 shadow-lg`}>
      <CardContent card={card} />
    </div>
  );
}

export default function Card({ card, onClick, highlighted }: { card: any; onClick: () => void; highlighted?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: card.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`${cardClasses(card, highlighted, isDragging)} cursor-grab hover:shadow-md transition-all`}
    >
      <CardContent card={card} highlighted={highlighted} />
    </div>
  );
}
