import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';

type Tab = 'tree' | 'senior' | 'line' | 'reportees';

export default function AdminPanel() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('tree');

  const { data: orgTree } = useQuery({ queryKey: ['org-tree'], queryFn: () => api.get('/admin/org-tree').then(r => r.data) });
  const { data: seniorManagers } = useQuery({ queryKey: ['admin-sm'], queryFn: () => api.get('/admin/senior-managers').then(r => r.data) });
  const { data: lineManagers } = useQuery({ queryKey: ['admin-lm'], queryFn: () => api.get('/admin/line-managers').then(r => r.data) });
  const { data: reportees } = useQuery({ queryKey: ['admin-rep'], queryFn: () => api.get('/admin/reportees').then(r => r.data) });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['org-tree'] });
    queryClient.invalidateQueries({ queryKey: ['admin-sm'] });
    queryClient.invalidateQueries({ queryKey: ['admin-lm'] });
    queryClient.invalidateQueries({ queryKey: ['admin-rep'] });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-indigo-700">⚙️ ManagerFlow Admin</h1>
        <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('role'); localStorage.removeItem('name'); window.location.href = '/'; }} className="text-sm text-gray-500 hover:text-red-500">Logout</button>
      </header>

      <div className="px-6 py-4">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-6">
          {(['tree', 'senior', 'line', 'reportees'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm rounded-md ${tab === t ? 'bg-white shadow font-medium' : 'text-gray-500'}`}>
              {t === 'tree' ? '🌳 Org Tree' : t === 'senior' ? '👔 Senior Managers' : t === 'line' ? '👤 Line Managers' : '👥 Reportees'}
            </button>
          ))}
        </div>

        {tab === 'tree' && <OrgTree data={orgTree} />}
        {tab === 'senior' && <SeniorManagersTab data={seniorManagers} onRefresh={invalidateAll} />}
        {tab === 'line' && <LineManagersTab data={lineManagers} seniorManagers={seniorManagers} onRefresh={invalidateAll} />}
        {tab === 'reportees' && <ReporteesTab data={reportees} lineManagers={lineManagers} onRefresh={invalidateAll} />}
      </div>
    </div>
  );
}

function OrgTree({ data }: { data: any[] | undefined }) {
  if (!data) return null;
  return (
    <div className="space-y-4">
      {data.map((sm: any) => (
        <div key={sm.id} className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700">{sm.name.charAt(0)}</span>
            <div>
              <div className="font-semibold text-gray-800">{sm.name}</div>
              <div className="text-xs text-gray-400">Senior Manager • {sm.orgUnit || 'No unit'} • {sm.email}</div>
            </div>
          </div>
          {sm.lineManagers?.length > 0 ? (
            <div className="ml-6 border-l-2 border-indigo-100 pl-4 space-y-3">
              {sm.lineManagers.map((lm: any) => (
                <div key={lm.id}>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700">{lm.name.charAt(0)}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-700">{lm.name}</div>
                      <div className="text-xs text-gray-400">Line Manager • {lm.orgUnit || 'No unit'} • {lm.email}</div>
                    </div>
                  </div>
                  {lm.reportees?.length > 0 && (
                    <div className="ml-6 mt-1 border-l border-gray-200 pl-3 space-y-1">
                      {lm.reportees.map((r: any) => (
                        <div key={r.id} className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">{r.name.charAt(0)}</span>
                          {r.name} <span className="text-xs text-gray-400">({r.role || 'No role'})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="ml-6 text-sm text-gray-400 italic">No line managers assigned</p>
          )}
        </div>
      ))}
      {data.length === 0 && <p className="text-gray-400">No organization structure yet. Start by creating a Senior Manager.</p>}
    </div>
  );
}

function SeniorManagersTab({ data, onRefresh }: { data: any[] | undefined; onRefresh: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', orgUnit: '' });
  const create = useMutation({
    mutationFn: () => api.post('/admin/senior-managers', form),
    onSuccess: () => { setForm({ name: '', email: '', password: '', orgUnit: '' }); onRefresh(); },
  });
  const remove = useMutation({ mutationFn: (id: string) => api.delete(`/admin/senior-managers/${id}`), onSuccess: onRefresh });

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">➕ Add Senior Manager</h3>
        <div className="grid grid-cols-4 gap-3">
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Org Unit" value={form.orgUnit} onChange={e => setForm({ ...form, orgUnit: e.target.value })} />
        </div>
        <button onClick={() => create.mutate()} disabled={!form.name || !form.email || !form.password} className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">Create</button>
      </div>
      <div className="bg-white rounded-lg shadow-sm border">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-gray-50"><th className="px-4 py-2 text-left">Name</th><th className="px-4 py-2 text-left">Email</th><th className="px-4 py-2 text-left">Org Unit</th><th className="px-4 py-2 text-left">Line Managers</th><th className="px-4 py-2"></th></tr></thead>
          <tbody>
            {data?.map((m: any) => (
              <tr key={m.id} className="border-b">
                <td className="px-4 py-2 font-medium">{m.name}</td>
                <td className="px-4 py-2 text-gray-500">{m.email}</td>
                <td className="px-4 py-2 text-gray-500">{m.orgUnit || '—'}</td>
                <td className="px-4 py-2 text-gray-500">{m.lineManagers?.map((l: any) => l.name).join(', ') || '—'}</td>
                <td className="px-4 py-2"><button onClick={() => { if (confirm(`Delete ${m.name}?`)) remove.mutate(m.id); }} className="text-red-500 hover:text-red-700 text-xs">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LineManagersTab({ data, seniorManagers, onRefresh }: { data: any[] | undefined; seniorManagers: any[] | undefined; onRefresh: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', orgUnit: '', seniorManagerId: '' });
  const create = useMutation({
    mutationFn: () => api.post('/admin/line-managers', form),
    onSuccess: () => { setForm({ name: '', email: '', password: '', orgUnit: '', seniorManagerId: '' }); onRefresh(); },
  });
  const remove = useMutation({ mutationFn: (id: string) => api.delete(`/admin/line-managers/${id}`), onSuccess: onRefresh });

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">➕ Add Line Manager</h3>
        <div className="grid grid-cols-5 gap-3">
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Org Unit" value={form.orgUnit} onChange={e => setForm({ ...form, orgUnit: e.target.value })} />
          <select className="border rounded-lg px-3 py-2 text-sm" value={form.seniorManagerId} onChange={e => setForm({ ...form, seniorManagerId: e.target.value })}>
            <option value="">Select Senior Manager</option>
            {seniorManagers?.map((sm: any) => <option key={sm.id} value={sm.id}>{sm.name}</option>)}
          </select>
        </div>
        <button onClick={() => create.mutate()} disabled={!form.name || !form.email || !form.password || !form.seniorManagerId} className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">Create</button>
      </div>
      <div className="bg-white rounded-lg shadow-sm border">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-gray-50"><th className="px-4 py-2 text-left">Name</th><th className="px-4 py-2 text-left">Email</th><th className="px-4 py-2 text-left">Org Unit</th><th className="px-4 py-2 text-left">Reports To</th><th className="px-4 py-2 text-left">Reportees</th><th className="px-4 py-2"></th></tr></thead>
          <tbody>
            {data?.map((m: any) => (
              <tr key={m.id} className="border-b">
                <td className="px-4 py-2 font-medium">{m.name}</td>
                <td className="px-4 py-2 text-gray-500">{m.email}</td>
                <td className="px-4 py-2 text-gray-500">{m.orgUnit || '—'}</td>
                <td className="px-4 py-2 text-gray-500">{m.seniorManager?.name || '—'}</td>
                <td className="px-4 py-2 text-gray-500">{m.reportees?.map((r: any) => r.name).join(', ') || '—'}</td>
                <td className="px-4 py-2"><button onClick={() => { if (confirm(`Delete ${m.name}?`)) remove.mutate(m.id); }} className="text-red-500 hover:text-red-700 text-xs">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReporteesTab({ data, lineManagers, onRefresh }: { data: any[] | undefined; lineManagers: any[] | undefined; onRefresh: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', role: '', managerId: '' });
  const create = useMutation({
    mutationFn: () => api.post('/admin/reportees', form),
    onSuccess: () => { setForm({ name: '', email: '', role: '', managerId: '' }); onRefresh(); },
  });
  const remove = useMutation({ mutationFn: (id: string) => api.delete(`/admin/reportees/${id}`), onSuccess: onRefresh });

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">➕ Add Reportee</h3>
        <div className="grid grid-cols-4 gap-3">
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Role (e.g. Senior Engineer)" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
          <select className="border rounded-lg px-3 py-2 text-sm" value={form.managerId} onChange={e => setForm({ ...form, managerId: e.target.value })}>
            <option value="">Select Manager</option>
            {lineManagers?.map((lm: any) => <option key={lm.id} value={lm.id}>{lm.name}</option>)}
          </select>
        </div>
        <button onClick={() => create.mutate()} disabled={!form.name || !form.managerId} className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">Create</button>
      </div>
      <div className="bg-white rounded-lg shadow-sm border">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-gray-50"><th className="px-4 py-2 text-left">Name</th><th className="px-4 py-2 text-left">Email</th><th className="px-4 py-2 text-left">Role</th><th className="px-4 py-2 text-left">Manager</th><th className="px-4 py-2"></th></tr></thead>
          <tbody>
            {data?.map((r: any) => (
              <tr key={r.id} className="border-b">
                <td className="px-4 py-2 font-medium">{r.name}</td>
                <td className="px-4 py-2 text-gray-500">{r.email || '—'}</td>
                <td className="px-4 py-2 text-gray-500">{r.role || '—'}</td>
                <td className="px-4 py-2 text-gray-500">{r.manager?.name || '—'}</td>
                <td className="px-4 py-2"><button onClick={() => { if (confirm(`Delete ${r.name}?`)) remove.mutate(r.id); }} className="text-red-500 hover:text-red-700 text-xs">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
