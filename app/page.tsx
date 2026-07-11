import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-4">The Profit Architecture</h1>
        <p className="text-xl mb-8">
          Business assessment, profitability analysis, and ongoing advisory platform
        </p>
        
        <div className="flex gap-4">
          <Link
            href="/login"
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded border border-blue-600 px-4 py-2 text-blue-600 hover:bg-blue-50"
          >
            Get Started
          </Link>
        </div>

        <div className="mt-12 p-6 bg-gray-100 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Build Pace Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded border">
              <h3 className="font-bold text-red-600">⚡ Aggressive</h3>
              <p className="text-sm text-gray-600">16 weeks</p>
              <p className="text-xs mt-2">Parallel workstreams, maximum velocity</p>
            </div>
            <div className="p-4 bg-white rounded border border-blue-500">
              <h3 className="font-bold text-blue-600">🟢 Standard</h3>
              <p className="text-sm text-gray-600">20 weeks</p>
              <p className="text-xs mt-2">Balanced approach with quality gates</p>
            </div>
            <div className="p-4 bg-white rounded border">
              <h3 className="font-bold text-green-600">🐢 Conservative</h3>
              <p className="text-sm text-gray-600">25 weeks</p>
              <p className="text-xs mt-2">Risk-averse with thorough testing</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            You can select your preferred pace during onboarding or in settings.
          </p>
        </div>
      </div>
    </main>
  );
}
