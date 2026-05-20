import { Connection, PublicKey } from '@solana/web3.js';

const HELIUS = 'https://mainnet.helius-rpc.com/?api-key=45c09379-40fc-49f0-93a0-733d9d41d1a4';
const TOKEN_MINT = 'DGNPSiTrX5xnKcpVKBaXUsWBZbFuA2cJcb7fUJmoAJrd';
const ESCROW    = 'GynyDkXj8WVdP7XDL1nTekF7Azv7ebxA7RCMnY3a3tSu';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { signature, walletAddress, expectedAmount } = req.body;

  if (!signature || !walletAddress || !expectedAmount) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const connection = new Connection(HELIUS, 'confirmed');

    // Wait for transaction to be confirmed
    let tx = null;
    for (let i = 0; i < 8; i++) {
      tx = await connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed',
      });
      if (tx) break;
      await new Promise(r => setTimeout(r, 2000));
    }

    if (!tx) {
      return res.status(400).json({ error: 'Transaction not found on-chain' });
    }

    if (tx.meta?.err) {
      return res.status(400).json({ error: 'Transaction failed on-chain' });
    }

    // Verify tokens were sent to escrow
    const pre  = tx.meta?.preTokenBalances  || [];
    const post = tx.meta?.postTokenBalances || [];

    let escrowReceived = 0;
    for (const p of post) {
      if (p.mint !== TOKEN_MINT) continue;
      const owner = p.owner || '';
      if (owner !== ESCROW) continue;
      const preEntry = pre.find(x => x.accountIndex === p.accountIndex);
      const preAmt   = preEntry?.uiTokenAmount?.uiAmount  || 0;
      const postAmt  = p.uiTokenAmount?.uiAmount || 0;
      escrowReceived += Math.max(0, postAmt - preAmt);
    }

    // Allow 1% tolerance for rounding
    if (escrowReceived < expectedAmount * 0.99) {
      return res.status(400).json({
        error: `Insufficient payment. Received ${escrowReceived.toFixed(2)} FT, expected ${expectedAmount} FT`,
      });
    }

    return res.status(200).json({
      success: true,
      confirmed: escrowReceived,
      signature,
    });

  } catch (err) {
    console.error('confirm-purchase error:', err);
    return res.status(500).json({ error: err.message });
  }
}
