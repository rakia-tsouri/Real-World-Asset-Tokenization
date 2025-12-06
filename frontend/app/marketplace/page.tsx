'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { assetAPI } from '@/lib/api';
import { AssetCard } from '@/components/marketplace/AssetCard';
import { Input } from '@/components/ui/Input';
import { Search, Filter } from 'lucide-react';

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
      filtered = filtered.filter(asset => asset.category === selectedType);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(asset =>
        asset.title?.toLowerCase().includes(term) ||
        asset.description?.toLowerCase().includes(term) ||
        asset.category?.toLowerCase().includes(term)
      );
    }

    setFilteredAssets(filtered);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto glow-primary"></div>
          <p className="mt-6 text-foreground-muted text-lg">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const assetTypes = [
    { value: 'all', label: 'All Properties', icon: '🏘️' },
    { value: 'real-estate', label: 'Residential', icon: '🏠' },
    { value: 'vehicle', label: 'Commercial', icon: '🏢' },
    { value: 'commodity', label: 'Tourist', icon: '🏖️' },
    { value: 'company', label: 'Industrial', icon: '🏭' },
  ];

  return (
    <div className="min-h-screen gradient-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Tunisian Real Estate Marketplace</h1>
          <p className="text-foreground-muted text-lg">Discover premium tokenized properties across Tunisia — starting from 300 TND</p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-foreground-subtle w-5 h-5" />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-foreground-subtle w-5 h-5" />
            <Input
              type="text"
              placeholder="Search assets by name, category, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-5 h-5 text-foreground-subtle" />
            {assetTypes.map(type => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  selectedType === type.value
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'bg-surface-elevated text-foreground-muted border border-border hover:bg-surface-hover hover:text-foreground'
                }`}
              >
                <span className="mr-2">{type.icon}</span>
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Assets Grid */}
        {filteredAssets.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-foreground-muted">
                Showing <span className="text-foreground font-semibold">{filteredAssets.length}</span> {filteredAssets.length === 1 ? 'asset' : 'assets'}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssets.map(asset => (
                <AssetCard key={asset._id} asset={asset} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20 glass rounded-2xl">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-surface-elevated rounded-2xl flex items-center justify-center mx-auto mb-6 border border-border">
                <Search className="w-10 h-10 text-foreground-subtle" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-3">
                {searchTerm || selectedType !== 'all' ? 'No assets found' : 'No assets available yet'}
              </h3>
              <p className="text-foreground-muted mb-8 text-lg">
                {searchTerm || selectedType !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Assets will appear here once they are created and verified'}
              </p>
              {!searchTerm && selectedType === 'all' && (
                <div className="text-sm text-foreground-muted bg-surface-elevated p-6 rounded-xl border border-border inline-block">
                  <p className="font-semibold mb-3 text-foreground">To add your first asset:</p>
                  <ol className="list-decimal list-inside space-y-2 text-left">
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
