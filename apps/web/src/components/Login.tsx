import { useState } from 'react';
import api from '../api/client';

export default function Login({ onLogin }: { onLogin: (token: string, role: string, name: string) => void }) {
  const [email, setEmail] = useState('manju@demo.com');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login', { email, password });
      onLogin(data.token, data.manager.role, data.manager.name);
    } catch { setError('Invalid credentials'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h2 className="text-2xl font-bold text-indigo-700 mb-6">📋 ManagerFlow</h2>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <input className="w-full border rounded-lg px-4 py-2 mb-4" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full border rounded-lg px-4 py-2 mb-4" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700">Sign In</button>
      </form>
    </div>
  );
}
