import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import api from '../api/client';

export default function NotificationBell({ onHighlight }: { onHighlight: (cardId: string) => void }) {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>(() => JSON.parse(localStorage.getItem('readNotifs') || '[]'));

  const { data: allNotifs = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
    refetchInterval: 5000,
  });

  const unread = allNotifs.filter((n: any) => !readIds.includes(n.id));

  useEffect(() => {
    localStorage.setItem('readNotifs', JSON.stringify(readIds));
  }, [readIds]);

  const markAllRead = () => {
    setReadIds(allNotifs.map((n: any) => n.id));
    setOpen(false);
  };

  const handleClick = (id: string) => {
    setReadIds(prev => [...prev, id]);
    setOpen(false);
    onHighlight(id);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative text-gray-500 hover:text-indigo-600 text-lg">
        🔔
        {unread.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
            {unread.length}
          </span>
        )}
      </button>
      {open && unread.length > 0 && (
        <div className="absolute right-0 top-8 w-72 bg-white border rounded-lg shadow-lg z-50">
          <div className="flex justify-between items-center px-3 py-2 border-b">
            <span className="text-xs font-semibold text-gray-600">New Tasks ({unread.length})</span>
            <button onClick={markAllRead} className="text-xs text-indigo-600 hover:underline">Mark all read</button>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {unread.map((n: any) => (
              <div key={n.id} onClick={() => handleClick(n.id)} className="px-3 py-2 border-b last:border-0 text-sm cursor-pointer hover:bg-indigo-50">
                <div className="font-medium text-gray-800 truncate">{n.title}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {n.source === 'organization' ? '🏢 Org' : '📥 Unit'} • {n.priority}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
