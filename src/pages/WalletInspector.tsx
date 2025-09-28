import React, { useState } from 'react';
import { Search, Shield, AlertTriangle, CheckCircle, Wallet, Clock, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ProtectedRoute from '@/components/ProtectedRoute';

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

  const validateEthereumAddress = (addr: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  const calculateRiskLevel = (data: any): { level: 'low' | 'medium' | 'high', score: number } => {
    let score = 0;
    
    // Age factor (older wallets are safer)
    const age = data.first_tx_date ? Date.now() - new Date(data.first_tx_date).getTime() : 0;
    const ageInDays = age / (1000 * 60 * 60 * 24);
    
    if (ageInDays > 365) score += 30;
    else if (ageInDays > 90) score += 20;
    else if (ageInDays > 30) score += 10;
    
    // Balance factor
    if (data.total_usd_value > 10000) score += 25;
    else if (data.total_usd_value > 1000) score += 15;
    else if (data.total_usd_value > 100) score += 5;
    
    // Token diversity (more established tokens = safer)
    const tokenCount = data.token_list?.length || 0;
    if (tokenCount > 5 && tokenCount < 20) score += 20;
    else if (tokenCount <= 5) score += 15;
    
    // Chain activity
    if (data.used_chains?.length > 1) score += 15;
    
    // Determine risk level
    if (score >= 70) return { level: 'low', score };
    if (score >= 40) return { level: 'medium', score };
    return { level: 'high', score };
  };

  const inspectWallet = async () => {
    if (!validateEthereumAddress(address)) {
      setError('Please enter a valid Ethereum address');
      return;
    }

    setIsLoading(true);
    setError('');
    setWalletData(null);

    try {
      // Simulate API call to DeBank (replace with actual API when available)
      const mockData = {
        total_usd_value: Math.random() * 50000,
        token_list: [
          {
            id: 'eth',
            symbol: 'ETH',
            name: 'Ethereum',
            amount: Math.random() * 10,
            price: 2000 + Math.random() * 1000,
            logo_url: 'https://static.debank.com/image/coin/logo_url/eth/6460e1f1-e24b-4e5c-a9b9-c9bf3b7d7c3e.png'
          },
          {
            id: 'usdc',
            symbol: 'USDC',
            name: 'USD Coin',
            amount: Math.random() * 5000,
            price: 1,
            logo_url: 'https://static.debank.com/image/coin/logo_url/usdc/e87790bfe0b3f2ea855dc29069b38818.png'
          }
        ],
        nft_list: [],
        first_tx_date: new Date(Date.now() - Math.random() * 3 * 365 * 24 * 60 * 60 * 1000).toISOString(),
        last_tx_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        used_chains: ['eth']
      };

      const risk = calculateRiskLevel(mockData);
      
      const processedData: WalletData = {
        address,
        balance: mockData.token_list.find(t => t.symbol === 'ETH')?.amount || 0,
        balanceUSD: mockData.total_usd_value,
        tokenCount: mockData.token_list.length,
        nftCount: mockData.nft_list.length,
        firstTransaction: mockData.first_tx_date,
        lastTransaction: mockData.last_tx_date,
        riskLevel: risk.level,
        riskScore: risk.score,
        tokens: mockData.token_list.map(token => ({
          symbol: token.symbol,
          name: token.name,
          balance: token.amount,
          price: token.price,
          valueUSD: token.amount * token.price,
          logo: token.logo_url
        }))
      };

      setWalletData(processedData);

      // Save to database if user is logged in
      if (user) {
        try {
          await supabase.from('token_scans').insert([{
            user_id: user.id,
            address: address,
            network: 'ethereum',
            chain: 'ETH',
            risk: risk.level,
            result: processedData as any
          }]);
        } catch (dbError) {
          console.error('Error saving to database:', dbError);
        }
      }

      toast({
        title: 'Wallet Analyzed',
        description: 'Wallet inspection completed successfully',
      });

    } catch (err) {
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
    return new Date(dateString).toLocaleDateString();
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

          {/* Results */}
          {walletData && (
            <div className="space-y-6">
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
                              e.currentTarget.src = `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#374151"/><text x="16" y="20" text-anchor="middle" fill="white" font-size="12">' + token.symbol.charAt(0) + '</text></svg>')}`;
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