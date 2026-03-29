import { CrashGame } from '@/components/CrashGame';
import { ConnectButton } from '@/components/ConnectButton';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#f0ece4]">
      {/* Topbar */}
      <header className="sticky top-0 z-50 flex items-center px-6 h-14 border-b border-[#1e1e1e] bg-[#0a0a0a]/90 backdrop-blur-md">
        <span className="font-mono text-xl tracking-widest font-bold">
          HATE<span className="text-[#e8002a]">CASINO</span>
        </span>
        <div className="ml-auto">
          <ConnectButton />
        </div>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <CrashGame />
      </div>
    </main>
  );
}