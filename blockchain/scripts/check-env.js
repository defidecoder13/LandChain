require('dotenv').config();
const pk = process.env.PRIVATE_KEY;

if (!pk) {
    console.log("❌ PRIVATE_KEY is missing from .env");
} else {
    const cleanPk = pk.startsWith('0x') ? pk.slice(2) : pk;
    console.log(`📏 Length check:`);
    console.log(`- Raw length: ${pk.length} characters`);
    console.log(`- Hex length (without 0x): ${cleanPk.length} characters`);

    if (cleanPk.length === 64) {
        console.log("✅ Length is correct (64 characters).");
    } else if (cleanPk.length === 40 || cleanPk.length === 42) {
        console.log("❌ It looks like you pasted a Public Wallet Address instead of a Private Key.");
    } else {
        console.log(`❌ Incorrect length. Expected 64 characters, got ${cleanPk.length}.`);
    }
}
