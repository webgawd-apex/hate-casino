'use client';

import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useEffect, useState, useCallback } from 'react';
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  SystemProgram,
} from '@solana/web3.js';

const HOUSE_WALLET = new PublicKey('6fJ4pPNbQjafe8aBAQxEhHpYDoQe9NFqARa74aEuRVaz');

export function useGameWallet() {
  const { publicKey, sendTransaction, connected, connecting } = useWallet();
  const { connection } = useConnection();

  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) { setBalance(null); return; }

    connection.getBalance(publicKey).then(lamports => {
      setBalance(lamports / LAMPORTS_PER_SOL);
    });

    const id = connection.onAccountChange(publicKey, (info) => {
      setBalance(info.lamports / LAMPORTS_PER_SOL);
    });

    return () => { connection.removeAccountChangeListener(id); };
  }, [publicKey, connection]);

  const placeBet = useCallback(async (amountSOL: number): Promise<string | null> => {
    if (!publicKey) return null;

    if (balance !== null && amountSOL > balance) {
      setTxError('Insufficient balance');
      return null;
    }

    setLoading(true);
    setTxError(null);

    try {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey:   HOUSE_WALLET,
          lamports:   Math.floor(amountSOL * LAMPORTS_PER_SOL),
        })
      );

      const signature = await sendTransaction(transaction, connection);
      const latestBlockhash = await connection.getLatestBlockhash();
await connection.confirmTransaction({
  signature,
  ...latestBlockhash,
}, 'confirmed');
      return signature;
    } catch (err: any) {
      setTxError(err?.message ?? 'Transaction failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, [publicKey, balance, connection, sendTransaction]);

  return {
    connected,
    connecting,
    publicKey,
    balance,
    loading,
    txError,
    placeBet,
  };
}