# LandChain

A decentralized National Blockchain Property System built to ensure secure, transparent, and efficient government property registration and management.

LandChain uses smart contracts on the Polygon blockchain to provide an immutable and mathematically provable ledger for real estate ownership. By bringing property records on-chain, it eliminates fraud, reduces bureaucratic friction, and creates a transparent history of ownership that anyone can verify but no one can illegally alter.

## Tech Stack
-   **Frontend:** Next.js (App Router), React, Tailwind CSS
-   **Blockchain:** Solidity, Hardhat, Ethers.js, Polygon/Ethereum Network
-   **Database / Backend:** Supabase (PostgreSQL)

## Detailed Application Workflow

The LandChain application manages the entire lifecycle of a property from initial registration, through various transfers, to dispute resolution—involving two main parties: **Citizens** and the **Registry Authority**.

### 1. Registration Phase (Citizen & Authority)

*   **Citizen Action (`/citizen/register`):** A citizen logs into the portal using their Web3 wallet (e.g., MetaMask). They submit a land registration application by providing property details (address, area, document hash/IPFS link, survey number) and their personal details. This data is kept off-chain (in Supabase) while in the pending state.
*   **Authority Review (`/authority/registrations` & `/authority/review/[id]`):** An authorized government official logs into the Authority Access panel. They can view all pending registration requests.
*   **Approval & Minting:** Upon verification of the off-chain documents, the Authority approves the application. This action triggers a smart contract transaction (`registerLand`), which officially mints a new property token (or record) on the blockchain. The property is now immutably tied to the citizen's wallet address.
*   **Rejection:** If documents are invalid, the Authority can reject the application, updating the status in the off-chain database.

### 2. Transfer Phase (Citizen to Citizen)

*   **Initiation (`/citizen/transfer`):** A citizen who owns a registered property can initiate a transfer to another individual by entering the recipient's wallet address and the property ID.
*   **Smart Contract Execution:** The transfer relies on the `transferLand` function in the smart contract. Once the transaction is signed and confirmed on the blockchain, ownership of the property token is permanently updated.
*   **Verification:** Both the sender and the receiver can view this updated ownership in their respective dashboards (`/citizen/properties`).

### 3. Dispute Resolution Phase (Citizen & Authority)

*   **Raising a Dispute (`/citizen/dispute`):** If a citizen identifies a fraudulent transfer, conflicting claims, or an error in a registered property, they can file a formal dispute. They provide the reasoning and the relevant Property ID. This is initially logged securely in the off-chain database.
*   **Authority Audit (`/authority/disputes`):** The Authority reviews active disputes. They have access to the immutable blockchain history of the property to audit past transfers and verify the true chain of ownership.
*   **Resolution:** Based on the audit, the Authority can resolve the dispute. Depending on the smart contract implementation, authorities with elevated privileges may have the right to forcefully reverse fraudulent transfers or freeze assets pending legal review.
*   **Updates:** Once the dispute is closed, the status is updated, and the citizens involved are notified through their portal.

### 4. Public Verification Phase (Public)

*   **Public Portal (`/verify`):** Anyone (even without an account or wallet) can visit the public verification portal to check the status of a property. By searching a Property ID, they can see its current owner, registration date, and verify its authenticity directly against the blockchain ledger.

## Getting Started (Local Development)

First, install dependencies:
```bash
npm install
```

Then, run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
