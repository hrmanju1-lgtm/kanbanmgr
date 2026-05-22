import { useState } from 'react';
import Login from './components/Login';
import Board from './components/Board';
import Widgets from './components/Widgets';
import TeamDashboard from './components/TeamDashboard';
import NotificationBell from './components/NotificationBell';
import AdminPanel from './components/AdminPanel';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role'));
  const [name, setName] = useState(localStorage.getItem('name'));
  const [view, setView] = useState<'board' | 'team'>('board');
  const [highlightedCard, setHighlightedCard] = useState<string | null>(null);

  if (!token) return <Login onLogin={(t, r, n) => { localStorage.setItem('token', t); localStorage.setItem('role', r); localStorage.setItem('name', n); setToken(t); setRole(r); setName(n); }} />;

  if (role === 'admin') return <AdminPanel />;

  const handleHighlight = (cardId: string) => {
    setView('board');
    setHighlightedCard(cardId);
    setTimeout(() => setHighlightedCard(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-indigo-700">📋 ManagerFlow</h1>
        <div className="flex items-center gap-4">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button onClick={() => setView('board')} className={`px-3 py-1 text-sm rounded-md ${view === 'board' ? 'bg-white shadow font-medium' : 'text-gray-500'}`}>My Board</button>
            <button onClick={() => setView('team')} className={`px-3 py-1 text-sm rounded-md ${view === 'team' ? 'bg-white shadow font-medium' : 'text-gray-500'}`}>Team Dashboard</button>
          </div>
          <NotificationBell onHighlight={handleHighlight} />
          <span className="text-sm text-gray-600">{name}</span>
          <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('role'); localStorage.removeItem('name'); setToken(null); setRole(null); setName(null); }} className="text-sm text-gray-500 hover:text-red-500">Logout</button>
        </div>
      </header>
      {view === 'board' ? (
        <>
          <Widgets />
          <Board highlightedCard={highlightedCard} />
        </>
      ) : (
        <TeamDashboard role={role} />
      )}
    </div>
  );
}
