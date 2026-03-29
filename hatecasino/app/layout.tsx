import type { Metadata } from 'next';
import { SolanaProvider } from '@/providers/SolanaProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'HateCasino — On-Chain Solana Gaming',
  description: 'Provably fair Solana casino',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SolanaProvider>
          {children}
        </SolanaProvider>
      </body>
    </html>
  );
}