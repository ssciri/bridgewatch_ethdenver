const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BridgeWatch", function () {
  
  describe("SanctionsOracle", function () {
    let oracle;
    let owner;
    let user;

    const SANCTIONED_ADDRESS = "0x098B716B8Aaf21512996dC57EB0615e2383E2f96";
    const CLEAN_ADDRESS = "0x1234567890123456789012345678901234567890";

    beforeEach(async function () {
      [owner, user] = await ethers.getSigners();
      
      const SanctionsOracle = await ethers.getContractFactory("SanctionsOracle");
      oracle = await SanctionsOracle.deploy();
      await oracle.waitForDeployment();
    });

    describe("Deployment", function () {
      it("Should set the right owner", async function () {
        expect(await oracle.owner()).to.equal(owner.address);
      });

      it("Should start with empty sanctions root", async function () {
        expect(await oracle.sanctionsRoot()).to.equal(ethers.ZeroHash);
      });
    });

    describe("Sanctions Root Management", function () {
      it("Should allow owner to update sanctions root", async function () {
        const newRoot = ethers.keccak256(ethers.toUtf8Bytes("test"));
        
        await expect(oracle.updateSanctionsRoot(newRoot))
          .to.emit(oracle, "SanctionsRootUpdated");
        
        expect(await oracle.sanctionsRoot()).to.equal(newRoot);
      });

      it("Should reject non-owner updates", async function () {
        const newRoot = ethers.keccak256(ethers.toUtf8Bytes("test"));
        
        await expect(
          oracle.connect(user).updateSanctionsRoot(newRoot)
        ).to.be.revertedWithCustomError(oracle, "OwnableUnauthorizedAccount");
      });

      it("Should update lastUpdated timestamp", async function () {
        const newRoot = ethers.keccak256(ethers.toUtf8Bytes("test"));
        await oracle.updateSanctionsRoot(newRoot);
        
        expect(await oracle.lastUpdated()).to.be.gt(0);
      });
    });

    describe("Address Checking", function () {
      let merkleRoot;
      
      beforeEach(async function () {
        // Simple single-leaf tree for testing
        merkleRoot = ethers.keccak256(
          ethers.solidityPacked(["address"], [SANCTIONED_ADDRESS])
        );
        await oracle.updateSanctionsRoot(merkleRoot);
      });

      it("Should return correct leaf hash", async function () {
        const expectedHash = ethers.keccak256(
          ethers.solidityPacked(["address"], [SANCTIONED_ADDRESS])
        );
        
        expect(await oracle.getLeafHash(SANCTIONED_ADDRESS)).to.equal(expectedHash);
      });

      it("Should verify sanctioned address with valid proof", async function () {
        // For single-element tree, leaf is the root
        const result = await oracle.checkAddress(SANCTIONED_ADDRESS, []);
        expect(result).to.equal(true);
      });

      it("Should reject clean address", async function () {
        const result = await oracle.checkAddress(CLEAN_ADDRESS, []);
        expect(result).to.equal(false);
      });

      it("Should emit events when checking via isSanctioned", async function () {
        await expect(oracle.isSanctioned(SANCTIONED_ADDRESS, []))
          .to.emit(oracle, "AddressChecked")
          .withArgs(SANCTIONED_ADDRESS, true);
      });

      it("Should emit SanctionedAddressBlocked for matches", async function () {
        await expect(oracle.isSanctioned(SANCTIONED_ADDRESS, []))
          .to.emit(oracle, "SanctionedAddressBlocked");
      });
    });
  });

  describe("ComplianceGate", function () {
    let oracle;
    let gate;
    let owner;

    beforeEach(async function () {
      [owner] = await ethers.getSigners();
      
      const SanctionsOracle = await ethers.getContractFactory("SanctionsOracle");
      oracle = await SanctionsOracle.deploy();
      await oracle.waitForDeployment();
      
      const ComplianceGate = await ethers.getContractFactory("ComplianceGate");
      gate = await ComplianceGate.deploy(await oracle.getAddress());
      await gate.waitForDeployment();
    });

    describe("Decision Recording", function () {
      const txHash = ethers.keccak256(ethers.toUtf8Bytes("test-tx"));
      const sender = "0x1111111111111111111111111111111111111111";
      const recipient = "0x2222222222222222222222222222222222222222";

      it("Should approve low-risk transactions", async function () {
        await gate.recordDecision(txHash, sender, recipient, 20, false);
        
        const record = await gate.getRecord(txHash);
        expect(record.decision).to.equal(0); // APPROVED
      });

      it("Should flag medium-risk transactions", async function () {
        await gate.recordDecision(txHash, sender, recipient, 50, false);
        
        const record = await gate.getRecord(txHash);
        expect(record.decision).to.equal(1); // FLAGGED
      });

      it("Should block high-risk transactions", async function () {
        await gate.recordDecision(txHash, sender, recipient, 80, false);
        
        const record = await gate.getRecord(txHash);
        expect(record.decision).to.equal(2); // BLOCKED
      });

      it("Should block OFAC matches regardless of score", async function () {
        await gate.recordDecision(txHash, sender, recipient, 10, true);
        
        const record = await gate.getRecord(txHash);
        expect(record.decision).to.equal(2); // BLOCKED
      });

      it("Should emit ComplianceDecision event", async function () {
        await expect(gate.recordDecision(txHash, sender, recipient, 50, false))
          .to.emit(gate, "ComplianceDecision")
          .withArgs(txHash, sender, recipient, 50, 1); // FLAGGED
      });

      it("Should increment totalDecisions", async function () {
        await gate.recordDecision(txHash, sender, recipient, 20, false);
        expect(await gate.totalDecisions()).to.equal(1);
      });
    });

    describe("Threshold Management", function () {
      it("Should allow updating thresholds", async function () {
        await gate.updateThresholds(40, 80);
        
        expect(await gate.flagThreshold()).to.equal(40);
        expect(await gate.blockThreshold()).to.equal(80);
      });

      it("Should reject invalid thresholds (flag >= block)", async function () {
        await expect(
          gate.updateThresholds(80, 40)
        ).to.be.revertedWith("Flag must be less than block");
      });

      it("Should reject thresholds over 100", async function () {
        await expect(
          gate.updateThresholds(30, 150)
        ).to.be.revertedWith("Block threshold max 100");
      });
    });
  });
});
