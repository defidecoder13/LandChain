import { ethers, BrowserProvider, Contract, Signer } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './contract/contractConfig';

const POLYGON_AMOY_CHAIN_ID = '0x13882'; // 80002
const POLYGON_AMOY_CONFIG = {
    chainId: POLYGON_AMOY_CHAIN_ID,
    chainName: 'Polygon Amoy Testnet',
    nativeCurrency: {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18
    },
    rpcUrls: ['https://rpc-amoy.polygon.technology'],
    blockExplorerUrls: ['https://amoy.polygonscan.com/']
};

/**
 * Switch wallet network to Polygon Amoy
 */
const checkAndSwitchNetwork = async (provider: BrowserProvider) => {
    const network = await provider.getNetwork();
    const chainIdHex = "0x" + network.chainId.toString(16);

    if (chainIdHex !== POLYGON_AMOY_CHAIN_ID) {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: POLYGON_AMOY_CHAIN_ID }],
            });
        } catch (switchError: any) {
            // This error code indicates that the chain has not been added to MetaMask.
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [POLYGON_AMOY_CONFIG],
                    });
                } catch (addError) {
                    throw new Error('Failed to add Polygon Amoy network to wallet.');
                }
            } else {
                throw new Error('Failed to switch network to Polygon Amoy.');
            }
        }
        // Refresh provider after switch
        return new BrowserProvider(window.ethereum);
    }
    return provider;
};

/**
 * Get a provider and signer from window.ethereum
 */
export const getBlockchainProvider = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask is not installed');
    }

    let provider = new BrowserProvider(window.ethereum);
    provider = await checkAndSwitchNetwork(provider);

    const signer = await provider.getSigner();
    return { provider, signer };
};

/**
 * Get an instance of the LandRegistry contract
 */
export const getLandRegistryContract = async (signer: Signer) => {
    return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
};

const GAS_OVERRIDES = {
    maxPriorityFeePerGas: ethers.parseUnits('30', 'gwei'),
    maxFeePerGas: ethers.parseUnits('60', 'gwei'),
};

/**
 * Register a new property on the blockchain
 */
export const registerPropertyOnChain = async (
    propertyId: string,
    ownerAddress: string,
    documentHash: string
) => {
    const { signer } = await getBlockchainProvider();
    const contract = await getLandRegistryContract(signer);

    const tx = await contract.registerProperty(propertyId, ownerAddress, documentHash, GAS_OVERRIDES);
    await tx.wait(); // Wait for confirmation
    return tx.hash;
};

/**
 * Transfer property ownership on the blockchain
 */
export const transferOwnershipOnChain = async (
    propertyId: string,
    toAddress: string,
    blockchainTxHash: string // Historical ref or specific tracking id
) => {
    const { signer } = await getBlockchainProvider();
    const contract = await getLandRegistryContract(signer);

    const tx = await contract.transferOwnership(propertyId, toAddress, blockchainTxHash, GAS_OVERRIDES);
    await tx.wait();
    return tx.hash;
};

/**
 * Raise a dispute on a property
 */
export const raiseDisputeOnChain = async (propertyId: string, reason: string) => {
    const { signer } = await getBlockchainProvider();
    const contract = await getLandRegistryContract(signer);

    const tx = await contract.raiseDispute(propertyId, reason, GAS_OVERRIDES);
    await tx.wait();
    return tx.hash;
};

/**
 * Resolve a dispute on-chain
 */
export const resolveDisputeOnChain = async (propertyId: string, resolutionNote: string) => {
    const { signer } = await getBlockchainProvider();
    const contract = await getLandRegistryContract(signer);

    const tx = await contract.resolveDispute(propertyId, resolutionNote, GAS_OVERRIDES);
    await tx.wait();
    return tx.hash;
};

/**
 * Freeze a property on-chain
 */
export const freezePropertyOnChain = async (propertyId: string) => {
    const { signer } = await getBlockchainProvider();
    const contract = await getLandRegistryContract(signer);

    const tx = await contract.freezeProperty(propertyId, GAS_OVERRIDES);
    await tx.wait();
    return tx.hash;
};

/**
 * Fetch property details directly from the blockchain
 */
export const getPropertyOnChain = async (propertyId: string) => {
    // For read operations, use a static JsonRpcProvider to avoid wallet interaction
    const provider = new ethers.JsonRpcProvider(POLYGON_AMOY_CONFIG.rpcUrls[0]);
    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    try {
        const property = await contract.getProperty(propertyId);
        // Returns struct: [propertyId, owner, documentHash, state, timestamp]
        // Note: The struct is returned as an array-like object by ethers.js for tuples
        return {
            propertyId: property[0],
            owner: property[1],
            documentHash: property[2],
            state: Number(property[3]), // Enum: 0=Registered/Active, 1=Disputed, 2=Frozen
            timestamp: Number(property[4])
        };
    } catch (err: any) {
        // If the contract reverts with "Property does not exist", return null
        if (err.message.includes("Property does not exist") || (err.info && err.info.error && err.info.error.message && err.info.error.message.includes("Property does not exist"))) {
            return null;
        }
        console.error("Error fetching on-chain property:", err);
        return null;
    }
};
