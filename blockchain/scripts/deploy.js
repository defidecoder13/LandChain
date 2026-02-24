const hre = require("hardhat");

async function main() {
    console.log("Starting LandRegistry contract deployment...");

    // Check if signer is available
    const [deployer] = await hre.ethers.getSigners();
    if (!deployer) {
        throw new Error("No deployer account found. Please check your .env file and hardhat.config.js");
    }

    console.log(`Deploying from account: ${deployer.address}`);

    // Get the ContractFactory
    const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");

    // Deploy the contract
    const landRegistry = await LandRegistry.deploy();

    // Wait for deployment to finish
    await landRegistry.waitForDeployment();

    const address = await landRegistry.getAddress();
    console.log(`LandRegistry deployed to: ${address}`);

    console.log("Deployment completed successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:");
        console.error(error);
        process.exit(1);
    });
