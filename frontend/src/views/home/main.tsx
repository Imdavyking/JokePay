import { useState } from "react";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import { BACKEND_URL, RPC_SOL } from "../../utils/constants";

// ===== CONFIG =====

const connection = new Connection(RPC_SOL);

// Devnet USDC mint
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

// Your receiving wallet
const MERCHANT_WALLET = new PublicKey(
  "AfsDkH86BvGK2GjGytLyotFihvmoc9aTwLNG5K5ZjuUw"
);

// 0.001 USDC (USDC has 6 decimals)
const AMOUNT = 1_000;

export default function JokePayPage() {
  const { publicKey, signTransaction } = useWallet();

  const [topic, setTopic] = useState("");
  const [joke, setJoke] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const getFreeJoke = () => {
    setJoke("Why do programmers hate nature? Too many bugs 😂");
  };

  const payAndGetJoke = async () => {
    try {
      if (!publicKey) throw new Error("Wallet not connected");
      setLoading(true);
      setStatus("Awaiting payment signature...");

      const userATA = await getAssociatedTokenAddress(USDC_MINT, publicKey);

      const merchantATA = await getAssociatedTokenAddress(
        USDC_MINT,
        MERCHANT_WALLET
      );

      console.log({ userATA, merchantATA });

      const ix = createTransferInstruction(
        userATA,
        merchantATA,
        publicKey,
        AMOUNT
      );

      const tx = new Transaction().add(ix);
      tx.feePayer = publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const sig = await signTransaction!(tx);
      const serializedTx = sig.serialize().toString("base64");

      const paymentProof = {
        x402Version: 1,
        scheme: "exact",
        network: "solana-devnet",
        payload: {
          serializedTransaction: serializedTx,
        },
      };

      const xPaymentHeader = Buffer.from(JSON.stringify(paymentProof)).toString(
        "base64"
      );

      const paid = await fetch(`${BACKEND_URL}/premium`, {
        headers: {
          "X-Payment": xPaymentHeader,
        },
      });

      const result = (await paid.json()) as {
        data?: string;
        error?: string;
        paymentDetails?: {
          signature: string;
          amount: number;
          amountUSDC: number;
          recipient: string;
          explorerUrl: string;
          joke: string;
        };
      };
    } catch (err: any) {
      setStatus(err.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white flex items-center justify-center px-4">
      <div className="max-w-xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <p className="text-zinc-400">
            One-page Solana dApp — Pay 0.001 USDC per premium joke
          </p>
        </div>

        {/* Free Joke */}
        <div className="bg-zinc-800/50 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold">Free Joke</h2>
          <button
            onClick={getFreeJoke}
            className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700"
          >
            Get Free Joke
          </button>
        </div>

        {/* Premium Joke */}
        <div className="bg-zinc-800/50 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold">💎 Premium Joke</h2>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Topic (optional)"
            className="w-full px-4 py-2 rounded-xl bg-black/40 border border-zinc-700"
          />
          <button
            onClick={payAndGetJoke}
            disabled={loading}
            className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Pay 0.001 USDC & Get Joke"}
          </button>
        </div>

        {/* Output */}
        {(status || joke) && (
          <div className="bg-black/40 rounded-xl p-4 space-y-2">
            {status && <p className="text-xs text-zinc-400">{status}</p>}
            {joke && <p className="whitespace-pre-line">{joke}</p>}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-zinc-500">
          Manual SPL-Token signing • Solana Devnet • Hackathon MVP
        </p>
      </div>
    </main>
  );
}
