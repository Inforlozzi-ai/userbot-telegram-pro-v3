'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import Link from 'next/link';
import axios from 'axios';

const PLANS = [
  { key: 'starter', label: 'Starter', price: 'R$ 49/mês', bots: 1, color: 'gray' },
  { key: 'pro',     label: 'Pro',     price: 'R$ 99/mês', bots: 5, color: 'indigo' },
  { key: 'agency',  label: 'Agency',  price: 'R$ 199/mês', bots: 999, color: 'purple' },
];

export default function AdminPlansPage() {
  useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [search, setSearch] = useState('');

  const load = () => {
    const token = localStorage.getItem('token');
    axios.get('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setUsers(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const changePlan = async (userId: string, plan: string) => {
    setSaving(userId);
    const token = localStorage.getItem('token');
    await axios.patch(`/api/admin/users/${userId}`, { plan }, { headers: { Authorization: `Bearer ${token}` } });
    await load();
    setSaving('');
  };

  const changeRole = async (userId: string, role: string) => {
    const token = localStorage.getItem('token');
    await axios.patch(`/api/admin/users/${userId}`, { role }, { headers: { Authorization: `Bearer ${token}` } });
    await load();
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">🛡️</span>
          <span className="font-bold">Admin — Planos</span>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/dashboard" className="text-gray-400 hover:text-white">📊 Dashboard</Link>
          <Link href="/dashboard/bots" className="text-gray-400 hover:text-white">🤖 Bots</Link>
          <Link href="/dashboard/admin/plans" className="text-white font-semibold">🛡️ Admin</Link>
          <button onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }} className="text-gray-500 hover:text-red-400">Sair</button>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-2">🛡️ Gerenciar Planos</h1>
        <p className="text-gray-400 mb-8">Altere o plano e role de qualquer usuário.</p>

        {/* Cards de planos */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {PLANS.map(p => (
            <div key={p.key} className={`bg-gray-900 border rounded-2xl p-5 ${
              p.color === 'indigo' ? 'border-indigo-500' :
              p.color === 'purple' ? 'border-purple-500' : 'border-gray-700'
            }`}>
              <p className="font-bold text-lg">{p.label}</p>
              <p className="text-gray-400 text-sm mt-1">{p.price}</p>
              <p className="text-gray-500 text-xs mt-1">{p.bots === 999 ? 'Bots ilimitados' : `${p.bots} bot${p.bots > 1 ? 's' : ''}`}</p>
              <p className="text-xs mt-3 font-mono text-indigo-400">
                {users.filter(u => u.plan === p.key).length} usuários
              </p>
            </div>
          ))}
        </div>

        {/* Busca */}
        <input
          type="text"
          placeholder="🔍 Buscar por nome ou e-mail..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm mb-6 focus:outline-none focus:border-indigo-500"
        />

        {/* Tabela */}
        {loading ? <p className="text-gray-500">Carregando...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-800">
                  <th className="text-left py-3 px-2">Usuário</th>
                  <th className="text-left py-3 px-2">Role</th>
                  <th className="text-left py-3 px-2">Plano atual</th>
                  <th className="text-left py-3 px-2">Alterar plano</th>
                  <th className="text-left py-3 px-2">Promover</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u: any) => (
                  <tr key={u.id} className="border-b border-gray-800 hover:bg-gray-900/50">
                    <td className="py-3 px-2">
                      <p className="font-medium">{u.name}</p>
                      <p className="text-gray-500 text-xs">{u.email}</p>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' :
                        u.role === 'reseller' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-700 text-gray-400'
                      }`}>{u.role}</span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-semibold">{u.plan || 'free'}</span>
                    </td>
                    <td className="py-3 px-2">
                      <select
                        value={u.plan || 'free'}
                        onChange={e => changePlan(u.id, e.target.value)}
                        disabled={saving === u.id}
                        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500">
                        <option value="free">Free</option>
                        <option value="starter">Starter</option>
                        <option value="pro">Pro</option>
                        <option value="agency">Agency</option>
                      </select>
                    </td>
                    <td className="py-3 px-2">
                      <select
                        value={u.role || 'user'}
                        onChange={e => changeRole(u.id, e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500">
                        <option value="user">User</option>
                        <option value="reseller">Reseller</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
