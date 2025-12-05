'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { assetAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Building2, Car, Gem, Building } from 'lucide-react';
import { RealEstateForm } from './RealEstateForm';
import { VehicleForm } from './VehicleForm';
import { CommodityForm } from './CommodityForm';
import { CompanyForm } from './CompanyForm';

type AssetType = 'real-estate' | 'vehicle' | 'commodity' | 'company' | '';

export default function CreateAsset() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [error, setError] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('');
  
  // Common fields
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    condition: 'good',
  });

  // Real Estate specific
  const [realEstateData, setRealEstateData] = useState({
    propertyType: 'apartment',
    size: '',
    bedrooms: '',
    bathrooms: '',
    yearBuilt: '',
    lotSize: '',
    floors: '',
    parking: '',
    furnished: 'no',
  });

  // Vehicle specific
  const [vehicleData, setVehicleData] = useState({
    make: '',
    model: '',
    year: '',
    mileage: '',
    transmission: 'automatic',
    fuelType: 'gasoline',
    engineSize: '',
    color: '',
    vin: '',
    owners: '1',
  });

  // Commodity specific (Gold, Silver, etc.)
  const [commodityData, setCommodityData] = useState({
    commodityType: 'gold',
    weight: '',
    unit: 'grams',
    purity: '',
    certification: '',
    storage: '',
    form: 'bars',
  });

  // Company specific
  const [companyData, setCompanyData] = useState({
    companyName: '',
    industry: '',
    yearEstablished: '',
    revenue: '',
    employees: '',
    valuation: '',
    equity: '',
    registrationNumber: '',
  });

  // Tokenization configuration
  const [tokenizationData, setTokenizationData] = useState({
    totalSupply: '',
    symbol: '',
    pricePerToken: '',
    reservedTokens: '',
  });

  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [images, setImages] = useState<File[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRealEstateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setRealEstateData({ ...realEstateData, [e.target.name]: e.target.value });
  };

  const handleVehicleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setVehicleData({ ...vehicleData, [e.target.name]: e.target.value });
  };

  const handleCommodityChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setCommodityData({ ...commodityData, [e.target.name]: e.target.value });
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setCompanyData({ ...companyData, [e.target.name]: e.target.value });
  };

  const handleTokenizationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTokenizationData({ ...tokenizationData, [name]: value });
  };

  const calculateAvailableTokens = () => {
    const total = parseInt(tokenizationData.totalSupply) || 0;
    const reserved = parseInt(tokenizationData.reservedTokens) || 0;
    return Math.max(0, total - reserved);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length > 3) {
        setError('Maximum 3 images allowed');
        return;
      }
      setImages(files);
    }
  };

  const handleEstimatePrice = async () => {
    setEstimating(true);
    setError('');

    try {
      let dataToEstimate = { ...formData };
      
      if (assetType === 'real-estate') {
        dataToEstimate = { ...dataToEstimate, ...realEstateData };
      } else if (assetType === 'vehicle') {
        dataToEstimate = { ...dataToEstimate, ...vehicleData };
      } else if (assetType === 'commodity') {
        dataToEstimate = { ...dataToEstimate, ...commodityData };
      } else if (assetType === 'company') {
        dataToEstimate = { ...dataToEstimate, ...companyData };
      }

      const response = await assetAPI.estimatePrice(dataToEstimate);
      setEstimatedPrice(response.data.data.estimatedPrice);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to estimate price');
    } finally {
      setEstimating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (images.length === 0) {
        setError('Please upload at least one verification image');
        setLoading(false);
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', assetType);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('condition', formData.condition);
      
      if (estimatedPrice) {
        formDataToSend.append('estimatedPrice', estimatedPrice.toString());
      }

      // Add type-specific data
      if (assetType === 'real-estate') {
        Object.entries(realEstateData).forEach(([key, value]) => {
          formDataToSend.append(key, value);
        });
      } else if (assetType === 'vehicle') {
        Object.entries(vehicleData).forEach(([key, value]) => {
          formDataToSend.append(key, value);
        });
      } else if (assetType === 'commodity') {
        Object.entries(commodityData).forEach(([key, value]) => {
          formDataToSend.append(key, value);
        });
      } else if (assetType === 'company') {
        Object.entries(companyData).forEach(([key, value]) => {
          formDataToSend.append(key, value);
        });
      }

      // Add tokenization data
      if (tokenizationData.totalSupply && tokenizationData.symbol && tokenizationData.pricePerToken) {
        formDataToSend.append('totalSupply', tokenizationData.totalSupply);
        formDataToSend.append('symbol', tokenizationData.symbol.toUpperCase());
        formDataToSend.append('pricePerToken', tokenizationData.pricePerToken);
        formDataToSend.append('reservedTokens', tokenizationData.reservedTokens || '0');
        formDataToSend.append('availableTokens', calculateAvailableTokens().toString());
      }

      images.forEach((image) => {
        formDataToSend.append('images', image);
      });

      const response = await assetAPI.createAndVerify(formDataToSend);

      if (response.data.success) {
        alert('Asset created and submitted for verification!');
        router.push('/portfolio');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create asset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <div className="p-8">
            <h1 className="text-3xl font-bold mb-2">Create New Asset</h1>
            <p className="text-gray-600 mb-8">
              Tokenize your real-world asset. Upload proof of ownership for verification.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {!assetType ? (
              /* Asset Type Selection */
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Select Asset Type</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setAssetType('real-estate')}
                    className="flex items-center gap-4 p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <Building2 className="w-12 h-12 text-blue-600" />
                    <div className="text-left">
                      <h3 className="font-semibold text-lg text-gray-900">Real Estate</h3>
                      <p className="text-sm text-gray-600">Houses, apartments, land, commercial properties</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setAssetType('vehicle')}
                    className="flex items-center gap-4 p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <Car className="w-12 h-12 text-green-600" />
                    <div className="text-left">
                      <h3 className="font-semibold text-lg text-gray-900">Vehicle</h3>
                      <p className="text-sm text-gray-600">Cars, motorcycles, boats, aircraft</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setAssetType('commodity')}
                    className="flex items-center gap-4 p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <Gem className="w-12 h-12 text-yellow-600" />
                    <div className="text-left">
                      <h3 className="font-semibold text-lg text-gray-900">Commodity</h3>
                      <p className="text-sm text-gray-600">Gold, silver, precious metals, gems</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setAssetType('company')}
                    className="flex items-center gap-4 p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <Building className="w-12 h-12 text-purple-600" />
                    <div className="text-left">
                      <h3 className="font-semibold text-lg text-gray-900">Company</h3>
                      <p className="text-sm text-gray-600">Business equity, shares, partnerships</p>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              /* Asset Form */
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center justify-between mb-6 pb-4 border-b">
                  <div className="flex items-center gap-3">
                    {assetType === 'real-estate' && <Building2 className="w-6 h-6 text-blue-600" />}
                    {assetType === 'vehicle' && <Car className="w-6 h-6 text-green-600" />}
                    {assetType === 'commodity' && <Gem className="w-6 h-6 text-yellow-600" />}
                    {assetType === 'company' && <Building className="w-6 h-6 text-purple-600" />}
                    <h2 className="text-xl font-semibold capitalize text-gray-900">
                      {assetType.replace('-', ' ')} Details
                    </h2>
                  </div>
                  <Button type="button" variant="outline" onClick={() => setAssetType('')}>
                    Change Type
                  </Button>
                </div>

                {/* Common Fields */}
                <div className="space-y-4">
                  <Input
                    label="Asset Title"
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Luxury Apartment in Downtown"
                    className="text-gray-900"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="Detailed description of your asset..."
                    />
                  </div>

                  <Input
                    label="Location"
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    placeholder="City, Country"
                    className="text-gray-900"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Condition
                    </label>
                    <select
                      name="condition"
                      value={formData.condition}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>
                </div>

                {/* Type-Specific Forms */}
                {assetType === 'real-estate' && (
                  <RealEstateForm data={realEstateData} onChange={handleRealEstateChange} />
                )}
                
                {assetType === 'vehicle' && (
                  <VehicleForm data={vehicleData} onChange={handleVehicleChange} />
                )}
                
                {assetType === 'commodity' && (
                  <CommodityForm data={commodityData} onChange={handleCommodityChange} />
                )}
                
                {assetType === 'company' && (
                  <CompanyForm data={companyData} onChange={handleCompanyChange} />
                )}

                {/* Tokenization Configuration */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg text-gray-900">Tokenization Configuration</h3>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                      Hedera Blockchain
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-4">
                    Configure how your asset will be fractionalized into tradeable tokens on Hedera.
                    You can keep some tokens for yourself and make the rest available for trading.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Total Supply (Total Fractions)"
                      name="totalSupply"
                      type="number"
                      value={tokenizationData.totalSupply}
                      onChange={handleTokenizationChange}
                      required
                      min="1"
                      placeholder="e.g., 1000"
                      className="text-gray-900"
                    />

                    <Input
                      label="Token Symbol (3-10 chars)"
                      name="symbol"
                      type="text"
                      value={tokenizationData.symbol}
                      onChange={handleTokenizationChange}
                      required
                      minLength={3}
                      maxLength={10}
                      placeholder="e.g., VILLA42"
                      className="text-gray-900 uppercase"
                      style={{ textTransform: 'uppercase' }}
                    />

                    <Input
                      label="Price Per Token (USD)"
                      name="pricePerToken"
                      type="number"
                      value={tokenizationData.pricePerToken}
                      onChange={handleTokenizationChange}
                      required
                      min="0.01"
                      step="0.01"
                      placeholder="e.g., 100.00"
                      className="text-gray-900"
                    />

                    <Input
                      label="Reserved Tokens (Keep for yourself)"
                      name="reservedTokens"
                      type="number"
                      value={tokenizationData.reservedTokens}
                      onChange={handleTokenizationChange}
                      min="0"
                      max={tokenizationData.totalSupply}
                      placeholder="e.g., 200"
                      className="text-gray-900"
                    />
                  </div>

                  {tokenizationData.totalSupply && (
                    <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Total Supply:</div>
                          <div className="text-lg font-bold text-gray-900">
                            {parseInt(tokenizationData.totalSupply).toLocaleString()} tokens
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">Available for Trading:</div>
                          <div className="text-lg font-bold text-green-600">
                            {calculateAvailableTokens().toLocaleString()} tokens
                          </div>
                        </div>
                        {tokenizationData.pricePerToken && (
                          <>
                            <div>
                              <div className="text-gray-600">Total Asset Value:</div>
                              <div className="text-lg font-bold text-gray-900">
                                ${(parseInt(tokenizationData.totalSupply || '0') * parseFloat(tokenizationData.pricePerToken)).toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-600">Trading Pool Value:</div>
                              <div className="text-lg font-bold text-blue-600">
                                ${(calculateAvailableTokens() * parseFloat(tokenizationData.pricePerToken)).toLocaleString()}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-600 bg-white p-3 rounded border border-gray-200">
                    <strong>Note:</strong> Admin will review these parameters before creating the actual Hedera token.
                    They may adjust values if needed for compliance or market reasons.
                  </div>
                </div>

              {/* Price Estimation */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold mb-2 text-gray-900">Price Estimation</h3>
                <p className="text-sm text-gray-700 mb-3">
                  Get an AI-powered price estimate for your asset based on the information provided.
                </p>
                <Button
                  type="button"
                  onClick={handleEstimatePrice}
                  disabled={estimating || !formData.title}
                  variant="outline"
                >
                  {estimating ? 'Estimating...' : 'Estimate Price'}
                </Button>

                {estimatedPrice && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                    <div className="text-sm text-gray-600">Estimated Value:</div>
                    <div className="text-2xl font-bold text-green-700">
                      ${estimatedPrice.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Images (1-3 images)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Upload clear photos that prove you own this asset (max 3 images, 10MB each)
                </p>
                {images.length > 0 && (
                  <div className="mt-2 text-sm text-green-600">
                    {images.length} image(s) selected
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">Verification Process:</h3>
                <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                  <li>AI will analyze your images for authenticity</li>
                  <li>Admin team will manually review your submission</li>
                  <li>Verification typically takes 24-48 hours</li>
                  <li>You'll be notified once verification is complete</li>
                  <li>Approved assets can be listed for sale</li>
                </ul>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating Asset...' : 'Create & Submit for Verification'}
              </Button>
            </form>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
