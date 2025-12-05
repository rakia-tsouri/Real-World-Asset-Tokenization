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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-gray-600 mb-1">Total Users</div>
              <div className="text-3xl font-bold">{stats?.users.total || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-gray-600 mb-1">Pending KYC</div>
              <div className="text-3xl font-bold text-yellow-600">
                {stats?.users.kycPending || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-gray-600 mb-1">Total Assets</div>
              <div className="text-3xl font-bold">{stats?.assets.total || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-gray-600 mb-1">Pending Asset Verifications</div>
              <div className="text-3xl font-bold text-yellow-600">
                {stats?.assets.verificationPending || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">KYC Verifications</h2>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Pending Reviews</div>
                  <div className="text-sm text-gray-600">
                    {stats?.users.kycPending || 0} users awaiting verification
                  </div>
                </div>
                <Button onClick={() => window.location.href = '/admin/kyc'}>
                  Review KYC
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <div className="text-sm text-gray-600">Approved</div>
                  <div className="text-xl font-semibold text-green-600">
                    {stats?.users.kycApproved || 0}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Rejected</div>
                  <div className="text-xl font-semibold text-red-600">
                    {stats?.users.kycRejected || 0}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Asset Verifications</h2>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Pending Reviews</div>
                  <div className="text-sm text-gray-600">
                    {stats?.assets.verificationPending || 0} assets awaiting verification
                  </div>
                </div>
                <Button onClick={() => window.location.href = '/admin/assets'}>
                  Review Assets
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <div className="text-sm text-gray-600">Approved</div>
                  <div className="text-xl font-semibold text-green-600">
                    {stats?.assets.verificationApproved || 0}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Rejected</div>
                  <div className="text-xl font-semibold text-red-600">
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
