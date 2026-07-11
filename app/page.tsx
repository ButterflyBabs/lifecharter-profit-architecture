import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="font-semibold text-slate-900">The Profit Architecture</span>
          </div>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
          The Profit Architecture
        </h1>
        <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
          Business assessment, profitability analysis, and ongoing advisory platform
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            Start Your Assessment
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 bg-white text-slate-700 border-2 border-slate-200 rounded-xl font-semibold text-lg hover:border-slate-300 hover:bg-slate-50 transition-all"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Pace Options Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Choose Your Pace</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Select the timeline that fits your needs. You can change this later in settings.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Aggressive */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-red-100 p-6 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-xl font-bold text-red-600 mb-2">Aggressive</h3>
            <p className="text-3xl font-bold text-slate-900 mb-4">16 weeks</p>
            <ul className="text-sm text-slate-600 space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Parallel workstreams
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Maximum velocity
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Dedicated focus required
              </li>
            </ul>
          </div>

          {/* Standard - Featured */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-500 p-6 relative transform scale-105">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Recommended
              </span>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">🟢</span>
            </div>
            <h3 className="text-xl font-bold text-blue-600 mb-2">Standard</h3>
            <p className="text-3xl font-bold text-slate-900 mb-4">20 weeks</p>
            <ul className="text-sm text-slate-600 space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Balanced approach
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Quality gates
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Sustainable pace
              </li>
            </ul>
          </div>

          {/* Conservative */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-green-100 p-6 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">🐢</span>
            </div>
            <h3 className="text-xl font-bold text-green-600 mb-2">Conservative</h3>
            <p className="text-3xl font-bold text-slate-900 mb-4">25 weeks</p>
            <ul className="text-sm text-slate-600 space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Thorough testing
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Risk-averse
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Generous buffers
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">
            © 2026 The Profit Architecture. Built with care by Sacred Kaleidoscope Community.
          </p>
        </div>
      </footer>
    </main>
  );
}
