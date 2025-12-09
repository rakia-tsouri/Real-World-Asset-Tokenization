'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { kycAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export default function KYCVerification() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    dateOfBirth: '',
    address: '',
    phoneNumber: '',
    country: '',
    documentType: 'cin',
  });
  const [document, setDocument] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocument(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!document) {
        setError('Please upload your identity document');
        setLoading(false);
        return;
      }

      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      formDataToSend.append('document', document);

      const response = await kycAPI.submit(formDataToSend);
      
      if (response.data.success) {
        alert('KYC submitted successfully! Verification may take up to 24 hours.');
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit KYC');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <div className="p-8">
            <h1 className="text-3xl font-bold mb-2 gradient-text">Identity Verification (KYC)</h1>
            <p className="text-foreground-muted mb-6">
              Complete your identity verification to start trading assets. This process may take up to 24 hours.
            </p>

            {error && (
              <div className="bg-danger-muted border border-danger/30 text-danger px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Full Name"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
              />

              <Input
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your@email.com"
              />

              <Input
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
              />

              <Input
                label="Phone Number"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                placeholder="+216 XX XXX XXX"
              />

              <Input
                label="Country"
                name="country"
                type="text"
                value={formData.country}
                onChange={handleChange}
                required
                placeholder="Tunisia"
              />

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Address
                </label>
                <input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-input border border-input-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-foreground"
                  placeholder="Your full address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Document Type
                </label>
                <select
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-input border border-input-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-foreground"
                  required
                >
                  <option value="cin">National ID Card (CIN)</option>
                  <option value="passport">Passport</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Upload Document
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  required
                  className="w-full px-4 py-2 bg-input border border-input-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-foreground"
                />
                <p className="text-sm text-foreground-muted mt-1">
                  Upload a clear photo of your {formData.documentType === 'cin' ? 'CIN' : 'passport'}
                </p>
              </div>

              <div className="bg-warning-muted border border-warning/30 rounded-lg p-4">
                <h3 className="font-semibold text-warning mb-2">Important:</h3>
                <ul className="text-sm text-warning space-y-1 list-disc list-inside">
                  <li>Ensure the document is clear and readable</li>
                  <li>All information must match your document exactly</li>
                  <li>AI verification will be performed on your document</li>
                  <li>Verification may take up to 24 hours</li>
                  <li>You'll be notified once your verification is complete</li>
                </ul>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit KYC Verification'}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
