require("dotenv").config();
const {
  Client,
  PrivateKey,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  TransferTransaction,
  TokenInfoQuery,
  AccountBalanceQuery,
  Hbar,
  TokenAssociateTransaction,
  AccountId
} = require("@hashgraph/sdk");

// Environment variables for Hedera operator account
const {
  HEDERA_OPERATOR_ID,
  HEDERA_OPERATOR_KEY,
  HEDERA_NETWORK = 'testnet'
} = process.env;

if (!HEDERA_OPERATOR_ID || !HEDERA_OPERATOR_KEY) {
  console.error("ERROR: HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY must be set in .env file");
}

// Initialize Hedera client
let client = null;

function getClient() {
  if (!client) {
    client = HEDERA_NETWORK === 'mainnet' 
      ? Client.forMainnet() 
      : Client.forTestnet();
    
    client.setOperator(HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY);
  }
  return client;
}

/**
 * Create a fungible token on Hedera for a tokenized asset
 * @param {Object} tokenData - Token configuration data
 * @param {string} tokenData.name - Token name (e.g., "Luxury Villa #42")
 * @param {string} tokenData.symbol - Token symbol (e.g., "VILLA42")
 * @param {number} tokenData.totalSupply - Initial supply (number of fractions)
 * @param {number} tokenData.decimals - Decimal places (default 0 for whole fractions)
 * @param {string} tokenData.memo - Optional memo (e.g., asset description)
 * @returns {Promise<Object>} { tokenId, treasuryAccountId, supplyKey, adminKey, transactionId }
 */
async function createFungibleToken(tokenData) {
  try {
    const client = getClient();
    
    // Generate new keys for the token
    const supplyKey = PrivateKey.generateED25519();
    const adminKey = PrivateKey.generateED25519();
    
    // Create the token
    const tokenCreateTx = new TokenCreateTransaction()
      .setTokenName(tokenData.name)
      .setTokenSymbol(tokenData.symbol)
      .setTokenType(TokenType.FungibleCommon)
      .setDecimals(tokenData.decimals || 0)
      .setInitialSupply(tokenData.totalSupply)
      .setTreasuryAccountId(HEDERA_OPERATOR_ID)
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(tokenData.totalSupply)
      .setSupplyKey(supplyKey.publicKey)
      .setAdminKey(adminKey.publicKey)
      .setFreezeDefault(false)
      .setMaxTransactionFee(new Hbar(30));
    
    if (tokenData.memo) {
      tokenCreateTx.setTokenMemo(tokenData.memo.substring(0, 100)); // Max 100 chars
    }

    const tokenCreateSubmit = await tokenCreateTx.execute(client);
    const tokenCreateReceipt = await tokenCreateSubmit.getReceipt(client);
    const tokenId = tokenCreateReceipt.tokenId.toString();

    console.log(`✅ Created fungible token: ${tokenId}`);

    return {
      tokenId,
      treasuryAccountId: HEDERA_OPERATOR_ID,
      supplyKey: supplyKey.toString(),
      adminKey: adminKey.toString(),
      transactionId: tokenCreateSubmit.transactionId.toString()
    };
  } catch (error) {
    console.error("Error creating fungible token:", error);
    throw new Error(`Failed to create token: ${error.message}`);
  }
}

/**
 * Mint additional tokens (if needed - though initial supply is set at creation)
 * @param {string} tokenId - The token ID
 * @param {string} supplyKeyString - The supply key as string
 * @param {number} amount - Amount to mint
 * @returns {Promise<Object>} { success, newTotalSupply, transactionId }
 */
async function mintTokens(tokenId, supplyKeyString, amount) {
  try {
    const client = getClient();
    const supplyKey = PrivateKey.fromString(supplyKeyString);

    const mintTx = await new TokenMintTransaction()
      .setTokenId(tokenId)
      .setAmount(amount)
      .freezeWith(client);

    const mintTxSigned = await mintTx.sign(supplyKey);
    const mintTxSubmit = await mintTxSigned.execute(client);
    const mintReceipt = await mintTxSubmit.getReceipt(client);

    console.log(`✅ Minted ${amount} tokens for ${tokenId}`);

    return {
      success: true,
      newTotalSupply: mintReceipt.totalSupply.toString(),
      transactionId: mintTxSubmit.transactionId.toString()
    };
  } catch (error) {
    console.error("Error minting tokens:", error);
    throw new Error(`Failed to mint tokens: ${error.message}`);
  }
}

