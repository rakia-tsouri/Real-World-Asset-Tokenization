# External Microservices Integration

This document describes all external microservices that the RWA Tokenization Platform expects to integrate with. Currently, these services are **STUBBED OUT** and the platform works without them by using simulated responses.

## 🔄 Current Status: All Services are Stubbed

The platform is fully functional without the external services. When users submit KYC or create assets, the data is saved to MongoDB for admin review. The AI services will enhance the process but are not required for basic operation.

---

## 1. AI KYC Verification Service

**Purpose:** Automated verification of identity documents (CIN/Passport)

**Location:** `Api/core/routes/kyc.js` (Line ~96)

**Expected Endpoint:** `POST http://localhost:8001/verify-kyc`

**Default URL:** `process.env.AI_KYC_SERVICE_URL`

### Request Payload:
```json
{
  "userId": "mongodb_user_id",
  "documentUrl": "/uploads/kyc/kyc-1234567890.jpg",
  "documentType": "cin" | "passport",
  "callbackUrl": "http://localhost:5000/api/kyc/ai-callback"
}
```

### Expected Behavior:
1. Service receives the document
2. Performs OCR and document verification
3. Validates information against databases
4. Calls back to `/api/kyc/ai-callback` with results (usually within 24 hours)

### Callback Endpoint Already Implemented:
`POST /api/kyc/ai-callback`
```json
{
  "userId": "mongodb_user_id",
  "result": "approved" | "rejected" | "needs_review",
  "confidence": 0.95,
  "details": {
    "documentValid": true,
    "faceMatch": true,
    "extractedData": { ... }
  }
}
```

### Current Behavior (Stubbed):
- Document is saved to `/uploads/kyc/`
- User `kycStatus` set to `'pending'`
- Admin must manually review via `/admin/kyc/pending`
- Console logs: `[STUB] Would send KYC document to AI service`

---

## 2. Price Estimation Service

**Purpose:** AI-powered asset valuation based on category, condition, location, etc.

**Location:** `Api/core/routes/assets_new.js` (Line ~150)

**Expected Endpoint:** `POST http://localhost:8002/estimate`

**Default URL:** `process.env.PRICE_ESTIMATION_SERVICE_URL`

### Request Payload:
```json
{
  "title": "Luxury Apartment in Downtown",
  "description": "2-bedroom apartment...",
  "category": "real-estate",
  "location": "Tunisia, Tunis",
  "condition": "excellent",
  "age": 5
}
```

### Expected Response:
```json
{
  "estimatedPrice": 250000,
  "confidence": 0.87,
  "currency": "USD",
  "factors": {
    "category": "real-estate",
    "condition": "excellent",
    "age": 5,
    "location": "Tunisia, Tunis",
    "marketTrend": "rising"
  },
  "priceRange": {
    "min": 230000,
    "max": 270000
  }
}
```

### Current Behavior (Stubbed):
- Returns random price between $10,000 - $60,000
- Returns random confidence between 70% - 100%
- Console logs: `[STUB] Would call price estimation service`

---

## 3. AI Asset Verification Service

**Purpose:** Automated verification of asset proof images

**Location:** `Api/core/routes/assets_new.js` (Line ~254)

**Expected Endpoint:** `POST http://localhost:8003/verify-asset`

**Default URL:** `process.env.AI_ASSET_SERVICE_URL`

### Request Payload:
```json
{
  "assetId": "mongodb_asset_id",
  "images": [
    "/uploads/assets/asset-1234567890-1.jpg",
    "/uploads/assets/asset-1234567890-2.jpg",
    "/uploads/assets/asset-1234567890-3.jpg"
  ],
  "title": "Vintage Car",
  "description": "Classic 1967 Mustang...",
  "category": "vehicles",
  "callbackUrl": "http://localhost:5000/api/admin/assets/:id/ai-callback"
}
```

### Expected Behavior:
1. Service receives asset images
2. Performs image analysis (authenticity, quality, consistency)
3. Validates against claimed category and description
4. Calls back with verification results

### Callback Endpoint (To Be Implemented):
`POST /api/admin/assets/:assetId/ai-callback`
```json
{
  "assetId": "mongodb_asset_id",
  "result": "approved" | "rejected" | "needs_review",
  "confidence": 0.92,
  "details": {
    "imagesAuthentic": true,
    "categoryMatch": true,
    "qualityScore": 0.88,
    "flags": []
  }
}
```

### Current Behavior (Stubbed):
- Images saved to `/uploads/assets/`
- Asset `verificationStatus` set to `'pending'`
- Admin must manually review via `/admin/assets/pending`
- Console logs: `[STUB] Would send asset images to AI service`

---

## 4. Security Analysis Service

**Purpose:** Risk assessment for tokenized assets

**Location:** `Api/core/routes/assets_new.js` (Line ~407)

**Expected Endpoint:** `POST http://localhost:8004/analyze`

**Default URL:** `process.env.SECURITY_ANALYSIS_SERVICE_URL`

