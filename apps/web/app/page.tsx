import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <span className="font-bold text-xl">Inforlozzi SaaS</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-gray-400 hover:text-white text-sm transition">
            Entrar
          </Link>
          <Link href="/register"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition">
            Criar conta
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 py-24">
        <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6">
          ✨ Multi-bot • IA integrada • Painel Revendedor
        </span>
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6 max-w-3xl">
          Bots Telegram profissionais{' '}
          <span className="text-indigo-400">gerenciados pelo seu painel</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mb-10">
          Crie, gerencie e revenda bots com IA, encaminhamento automático e painel de clientes.
          Tudo rodando em Docker, sem complicação.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link href="/register"
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-semibold text-lg transition">
            Começar agora →
          </Link>
          <Link href="/login"
            className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-2xl font-semibold text-lg transition">
            Fazer login
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-6">
        {[
          { icon: '🤖', title: 'Multi-bot', desc: 'Gerencie dezenas de bots de uma única conta. Cada um com config independente.' },
          { icon: '🧠', title: 'IA Integrada', desc: 'OpenAI GPT-4o e Gemini para reescrever, resumir ou traduzir mensagens automaticamente.' },
          { icon: '🏪', title: 'Painel Revendedor', desc: 'Crie sua marca, defina preços e gerencie seus clientes com comissões automáticas.' },
          { icon: '💳', title: 'Billing Automático', desc: 'Cobranças via Asaas com Pix, boleto e cartão. Webhook integrado.' },
          { icon: '🐳', title: '100% Docker', desc: 'Cada bot roda em container isolado. Fácil de escalar e manter.' },
          { icon: '📊', title: 'Dashboard em tempo real', desc: 'Logs, status, gráfico de mensagens e controle total pelo navegador.' },
        ].map((f) => (
          <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-bold text-lg mb-2">{f.title}</h3>
            <p className="text-gray-400 text-sm">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* CTA final */}
      <section className="text-center px-6 py-16 border-t border-gray-800">
        <h2 className="text-3xl font-bold mb-4">Pronto para começar?</h2>
        <p className="text-gray-400 mb-8">Crie sua conta gratuitamente e publique seu primeiro bot em minutos.</p>
        <Link href="/register"
          className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-semibold text-lg transition">
          Criar conta grátis
        </Link>
      </section>

      <footer className="text-center py-6 text-gray-600 text-sm border-t border-gray-800">
        © {new Date().getFullYear()} Inforlozzi SaaS • Feito com ❤️ no Brasil
      </footer>
    </main>
  );
}