/**
 * Associate a token with a user's account (required before they can receive tokens)
 * @param {string} accountId - User's Hedera account ID
 * @param {string} tokenId - The token ID to associate
 * @param {string} accountPrivateKey - User's private key
 * @returns {Promise<Object>} { success, transactionId }
 */
async function associateToken(accountId, tokenId, accountPrivateKey) {
  try {
    const client = getClient();
    const privateKey = PrivateKey.fromString(accountPrivateKey);

    const associateTx = await new TokenAssociateTransaction()
      .setAccountId(accountId)
      .setTokenIds([tokenId])
      .freezeWith(client);

    const signedTx = await associateTx.sign(privateKey);
    const txResponse = await signedTx.execute(client);
    const receipt = await txResponse.getReceipt(client);

    console.log(`✅ Associated token ${tokenId} with account ${accountId}`);

    return {
      success: true,
      transactionId: txResponse.transactionId.toString()
    };
  } catch (error) {
    console.error("Error associating token:", error);
    throw new Error(`Failed to associate token: ${error.message}`);
  }
}

/**
 * Transfer tokens from one account to another
 * @param {string} tokenId - The token ID
 * @param {string} fromAccountId - Sender's account ID
 * @param {string} toAccountId - Recipient's account ID
 * @param {number} amount - Amount to transfer
 * @param {string} fromPrivateKey - Sender's private key (or treasury key if from treasury)
 * @returns {Promise<Object>} { success, transactionId, timestamp }
 */