### Request Payload:
```json
{
  "assetId": "mongodb_asset_id",
  "tokenId": "0.0.123456",
  "ownerId": "mongodb_user_id",
  "category": "real-estate",
  "value": 250000
}
```

### Expected Response:
```json
{
  "securityScore": 85,
  "factors": {
    "ownerVerification": "passed",
    "documentAuthenticity": "passed",
    "marketLiquidity": "high",
    "priceConsistency": "good",
    "historicalData": "available"
  },
  "risks": [
    {
      "type": "market_volatility",
      "severity": "low",
      "description": "Market conditions are stable"
    }
  ],
  "recommendations": [
    "Consider price hedging strategies",
    "Regular asset revaluation recommended"
  ]
}
```

### Current Behavior (Stubbed):
- Returns random security score between 70-100
- Returns simulated factors
- Console logs: `[STUB] Would call security analysis service`

---

## 🛠️ How to Implement the Services

### Step 1: Set Environment Variables
Add to `Api/core/.env`:
```bash
AI_KYC_SERVICE_URL=http://localhost:8001/verify-kyc
PRICE_ESTIMATION_SERVICE_URL=http://localhost:8002/estimate
AI_ASSET_SERVICE_URL=http://localhost:8003/verify-asset
SECURITY_ANALYSIS_SERVICE_URL=http://localhost:8004/analyze
API_URL=http://localhost:5000
```

### Step 2: Uncomment API Calls
In each file, uncomment the `axios.post()` calls marked with `// Uncomment when service is ready:`

**Example in `kyc.js`:**
```javascript
// Change from:
// await axios.post(aiServiceUrl, {

// To:
await axios.post(aiServiceUrl, {
  userId: user._id,
  documentUrl: user.kycDocumentUrl,
  documentType: documentType,
  callbackUrl: `${process.env.API_URL}/api/kyc/ai-callback`
});
```

### Step 3: Implement Callback Endpoints
For AI services that need to call back:

**KYC AI Callback** - Already implemented at `POST /api/kyc/ai-callback`

**Asset AI Callback** - Needs to be added to `Api/core/routes/admin.js`:
```javascript
router.post('/assets/:id/ai-callback', async (req, res) => {
  // Handle AI verification results
  // Update asset.verificationStatus based on AI result
});
```

---

## 📊 Service Dependencies

| Service | Required For | Platform Works Without? |
|---------|-------------|------------------------|
| AI KYC | Automated identity verification | ✅ Yes - Admin manual review |
| Price Estimation | Accurate asset pricing | ✅ Yes - Returns random estimate |
| AI Asset Verification | Automated asset validation | ✅ Yes - Admin manual review |
| Security Analysis | Risk scoring | ✅ Yes - Returns random score |

---

## 🔍 Monitoring Service Integration

Check console logs for service calls:
```bash
[STUB] Would send KYC document to AI service: http://localhost:8001/verify-kyc
[STUB] Document: /uploads/kyc/kyc-1701795123456.jpg, Type: passport

[STUB] Would call price estimation service: http://localhost:8002/estimate

[STUB] Would send asset images to AI service: http://localhost:8003/verify-asset
[STUB] Asset ID: 674f2a3b1c2d3e4f5a6b7c8d, Images: 3

[STUB] Would call security analysis service: http://localhost:8004/analyze
```

---

## ✅ Current Platform Workflow (Without AI)

### KYC Flow:
1. User submits KYC via `/api/kyc/submit` ✅
2. Document saved to MongoDB + File system ✅
3. Status set to `'pending'` ✅
4. **Admin manually reviews** via `/admin/kyc/:id/approve` or `reject` ✅

### Asset Creation Flow:
1. User creates asset via `/api/assets/create-and-verify` ✅
2. Images saved to MongoDB + File system ✅
3. Status set to `'pending'` ✅
4. **Admin manually reviews** via `/admin/assets/:id/approve` or `reject` ✅

### Price Estimation Flow:
1. User requests estimate via `/api/assets/estimate-price` ✅
2. Returns simulated price (random) ✅
3. User can use or override the estimate ✅

### Security Analysis Flow:
1. User requests analysis via `/api/assets/:id/security-analysis` ✅
2. Returns simulated security score (random 70-100) ✅
3. Score saved to asset record ✅

---

## 🚀 Next Steps for AI Integration

1. **Develop Python Microservices** (in `Api/predictor/` and `Api/smart-contract/`)
2. **Set up service endpoints** on ports 8001-8004
3. **Update environment variables** to point to real services
4. **Uncomment axios calls** in backend routes
5. **Implement callback handlers** for async AI results
6. **Test end-to-end flow** with real AI processing
7. **Add error handling** for service failures
8. **Monitor service health** and response times

---

## 📝 Notes

- All services should be **asynchronous** - don't block the main request
- Use **callbacks** for long-running processes (AI analysis may take seconds/minutes)
- Implement **retry logic** for failed service calls
- Add **API key authentication** for production security
- Consider **rate limiting** to prevent abuse
- Log all service interactions for debugging
