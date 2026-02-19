// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./SanctionsOracle.sol";

/**
 * @title ComplianceGate
 * @author BridgeWatch Team
 * @notice Records compliance decisions combining OFAC screening + ML risk scores
 * @dev Integrates with SanctionsOracle for address checking and records
 *      all compliance decisions on-chain for audit purposes.
 * 
 * The ComplianceGate receives risk scores from the off-chain ML pipeline
 * and combines them with on-chain OFAC screening to make final decisions.
 */
contract ComplianceGate is Ownable {
    
    /// @notice Reference to the SanctionsOracle contract
    SanctionsOracle public oracle;
    
    /// @notice Risk score threshold for flagging (requires manual review)
    uint8 public flagThreshold = 30;
    
    /// @notice Risk score threshold for blocking
    uint8 public blockThreshold = 70;

    /// @notice Possible compliance decisions
    enum Decision { APPROVED, FLAGGED, BLOCKED }

    /// @notice Record of a compliance decision
    struct ComplianceRecord {
        address sender;
        address recipient;
        uint256 riskScore;
        bool ofacMatch;
        Decision decision;
        uint256 timestamp;
    }

    /// @notice Mapping from transaction hash to compliance record
    mapping(bytes32 => ComplianceRecord) public records;
    
    /// @notice Total number of decisions recorded
    uint256 public totalDecisions;

    /// @notice Emitted when a compliance decision is recorded
    event ComplianceDecision(
        bytes32 indexed txHash,
        address indexed sender,
        address indexed recipient,
        uint256 riskScore,
        Decision decision
    );
    
    /// @notice Emitted when thresholds are updated
    event ThresholdsUpdated(uint8 flagThreshold, uint8 blockThreshold);

    /**
     * @notice Initialize the ComplianceGate with a SanctionsOracle
     * @param _oracle Address of the deployed SanctionsOracle contract
     */
    constructor(address _oracle) Ownable(msg.sender) {
        oracle = SanctionsOracle(_oracle);
    }

    /**
     * @notice Record a compliance decision for a transaction
     * @dev Called by the off-chain orchestrator after ML analysis
     * @param txHash Hash of the transaction being evaluated
     * @param sender Sender address
     * @param recipient Recipient address
     * @param riskScore ML-generated risk score (0-100)
     * @param ofacMatch Whether OFAC screening found a match
     */
    function recordDecision(
        bytes32 txHash,
        address sender,
        address recipient,
        uint256 riskScore,
        bool ofacMatch
    ) external onlyOwner {
        Decision decision;
        
        // OFAC match always results in BLOCKED
        if (ofacMatch) {
            decision = Decision.BLOCKED;
        } else if (riskScore >= blockThreshold) {
            decision = Decision.BLOCKED;
        } else if (riskScore >= flagThreshold) {
            decision = Decision.FLAGGED;
        } else {
            decision = Decision.APPROVED;
        }

        records[txHash] = ComplianceRecord({
            sender: sender,
            recipient: recipient,
            riskScore: riskScore,
            ofacMatch: ofacMatch,
            decision: decision,
            timestamp: block.timestamp
        });
        
        totalDecisions++;

        emit ComplianceDecision(txHash, sender, recipient, riskScore, decision);
    }

    /**
     * @notice Get the compliance record for a transaction
     * @param txHash Transaction hash to query
     * @return ComplianceRecord struct with decision details
     */
    function getRecord(bytes32 txHash) external view returns (ComplianceRecord memory) {
        return records[txHash];
    }

    /**
     * @notice Update the risk score thresholds
     * @dev Only callable by owner
     * @param _flagThreshold New threshold for flagging
     * @param _blockThreshold New threshold for blocking
     */
    function updateThresholds(uint8 _flagThreshold, uint8 _blockThreshold) external onlyOwner {
        require(_flagThreshold < _blockThreshold, "Flag must be less than block");
        require(_blockThreshold <= 100, "Block threshold max 100");
        
        flagThreshold = _flagThreshold;
        blockThreshold = _blockThreshold;
        
        emit ThresholdsUpdated(_flagThreshold, _blockThreshold);
    }

    /**
     * @notice Update the SanctionsOracle address
     * @dev Only callable by owner
     * @param _oracle New oracle address
     */
    function updateOracle(address _oracle) external onlyOwner {
        oracle = SanctionsOracle(_oracle);
    }
}
