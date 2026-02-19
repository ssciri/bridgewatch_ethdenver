const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("");
  console.log("🛡️  BridgeWatch Deployment");
  console.log("═".repeat(50));
  
  // Get deployer info
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance: ", hre.ethers.formatEther(balance), "ETH");
  console.log("Network: ", hre.network.name);
  console.log("");

  // Deploy SanctionsOracle
  console.log("📋 Deploying SanctionsOracle...");
  const SanctionsOracle = await hre.ethers.getContractFactory("SanctionsOracle");
  const oracle = await SanctionsOracle.deploy();
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log("✅ SanctionsOracle deployed to:", oracleAddress);

  // Deploy ComplianceGate
  console.log("\n📋 Deploying ComplianceGate...");
  const ComplianceGate = await hre.ethers.getContractFactory("ComplianceGate");
  const gate = await ComplianceGate.deploy(oracleAddress);
  await gate.waitForDeployment();
  const gateAddress = await gate.getAddress();
  console.log("✅ ComplianceGate deployed to:", gateAddress);

  // Set up a sample Merkle root (demo purposes)
  console.log("\n📋 Setting sample sanctions root...");
  
  // Sample root representing known sanctioned addresses
  const sampleRoot = hre.ethers.keccak256(
    hre.ethers.solidityPacked(
      ["address", "address", "address"],
      [
        "0x098B716B8Aaf21512996dC57EB0615e2383E2f96", // Lazarus Group
        "0xa7e5d5a720f06526557c513402f2e6b5fa20b008", // Sanctioned
        "0x8589427373D6D84E98730D7795D8f6f8731FDA16"  // Tornado Cash
      ]
    )
  );
  
  const tx = await oracle.updateSanctionsRoot(sampleRoot);
  await tx.wait();
  console.log("✅ Sample sanctions root set");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      SanctionsOracle: oracleAddress,
      ComplianceGate: gateAddress
    }
  };

  fs.writeFileSync(
    "deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n📁 Deployment info saved to deployment.json");

  // Summary
  console.log("\n" + "═".repeat(50));
  console.log("🎉 Deployment Complete!");
  console.log("═".repeat(50));
  console.log("\nContracts:");
  console.log("  SanctionsOracle:", oracleAddress);
  console.log("  ComplianceGate: ", gateAddress);
  
  if (hre.network.name === "sepolia") {
    console.log("\nEtherscan Links:");
    console.log(`  https://sepolia.etherscan.io/address/${oracleAddress}`);
    console.log(`  https://sepolia.etherscan.io/address/${gateAddress}`);
  }
  
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
