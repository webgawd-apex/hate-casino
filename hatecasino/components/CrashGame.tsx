'use client';

import { useState, useRef, useEffect } from 'react';
import { useGameWallet } from '@/hooks/useGameWallet';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

export function CrashGame() {
    const { connected, balance, loading, txError, placeBet } = useGameWallet();
    const { setVisible } = useWalletModal();    

  const [betAmount, setBetAmount]       = useState(0.1);
  const [autoCashout, setAutoCashout]   = useState(2.0);
  const [multiplier, setMultiplier]     = useState(1.0);
  const [betActive, setBetActive]       = useState(false);
  const [status, setStatus]             = useState('PLACE YOUR BET');
  const [isBust, setIsBust]             = useState(false);
  const [recentRounds, setRecentRounds] = useState<number[]>([7.44, 1.02, 3.21, 11.8, 1.55]);

  const crashTimer  = useRef<NodeJS.Timeout | null>(null);
  const crashPoint  = useRef(1.0);
  const currentMult = useRef(1.0);

  function clearTimer() {
    if (crashTimer.current) clearInterval(crashTimer.current);
  }

  function startRound() {
    currentMult.current = 1.0;
    setMultiplier(1.0);
    setIsBust(false);
    crashPoint.current = Math.max(1.01, Math.pow(Math.random() * 4, 2) + 1.0);
    setStatus('ROUND ACTIVE — CASH OUT BEFORE IT CRASHES!');

    crashTimer.current = setInterval(() => {
      currentMult.current += 0.01 + currentMult.current * 0.003;
      setMultiplier(parseFloat(currentMult.current.toFixed(2)));

      if (autoCashout > 1.0 && currentMult.current >= autoCashout) {
        handleCashout();
        return;
      }

      if (currentMult.current >= crashPoint.current) {
        handleBust();
      }
    }, 80);
  }

  function handleCashout() {
    clearTimer();
    const profit = (betAmount * currentMult.current - betAmount).toFixed(3);
    setBetActive(false);
    setStatus(`CASHED OUT AT ${currentMult.current.toFixed(2)}x  +${profit} SOL 🎉`);
    setTimeout(prepareNext, 2000);
  }

  function handleBust() {
    clearTimer();
    setBetActive(false);
    setIsBust(true);
    setStatus(`BUSTED AT ${crashPoint.current.toFixed(2)}x`);
    setRecentRounds(prev => [crashPoint.current, ...prev].slice(0, 12));
    setTimeout(prepareNext, 2500);
  }

  function prepareNext() {
    setMultiplier(1.0);
    setIsBust(false);
    setStatus('PLACE YOUR BET');
  }

async function handleAction() {
  if (!connected) {
    setVisible(true);
    return;
  }

  if (!betActive) {
    const sig = await placeBet(betAmount);
    if (!sig) return;
    setBetActive(true);
    startRound();
  } else {
    handleCashout();
  }
}

  useEffect(() => () => clearTimer(), []);

  return (
    <div className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden mb-6">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e1e]">
        <div className="flex items-center gap-3">
          <span className="font-display text-xl tracking-widest">CRASH</span>
          <span className="font-mono text-[9px] tracking-widest uppercase px-2 py-1 rounded bg-[#7a0014] text-[#e8002a] animate-pulse">
            LIVE
          </span>
        </div>
        {balance !== null && (
          <span className="font-mono text-xs text-[#5a5a5a]">
            Balance: <span className="text-[#00e676]">{balance.toFixed(3)} SOL</span>
          </span>
        )}
      </div>

      {/* Multiplier display */}
      <div className="flex items-center justify-center h-56 bg-[#0d0d0d] relative">
        <div
          className={`font-display text-8xl tracking-widest transition-colors ${
            isBust ? 'text-[#5a5a5a]' : 'text-[#00e676]'
          }`}
          style={{ textShadow: isBust ? 'none' : '0 0 40px rgba(0,230,118,0.5)' }}
        >
          {multiplier.toFixed(2)}x
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-[11px] tracking-widest uppercase text-[#5a5a5a] whitespace-nowrap">
          {status}
        </div>
      </div>

      {/* Recent rounds */}
      <div className="flex flex-wrap gap-2 px-5 py-3 border-t border-[#1e1e1e]">
        {recentRounds.map((r, i) => (
          <span
            key={i}
            className={`font-mono text-[10px] px-2 py-1 rounded ${
              r >= 2
                ? 'bg-[rgba(0,230,118,0.12)] text-[#00e676]'
                : 'bg-[rgba(232,0,42,0.12)] text-[#e8002a]'
            }`}
          >
            {r.toFixed(2)}x
          </span>
        ))}
      </div>

      {/* Bet panel */}
      <div className="grid grid-cols-2 gap-5 p-5 border-t border-[#1e1e1e]">
        {/* Bet amount */}
        <div className="flex flex-col gap-2">
          <label className="font-mono text-[9px] tracking-widest uppercase text-[#5a5a5a]">Bet Amount</label>
          <div className="flex items-center bg-[#0a0a0a] border border-[#1e1e1e] rounded-md overflow-hidden focus-within:border-[#e8002a] transition-colors">
            <span className="px-3 font-mono text-xs text-[#5a5a5a] border-r border-[#1e1e1e] h-11 flex items-center bg-[#111]">◎</span>
            <input
              type="number"
              value={betAmount}
              min={0.001}
              step={0.01}
              onChange={e => setBetAmount(parseFloat(e.target.value))}
              className="flex-1 bg-transparent font-mono text-sm text-[#f0ece4] px-3 h-11 outline-none"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[0.05, 0.1, 0.5, 1].map(v => (
              <button key={v} onClick={() => setBetAmount(v)}
                className="font-mono text-[10px] px-2 py-1 border border-[#1e1e1e] rounded text-[#5a5a5a] hover:border-[#e8002a] hover:text-[#e8002a] transition-all">
                {v}
              </button>
            ))}
            <button onClick={() => setBetAmount(b => parseFloat((b / 2).toFixed(3)))}
              className="font-mono text-[10px] px-2 py-1 border border-[#1e1e1e] rounded text-[#5a5a5a] hover:border-[#e8002a] hover:text-[#e8002a] transition-all">½</button>
            <button onClick={() => setBetAmount(b => parseFloat((b * 2).toFixed(3)))}
              className="font-mono text-[10px] px-2 py-1 border border-[#1e1e1e] rounded text-[#5a5a5a] hover:border-[#e8002a] hover:text-[#e8002a] transition-all">2×</button>
          </div>
        </div>

        {/* Auto cashout */}
        <div className="flex flex-col gap-2">
          <label className="font-mono text-[9px] tracking-widest uppercase text-[#5a5a5a]">Auto Cash-Out</label>
          <div className="flex items-center bg-[#0a0a0a] border border-[#1e1e1e] rounded-md overflow-hidden focus-within:border-[#e8002a] transition-colors">
            <span className="px-3 font-mono text-xs text-[#5a5a5a] border-r border-[#1e1e1e] h-11 flex items-center bg-[#111]">✕</span>
            <input
              type="number"
              value={autoCashout}
              min={1.01}
              step={0.1}
              onChange={e => setAutoCashout(parseFloat(e.target.value))}
              className="flex-1 bg-transparent font-mono text-sm text-[#f0ece4] px-3 h-11 outline-none"
            />
          </div>
          <p className="font-mono text-[10px] text-[#5a5a5a]">Set to 0 for manual cash-out</p>
        </div>

        {/* Action button */}
        <button
          onClick={handleAction}
          disabled={loading}
          className={`col-span-2 py-4 rounded-md font-display text-lg tracking-widest transition-all ${
            betActive
              ? 'bg-[#00e676] text-black hover:shadow-[0_0_30px_rgba(0,230,118,0.4)]'
              : 'bg-[#e8002a] text-white hover:bg-[#ff0033] hover:shadow-[0_0_30px_rgba(232,0,42,0.4)]'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'CONFIRMING...' : betActive ? 'CASH OUT' : connected ? 'BET NOW' : 'CONNECT WALLET'}
        </button>

        {txError && (
          <p className="col-span-2 font-mono text-[11px] text-[#e8002a] text-center">{txError}</p>
        )}
      </div>
    </div>
  );
}