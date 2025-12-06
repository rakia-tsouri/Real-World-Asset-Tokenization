'use client';

import { Card } from '@/components/ui/Card';
import { Building2, DollarSign, CheckCircle, Clock, XCircle, Sparkles } from 'lucide-react';
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
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-success-muted text-success border border-success/30">
            <CheckCircle className="w-3 h-3" />
            Verified
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-warning-muted text-warning border border-warning/30">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-danger-muted text-danger border border-danger/30">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-surface-hover text-foreground-subtle border border-border">
            <Clock className="w-3 h-3" />
            Not Submitted
          </span>
        );
    }
  };

  const getCategoryGradient = () => {
    const gradients = {
      'real estate': 'from-primary via-accent to-primary',
      'commodity': 'from-gold via-warning to-gold',
      'vehicle': 'from-accent via-primary to-accent',
      'company': 'from-success via-accent to-success',
    };
    return gradients[asset.category?.toLowerCase() as keyof typeof gradients] || 'from-primary via-accent to-primary';
  };

  return (
    <Link href={`/marketplace/${asset._id}`}>
      <Card hover className="h-full overflow-hidden group">
        <div className="p-0">
          <div className={`aspect-video bg-gradient-to-br ${getCategoryGradient()} rounded-t-xl flex items-center justify-center relative overflow-hidden`}>
            <div className="absolute inset-0 bg-black/20"></div>
            <Building2 className="w-20 h-20 text-white/30 relative z-10 group-hover:scale-110 transition-transform" />
            {asset.hedera?.tokenized && (
              <div className="absolute top-3 right-3 bg-surface-elevated/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1.5 border border-accent">
                <Sparkles className="w-3 h-3 text-accent" />
                <span className="text-xs font-medium text-accent">Tokenized</span>
              </div>
            )}
          </div>
          <div className="p-5">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate text-foreground group-hover:text-primary transition-colors">{asset.title}</h3>
                {asset.category && (
                  <p className="text-sm text-foreground-subtle capitalize mt-1">{asset.category}</p>
                )}
              </div>
              {getStatusBadge()}
            </div>
            
            {asset.description && (
              <p className="text-sm text-foreground-muted line-clamp-2 mb-4">
                {asset.description}
              </p>
            )}
            
            <div className="space-y-3 mt-4">
              {asset.valuation && (
                <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                  <span className="text-sm text-foreground-muted">Valuation</span>
                  <span className="text-lg font-bold text-foreground">
                    ${asset.valuation.toLocaleString()}
                  </span>
                </div>
              )}
              
              {asset.isListed && asset.listingPrice && (
                <div className="flex items-center justify-between p-3 bg-success-muted rounded-lg border border-success/30">
                  <span className="text-sm font-medium text-success">Listed Price</span>
                  <span className="text-lg font-bold text-success flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {asset.listingPrice.toLocaleString()}
                  </span>
                </div>
              )}

              {!asset.isListed && (
                <div className="text-xs text-foreground-subtle text-center py-2 bg-surface rounded-lg border border-border">
                  Not listed for sale
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
