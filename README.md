# 🛡️ BridgeWatch

**Cross-Chain Compliance Intelligence for Global Sanctions Enforcement**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-purple)](https://soliditylang.org/)
[![ETH Denver 2026](https://img.shields.io/badge/ETH%20Denver-2026-green)](https://ethdenver.com)

> 🏆 **ETH Denver 2026** | Track 3: New France Village — The Future of Finance

---

## 🎯 The Problem

**$15.8 billion** was sent to sanctioned entities via crypto in 2024. Current compliance tools track *known* addresses — but they're blind to **new wallets** carrying funds from sanctioned sources through cross-chain bridges.

When funds move through Bridge A → Bridge B → Stablecoin, existing tools see "a normal transaction."

**The origin is invisible.**

---

## 💡 The Solution

BridgeWatch detects **behavior**, not just addresses.

| Layer | What It Does | How |
|-------|--------------|-----|
| **Layer 1** | OFAC Screening | On-chain Merkle proofs against 12,000+ sanctioned entities |
| **Layer 2** | Pattern Detection | ML/NLP analysis of transaction behavior |

### Two-Layer Protection

```
Transaction arrives
        ↓
┌─────────────────────────────┐
│  Layer 1: OFAC Oracle       │
│  "Is this address banned?"  │
│  → Instant on-chain check   │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│  Layer 2: Pattern Analysis  │
│  "Does behavior look        │
│   suspicious?"              │
│  → ML risk scoring          │
└──────────────┬──────────────┘
               ↓
        ┌──────┴──────┐
        │  DECISION   │
        │ ✅ APPROVED │
        │ ⚠️ FLAGGED  │
        │ 🚫 BLOCKED  │
        └─────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repo
git clone https://github.com/ssciri/bridgewatch.git
cd bridgewatch

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your ALCHEMY_API_KEY and PRIVATE_KEY
```

### Compile Contracts

```bash
npx hardhat compile
```

### Run Tests

```bash
npx hardhat test
```

### Deploy to Testnet

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Run Demo

```bash
npx hardhat run demo/run_demo.js --network sepolia
```

---

## 🌐 Live Demo

Open `index.html` in your browser to see the live monitoring dashboard.

**Or visit:** [Live Demo](https://ssciri.github.io/bridgewatch)

---

## 📜 Deployed Contracts (Sepolia Testnet)

| Contract | Address | Etherscan |
|----------|---------|-----------|
| **SanctionsOracle** | `0xf7d4B52e5F36072aB9cfc680476176Ae9982ef0d` | [View →](https://sepolia.etherscan.io/address/0xf7d4B52e5F36072aB9cfc680476176Ae9982ef0d) |
| **ComplianceGate** | `0xb55D2ABc062fA0fE73e78e97fC2bbF5f25DA3FEE` | [View →](https://sepolia.etherscan.io/address/0xb55D2ABc062fA0fE73e78e97fC2bbF5f25DA3FEE) |

---

## 📁 Project Structure

```
bridgewatch/
├── contracts/
│   ├── SanctionsOracle.sol    # OFAC Merkle verification
│   └── ComplianceGate.sol     # Risk scoring & decisions
├── scripts/
│   └── deploy.js              # Deployment script
├── test/
│   └── BridgeWatch.test.js    # Contract tests
├── demo/
│   └── run_demo.js            # Terminal demo
├── docs/
│   └── ARCHITECTURE.md        # System design
├── index.html                 # Live monitoring dashboard
├── hardhat.config.js
└── README.md
```

---

## 🔧 How It Works

### Layer 1: Sanctions Oracle

The `SanctionsOracle` contract stores a Merkle root of OFAC-sanctioned addresses.

```solidity
// Check if address is sanctioned
bool isBanned = oracle.checkAddress(walletAddress, merkleProof);
```

**Benefits:**
- Only 32 bytes stored on-chain
- O(log n) verification cost
- Trustless — anyone can verify

### Layer 2: Pattern Detection

Analyzes transaction behavior:

| Signal | Why Suspicious |
|--------|----------------|
| High gas ratio (>3x average) | Urgency, institutional behavior |
| Fresh wallet + high value | Funds from outside crypto |
| Round amounts ($1M, $100K) | Institutional transfers |
| Batch timing (on the hour) | Automated processing |

### Risk Scoring

```
Score 0-30   → ✅ APPROVED
Score 31-70  → ⚠️ FLAGGED (manual review)
Score 71-100 → 🚫 BLOCKED
OFAC Match   → 🚫 BLOCKED (always)
```

---

## 🌍 Threat Coverage

**Layer 1 — OFAC Sanctioned Entities:**
- 🇰🇵 North Korea (Lazarus Group)
- 🇷🇺 Russia (Garantex, oligarchs)
- 🇮🇷 Iran (oil-to-crypto networks)
- 🇻🇪 Venezuela, 🇨🇺 Cuba, 🇸🇾 Syria
- 🏴‍☠️ Mixers (Tornado Cash, Blender.io)
- 🌍 Terrorists, cartels, proliferators

**Layer 2 — Behavioral Patterns:**
- Institutional timing
- High gas behavior
- Fresh wallet anomalies
- Bridge hopping patterns

---

## 🎯 Use Cases

| Customer | Problem | Solution |
|----------|---------|----------|
| **Bridge Protocols** | Can't screen incoming funds | BridgeWatch screens before release |
| **Stablecoin Issuers** | GENIUS Act compliance | Automated sanctions screening |
| **DeFi Protocols** | Institutional adoption blocked | Verifiable compliance layer |

---

## 📊 Market Opportunity

- **$312B** stablecoin market cap
- **$33T** annual stablecoin transaction volume
- **GENIUS Act** (July 2025) mandates compliance
- **$15.8B** to sanctioned entities in 2024

---

## 🔬 The Innovation

**First application of NLP techniques to blockchain transaction data.**

We treat transaction calldata as "language" — different systems produce different byte patterns, like accents. This allows detection of suspicious origins even from brand-new wallets with no history.

> *"Existing tools ask 'Who is this address?' BridgeWatch asks 'Where did this behavior come from?'"*

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Smart Contracts | Solidity 0.8.20 |
| Framework | Hardhat |
| Libraries | OpenZeppelin |
| Network | Ethereum Sepolia (testnet) |
| Frontend | HTML/CSS/JavaScript |

---

## 🧪 Testing

```bash
# Run all tests
npx hardhat test

# Run with gas reporting
REPORT_GAS=true npx hardhat test
```

---

## 📄 Documentation

- [Architecture & Design](docs/ARCHITECTURE.md)

---

## ⚠️ Disclaimer

- This is **hackathon code** — not production-ready
- Deployed on **testnet only**
- **Not audited** — do not use with real funds
- Pattern detection uses simulated data

---

## 📜 License

MIT License — see [LICENSE](LICENSE)

---

## 🏆 ETH Denver 2026

**Track 3: New France Village — The Future of Finance**

> *BridgeWatch — Because addresses lie, but behavior doesn't.*

---

## 👥 Team

Built with ☕ for ETH Denver 2026

---

## 🔗 Links

- [Live Demo](https://ssciri.github.io/bridgewatch)
- [Etherscan — SanctionsOracle](https://sepolia.etherscan.io/address/0xf7d4B52e5F36072aB9cfc680476176Ae9982ef0d)
- [Etherscan — ComplianceGate](https://sepolia.etherscan.io/address/0xb55D2ABc062fA0fE73e78e97fC2bbF5f25DA3FEE)
