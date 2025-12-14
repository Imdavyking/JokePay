# JokePay 😂💸

**Premium Jokes on Demand with x402 Micropayments (Solana)**

JokePay is a fun, lightweight Solana dApp that demonstrates **pay-per-use AI content** using **x402 micropayments**. Users can enjoy free basic jokes, but must pay a tiny amount (e.g. **0.01 USDC**) to unlock **premium, funnier, or personalized jokes** — instantly.

This project showcases how **x402 + Solana** enable seamless, real-time micropayments for digital content without subscriptions.

---

## 🚀 What This Project Demonstrates

* HTTP **402 Payment Required** flow in a real application
* Instant **micropayments on Solana** (USDC)
* Pay-and-unlock content UX (no subscriptions)
* x402 client + server integration
* A simple, viral-friendly dApp use case

Perfect for hackathons, demos, and learning how to monetize APIs/content on-chain.

---

## 🧠 How It Works (High Level)

1. User connects their Solana wallet (Phantom, etc.)
2. User clicks **“Free Joke”** → joke is returned instantly
3. User requests a **Premium Joke** (optionally personalized)
4. Backend responds with **HTTP 402** + payment requirements
5. x402 client:

   * Detects the 402 response
   * Prompts wallet payment (e.g. 0.01 USDC)
   * Submits transaction on Solana
   * Automatically retries the request
6. Backend verifies payment and returns the premium joke 🎉

---

## ✨ Features (MVP)

### Frontend (Next.js)

* 🔐 Solana wallet connection
* 😂 Free joke button (no payment)
* 💎 Premium joke input ("Tell me a joke about …")
* ⚡ Seamless x402 payment flow
* 📜 Joke result display

### Backend (API)

* 🔒 Protected `/api/premium-joke` endpoint
* 💰 Returns `402 Payment Required` when unpaid
* ✅ Verifies on-chain payment via x402
* 🤖 Generates AI or predefined premium jokes

---

## 🧱 Tech Stack

* **Frontend:** Next.js
* **Blockchain:** Solana (Devnet)
* **Wallets:** Phantom (via Solana Wallet Adapter)
* **Payments:** x402 Micropayments
* **AI Jokes:**

  * Free LLM API (Grok / Gemini), or
  * Static mock jokes for MVP
* **Deployment:** Vercel

### x402 SDKs

* Client: `@x402/fetch` or `@x402/axios`
* Server: `@x402/next` or `@x402/express`

---

## 🛠️ Setup Instructions

### 1️⃣ Clone the Repo

```bash
git clone https://github.com/imdavyking/jokepay.git
cd jokepay
```

### 2️⃣ Install Dependencies

```bash
npm install
# or
yarn install
```

### 3️⃣ Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
X402_RECEIVER_ADDRESS=YOUR_SOLANA_ADDRESS
X402_PRICE_USDC=0.01
```

---

## 🧪 Running Locally

```bash
npm run dev
```

Open: [http://localhost:3000](http://localhost:3000)

Make sure your wallet:

* Is connected to **Solana Devnet**
* Has **devnet USDC** from a faucet

---

## 🔌 API Endpoints

### Free Joke

```
GET /api/free-joke
```

Returns a basic joke without payment.

---

### Premium Joke

```
POST /api/premium-joke
Body: { "topic": "Solana" }
```

* Returns **402 Payment Required** if unpaid
* x402 client handles payment automatically
* Returns premium joke after successful payment

---

## ⏱️ One-Day Build Plan

* **Morning (2h):** Next.js setup + wallet connection
* **Midday (2h):** x402-protected API route
* **Afternoon (2h):** Client-side x402 integration
* **Evening (1–2h):** UI polish + demo recording

---

## 🎥 Demo Flow (Perfect for Hackathons)

1. Connect wallet
2. Click **Free Joke** → instant laugh
3. Enter topic for **Premium Joke**
4. See payment prompt (0.01 USDC)
5. Approve transaction
6. Receive premium joke instantly 🎉

---

## 🏆 Why This Project Wins

* ✅ Clear x402 usage (real 402 flow)
* ✅ Micropayments that actually make sense
* ✅ Fast, cheap Solana UX
* ✅ Fun, viral, demo-friendly
* ✅ Easily extensible (stories, images, advice)

---

## 🔮 Future Extensions

* Joke history (NFT-style receipts)
* Creator-uploaded jokes (revenue split)
* AI image / meme generation
* Tiered pricing (funnier = more expensive 😄)
* Social sharing

---

## 📜 License

MIT License

---

Built for hackathons. Powered by Solana ⚡ x402 💸 and humor 😂


