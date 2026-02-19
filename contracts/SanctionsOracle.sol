// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title SanctionsOracle
 * @author BridgeWatch Team
 * @notice On-chain OFAC sanctions screening using Merkle proofs
 * @dev Stores Merkle root of sanctioned addresses for gas-efficient verification
 * 
 * This contract enables trustless, on-chain verification of whether an address
 * appears on the OFAC SDN (Specially Designated Nationals) list. The full list
 * is stored off-chain, with only a 32-byte Merkle root on-chain.
 */
contract SanctionsOracle is Ownable {
    
    /// @notice Merkle root of all sanctioned addresses
    bytes32 public sanctionsRoot;
    
    /// @notice Timestamp of last sanctions list update
    uint256 public lastUpdated;

    /// @notice Emitted when the sanctions root is updated
    event SanctionsRootUpdated(bytes32 indexed newRoot, uint256 timestamp);
    
    /// @notice Emitted when an address is checked
    event AddressChecked(address indexed addr, bool isSanctioned);
    
    /// @notice Emitted when a sanctioned address is detected
    event SanctionedAddressBlocked(address indexed addr, address indexed checker);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Update the sanctions list Merkle root
     * @dev Only callable by contract owner. In production, this would be
     *      updated by an authorized oracle or multisig.
     * @param newRoot New Merkle root computed from updated OFAC list
     */
    function updateSanctionsRoot(bytes32 newRoot) external onlyOwner {
        sanctionsRoot = newRoot;
        lastUpdated = block.timestamp;
        emit SanctionsRootUpdated(newRoot, block.timestamp);
    }

    /**
     * @notice Check if an address is sanctioned (state-changing, emits events)
     * @dev Use this when you want an on-chain record of the check
     * @param addr Address to check
     * @param merkleProof Proof that address is in the Merkle tree
     * @return True if address is sanctioned
     */
    function isSanctioned(
        address addr,
        bytes32[] calldata merkleProof
    ) external returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(addr));
        bool result = MerkleProof.verify(merkleProof, sanctionsRoot, leaf);
        
        emit AddressChecked(addr, result);
        
        if (result) {
            emit SanctionedAddressBlocked(addr, msg.sender);
        }
        
        return result;
    }

    /**
     * @notice Check if an address is sanctioned (view function, no events)
     * @dev Gas-efficient check without state changes
     * @param addr Address to check
     * @param merkleProof Proof that address is in the Merkle tree
     * @return True if address is sanctioned
     */
    function checkAddress(
        address addr,
        bytes32[] calldata merkleProof
    ) external view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(addr));
        return MerkleProof.verify(merkleProof, sanctionsRoot, leaf);
    }

    /**
     * @notice Get the leaf hash for an address
     * @dev Useful for off-chain Merkle proof generation
     * @param addr Address to hash
     * @return Keccak256 hash used as Merkle leaf
     */
    function getLeafHash(address addr) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(addr));
    }
}
