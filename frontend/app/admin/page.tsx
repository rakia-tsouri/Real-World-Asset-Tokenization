'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Stats {
  users: {
    total: number;
    kycPending: number;
    kycApproved: number;
    kycRejected: number;
  };
  assets: {
    total: number;
    verificationPending: number;
    verificationApproved: number;
    verificationRejected: number;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto glow-primary"></div>
          <p className="mt-6 text-foreground-muted text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold gradient-text mb-8">Admin Dashboard</h1>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card hover className="glass">
            <CardContent className="p-6">
              <div className="text-sm text-foreground-muted mb-2">Total Users</div>
              <div className="text-3xl font-bold text-foreground">{stats?.users.total || 0}</div>
            </CardContent>
          </Card>

          <Card hover className="glass">
            <CardContent className="p-6">
              <div className="text-sm text-foreground-muted mb-2">Pending KYC</div>
              <div className="text-3xl font-bold text-warning">
                {stats?.users.kycPending || 0}
              </div>
            </CardContent>
          </Card>

          <Card hover className="glass">
            <CardContent className="p-6">
              <div className="text-sm text-foreground-muted mb-2">Total Assets</div>
              <div className="text-3xl font-bold text-foreground">{stats?.assets.total || 0}</div>
            </CardContent>
          </Card>

          <Card hover className="glass">
            <CardContent className="p-6">
              <div className="text-sm text-foreground-muted mb-2">Pending Asset Verifications</div>
              <div className="text-3xl font-bold text-warning">
                {stats?.assets.verificationPending || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card hover className="glass">
            <CardHeader>
              <h2 className="text-xl font-semibold text-foreground">KYC Verifications</h2>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-foreground">Pending Reviews</div>
                  <div className="text-sm text-foreground-muted">
                    {stats?.users.kycPending || 0} users awaiting verification
                  </div>
                </div>
                <Button onClick={() => window.location.href = '/admin/kyc'} glow>
                  Review KYC
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <div className="text-sm text-foreground-muted">Approved</div>
                  <div className="text-xl font-semibold text-success">
                    {stats?.users.kycApproved || 0}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-foreground-muted">Rejected</div>
                  <div className="text-xl font-semibold text-danger">
                    {stats?.users.kycRejected || 0}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card hover className="glass">
            <CardHeader>
              <h2 className="text-xl font-semibold text-foreground">Asset Verifications</h2>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-foreground">Pending Reviews</div>
                  <div className="text-sm text-foreground-muted">
                    {stats?.assets.verificationPending || 0} assets awaiting verification
                  </div>
                </div>
                <Button onClick={() => window.location.href = '/admin/assets'} glow>
                  Review Assets
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <div className="text-sm text-foreground-muted">Approved</div>
                  <div className="text-xl font-semibold text-success">
                    {stats?.assets.verificationApproved || 0}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-foreground-muted">Rejected</div>
                  <div className="text-xl font-semibold text-danger">
                    {stats?.assets.verificationRejected || 0}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
