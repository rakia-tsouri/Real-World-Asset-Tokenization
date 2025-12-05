'use client';

import { Card } from '@/components/ui/Card';
import { Building2, DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';

interface Asset {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  valuation?: number;
  liquidityScore?: number;
  isListed: boolean;
  listingPrice?: number;
  verificationStatus: string;
  availability_in_tunisia?: boolean;
  hedera?: {
    tokenId?: string;
    tokenized?: boolean;
  };
}

interface AssetCardProps {
  asset: Asset;
}

export function AssetCard({ asset }: AssetCardProps) {
  const getStatusBadge = () => {
    switch (asset.verificationStatus) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Verified
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Clock className="w-3 h-3" />
            Not Submitted
          </span>
        );
    }
  };

  return (
    <Link href={`/marketplace/${asset._id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <div className="p-0">
          <div className="aspect-video bg-gradient-to-br from-blue-400 via-blue-500 to-purple-500 rounded-t-lg flex items-center justify-center">
            <Building2 className="w-16 h-16 text-white opacity-50" />
          </div>
          <div className="p-5">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{asset.title}</h3>
                {asset.category && (
                  <p className="text-sm text-gray-500 capitalize">{asset.category}</p>
                )}
              </div>
              {getStatusBadge()}
            </div>
            
            {asset.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                {asset.description}
              </p>
            )}
            
            <div className="space-y-3 mt-4">
              {asset.valuation && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Valuation</span>
                  <span className="text-lg font-bold text-gray-900">
                    ${asset.valuation.toLocaleString()}
                  </span>
                </div>
              )}
              
              {asset.isListed && asset.listingPrice && (
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span className="text-sm font-medium text-green-800">Listed Price</span>
                  <span className="text-lg font-bold text-green-900 flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {asset.listingPrice.toLocaleString()}
                  </span>
                </div>
              )}

              {!asset.isListed && (
                <div className="text-xs text-gray-500 text-center py-2 bg-gray-50 rounded">
                  Not listed for sale
                </div>
              )}

              {asset.hedera?.tokenized && (
                <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  <CheckCircle className="w-3 h-3" />
                  <span>Tokenized on Hedera</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
