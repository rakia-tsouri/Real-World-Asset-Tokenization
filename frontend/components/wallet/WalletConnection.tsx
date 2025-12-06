'use client';

import { useState, useEffect } from 'react';
import { authAPI } from '@/lib/api';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Smartphone, RefreshCw } from 'lucide-react';
import SignClient from '@walletconnect/sign-client';
import { WalletConnectModal } from '@walletconnect/modal';

interface WalletConnectionProps {
  onSuccess?: () => void;
}

export default function WalletConnection({ onSuccess }: WalletConnectionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uri, setUri] = useState('');
  const [signClient, setSignClient] = useState<SignClient | null>(null);
  const [modal, setModal] = useState<WalletConnectModal | null>(null);
  const [session, setSession] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    initWalletConnect();
  }, []);

  const initWalletConnect = async () => {
    try {
      const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
      
      if (!projectId || projectId === 'YOUR_PROJECT_ID' || projectId === 'a01e2f3b4c5d6e7f8a9b0c1d2e3f4a5b') {
        setError('WalletConnect Project ID not configured. Please add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID to .env.local');
        return;
      }

      const client = await SignClient.init({
        projectId,
        metadata: {
          name: 'RWA Tokenization Platform',
          description: 'Real-World Asset Tokenization on Hedera',
          url: typeof window !== 'undefined' ? window.location.origin : 'https://rwa-platform.com',
          icons: ['https://rwa-platform.com/logo.png']
        }
      });

      setSignClient(client);

      // Don't initialize modal - it causes issues with invalid project IDs
      // We'll use custom QR code display instead

      client.on('session_delete', () => {
        setSession(null);
        setUri('');
      });

    } catch (err) {
      console.error('Failed to initialize WalletConnect:', err);
      setError('Failed to initialize wallet connection. Check your Project ID.');
    }
  };

  const connect = async () => {
    if (!signClient) {
      setError('WalletConnect not initialized');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const { uri: connectionUri, approval } = await signClient.connect({
        requiredNamespaces: {
          hedera: {
            methods: ['hedera_signMessage', 'hedera_executeTransaction'],
            chains: ['hedera:testnet'],
            events: ['chainChanged', 'accountsChanged']
          }
        }
      });

      if (connectionUri) {
        setUri(connectionUri);
        // Don't use modal - just show our custom QR code
      }

      const newSession = await approval();
      setSession(newSession);
      
      // Don't need to close modal since we're not using it

      const hederaNamespace = newSession.namespaces['hedera'];
      if (hederaNamespace && hederaNamespace.accounts.length > 0) {
        const accountId = hederaNamespace.accounts[0].split(':')[2];
        await saveWalletConnection(accountId);
      } else {
        setError('No account found in wallet');
      }

    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const saveWalletConnection = async (accountId: string) => {
    try {
      console.log('Saving wallet connection with accountId:', accountId);
      const response = await authAPI.connectWallet({ walletId: accountId });
      if (response.data.success) {
        console.log('Wallet connected successfully:', response.data.data);
        alert('✅ HashPack wallet connected successfully!');
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      console.error('Save wallet connection error:', err.response?.data);
      const errorMsg = err.response?.data?.message || 'Failed to save wallet connection';
      const details = err.response?.data?.details?.join(', ');
      setError(details ? `${errorMsg}: ${details}` : errorMsg);
    }
  };

  const disconnect = async () => {
    if (signClient && session) {
      await signClient.disconnect({
        topic: session.topic,
        reason: { code: 6000, message: 'User disconnected' }
      });
      setSession(null);
      setUri('');
    }
  };

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Connect HashPack Wallet</h2>
        <p className="text-gray-600 mb-6">
          Connect your HashPack wallet using WalletConnect.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {session ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              <p className="font-semibold">✅ Wallet Connected!</p>
              <p className="text-sm mt-1">Account: {session.namespaces?.hedera?.accounts?.[0]?.split(':')[2]}</p>
            </div>
            <Button onClick={disconnect} variant="outline" className="w-full">Disconnect</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {!uri ? (
              <Button onClick={connect} disabled={loading || !signClient} className="w-full">
                {loading ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Connecting...</> : 'Connect Wallet'}
              </Button>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="flex justify-center p-6 bg-white rounded-lg border-2 border-gray-300">
                    <QRCodeSVG 
                      value={uri} 
                      size={280}
                      level="M"
                      includeMargin={true}
                    />
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-blue-900 mb-2">
                      <Smartphone className="inline w-4 h-4 mr-1" />Mobile: Scan QR Code
                    </p>
                    <p className="text-xs text-blue-700">Open HashPack mobile app and scan the QR code above</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-900 mb-2">Desktop: Copy URI</p>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={uri} 
                        readOnly 
                        className="flex-1 px-3 py-2 text-xs bg-white border rounded font-mono"
                      />
                      <Button 
                        onClick={() => { navigator.clipboard.writeText(uri); setCopied(true); setTimeout(() => setCopied(false), 2000); }} 
                        variant="outline"
                        size="sm"
                      >
                        {copied ? <><Check className="w-4 h-4" /></> : <><Copy className="w-4 h-4" /></>}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">Paste in HashPack browser extension</p>
                  </div>
                </div>
              </>
            )}
            <p className="text-xs text-center text-gray-500">
              Get WalletConnect Project ID from <a href="https://cloud.walletconnect.com" target="_blank" className="text-blue-600">cloud.walletconnect.com</a>
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
