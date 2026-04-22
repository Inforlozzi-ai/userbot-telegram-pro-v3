'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import Link from 'next/link';
import axios from 'axios';

export default function BotsPage() {
  useAuth();
  const [bots, setBots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    const token = localStorage.getItem('token');
    axios.get('/api/bots', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setBots(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const action = async (id: string, act: string) => {
    const token = localStorage.getItem('token');
    await axios.post(`/api/bots/${id}/${act}`, {}, { headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <span className="font-bold">Inforlozzi SaaS</span>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/dashboard" className="text-gray-400 hover:text-white">📊 Dashboard</Link>
          <Link href="/dashboard/bots" className="text-white font-semibold">🤖 Bots</Link>
          <Link href="/dashboard/reseller" className="text-gray-400 hover:text-white">🏪 Revendedor</Link>
          <button onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }} className="text-gray-500 hover:text-red-400">Sair</button>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">🤖 Meus Bots</h1>
            <p className="text-gray-400 mt-1">Gerencie todos os seus bots Telegram.</p>
          </div>
          <Link href="/dashboard/bots/new"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-sm transition">
            + Novo Bot
          </Link>
        </div>

        {loading ? (
          <p className="text-gray-500">Carregando...</p>
        ) : bots.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-700 rounded-2xl">
            <p className="text-5xl mb-4">🤖</p>
            <p className="text-gray-400 mb-6">Nenhum bot criado ainda.</p>
            <Link href="/dashboard/bots/new"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-sm transition">
              Criar primeiro bot
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bots.map((bot: any) => (
              <div key={bot.id} className="bg-gray-900 border border-gray-800 rounded-2xl px-5 py-4 flex items-center justify-between hover:border-indigo-500 transition">
                <div>
                  <p className="font-semibold">{bot.name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">@{bot.slug} • criado em {new Date(bot.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    bot.status === 'running' ? 'bg-green-500/20 text-green-400' :
                    bot.status === 'error'   ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-700 text-gray-400'
                  }`}>
                    {bot.status === 'running' ? '🟢 Ativo' : bot.status === 'error' ? '🔴 Erro' : '⚪ Parado'}
                  </span>
                  {bot.status !== 'running' ?
                    <button onClick={() => action(bot.id, 'start')} className="text-xs px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded-lg">▶ Iniciar</button> :
                    <button onClick={() => action(bot.id, 'stop')}  className="text-xs px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 rounded-lg">⏸ Parar</button>
                  }
                  <Link href={`/dashboard/bots/${bot.id}`} className="text-indigo-400 hover:text-indigo-300 text-sm">Gerenciar →</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
