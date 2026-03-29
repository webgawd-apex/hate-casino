'use client';

import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import '@solana/wallet-adapter-react-ui/styles.css';

interface Props { children: ReactNode }

export const SolanaProvider: FC<Props> = ({ children }) => {
  const endpoint = 'https://api.devnet.solana.com';
  const wallets  = useMemo(() => [
    new SolflareWalletAdapter(), // Phantom auto-registers via Wallet Standard
  ], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};