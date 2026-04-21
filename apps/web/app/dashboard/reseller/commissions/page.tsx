'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import axios from 'axios';

export default function ResellerCommissions() {
  useAuth();
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('/api/reseller/commissions', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => setCommissions(r.data)).finally(() => setLoading(false));
  }, []);

  const total = commissions.reduce((s, c) => s + Number(c.amount), 0);
  const paid = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + Number(c.amount), 0);
  const pending = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + Number(c.amount), 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <a href="/dashboard/reseller" className="text-gray-500 text-sm hover:text-white">← Painel</a>
        <h1 className="text-2xl font-bold mt-1 mb-6">💰 Comissões</h1>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Total acumulado</p>
            <p className="text-2xl font-bold text-white mt-1">R$ {total.toFixed(2)}</p>
          </div>
          <div className="bg-green-500/10 border border-green-500 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Pago</p>
            <p className="text-2xl font-bold text-green-400 mt-1">R$ {paid.toFixed(2)}</p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Pendente</p>
            <p className="text-2xl font-bold text-yellow-400 mt-1">R$ {pending.toFixed(2)}</p>
          </div>
        </div>

        {loading ? <p className="text-gray-500">Carregando...</p> : (
          <div className="bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-800">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-400">Referência</th>
                  <th className="text-left px-4 py-3 text-gray-400">Valor</th>
                  <th className="text-left px-4 py-3 text-gray-400">Status</th>
                  <th className="text-left px-4 py-3 text-gray-400">Data</th>
                </tr>
              </thead>
              <tbody>
                {commissions.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-gray-500">Nenhuma comissão ainda.</td></tr>
                ) : commissions.map((c: any) => (
                  <tr key={c.id} className="border-t border-gray-800">
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{c.paymentRef}</td>
                    <td className="px-4 py-3 font-semibold">R$ {Number(c.amount).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        c.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                        c.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>{c.status === 'paid' ? 'Pago' : c.status === 'pending' ? 'Pendente' : 'Cancelado'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(c.createdAt).toLocaleDateString('pt-BR')}</td>
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
