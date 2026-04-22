'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import Link from 'next/link';
import axios from 'axios';
import { useParams } from 'next/navigation';

export default function BotDetailPage() {
  useAuth();
  const { id } = useParams();
  const [bot, setBot] = useState<any>(null);
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');

  const load = async () => {
    const token = localStorage.getItem('token');
    const r = await axios.get(`/api/bots/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    setBot(r.data);
    setLoading(false);
  };

  const loadLogs = async () => {
    const token = localStorage.getItem('token');
    const r = await axios.get(`/api/bots/${id}/logs`, { headers: { Authorization: `Bearer ${token}` } });
    setLogs(r.data?.logs || 'Sem logs disponíveis.');
  };

  useEffect(() => { load(); loadLogs(); }, []);

  const action = async (act: string) => {
    setActionLoading(act);
    const token = localStorage.getItem('token');
    await axios.post(`/api/bots/${id}/${act}`, {}, { headers: { Authorization: `Bearer ${token}` } });
    await load();
    setActionLoading('');
  };

  if (loading) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Carregando...</div>;
  if (!bot) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Bot não encontrado.</div>;

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

      <main className="max-w-4xl mx-auto px-6 py-10">
        <Link href="/dashboard/bots" className="text-gray-500 hover:text-white text-sm mb-6 inline-block">← Voltar aos bots</Link>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{bot.name}</h1>
            <p className="text-gray-400 mt-1">@{bot.slug}</p>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
            bot.status === 'running' ? 'bg-green-500/20 text-green-400' :
            bot.status === 'error'   ? 'bg-red-500/20 text-red-400' :
            'bg-gray-700 text-gray-400'
          }`}>
            {bot.status === 'running' ? '🟢 Ativo' : bot.status === 'error' ? '🔴 Erro' : '⚪ Parado'}
          </span>
        </div>

        {/* Ações */}
        <div className="flex gap-3 mb-8">
          {bot.status !== 'running' ? (
            <button onClick={() => action('start')} disabled={!!actionLoading}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-xl font-semibold text-sm transition">
              {actionLoading === 'start' ? 'Iniciando...' : '▶ Iniciar'}
            </button>
          ) : (
            <button onClick={() => action('stop')} disabled={!!actionLoading}
              className="px-5 py-2.5 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 rounded-xl font-semibold text-sm transition">
              {actionLoading === 'stop' ? 'Parando...' : '⏸ Parar'}
            </button>
          )}
          <button onClick={() => action('restart')} disabled={!!actionLoading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl font-semibold text-sm transition">
            {actionLoading === 'restart' ? 'Reiniciando...' : '🔄 Reiniciar'}
          </button>
        </div>

        {/* Info */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            { label: 'Criado em', value: new Date(bot.createdAt).toLocaleString('pt-BR') },
            { label: 'Atualizado em', value: new Date(bot.updatedAt).toLocaleString('pt-BR') },
            { label: 'Container ID', value: bot.containerId ? bot.containerId.substring(0, 12) : '—' },
            { label: 'Telefone', value: bot.phoneNumber || '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
              <p className="text-gray-400 text-xs mb-1">{label}</p>
              <p className="font-mono text-sm">{value}</p>
            </div>
          ))}
        </div>

        {/* Logs */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold">📋 Logs</h2>
            <button onClick={loadLogs} className="text-xs text-indigo-400 hover:text-indigo-300">🔄 Atualizar</button>
          </div>
          <pre className="bg-gray-900 border border-gray-800 rounded-2xl px-5 py-4 text-xs text-gray-300 overflow-auto max-h-80 whitespace-pre-wrap">
            {logs || 'Sem logs.'}
          </pre>
        </div>
      </main>
    </div>
  );
}
