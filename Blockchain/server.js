require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const {
  Client,
  PrivateKey,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  AccountInfoQuery,
  TokenGrantKycTransaction
} = require("@hashgraph/sdk");

const User = require("./models/User");
const Asset = require("./models/Asset");
const KycRequest = require("./models/KycRequest");

const app = express();
app.use(bodyParser.json());

const {
  OPERATOR_ID,
  OPERATOR_KEY,
  KYC_PRIVATE_KEY, // must be private key string for the kycKey
  MONGO_URI
} = process.env;

if (!OPERATOR_ID || !OPERATOR_KEY || !KYC_PRIVATE_KEY || !MONGO_URI) {
  console.error("set OPERATOR_ID OPERATOR_KEY KYC_PRIVATE_KEY MONGO_URI in .env");
  process.exit(1);
}

mongoose.connect(MONGO_URI);

// Hedera client
const client = Client.forTestnet();
client.setOperator(OPERATOR_ID, OPERATOR_KEY);
const kycPrivateKey = PrivateKey.fromString(KYC_PRIVATE_KEY);
const kycPublicKey = kycPrivateKey.publicKey;

// helper: placeholder IPFS upload (implement with nft.storage / pinata)
async function uploadToIPFS(bufferOrJson) {
  // return CID string
  return "bafy...EXAMPLECID";
}

// helper: verify signature. Frontend should use HashPack/HashConnect to sign `challenge`.
// Server retrieves account key via AccountInfoQuery and verifies the signature.
// Implementation detail: use HashConnect's recommended verify logic or the Hedera SDK crypto verify method.
async function verifySignature(accountId, message, signatureBase64) {
  // fetch account info
  const info = await new AccountInfoQuery().setAccountId(accountId).execute(client);
  const accountKeyString = info.key.toString(); // canonical
  // use Hedera SDK PublicKey verification or external library depending on key type
  // Example (pseudo): PublicKey.fromString(accountKeyString).verify(Buffer.from(message), Buffer.from(signatureBase64, 'base64'))
  // Replace below with your verified method/logic (HashConnect docs recommend verifying with mirror node key)
  const { PublicKey } = require("@hashgraph/sdk");
  const pub = PublicKey.fromString(accountKeyString);
  const sig = Buffer.from(signatureBase64, "base64");
  const msg = Buffer.from(message);
  const ok = pub.verify(msg, sig); // if not present, replace with appropriate verify implementation
  return ok;
}

// create asset + mint HTS token with KYC key
app.post("/assets/mint", async (req, res) => {
  try {
    const { title, description, ownerAccountId, ipfsData, availability_in_tunisia, supply = 1000, decimals = 0 } = req.body;
    const owner = await User.findOne({ accountId: ownerAccountId });
    if (!owner) return res.status(400).json({ error: "owner not found" });

    const ipfsCid = await uploadToIPFS(ipfsData || { title, description });

    const tokenCreate = new TokenCreateTransaction()
      .setTokenName(title)
      .setTokenSymbol("RWA")
      .setTokenType(TokenType.FUNGIBLE_COMMON)
      .setDecimals(decimals)
      .setInitialSupply(supply)
      .setTreasuryAccountId(OPERATOR_ID)
      .setKycKey(kycPublicKey) // enforce KYC for transfers/receives
      .setMaxTransactionFee(100000000) // adjust for testnet; tune later
      .setMemo(`IPFS:${ipfsCid}`);

    const submitTx = await tokenCreate.execute(client);
    const receipt = await submitTx.getReceipt(client);
    const tokenId = receipt.tokenId.toString();

    const asset = new Asset({
      title, description, ownerId: owner._id,
      ipfsCid, availability_in_tunisia: !!availability_in_tunisia,
      hedera: { tokenId, treasuryAccountId: OPERATOR_ID, createdTxHash: receipt.transactionHash ? Buffer.from(receipt.transactionHash).toString("hex") : undefined }
    });
    await asset.save();

    res.json({ ok: true, assetId: asset._id, tokenId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.toString() });
  }
});

// generate challenge for KYC signature
app.post("/kyc/challenge", async (req, res) => {
  const { accountId } = req.body;
  if (!accountId) return res.status(400).json({ error: "accountId required" });
  const challenge = `sign this to kyc:${accountId}:${Date.now()}:${Math.random().toString(36).slice(2,8)}`;
  const kr = new KycRequest({ userAccountId: accountId, challenge });
  await kr.save();
  res.json({ challenge, requestId: kr._id });
});

// verify signature and grant on-chain KYC
app.post("/kyc/verify", async (req, res) => {
  try {
    const { requestId, signatureBase64 } = req.body;
    const reqDoc = await KycRequest.findById(requestId);
    if (!reqDoc) return res.status(404).json({ error: "request not found" });

    const ok = await verifySignature(reqDoc.userAccountId, reqDoc.challenge, signatureBase64);
    if (!ok) {
      reqDoc.status = "failed"; await reqDoc.save();
      return res.status(400).json({ error: "signature verification failed" });
    }

    reqDoc.signature = signatureBase64; reqDoc.status = "verified"; reqDoc.verifiedAt = new Date();
    await reqDoc.save();

    const user = await User.findOne({ accountId: reqDoc.userAccountId }) || new User({ accountId: reqDoc.userAccountId });
    user.kycStatus = "approved"; user.kycApprovedAt = new Date();
    await user.save();

    // grant KYC on all tokens (or per-token) that you want this user to be allowed to hold
    // Example: grant on a specific tokenId passed in request body (or grant globally if you store token list)
    const { tokenId } = req.body;
    if (!tokenId) return res.json({ ok: true, note: "signature verified, user KYCed in DB; provide tokenId to grant on-chain KYC" });

    const grantTx = await new TokenGrantKycTransaction()
      .setTokenId(tokenId)
      .setAccountId(reqDoc.userAccountId)
      .execute(client);

    const grantReceipt = await grantTx.getReceipt(client);

    res.json({ ok: true, onChain: grantReceipt.status.toString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.toString() });
  }
});

app.get("/assets/:id", async (req,res) => {
  const a = await Asset.findById(req.params.id).populate("ownerId");
  if (!a) return res.status(404).json({ error: "not found" });
  res.json(a);
});

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => console.log("listening", PORT));
