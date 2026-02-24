
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Load Contract Config
const contractConfigPath = path.join(__dirname, "../src/lib/contract/contractConfig.ts");
const contractConfigContent = fs.readFileSync(contractConfigPath, "utf8");

// Extract Address (Regex because it's a TS file)
const addressMatch = contractConfigContent.match(/CONTRACT_ADDRESS = "(0x[a-fA-F0-9]+)"/);
const CONTRACT_ADDRESS = addressMatch ? addressMatch[1] : null;

// Load ABI
const abiPath = path.join(__dirname, "../src/lib/contract/LandRegistryABI.json");
const CONTRACT_ABI = JSON.parse(fs.readFileSync(abiPath, "utf8"));

const RPC_URL = "https://rpc-amoy.polygon.technology";

async function main() {
    console.log(`Checking Property on ${RPC_URL}`);
    console.log(`Contract: ${CONTRACT_ADDRESS}`);

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    const propertyId = "PROP-3631-04"; // The ID from the error log

    try {
        console.log(`Fetching ${propertyId}...`);
        // Using the correct function getProperty(string)
        const prop = await contract.getProperty(propertyId);

        console.log("On-Chain Data:");
        console.log("- ID:", prop[0]);
        console.log("- Owner:", prop[1]);
        console.log("- DocHash:", prop[2]);
        console.log("- State:", prop[3].toString());
        console.log("- Timestamp:", prop[4].toString());

        if (prop[1] === "0x0000000000000000000000000000000000000000") {
            console.error("ERROR: Property does not exist (Owner is zero address).");
        } else {
            // Enum logic: 0=Active, 1=Disputed, 2=Frozen (based on common practice, need to verify contract)
            const state = Number(prop[3]);
            if (state === 0) {
                console.log("SUCCESS: Property exists and is Active (0). Dispute should be possible.");
            } else {
                console.log(`WARNING: Property is in state ${state}. Can you dispute a property in this state?`);
            }
        }

    } catch (e) {
        console.error("Failed to fetch property:", e.message);
        if (e.data) console.error("Revert Data:", e.data);
    }
}

main();
