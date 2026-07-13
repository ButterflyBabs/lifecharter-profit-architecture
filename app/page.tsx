import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F6F1E8] via-[#FDFBF7] to-[#F6F1E8]">
      {/* Header */}
      <header className="bg-[#F6F1E8]/80 backdrop-blur-sm border-b border-[#D4AF63]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-[#1F315B] to-[#5E3B6C] border border-[#D4AF63]/40">
              <span className="text-[#D4AF63] font-display font-bold text-lg">P</span>
            </div>
            <span className="font-display font-semibold text-[#1F315B] text-lg">The Profit Architecture</span>
          </div>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-[#1F315B] hover:text-[#5E3B6C] font-medium transition-colors font-body"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-5 py-2 bg-gradient-to-r from-[#1F315B] to-[#2a3f6e] text-[#F6F1E8] rounded-xl font-medium hover:shadow-lg hover:shadow-[#1F315B]/25 transition-all duration-300 font-body border border-[#D4AF63]/30"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-[#CDBFD6]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-[#2E7C83]/10 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <p className="font-editorial italic text-[#5E3B6C] text-lg mb-4 tracking-wide">
            A LifeCharter Experience
          </p>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-[#1F315B] mb-6 tracking-tight">
            The Profit <span className="text-[#D4AF63]">Architecture</span>
          </h1>
          <p className="font-body text-xl md:text-2xl text-[#1F315B]/70 max-w-3xl mx-auto mb-12 leading-relaxed">
            Business assessment, profitability analysis, and ongoing advisory platform designed to transform your vision into sustainable success
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-gradient-to-r from-[#D4AF63] to-[#E8D5A3] text-[#1F315B] rounded-xl font-semibold text-lg hover:shadow-xl hover:shadow-[#D4AF63]/30 transition-all duration-300 font-body border border-[#D4AF63]/50"
            >
              Start Your Assessment
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-[#F6F1E8] text-[#1F315B] border border-[#D4AF63]/40 rounded-xl font-semibold text-lg hover:bg-[#FDFBF7] hover:border-[#D4AF63]/60 transition-all duration-300 font-body"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Pace Options Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center mb-16">
          <p className="font-editorial italic text-[#5E3B6C] text-lg mb-3">Choose Your Path</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-[#1F315B] mb-4">Select Your Pace</h2>
          <p className="font-body text-[#1F315B]/70 max-w-2xl mx-auto text-lg">
            Every journey is unique. Select the timeline that fits your needs. You can change this later in settings.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Aggressive */}
          <div className="bg-[#FDFBF7] rounded-2xl shadow-sacred border border-[#D4AF63]/20 p-8 hover:shadow-sacred-lg hover:border-[#D4AF63]/40 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-6 bg-gradient-to-br from-[#2E7C83]/20 to-[#2E7C83]/5 border border-[#2E7C83]/30">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="font-display text-2xl font-bold text-[#2E7C83] mb-2">Aggressive</h3>
            <p className="font-display text-4xl font-bold text-[#1F315B] mb-6">16 weeks</p>
            <ul className="font-body text-[#1F315B]/70 space-y-3">
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#2E7C83]/10 flex items-center justify-center text-[#2E7C83] text-xs">✓</span>
                Parallel workstreams
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#2E7C83]/10 flex items-center justify-center text-[#2E7C83] text-xs">✓</span>
                Maximum velocity
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#2E7C83]/10 flex items-center justify-center text-[#2E7C83] text-xs">✓</span>
                Dedicated focus required
              </li>
            </ul>
          </div>

          {/* Standard - Featured */}
          <div className="bg-[#FDFBF7] rounded-2xl shadow-sacred-lg border-2 border-[#D4AF63]/50 p-8 relative transform scale-105 hover:shadow-sacred-lg transition-all duration-300">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-gradient-to-r from-[#D4AF63] to-[#E8D5A3] text-[#1F315B] px-5 py-1.5 rounded-full text-sm font-semibold font-body shadow-gold">
                Recommended
              </span>
            </div>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-6 bg-gradient-to-br from-[#5E3B6C]/20 to-[#5E3B6C]/5 border border-[#5E3B6C]/30">
              <span className="text-2xl">🌿</span>
            </div>
            <h3 className="font-display text-2xl font-bold text-[#5E3B6C] mb-2">Standard</h3>
            <p className="font-display text-4xl font-bold text-[#1F315B] mb-6">20 weeks</p>
            <ul className="font-body text-[#1F315B]/70 space-y-3">
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#5E3B6C]/10 flex items-center justify-center text-[#5E3B6C] text-xs">✓</span>
                Balanced approach
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#5E3B6C]/10 flex items-center justify-center text-[#5E3B6C] text-xs">✓</span>
                Quality gates
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#5E3B6C]/10 flex items-center justify-center text-[#5E3B6C] text-xs">✓</span>
                Sustainable pace
              </li>
            </ul>
          </div>

          {/* Conservative */}
          <div className="bg-[#FDFBF7] rounded-2xl shadow-sacred border border-[#D4AF63]/20 p-8 hover:shadow-sacred-lg hover:border-[#D4AF63]/40 transition-all duration-300">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-6 bg-gradient-to-br from-[#CDBFD6]/30 to-[#CDBFD6]/10 border border-[#CDBFD6]/40">
              <span className="text-2xl">🐢</span>
            </div>
            <h3 className="font-display text-2xl font-bold text-[#1F315B]/80 mb-2">Conservative</h3>
            <p className="font-display text-4xl font-bold text-[#1F315B] mb-6">25 weeks</p>
            <ul className="font-body text-[#1F315B]/70 space-y-3">
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#1F315B]/10 flex items-center justify-center text-[#1F315B] text-xs">✓</span>
                Thorough testing
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#1F315B]/10 flex items-center justify-center text-[#1F315B] text-xs">✓</span>
                Risk-averse
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#1F315B]/10 flex items-center justify-center text-[#1F315B] text-xs">✓</span>
                Generous buffers
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Sacred Promise Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="bg-gradient-to-br from-[#1F315B] to-[#5E3B6C] rounded-3xl p-8 md:p-16 text-center relative overflow-hidden">
          {/* Decorative gold accents */}
          <div className="absolute top-0 left-0 w-32 h-32 border-t border-l border-[#D4AF63]/30 rounded-tl-3xl" />
          <div className="absolute bottom-0 right-0 w-32 h-32 border-b border-r border-[#D4AF63]/30 rounded-br-3xl" />
          
          <div className="relative z-10">
            <p className="font-editorial italic text-[#D4AF63] text-xl mb-4">Our Sacred Promise</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-[#F6F1E8] mb-6">
              Transform Your Business Into a <span className="text-[#D4AF63]">Thriving Enterprise</span>
            </h2>
            <p className="font-body text-[#F6F1E8]/80 max-w-2xl mx-auto text-lg mb-8">
              Through careful assessment, strategic planning, and ongoing advisory, we help you build a business that serves both your vision and your life.
            </p>
            <Link
              href="/register"
              className="inline-block px-8 py-4 bg-gradient-to-r from-[#D4AF63] to-[#E8D5A3] text-[#1F315B] rounded-xl font-semibold text-lg hover:shadow-xl hover:shadow-[#D4AF63]/30 transition-all duration-300 font-body"
            >
              Begin Your Journey
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1F315B] text-[#F6F1E8]/70 py-12 mt-20 border-t border-[#D4AF63]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-[#D4AF63] to-[#E8D5A3]">
              <span className="text-[#1F315B] font-display font-bold text-sm">P</span>
            </div>
            <span className="font-display font-semibold text-[#F6F1E8]">The Profit Architecture</span>
          </div>
          <p className="font-body text-sm">
            © 2026 The Profit Architecture. A LifeCharter Experience. Built with care by Sacred Kaleidoscope Community.
          </p>
        </div>
      </footer>
    </main>
  );
}