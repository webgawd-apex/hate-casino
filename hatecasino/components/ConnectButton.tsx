'use client';

import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useEffect, useState } from 'react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export function ConnectButton() {
  const { publicKey, disconnect, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!publicKey) { setBalance(null); return; }

    // Fetch balance on connect
    connection.getBalance(publicKey).then(lamports => {
      setBalance(lamports / LAMPORTS_PER_SOL);
    });

    // Live balance updates
    const id = connection.onAccountChange(publicKey, (info) => {
      setBalance(info.lamports / LAMPORTS_PER_SOL);
    });

    return () => { connection.removeAccountChangeListener(id); };
  }, [publicKey, connection]);

  if (connected && publicKey) {
    return (
      <button
        onClick={disconnect}
        className="flex items-center gap-2 px-4 py-2 rounded font-mono text-xs uppercase tracking-widest border border-[#1e1e1e] bg-[#111] text-[#f0ece4] hover:border-[#e8002a] transition-all"
      >
        <span className="text-[#00e676]">{balance !== null ? `${balance.toFixed(3)} SOL` : '...'}</span>
        <span className="text-[#5a5a5a]">
          {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={() => setVisible(true)}
      className="flex items-center gap-2 px-4 py-2 rounded font-mono text-xs uppercase tracking-widest bg-[#e8002a] text-white hover:bg-[#ff0033] hover:shadow-[0_0_20px_rgba(232,0,42,0.4)] transition-all"
    >
      Connect Wallet
    </button>
  );
}