async function transferTokens(tokenId, fromAccountId, toAccountId, amount, fromPrivateKey) {
  try {
    const client = getClient();
    const privateKey = PrivateKey.fromString(fromPrivateKey);

    const transferTx = await new TransferTransaction()
      .addTokenTransfer(tokenId, fromAccountId, -amount)
      .addTokenTransfer(tokenId, toAccountId, amount)
      .freezeWith(client);

    const signedTx = await transferTx.sign(privateKey);
    const txResponse = await signedTx.execute(client);
    const receipt = await txResponse.getReceipt(client);

    console.log(`✅ Transferred ${amount} tokens from ${fromAccountId} to ${toAccountId}`);

    return {
      success: true,
      transactionId: txResponse.transactionId.toString(),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error transferring tokens:", error);
    throw new Error(`Failed to transfer tokens: ${error.message}`);
  }
}

/**
 * Get token information
 * @param {string} tokenId - The token ID
 * @returns {Promise<Object>} Token details including name, symbol, supply, etc.
 */
async function getTokenInfo(tokenId) {
  try {
    const client = getClient();
    const tokenInfo = await new TokenInfoQuery()
      .setTokenId(tokenId)
      .execute(client);

    return {
      tokenId: tokenInfo.tokenId.toString(),
      name: tokenInfo.name,
      symbol: tokenInfo.symbol,
      decimals: tokenInfo.decimals,
      totalSupply: tokenInfo.totalSupply.toString(),
      treasuryAccountId: tokenInfo.treasuryAccountId.toString(),
      adminKey: tokenInfo.adminKey ? tokenInfo.adminKey.toString() : null,
      supplyKey: tokenInfo.supplyKey ? tokenInfo.supplyKey.toString() : null,
      memo: tokenInfo.tokenMemo
    };
  } catch (error) {
    console.error("Error getting token info:", error);
    throw new Error(`Failed to get token info: ${error.message}`);
  }
}

/**
 * Get account's balance for a specific token
 * @param {string} accountId - Account ID to check
 * @param {string} tokenId - Token ID to check balance for
 * @returns {Promise<number>} Token balance
 */
async function getTokenBalance(accountId, tokenId) {
  try {
    const client = getClient();
    const balanceQuery = await new AccountBalanceQuery()
      .setAccountId(accountId)
      .execute(client);

    const tokenBalance = balanceQuery.tokens.get(tokenId);
    return tokenBalance ? tokenBalance.toNumber() : 0;
  } catch (error) {
    console.error("Error getting token balance:", error);
    throw new Error(`Failed to get token balance: ${error.message}`);
  }
}

/**
 * Get transaction history for an account (simplified - uses mirror node API)
 * Note: This requires using Hedera Mirror Node REST API
 * @param {string} accountId - Account ID
 * @param {string} tokenId - Optional: filter by token ID
 * @returns {Promise<Array>} Array of transactions
 */
async function getTransactionHistory(accountId, tokenId = null) {
  try {
    const mirrorNodeUrl = HEDERA_NETWORK === 'mainnet' 
      ? 'https://mainnet-public.mirrornode.hedera.com'
      : 'https://testnet.mirrornode.hedera.com';
    
    let url = `${mirrorNodeUrl}/api/v1/transactions?account.id=${accountId}&limit=100&order=desc`;
    
    if (tokenId) {
      // Note: Mirror node API syntax for token transfers
      url += `&transactiontype=CRYPTOTRANSFER`;
    }

    const response = await fetch(url);
    const data = await response.json();

    return data.transactions || [];
  } catch (error) {
    console.error("Error getting transaction history:", error);
    throw new Error(`Failed to get transaction history: ${error.message}`);
  }
}

/**
 * Buy tokens from treasury (simplified version)
 * Transfers tokens from treasury to buyer
 * @param {string} tokenId - Token ID
 * @param {string} buyerAccountId - Buyer's account ID
 * @param {number} tokenAmount - Amount of tokens to buy
 * @param {number} totalPriceUSD - Total price in USD (for record keeping)
 * @returns {Promise<Object>} Transaction result
 */
async function buyTokensFromTreasury(tokenId, buyerAccountId, tokenAmount, totalPriceUSD) {
  try {
    // Transfer tokens from treasury to buyer
    // In production, you'd also handle HBAR/USD payment here
    const result = await transferTokens(
      tokenId,
      HEDERA_OPERATOR_ID, // from treasury
      buyerAccountId,
      tokenAmount,
      HEDERA_OPERATOR_KEY // treasury private key
    );

    console.log(`✅ Sold ${tokenAmount} tokens to ${buyerAccountId} for $${totalPriceUSD}`);

    return {
      ...result,
      tokenAmount,
      totalPriceUSD,
      type: 'buy'
    };
  } catch (error) {
    console.error("Error buying tokens:", error);
    throw new Error(`Failed to buy tokens: ${error.message}`);
  }
}

/**
 * Sell tokens back to treasury (or to marketplace)
 * @param {string} tokenId - Token ID
 * @param {string} sellerAccountId - Seller's account ID
 * @param {string} sellerPrivateKey - Seller's private key
 * @param {number} tokenAmount - Amount of tokens to sell
 * @param {number} totalPriceUSD - Total price in USD
 * @returns {Promise<Object>} Transaction result
 */
async function sellTokensToTreasury(tokenId, sellerAccountId, sellerPrivateKey, tokenAmount, totalPriceUSD) {
  try {
    // Transfer tokens from seller back to treasury
    const result = await transferTokens(
      tokenId,
      sellerAccountId,
      HEDERA_OPERATOR_ID, // to treasury
      tokenAmount,
      sellerPrivateKey
    );

    console.log(`✅ Bought ${tokenAmount} tokens from ${sellerAccountId} for $${totalPriceUSD}`);

    return {
      ...result,
      tokenAmount,
      totalPriceUSD,
      type: 'sell'
    };
  } catch (error) {
    console.error("Error selling tokens:", error);
    throw new Error(`Failed to sell tokens: ${error.message}`);
  }
}

module.exports = {
  createFungibleToken,
  mintTokens,
  associateToken,
  transferTokens,
  getTokenInfo,
  getTokenBalance,
  getTransactionHistory,
  buyTokensFromTreasury,
  sellTokensToTreasury
};
