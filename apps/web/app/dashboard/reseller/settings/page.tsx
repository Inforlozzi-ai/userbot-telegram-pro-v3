'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import axios from 'axios';

export default function ResellerSettings() {
  useAuth();
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('/api/reseller', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setForm(r.data));
  }, []);

  const save = async (e: any) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess(false);
    try {
      const token = localStorage.getItem('token');
      await axios.patch('/api/reseller', form, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  if (!form) return <div className="flex items-center justify-center h-screen text-gray-400">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <a href="/dashboard/reseller" className="text-gray-500 text-sm hover:text-white">← Painel</a>
        <h1 className="text-2xl font-bold mt-1 mb-6">⚙️ Configurações do Reseller</h1>

        <form onSubmit={save} className="bg-gray-900 rounded-2xl border border-gray-700 p-6 space-y-5">
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {success && <p className="text-green-400 text-sm">✅ Configurações salvas!</p>}

          <Field label="Nome da marca" value={form.brandName} onChange={v => setForm({...form, brandName: v})} />
          <Field label="Slug" value={form.slug} onChange={v => setForm({...form, slug: v})} />
          <Field label="URL do logo" value={form.logo || ''} onChange={v => setForm({...form, logo: v})} placeholder="https://..." />

          <div>
            <label className="block text-sm text-gray-400 mb-1">Cor principal</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.primaryColor} onChange={e => setForm({...form, primaryColor: e.target.value})}
                className="h-10 w-16 rounded cursor-pointer bg-transparent" />
              <span className="text-sm text-gray-400">{form.primaryColor}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Máx. clientes</label>
              <input type="number" min={1} value={form.maxClients} onChange={e => setForm({...form, maxClients: Number(e.target.value)})}
                className="w-full bg-gray-800 text-white px-4 py-2 rounded-xl border border-gray-700 outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Bots por cliente</label>
              <input type="number" min={1} value={form.maxBotsPerClient} onChange={e => setForm({...form, maxBotsPerClient: Number(e.target.value)})}
                className="w-full bg-gray-800 text-white px-4 py-2 rounded-xl border border-gray-700 outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Comissão (%)</label>
            <input type="number" min={0} max={100} step={0.1} value={form.commissionPct}
              onChange={e => setForm({...form, commissionPct: Number(e.target.value)})}
              className="w-full bg-gray-800 text-white px-4 py-2 rounded-xl border border-gray-700 outline-none" />
          </div>

          <button type="submit" disabled={saving}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar configurações'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: any) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-gray-800 text-white px-4 py-2 rounded-xl border border-gray-700 focus:border-indigo-500 outline-none" />
    </div>
  );
}
