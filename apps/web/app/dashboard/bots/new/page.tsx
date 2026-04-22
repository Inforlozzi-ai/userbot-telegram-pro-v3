'use client';
import { useState } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import Link from 'next/link';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function NewBotPage() {
  useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', botToken: '', phoneNumber: '', apiId: '', apiHash: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/bots', form, { headers: { Authorization: `Bearer ${token}` } });
      router.push('/dashboard/bots');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar bot.');
    } finally {
      setLoading(false);
    }
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

      <main className="max-w-xl mx-auto px-6 py-10">
        <Link href="/dashboard/bots" className="text-gray-500 hover:text-white text-sm mb-6 inline-block">← Voltar</Link>
        <h1 className="text-3xl font-bold mb-2">➕ Novo Bot</h1>
        <p className="text-gray-400 mb-8">Preencha os dados do seu bot Telegram.</p>

        <form onSubmit={submit} className="space-y-4">
          {[
            { key: 'name', label: 'Nome do Bot', placeholder: 'Ex: Meu Bot VIP', type: 'text' },
            { key: 'botToken', label: 'Token do Bot (@BotFather)', placeholder: '123456:ABC-DEF...', type: 'text' },
            { key: 'phoneNumber', label: 'Número de Telefone (userbot)', placeholder: '+5511999999999', type: 'text' },
            { key: 'apiId', label: 'API ID (my.telegram.org)', placeholder: '12345678', type: 'text' },
            { key: 'apiHash', label: 'API Hash (my.telegram.org)', placeholder: 'abc123...', type: 'text' },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label className="block text-sm text-gray-400 mb-1">{label}</label>
              <input
                type={type}
                placeholder={placeholder}
                value={(form as any)[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                required
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          ))}

          {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl font-semibold transition">
            {loading ? 'Criando...' : '🚀 Criar Bot'}
          </button>
        </form>
      </main>
    </div>
  );
}
