'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import axios from 'axios';

export default function ResellerClients() {
  useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', maxBots: 1, monthlyPrice: 49.9 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  const headers = { Authorization: `Bearer ${token}` };

  const load = () => {
    setLoading(true);
    axios.get('/api/reseller/clients', { headers })
      .then(r => setClients(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const addClient = async (e: any) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await axios.post('/api/reseller/clients', form, { headers });
      setShowForm(false);
      setForm({ email: '', maxBots: 1, monthlyPrice: 49.9 });
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao adicionar cliente');
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('Inativar este cliente?')) return;
    await axios.delete(`/api/reseller/clients/${id}`, { headers });
    load();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <a href="/dashboard/reseller" className="text-gray-500 text-sm hover:text-white">← Painel</a>
            <h1 className="text-2xl font-bold mt-1">👥 Clientes</h1>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition">
            + Novo Cliente
          </button>
        </div>

        {/* Formulário novo cliente */}
        {showForm && (
          <form onSubmit={addClient} className="bg-gray-900 rounded-2xl p-6 border border-gray-700 mb-6 space-y-4">
            <h2 className="font-semibold text-lg">Adicionar cliente</h2>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm text-gray-400 mb-1">E-mail</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-xl border border-gray-700 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Máx. bots</label>
                <input type="number" min={1} value={form.maxBots} onChange={e => setForm({...form, maxBots: Number(e.target.value)})}
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-xl border border-gray-700 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Preço mensal (R$)</label>
                <input type="number" step="0.01" value={form.monthlyPrice} onChange={e => setForm({...form, monthlyPrice: Number(e.target.value)})}
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-xl border border-gray-700 outline-none" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold disabled:opacity-50">
                {saving ? 'Salvando...' : 'Adicionar'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Tabela de clientes */}
        {loading ? (
          <p className="text-gray-500">Carregando...</p>
        ) : clients.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-3">👥</p>
            <p>Nenhum cliente ainda. Adicione o primeiro!</p>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-800">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-400">Cliente</th>
                  <th className="text-left px-4 py-3 text-gray-400">Bots</th>
                  <th className="text-left px-4 py-3 text-gray-400">Preço/mês</th>
                  <th className="text-left px-4 py-3 text-gray-400">Status</th>
                  <th className="text-left px-4 py-3 text-gray-400">Desde</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c: any) => (
                  <tr key={c.id} className="border-t border-gray-800 hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{c.clientUser?.name}</p>
                      <p className="text-gray-500 text-xs">{c.clientUser?.email}</p>
                    </td>
                    <td className="px-4 py-3">{c.maxBots}</td>
                    <td className="px-4 py-3">R$ {Number(c.monthlyPrice).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        c.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>{c.active ? 'Ativo' : 'Inativo'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(c.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3">
                      {c.active && (
                        <button onClick={() => remove(c.id)} className="text-red-400 hover:text-red-300 text-xs">
                          Inativar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
