'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import Link from 'next/link';
import axios from 'axios';
import { useParams } from 'next/navigation';

type AuthStep = 'idle' | 'sms_sent' | 'needs_2fa' | 'done';

export default function BotDetailPage() {
  useAuth();
  const { id } = useParams();
  const [bot, setBot] = useState<any>(null);
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');

  // Auth flow
  const [authStep, setAuthStep] = useState<AuthStep>('idle');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [authMsg, setAuthMsg] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const token = () => localStorage.getItem('token');
  const headers = () => ({ Authorization: `Bearer ${token()}` });

  const load = async () => {
    try {
      const r = await axios.get(`/api/bots/${id}`, { headers: headers() });
      setBot(r.data);
    } catch {}
    setLoading(false);
  };

  const loadLogs = async () => {
    try {
      const r = await axios.get(`/api/bots/${id}/logs`, { headers: headers() });
      setLogs(r.data?.logs || 'Sem logs.');
    } catch {}
  };

  useEffect(() => { load(); loadLogs(); }, []);

  const action = async (act: string) => {
    setActionLoading(act);
    await axios.post(`/api/bots/${id}/${act}`, {}, { headers: headers() }).catch(() => {});
    await load();
    setActionLoading('');
  };

  const startAuth = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const r = await axios.post(`/api/bots/${id}/auth/start`, {}, { headers: headers() });
      setAuthMsg(r.data.message);
      setAuthStep('sms_sent');
    } catch (e: any) {
      setAuthError(e.response?.data?.message || 'Erro ao enviar SMS.');
    } finally {
      setAuthLoading(false);
    }
  };

  const verifyCode = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const body: any = { code };
      if (authStep === 'needs_2fa') body.password = password;
      const r = await axios.post(`/api/bots/${id}/auth/verify`, body, { headers: headers() });
      setAuthMsg(r.data.message);
      setAuthStep('done');
      setTimeout(() => { load(); loadLogs(); }, 3000);
    } catch (e: any) {
      const msg = e.response?.data?.message || '';
      if (msg.includes('dois fatores') || msg.includes('password')) {
        setAuthStep('needs_2fa');
        setAuthError('Conta com verificacao em 2 etapas. Digite sua senha do Telegram abaixo.');
      } else {
        setAuthError(msg || 'Codigo invalido.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Carregando...</div>;
  if (!bot) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Bot nao encontrado.</div>;

  const needsAuth = !bot.sessionString || bot.status === 'error';

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
        <Link href="/dashboard/bots" className="text-gray-500 hover:text-white text-sm mb-6 inline-block">← Voltar</Link>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{bot.name}</h1>
            <p className="text-gray-400 mt-1">@{bot.slug} • {bot.phoneNumber}</p>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
            bot.status === 'running'      ? 'bg-green-500/20 text-green-400' :
            bot.status === 'error'        ? 'bg-red-500/20 text-red-400' :
            bot.status === 'provisioning' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-gray-700 text-gray-400'
          }`}>
            {bot.status === 'running' ? '🟢 Ativo' : bot.status === 'error' ? '🔴 Erro' : bot.status === 'provisioning' ? '⏳ Provisionando' : '⚪ Parado'}
          </span>
        </div>

        {/* BLOCO DE AUTENTICACAO TELEGRAM */}
        {needsAuth && (
          <div className="bg-yellow-500/10 border border-yellow-500/40 rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-bold text-yellow-400 mb-1">🔐 Autenticar conta Telegram</h2>
            <p className="text-gray-400 text-sm mb-4">Para ativar o bot, autentique a conta Telegram associada ({bot.phoneNumber}).</p>

            {authStep === 'idle' && (
              <button onClick={startAuth} disabled={authLoading}
                className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-xl text-sm disabled:opacity-50 transition">
                {authLoading ? 'Enviando SMS...' : '📲 Enviar codigo SMS'}
              </button>
            )}

            {(authStep === 'sms_sent' || authStep === 'needs_2fa') && (
              <div className="space-y-3">
                {authMsg && <p className="text-green-400 text-sm">✅ {authMsg}</p>}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Codigo recebido no Telegram</label>
                  <input
                    type="text"
                    placeholder="Ex: 12345"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm w-48 focus:outline-none focus:border-yellow-500"
                  />
                </div>
                {authStep === 'needs_2fa' && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Senha de verificacao em 2 etapas</label>
                    <input
                      type="password"
                      placeholder="Sua senha do Telegram"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm w-64 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                )}
                <button onClick={verifyCode} disabled={authLoading || !code}
                  className="px-5 py-2.5 bg-green-600 hover:bg-green-500 font-semibold rounded-xl text-sm disabled:opacity-50 transition">
                  {authLoading ? 'Verificando...' : '✅ Confirmar codigo'}
                </button>
              </div>
            )}

            {authStep === 'done' && (
              <p className="text-green-400 font-semibold">✅ {authMsg}</p>
            )}

            {authError && (
              <p className="text-red-400 text-sm mt-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">{authError}</p>
            )}
          </div>
        )}

        {/* ACOES */}
        {!needsAuth && (
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
        )}

        {/* INFO */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            { label: 'Criado em', value: new Date(bot.createdAt).toLocaleString('pt-BR') },
            { label: 'Atualizado em', value: new Date(bot.updatedAt).toLocaleString('pt-BR') },
            { label: 'Container ID', value: bot.containerId ? bot.containerId.substring(0, 12) : '—' },
            { label: 'Sessao', value: bot.sessionString ? '✅ Autenticada' : '❌ Nao autenticada' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
              <p className="text-gray-400 text-xs mb-1">{label}</p>
              <p className="font-mono text-sm">{value}</p>
            </div>
          ))}
        </div>

        {/* LOGS */}
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
