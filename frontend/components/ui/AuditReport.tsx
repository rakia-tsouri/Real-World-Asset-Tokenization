'use client';

import { XCircle, AlertTriangle, Info, CheckCircle, Shield, Key, Lock, Pause, Trash2, Coins, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';

interface AuditIssue {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

interface AuditRule {
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
}

interface TokenData {
  token_id: string;
  name: string;
  symbol: string;
  type: string;
  decimals: string;
  total_supply: string;
  max_supply: string;
  initial_supply: string;
  supply_type: string;
  memo: string;
  treasury_account_id: string;
  auto_renew_account: string;
  auto_renew_period: number;
  created_timestamp: string;
  modified_timestamp: string;
  deleted: boolean;
  freeze_default: boolean;
  pause_status: string;
  admin_key: any;
  kyc_key: any;
  freeze_key: any;
  wipe_key: any;
  supply_key: any;
  fee_schedule_key: any;
  pause_key: any;
  metadata_key: any;
  custom_fees: any;
}

interface AuditReportData {
  success: boolean;
  report: {
    token_id: string;
    security_score: number;
    summary: {
      total_issues: number;
    };
    issues: AuditIssue[];
    rules: AuditRule[];
    token: TokenData;
  };
}

interface AuditReportProps {
  data: AuditReportData | null;
  onClose: () => void;
}

export function AuditReport({ data, onClose }: AuditReportProps) {
  if (!data || !data.report) return null;

  const { report } = data;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'low':
        return <Info className="w-5 h-5 text-yellow-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Poor';
  };

  const keyIcons: Record<string, JSX.Element> = {
    admin_key: <Key className="w-4 h-4" />,
    kyc_key: <Shield className="w-4 h-4" />,
    freeze_key: <Lock className="w-4 h-4" />,
    wipe_key: <Trash2 className="w-4 h-4" />,
    supply_key: <Coins className="w-4 h-4" />,
    pause_key: <Pause className="w-4 h-4" />,
    fee_schedule_key: <DollarSign className="w-4 h-4" />,
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold">Token Security Audit</h2>
            <Button onClick={onClose} variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
              ✕
            </Button>
          </div>
          <p className="text-blue-100 text-sm">Token ID: {report.token_id}</p>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {/* Security Score */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-1">Security Score</h3>
                  <p className="text-sm text-gray-500">Overall token security rating</p>
                </div>
                <div className="text-center">
                  <div className={`text-5xl font-bold ${getScoreColor(report.security_score)}`}>
                    {report.security_score}
                  </div>
                  <div className={`text-sm font-medium ${getScoreColor(report.security_score)}`}>
                    {getScoreLabel(report.security_score)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total Issues</p>
                  <p className="text-2xl font-bold text-gray-900">{report.summary.total_issues}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Token Name</p>
                  <p className="text-lg font-semibold text-gray-900">{report.token.name}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Symbol</p>
                  <p className="text-lg font-semibold text-gray-900">{report.token.symbol}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Issues */}
          {report.issues && report.issues.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Security Issues ({report.issues.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.issues.map((issue, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 ${getSeverityColor(issue.severity)}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{getSeverityIcon(issue.severity)}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold">{issue.title}</h4>
                            <span className="text-xs uppercase font-medium px-2 py-1 rounded">
                              {issue.severity}
                            </span>
                          </div>
                          <p className="text-sm opacity-90">{issue.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Compliance Rules */}
          {report.rules && report.rules.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Compliance Rules ({report.rules.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.rules.map((rule, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 ${getSeverityColor(rule.severity)}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{getSeverityIcon(rule.severity)}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold">{rule.title}</h4>
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded">
                                {rule.category}
                              </span>
                              <span className="text-xs uppercase font-medium px-2 py-1 rounded">
                                {rule.severity}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm opacity-90">{rule.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Token Details */}
          <Card>
            <CardHeader>
              <CardTitle>Token Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Type</p>
                  <p className="font-medium">{report.token.type}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Supply Type</p>
                  <p className="font-medium">{report.token.supply_type}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Total Supply</p>
                  <p className="font-medium">{report.token.total_supply}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Max Supply</p>
                  <p className="font-medium">{report.token.max_supply}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Treasury Account</p>
                  <p className="font-medium text-xs">{report.token.treasury_account_id}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Auto Renew Period</p>
                  <p className="font-medium">{Math.floor(report.token.auto_renew_period / 86400)} days</p>
                </div>
                {report.token.memo && (
                  <div className="md:col-span-2">
                    <p className="text-gray-600 mb-1">Memo</p>
                    <p className="font-medium">{report.token.memo}</p>
                  </div>
                )}
              </div>

              {/* Keys Configuration */}
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold mb-3">Key Configuration</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(keyIcons).map(([key, icon]) => {
                    const hasKey = report.token[key as keyof TokenData] !== null;
                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-2 p-3 rounded-lg border ${
                          hasKey
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : 'bg-gray-50 border-gray-200 text-gray-400'
                        }`}
                      >
                        {icon}
                        <div className="flex-1">
                          <p className="text-xs font-medium capitalize">
                            {key.replace('_', ' ')}
                          </p>
                          <p className="text-xs">
                            {hasKey ? <CheckCircle className="w-3 h-3 inline" /> : <XCircle className="w-3 h-3 inline" />}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Fees */}
              {report.token.custom_fees && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold mb-2">Custom Fees</h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      {report.token.custom_fees.fixed_fees?.length || 0} Fixed Fee(s), {' '}
                      {report.token.custom_fees.fractional_fees?.length || 0} Fractional Fee(s)
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
