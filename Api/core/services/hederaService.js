import dotenv from 'dotenv';
dotenv.config();

import {
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
} from '@hashgraph/sdk';

const {
  HEDERA_OPERATOR_ID,
  HEDERA_OPERATOR_KEY,
  HEDERA_NETWORK = 'testnet'
} = process.env;

if (!HEDERA_OPERATOR_ID || !HEDERA_OPERATOR_KEY) {
  console.error("ERROR: HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY must be set in .env file");
}

let client = null;

function getClient() {
  if (!client) {
    try {
      client = HEDERA_NETWORK === 'mainnet' 
        ? Client.forMainnet() 
        : Client.forTestnet();
      
      let operatorKey;
      try {
        operatorKey = PrivateKey.fromStringED25519(HEDERA_OPERATOR_KEY);
      } catch (e) {
        operatorKey = PrivateKey.fromString(HEDERA_OPERATOR_KEY);
      }
      console.log(PrivateKey.fromString(HEDERA_OPERATOR_KEY).publicKey.toString());
      
      client.setOperator(HEDERA_OPERATOR_ID, operatorKey);
      
      console.log(`✅ Hedera client initialized for ${HEDERA_NETWORK}`);
      console.log(`   Operator Account: ${HEDERA_OPERATOR_ID}`);
    } catch (error) {
      console.error('❌ Failed to initialize Hedera client:', error.message);
      throw new Error(`Hedera client initialization failed: ${error.message}`);
    }
  }
  return client;
}

async function createFungibleToken(tokenData) {
  try {
    const client = getClient();
    
    const operatorKey = client.operatorPublicKey;
    
    const tokenCreateTx = new TokenCreateTransaction()
      .setTokenName(tokenData.name)
      .setTokenSymbol(tokenData.symbol)
      .setTokenType(TokenType.FungibleCommon)
      .setDecimals(tokenData.decimals || 0)
      .setInitialSupply(tokenData.totalSupply)
      .setTreasuryAccountId(HEDERA_OPERATOR_ID)
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(tokenData.totalSupply)
      .setSupplyKey(operatorKey)
      .setAdminKey(operatorKey)
      .setFreezeDefault(false)
      .setMaxTransactionFee(new Hbar(30));
    
    if (tokenData.memo) {
      tokenCreateTx.setTokenMemo(tokenData.memo.substring(0, 100));
    }

    const tokenCreateSubmit = await tokenCreateTx.execute(client);
    const tokenCreateReceipt = await tokenCreateSubmit.getReceipt(client);
    const tokenId = tokenCreateReceipt.tokenId.toString();

    console.log(`✅ Created fungible token: ${tokenId}`);

    return {
      tokenId,
      treasuryAccountId: HEDERA_OPERATOR_ID,
      supplyKey: operatorKey.toString(),
      adminKey: operatorKey.toString(),
      transactionId: tokenCreateSubmit.transactionId.toString()
    };
  } catch (error) {
    console.error("Error creating fungible token:", error);
    throw new Error(`Failed to create token: ${error.message}`);
  }
}

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

async function getTransactionHistory(accountId, tokenId = null) {
  try {
    const mirrorNodeUrl = HEDERA_NETWORK === 'mainnet' 
      ? 'https://mainnet-public.mirrornode.hedera.com'
      : 'https://testnet.mirrornode.hedera.com';
    
    let url = `${mirrorNodeUrl}/api/v1/transactions?account.id=${accountId}&limit=100&order=desc`;
    
    if (tokenId) {
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

async function buyTokensFromTreasury(tokenId, buyerAccountId, tokenAmount, totalPriceTND) {
  try {
    const client = getClient();

    let result;
    try {
      result = await transferTokens(
        tokenId,
        HEDERA_OPERATOR_ID, // from treasury
        buyerAccountId,
        tokenAmount,
        HEDERA_OPERATOR_KEY
      );
    } catch (transferError) {
      if (transferError.message.includes('TOKEN_NOT_ASSOCIATED_TO_ACCOUNT')) {
        console.log(`⚠️ Buyer ${buyerAccountId} not associated with token ${tokenId}. Auto-associating...`);
        
        throw new Error(
          'Token not associated to account. Please associate the token with your HashPack wallet first. ' +
          `Token ID: ${tokenId}`
        );
      }
      throw transferError;
    }

    console.log(`✅ Sold ${tokenAmount} tokens to ${buyerAccountId} for ${totalPriceTND} TND`);

    return {
      ...result,
      tokenAmount,
      totalPriceTND,
      type: 'buy'
    };
  } catch (error) {
    console.error("Error buying tokens:", error);
    throw new Error(`Failed to buy tokens: ${error.message}`);
  }
}

async function sellTokensToTreasury(tokenId, sellerAccountId, sellerPrivateKey, tokenAmount, totalPriceTND) {
  try {
    const result = await transferTokens(
      tokenId,
      sellerAccountId,
      HEDERA_OPERATOR_ID,
      tokenAmount,
      sellerPrivateKey
    );

    console.log(`✅ Bought ${tokenAmount} tokens from ${sellerAccountId} for ${totalPriceTND} TND`);

    return {
      ...result,
      tokenAmount,
      totalPriceTND,
      type: 'sell'
    };
  } catch (error) {
    console.error("Error selling tokens:", error);
    throw new Error(`Failed to sell tokens: ${error.message}`);
  }
}

export {
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
