import React, { useState } from 'react';
import { Search, Shield, AlertTriangle, CheckCircle, Wallet, Clock, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ProtectedRoute from '@/components/ProtectedRoute';
import { fetchWalletData, type RawWalletData } from '@/lib/fetchWalletData';
import { getUserPlan, getWalletInspectorUsage, isOverWalletInspectorLimit } from '@/lib/planLimits';

interface WalletData {
  address: string;
  balance: number;
  balanceUSD: number;
  tokenCount: number;
  nftCount: number;
  firstTransaction: string;
  lastTransaction: string;
  riskLevel: 'low' | 'medium' | 'high';
  riskScore: number;
  tokens: Token[];
}

interface Token {
  symbol: string;
  name: string;
  balance: number;
  price: number;
  valueUSD: number;
  logo: string;
}

const WalletInspector = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [address, setAddress] = useState('');
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Analysis options to intake information about features
  const [analysisDepth, setAnalysisDepth] = useState<'basic' | 'standard' | 'advanced'>('standard');
  const [includeNFTs, setIncludeNFTs] = useState<boolean>(true);
  const [chain, setChain] = useState<'ethereum' | 'polygon' | 'bsc'>('ethereum');
  const [dateRangeDays, setDateRangeDays] = useState<number>(90);
  const [riskFocus, setRiskFocus] = useState<'general' | 'scam' | 'privacy' | 'compliance'>('general');

  const validateEthereumAddress = (addr: string): boolean => {
    const trimmed = (addr || '').trim();
    return /^0x[a-fA-F0-9]{40}$/.test(trimmed);
  };

  const calculateRiskLevel = (data: RawWalletData): { level: 'low' | 'medium' | 'high', score: number } => {
    // New scoring: higher score = higher risk
    let score = 0;

    // Age factor: younger wallets are riskier
    const ageMs = data.first_tx_date ? Date.now() - new Date(data.first_tx_date).getTime() : 0;
    const ageInDays = ageMs / (1000 * 60 * 60 * 24);
    if (!data.first_tx_date) {
      score += 30; // no history
    } else if (ageInDays < 7) score += 30;
    else if (ageInDays < 30) score += 20;
    else if (ageInDays < 90) score += 10;

    // Balance factor: low balances are riskier, weight depends on risk focus
    const total = data.total_usd_value || 0;
    const balanceWeight = riskFocus === 'compliance' ? 10 : riskFocus === 'privacy' ? 10 : riskFocus === 'scam' ? 15 : 20;
    if (total < 100) score += balanceWeight;
    else if (total < 1000) score += Math.floor(balanceWeight / 2);

    // Token diversity: fewer tokens increases risk; lower weight for privacy focus
    const tokenCount = data.token_holdings?.length || 0;
    const diversityHigh = riskFocus === 'privacy' ? 15 : 25;
    const diversityMed = riskFocus === 'privacy' ? 8 : 15;
    if (tokenCount <= 2) score += diversityHigh;
    else if (tokenCount <= 5) score += diversityMed;

    // GoPlus risk flags: add points for flagged indicators
    const flags = data.riskFlags || {};
    const toBool = (v: unknown) => v === true || v === 1 || v === '1' || v === 'true' || v === 'TRUE';
    const flagBooleans = [
      toBool(flags.is_blacklisted),
      toBool(flags.is_sanctioned),
      toBool(flags.is_scam),
      toBool(flags.is_abnormal),
      toBool(flags.is_dex_trader),
      toBool(flags.is_phishing),
    ];
    const trueFlags = flagBooleans.filter((f) => f === true).length;
    const perFlag = riskFocus === 'compliance' ? 15 : riskFocus === 'scam' ? 12 : 10;
    score += trueFlags * perFlag; // focus-weighted flags

    // Map to risk levels
    if (score >= 60) return { level: 'high', score };
    if (score >= 30) return { level: 'medium', score };
    return { level: 'low', score };
  };

  const inspectWallet = async () => {
    if (!validateEthereumAddress(address)) {
      setError('Please enter a valid Ethereum address');
      return;
    }

    // Enforce monthly wallet inspector limits per plan
    if (user) {
      const planType = await getUserPlan(user.id);
      const usageCount = await getWalletInspectorUsage(user.id);
      if (isOverWalletInspectorLimit(usageCount, planType)) {
        toast({
          title: 'Monthly Limit Reached',
          description: `You have reached your ${planType} plan wallet inspections limit for this month.`,
          variant: 'destructive',
        });
        return;
      }
    }

    setIsLoading(true);
    setError('');
    setWalletData(null);

    try {
      // Fetch real-time data
      const addr = address.trim();
      const raw: RawWalletData = await fetchWalletData(addr, includeNFTs, chain, {
        analysisDepth,
        dateRangeDays,
      });
      const risk = calculateRiskLevel(raw);

      const tokensProcessed = raw.token_holdings.map((t) => ({
        symbol: t.symbol,
        name: t.name,
        balance: t.amount,
        price: t.price,
        valueUSD: Number((t.amount * (t.price || 0)).toFixed(2)),
        logo: t.logo_url || '',
      }));

      const ethBalance = tokensProcessed.find((t) => t.symbol?.toUpperCase() === 'ETH')?.balance || 0;

      const processedData: WalletData = {
        address: addr,
        balance: ethBalance,
        balanceUSD: raw.total_usd_value,
        tokenCount: tokensProcessed.length,
        nftCount: raw.nft_count || 0,
        firstTransaction: raw.first_tx_date || '',
        lastTransaction: raw.last_tx_date || '',
        riskLevel: risk.level,
        riskScore: risk.score,
        tokens: tokensProcessed,
      };

      setWalletData(processedData);

      // Save to database if user is logged in (required for security)
      if (user) {
        try {
          await supabase.from('wallet_inspections').insert({
            user_id: user.id,
            address: addr,
            chain: chain || null,
            risk_level: processedData.riskLevel || null,
            risk_score: processedData.riskScore || null,
          });
          
          toast({
            title: 'Wallet Scan Saved',
            description: 'Wallet inspection saved to your dashboard',
          });
        } catch (dbError) {
          console.error('Error saving to database:', dbError);
          toast({
            title: 'Save Failed',
            description: 'Could not save scan to database',
            variant: 'destructive',
          });
        }
      }

      toast({
        title: 'Wallet Analyzed',
        description: 'Wallet inspection completed successfully',
      });

    } catch (err) {
      console.error('Wallet inspection error:', err);
      setError('Failed to inspect wallet. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to inspect wallet',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'high': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-muted-foreground bg-muted/10 border-muted/20';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <Shield className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              Wallet Inspector
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Analyze any Ethereum wallet to view balance, tokens, transaction history, and assess potential risks.
            </p>
          </div>

          {/* Wallet Input */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Enter Ethereum wallet address (0x...)"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="bg-background/50 border-border/50"
                  />
                  {error && (
                    <p className="text-red-400 text-sm mt-2">{error}</p>
                  )}
                </div>
                <Button 
                  onClick={inspectWallet}
                  disabled={isLoading || !address}
                  className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/80 hover:to-purple-600/80"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Inspect Wallet
                    </>
                  )}
                </Button>
              </div>
          </CardContent>
          </Card>

          {/* Analysis Options */}
          <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-primary" />
                Analysis Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configure how the Wallet Inspector analyzes data. These inputs help tailor the inspection to your needs.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chain">Network</Label>
                  <select
                    id="chain"
                    value={chain}
                    onChange={(e) => setChain(e.target.value as 'ethereum' | 'polygon' | 'bsc')}
                    className="w-full rounded-md border border-border/50 bg-background/60 text-foreground px-3 py-2 transition-colors duration-150 hover:bg-background/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus:border-primary/60 disabled:opacity-50"
                  >
                    <option value="ethereum">Ethereum (supported)</option>
                    <option value="polygon" disabled>Polygon (coming soon)</option>
                    <option value="bsc" disabled>BNB Smart Chain (coming soon)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="depth">Analysis Depth</Label>
                  <select
                    id="depth"
                    value={analysisDepth}
                    onChange={(e) => setAnalysisDepth(e.target.value as 'basic' | 'standard' | 'advanced')}
                    className="w-full rounded-md border border-border/50 bg-background/60 text-foreground px-3 py-2 transition-colors duration-150 hover:bg-background/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus:border-primary/60 disabled:opacity-50"
                  >
                    <option value="basic">Basic (fast)</option>
                    <option value="standard">Standard (balanced)</option>
                    <option value="advanced">Advanced (more checks)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="range">Transaction Window (days)</Label>
                  <Input
                    id="range"
                    type="number"
                    min={1}
                    max={3650}
                    value={dateRangeDays}
                    onChange={(e) => setDateRangeDays(Number(e.target.value))}
                    className="bg-background/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="risk">Risk Focus</Label>
                  <select
                    id="risk"
                    value={riskFocus}
                    onChange={(e) => setRiskFocus(e.target.value as 'general' | 'scam' | 'privacy' | 'compliance')}
                    className="w-full rounded-md border border-border/50 bg-background/50 p-2"
                  >
                    <option value="general">General</option>
                    <option value="scam">Scam / Rug-pull indicators</option>
                    <option value="privacy">Privacy risks</option>
                    <option value="compliance">Compliance flags</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nfts">Include NFTs</Label>
                  <div className="flex items-center gap-2">
                    <input
                      id="nfts"
                      type="checkbox"
                      checked={includeNFTs}
                      onChange={(e) => setIncludeNFTs(e.target.checked)}
                      className="h-4 w-4 rounded border-border/50"
                    />
                    <span className="text-sm text-muted-foreground">Count NFTs in overview</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Note: Options refine the analysis UI today; backend validation for additional networks is rolling out.
              </p>
            </CardContent>
          </Card>

          {/* About & Highlights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-border/50 bg-card/40 backdrop-blur-sm lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Search className="h-5 w-5 text-primary" />
                  About Wallet Inspector
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Wallet Inspector helps you understand on-chain activity for any Ethereum address. It summarizes balances, token holdings, activity timelines, and provides a lightweight risk assessment to help you gauge trust and exposure.
                </p>
                <p>
                  Use this tool when evaluating counterparties, investigating suspicious activity, or doing due diligence on wallets interacting with your smart contracts.
                </p>
                <p>
                  Your privacy matters: we do not store raw wallet inputs beyond necessary usage analytics. Results are generated on-demand.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Feature Highlights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Shield className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Risk Scoring</p>
                      <p className="text-sm text-muted-foreground">Simple, explainable indicators for wallet maturity, diversity and chain usage.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Coins className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Token Breakdown</p>
                      <p className="text-sm text-muted-foreground">Holdings and USD value estimates with per-token details.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Activity Timeline</p>
                      <p className="text-sm text-muted-foreground">First and recent transactions to quickly gauge wallet history.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Flag Indicators</p>
                      <p className="text-sm text-muted-foreground">Potential red flags based on common scam and risk patterns.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          {walletData && (
            <div className="space-y-6">
              {/* Applied Options Summary */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Applied Analysis Options</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Network</p>
                    <p className="font-medium capitalize">{chain}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Depth</p>
                    <p className="font-medium capitalize">{analysisDepth}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Window</p>
                    <p className="font-medium">{dateRangeDays} days</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Include NFTs</p>
                    <p className="font-medium">{includeNFTs ? 'Yes' : 'No'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-muted-foreground">Risk Focus</p>
                    <p className="font-medium capitalize">{riskFocus}</p>
                  </div>
                </CardContent>
              </Card>
              {/* Wallet Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Wallet className="h-5 w-5 text-primary" />
                      Wallet Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-mono text-sm">{formatAddress(walletData.address)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Value</p>
                      <p className="text-xl font-bold text-primary">
                        ${walletData.balanceUSD.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ETH Balance</p>
                      <p className="font-semibold">{walletData.balance.toFixed(4)} ETH</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Clock className="h-5 w-5 text-primary" />
                      Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">First Transaction</p>
                      <p className="font-semibold">{formatDate(walletData.firstTransaction)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Transaction</p>
                      <p className="font-semibold">{formatDate(walletData.lastTransaction)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Assets</p>
                      <p className="font-semibold">{walletData.tokenCount} tokens, {walletData.nftCount} NFTs</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Shield className="h-5 w-5 text-primary" />
                      Risk Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Risk Level</p>
                      <Badge className={getRiskColor(walletData.riskLevel)}>
                        {getRiskIcon(walletData.riskLevel)}
                        <span className="ml-2 capitalize">{walletData.riskLevel} Risk</span>
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Risk Score</p>
                      <p className="text-xl font-bold">{walletData.riskScore}/100</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Token Holdings */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-primary" />
                    Token Holdings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {walletData.tokens.map((token, index) => (
                      <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/30">
                        <div className="flex items-center gap-3">
                          <img 
                            src={token.logo} 
                            alt={token.symbol}
                            className="w-8 h-8 rounded-full"
                            onError={(e) => {
                              const inspectedWalletSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect x="5" y="9" width="22" height="14" rx="4" fill="#1F2937"/><rect x="18" y="12" width="9" height="8" rx="2" fill="#374151"/><circle cx="23" cy="16" r="2" fill="#10B981"/><circle cx="12" cy="14" r="5" fill="none" stroke="#60A5FA" stroke-width="2"/><line x1="15.5" y1="17.5" x2="19" y2="21" stroke="#60A5FA" stroke-width="2" stroke-linecap="round"/></svg>';
                              e.currentTarget.src = `data:image/svg+xml;base64,${btoa(inspectedWalletSvg)}`;
                            }}
                          />
                          <div>
                            <p className="font-semibold">{token.symbol}</p>
                            <p className="text-sm text-muted-foreground">{token.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{token.balance.toFixed(4)} {token.symbol}</p>
                          <p className="text-sm text-muted-foreground">${token.valueUSD.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default WalletInspector;