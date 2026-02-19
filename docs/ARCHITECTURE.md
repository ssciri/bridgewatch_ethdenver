# BridgeWatch Architecture

## Overview

BridgeWatch is a two-layer blockchain compliance system designed to detect sanctioned entities and suspicious transaction patterns in cross-chain bridge protocols.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BRIDGEWATCH                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐         ┌─────────────────┐                │
│  │  Bridge         │         │  Off-Chain      │                │
│  │  Transaction    │────────▶│  Orchestrator   │                │
│  │  (Wormhole,     │         │  (API)          │                │
│  │   LayerZero)    │         └────────┬────────┘                │
│  └─────────────────┘                  │                         │
│                                       ▼                         │
│                         ┌─────────────────────────┐             │
│                         │  LAYER 1: OFAC Check    │             │
│                         │  ───────────────────    │             │
│                         │  • Merkle proof verify  │             │
│                         │  • 12,000+ entities     │             │
│                         │  • On-chain, instant    │             │
│                         └────────────┬────────────┘             │
│                                      │                          │
│                                      ▼                          │
│                         ┌─────────────────────────┐             │
│                         │  LAYER 2: ML Analysis   │             │
│                         │  ───────────────────    │             │
│                         │  • Behavioral patterns  │             │
│                         │  • NLP on calldata      │             │
│                         │  • Risk scoring         │             │
│                         └────────────┬────────────┘             │
│                                      │                          │
│                                      ▼                          │
│                         ┌─────────────────────────┐             │
│                         │  COMPLIANCE DECISION    │             │
│                         │  ───────────────────    │             │
│                         │  ✅ APPROVED (0-30)     │             │
│                         │  ⚠️ FLAGGED (31-70)     │             │
│                         │  🚫 BLOCKED (71-100)    │             │
│                         │                         │             │
│                         │  → Recorded on-chain    │             │
│                         └─────────────────────────┘             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Smart Contracts

### SanctionsOracle.sol

The SanctionsOracle contract provides on-chain OFAC screening using Merkle proofs.

**Key Features:**
- Stores only 32-byte Merkle root on-chain
- O(log n) verification cost
- Supports 12,000+ sanctioned addresses efficiently

**Functions:**
```solidity
// Update the OFAC list (owner only)
function updateSanctionsRoot(bytes32 newRoot) external onlyOwner

// Check if address is sanctioned (view)
function checkAddress(address addr, bytes32[] calldata merkleProof) external view returns (bool)

// Check and emit events (state-changing)
function isSanctioned(address addr, bytes32[] calldata merkleProof) external returns (bool)
```

### ComplianceGate.sol

The ComplianceGate contract records compliance decisions combining OFAC screening with ML risk scores.

**Key Features:**
- Configurable risk thresholds
- Immutable audit trail
- Integrates with SanctionsOracle

**Decision Logic:**
```
if (OFAC match):
    → BLOCKED
else if (risk_score >= 70):
    → BLOCKED
else if (risk_score >= 30):
    → FLAGGED
else:
    → APPROVED
```

## Detection Layers

### Layer 1: OFAC Screening

Deterministic check against known sanctioned addresses.

**Coverage:**
- 🇰🇵 North Korea (Lazarus Group)
- 🇷🇺 Russia (Garantex, oligarchs)
- 🇮🇷 Iran (oil-to-crypto networks)
- 🇻🇪 Venezuela, 🇨🇺 Cuba, 🇸🇾 Syria
- 🏴‍☠️ Mixers (Tornado Cash)
- 🌍 Terrorists, cartels, proliferators

### Layer 2: Pattern Detection

Behavioral analysis using ML/NLP techniques.

**Signals:**
| Signal | Description | Risk Impact |
|--------|-------------|-------------|
| High gas ratio | >3x average gas price | +15-20 |
| Fresh wallet | <24 hours old | +15 |
| Round amounts | $100K, $1M exact | +10 |
| Batch timing | On the hour | +15 |
| Low nonce + high value | First tx is large | +20 |

## Data Flow

1. **Detection**: Bridge event detected (Wormhole, LayerZero, CCTP)
2. **Extraction**: Pull transaction metadata (sender, recipient, value, calldata)
3. **Layer 1**: Check addresses against OFAC Merkle tree
4. **Layer 2**: Extract behavioral features, compute risk score
5. **Decision**: Combine checks, determine APPROVED/FLAGGED/BLOCKED
6. **Recording**: Store decision on-chain via ComplianceGate

## Technology Stack

| Component | Technology |
|-----------|------------|
| Smart Contracts | Solidity 0.8.20 |
| Contract Framework | Hardhat |
| Libraries | OpenZeppelin |
| Network | Ethereum (Sepolia testnet) |
| Frontend | HTML/CSS/JavaScript |

## Security Considerations

1. **Oracle Trust**: The SanctionsOracle owner can update the Merkle root. In production, this should be a multisig or DAO.

2. **ML Evasion**: Sophisticated actors may attempt to evade behavioral detection. The system should be continuously updated.

3. **False Positives**: Flagged transactions require manual review to prevent blocking legitimate users.

4. **Privacy**: All checks are on-chain and public. Consider privacy implications.

## Future Enhancements

- [ ] Graph Neural Networks for transaction pattern analysis
- [ ] Real-time bridge monitoring integration
- [ ] Cross-chain identity linking
- [ ] Chainlink oracle for decentralized OFAC updates
- [ ] Privacy-preserving compliance proofs (ZK)
