'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import axios from 'axios';

export default function ResellerDashboard() {
  useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    axios.get('/api/reseller/dashboard', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(r => setData(r.data))
      .catch(() => setShowSetup(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen text-gray-400">Carregando...</div>;
  if (showSetup) return <ResellerSetup onCreated={() => { setShowSetup(false); window.location.reload(); }} />;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">🏪 Painel Revendedor</h1>
        <p className="text-gray-400 mb-8">{data?.reseller?.brandName}</p>

        {/* Cards resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Clientes ativos" value={data?.totalClients} max={data?.maxClients} color="blue" />
          <StatCard label="Comissão %" value={`${data?.commissionPct}%`} color="purple" />
          <StatCard label="Ganhos pagos" value={`R$ ${Number(data?.totalEarned).toFixed(2)}`} color="green" />
          <StatCard label="Pendente" value={`R$ ${Number(data?.pendingEarned).toFixed(2)}`} color="yellow" />
        </div>

        {/* Navegação */}
        <div className="flex gap-3 mb-6">
          <TabLink href="/dashboard/reseller/clients">👥 Clientes</TabLink>
          <TabLink href="/dashboard/reseller/commissions">💰 Comissões</TabLink>
          <TabLink href="/dashboard/reseller/settings">⚙️ Configurações</TabLink>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, max, color }: any) {
  const colors: any = {
    blue: 'border-blue-500 bg-blue-500/10',
    purple: 'border-purple-500 bg-purple-500/10',
    green: 'border-green-500 bg-green-500/10',
    yellow: 'border-yellow-500 bg-yellow-500/10',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {max !== undefined && <p className="text-xs text-gray-500 mt-1">de {max}</p>}
    </div>
  );
}

function TabLink({ href, children }: any) {
  return (
    <a href={href} className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-medium transition">
      {children}
    </a>
  );
}

function ResellerSetup({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({ slug: '', brandName: '', primaryColor: '#6366f1' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/reseller', form, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      onCreated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar reseller');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-2">🏪 Criar Painel Revendedor</h2>
        <p className="text-gray-400 mb-6 text-sm">Configure sua marca e comece a revender bots.</p>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <form onSubmit={submit} className="space-y-4">
          <Field label="Slug (URL)" value={form.slug} onChange={v => setForm({...form, slug: v})} placeholder="minha-revenda" />
          <Field label="Nome da marca" value={form.brandName} onChange={v => setForm({...form, brandName: v})} placeholder="Minha Revenda Bot" />
          <div>
            <label className="block text-sm text-gray-400 mb-1">Cor principal</label>
            <input type="color" value={form.primaryColor} onChange={e => setForm({...form, primaryColor: e.target.value})}
              className="h-10 w-20 rounded cursor-pointer bg-transparent" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition disabled:opacity-50">
            {loading ? 'Criando...' : 'Criar Painel'}
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
