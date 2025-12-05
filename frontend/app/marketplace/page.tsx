'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { assetAPI } from '@/lib/api';
import { AssetCard } from '@/components/marketplace/AssetCard';
import { Input } from '@/components/ui/Input';
import { Search } from 'lucide-react';

export default function MarketplacePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [assets, setAssets] = useState<any[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    filterAssets();
  }, [searchTerm, selectedType, assets]);

  const fetchAssets = async () => {
    try {
      // Fetch all assets including unverified ones for testing
      const response = await assetAPI.getAll({ includeUnverified: 'true' });
      console.log('Fetched assets:', response.data);
      setAssets(response.data.data || []);
      setFilteredAssets(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
      setAssets([]);
      setFilteredAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAssets = () => {
    let filtered = [...assets];

    if (selectedType !== 'all') {
      filtered = filtered.filter(asset => asset.assetType === selectedType);
    }

    if (searchTerm) {
      filtered = filtered.filter(asset =>
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAssets(filtered);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const assetTypes = [
    { value: 'all', label: 'All Assets' },
    { value: 'real-estate', label: 'Real Estate' },
    { value: 'commodities', label: 'Commodities' },
    { value: 'art', label: 'Art' },
    { value: 'bonds', label: 'Bonds' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Asset Marketplace</h1>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {assetTypes.map(type => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedType === type.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Assets Grid */}
        {filteredAssets.length > 0 ? (
          <>
            <p className="text-gray-600 mb-4">
              Showing {filteredAssets.length} {filteredAssets.length === 1 ? 'asset' : 'assets'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssets.map(asset => (
                <AssetCard key={asset.id} asset={asset} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm || selectedType !== 'all' ? 'No assets found' : 'No assets available yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || selectedType !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Assets will appear here once they are created and verified'}
              </p>
              {!searchTerm && selectedType === 'all' && (
                <div className="text-sm text-gray-500">
                  <p>To add your first asset:</p>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Complete KYC verification</li>
                    <li>Connect your HashPack wallet</li>
                    <li>Go to Dashboard and create a new asset</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
