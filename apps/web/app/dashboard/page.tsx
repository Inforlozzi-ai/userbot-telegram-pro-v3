'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Link from 'next/link';
import axios from 'axios';

export default function Dashboard() {
  useAuth();
  const [bots, setBots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('/api/bots', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setBots(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <span className="font-bold">Inforlozzi SaaS</span>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/dashboard" className="text-white font-semibold">📊 Dashboard</Link>
          <Link href="/dashboard/bots" className="text-gray-400 hover:text-white">🤖 Bots</Link>
          <Link href="/dashboard/reseller" className="text-gray-400 hover:text-white">🏪 Revendedor</Link>
          <Link href="/dashboard/admin/plans" className="text-gray-400 hover:text-white">🛡️ Admin</Link>
          <button
            onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }}
            className="text-gray-500 hover:text-red-400">
            Sair
          </button>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-400 mb-8">Bem-vindo à sua plataforma de bots.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard label="Total de bots" value={bots.length} icon="🤖" color="indigo" />
          <StatCard label="Bots ativos" value={bots.filter(b => b.status === 'running').length} icon="🟢" color="green" />
          <StatCard label="Com erro" value={bots.filter(b => b.status === 'error').length} icon="🔴" color="red" />
          <StatCard label="Inativos" value={bots.filter(b => b.status === 'stopped').length} icon="⚪" color="gray" />
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">🤖 Seus bots</h2>
          <Link href="/dashboard/bots/new"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition">
            + Novo Bot
          </Link>
        </div>

        {loading ? (
          <p className="text-gray-500">Carregando...</p>
        ) : bots.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-gray-700 rounded-2xl">
            <p className="text-5xl mb-4">🤖</p>
            <p className="text-gray-400 mb-4">Você ainda não tem nenhum bot.</p>
            <Link href="/dashboard/bots/new"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-sm transition">
              Criar meu primeiro bot
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bots.map((bot: any) => (
              <div key={bot.id}
                className="bg-gray-900 border border-gray-800 rounded-2xl px-5 py-4 flex items-center justify-between hover:border-indigo-500 transition">
                <div>
                  <p className="font-semibold">{bot.name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{bot.phoneNumber}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    bot.status === 'running' ? 'bg-green-500/20 text-green-400' :
                    bot.status === 'error'   ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-700 text-gray-400'
                  }`}>
                    {bot.status === 'running' ? '🟢 Ativo' : bot.status === 'error' ? '🔴 Erro' : '⚪ Parado'}
                  </span>
                  <Link href={`/dashboard/bots/${bot.id}`}
                    className="text-indigo-400 hover:text-indigo-300 text-sm">
                    Gerenciar →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
          <Link href="/dashboard/reseller"
            className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-indigo-500 transition">
            <p className="text-2xl mb-2">🏪</p>
            <p className="font-bold">Painel Revendedor</p>
            <p className="text-gray-400 text-sm mt-1">Gerencie clientes e acompanhe comissões.</p>
          </Link>
          <Link href="/dashboard/admin/plans"
            className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-indigo-500 transition">
            <p className="text-2xl mb-2">🛡️</p>
            <p className="font-bold">Admin — Planos</p>
            <p className="text-gray-400 text-sm mt-1">Gerencie planos e roles dos usuários.</p>
          </Link>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon, color }: any) {
  const colors: any = {
    indigo: 'border-indigo-500 bg-indigo-500/10',
    green:  'border-green-500 bg-green-500/10',
    red:    'border-red-500 bg-red-500/10',
    gray:   'border-gray-600 bg-gray-700/20',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-2xl mb-1">{icon}</p>
      <p className="text-gray-400 text-xs">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
