import {
  Connection, PublicKey, Transaction, clusterApiUrl
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress, createTransferInstruction,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token';

const HELIUS = 'https://mainnet.helius-rpc.com/?api-key=45c09379-40fc-49f0-93a0-733d9d41d1a4';
const TOKEN_MINT = new PublicKey('DGNPSiTrX5xnKcpVKBaXUsWBZbFuA2cJcb7fUJmoAJrd');
const ESCROW = new PublicKey('GynyDkXj8WVdP7XDL1nTekF7Azv7ebxA7RCMnY3a3tSu');
const DECIMALS = 6;

export const connection = new Connection(HELIUS, 'confirmed');

// Read real FREEDOM token balance for a wallet
export async function getFreedomBalance(walletAddr) {
  try {
    const mint = TOKEN_MINT;
    const owner = new PublicKey(walletAddr);
    const ata = await getAssociatedTokenAddress(mint, owner);
    const info = await connection.getTokenAccountBalance(ata);
    return info.value.uiAmount || 0;
  } catch {
    return 0;
  }
}

// Transfer FREEDOM tokens from user wallet to escrow (purchase)
export async function transferToEscrow(walletAddr, amountFT) {
  try {
    const phantom = window.solana;
    if (!phantom?.isPhantom) throw new Error('Phantom not found');

    const sender = new PublicKey(walletAddr);
    const lamports = Math.floor(amountFT * Math.pow(10, DECIMALS));

    const senderATA = await getAssociatedTokenAddress(TOKEN_MINT, sender);
    const escrowATA = await getAssociatedTokenAddress(TOKEN_MINT, ESCROW);

    const { blockhash } = await connection.getLatestBlockhash();
    const tx = new Transaction();
    tx.recentBlockhash = blockhash;
    tx.feePayer = sender;

    tx.add(
      createTransferInstruction(
        senderATA,
        escrowATA,
        sender,
        lamports,
        [],
        TOKEN_PROGRAM_ID
      )
    );

    const signed = await phantom.signTransaction(tx);
    const sig = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(sig, 'confirmed');
    return { success: true, sig };
  } catch (e) {
    console.error('Transfer failed:', e);
    return { success: false, error: e.message };
  }
}

// Request payout from escrow to user (match win, friendly win)
export async function requestPayout(walletAddr, amountFT, reason) {
  try {
    const res = await fetch('/api/payout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: walletAddr, amount: amountFT, reason }),
    });
    const data = await res.json();
    return data;
  } catch (e) {
    return { success: false, error: e.message };
  }
}
