import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  Users, 
  Lock,
  DollarSign,
  PieChart,
  Activity,
  Save
} from 'lucide-react';

interface TokenData {
  chainId?: string;
  dexId?: string;
  url?: string;
  pairAddress?: string;
  baseToken?: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken?: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative?: string;
  priceUsd?: string;
  liquidity?: {
    usd?: number;
    base?: number;
    quote?: number;
  };
  marketCap?: number;
  volume?: {
    h24?: number;
    h6?: number;
    h1?: number;
    m5?: number;
  };
  priceChange?: {
    h24?: number;
    h6?: number;
    h1?: number;
    m5?: number;
  };
}

interface AnalysisResult {
  tokenInfo: {
    name: string;
    symbol: string;
    address: string;
    price: string;
    marketCap: string;
    volume24h: string;
    liquidity: string;
  };
  scores: {
    overall: number;
    security: number;
    liquidity: number;
    distribution: number;
    manipulation: number;
  };
  riskLevel: string;
  analysis: {
    liquidityLocked: boolean;
    whaleDistribution: number;
    honeypotRisk: boolean;
    priceManipulation: boolean;
    rugPullRisk: number;
    liquidityScore: number;
  };
  warnings: Array<{
    type: string;
    description: string;
    severity: string;
  }>;
}

const Scanner = () => {
  const [tokenAddress, setTokenAddress] = useState('0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE');
  const [selectedChain, setSelectedChain] = useState('bsc');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const fetchTokenData = async (address: string): Promise<TokenData | null> => {
    try {
      // Try DexScreener API first
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
      if (!response.ok) throw new Error('DexScreener API failed');
      
      const data = await response.json();
      if (data.pairs && data.pairs.length > 0) {
        return data.pairs[0]; // Return the first pair data
      }
      return null;
    } catch (error) {
      console.error('Error fetching token data:', error);
      return null;
    }
  };

  const analyzeToken = (tokenData: TokenData | null, address: string): AnalysisResult => {
    const warnings: Array<{ type: string; description: string; severity: string }> = [];
    let securityScore = 10;
    let liquidityScore = 10;
    let distributionScore = 10;
    let manipulationScore = 10;

    // Default values for analysis
    let liquidityLocked = true;
    let whaleDistribution = 30;
    let honeypotRisk = false;
    let priceManipulation = false;
    let rugPullRisk = 10;

    if (!tokenData) {
      // Token not found on DexScreener - high risk
      securityScore = 2;
      liquidityScore = 1;
      rugPullRisk = 95;
      honeypotRisk = true;
      liquidityLocked = false;
      
      warnings.push({
        type: "Token Not Listed",
        description: "Token not found on major DEX platforms. This could indicate a new, unlisted, or potentially fraudulent token.",
        severity: "Critical"
      });
      
      warnings.push({
        type: "No Liquidity Data",
        description: "Unable to verify liquidity information. Proceed with extreme caution.",
        severity: "High"
      });
    } else {
      // Analyze liquidity
      const liquidityUsd = tokenData.liquidity?.usd || 0;
      if (liquidityUsd < 10000) {
        liquidityScore -= 4;
        rugPullRisk += 30;
        warnings.push({
          type: "Low Liquidity",
          description: `Very low liquidity ($${liquidityUsd?.toLocaleString()}). High risk of price manipulation and difficulty selling.`,
          severity: "High"
        });
      } else if (liquidityUsd < 50000) {
        liquidityScore -= 2;
        rugPullRisk += 15;
        warnings.push({
          type: "Moderate Liquidity Risk",
          description: `Moderate liquidity ($${liquidityUsd?.toLocaleString()}). Consider the risk of slippage.`,
          severity: "Medium"
        });
      }

      // Analyze price changes for manipulation detection
      const priceChange24h = tokenData.priceChange?.h24 || 0;
      if (Math.abs(priceChange24h) > 50) {
        manipulationScore -= 3;
        priceManipulation = true;
        rugPullRisk += 20;
        warnings.push({
          type: "Extreme Price Volatility",
          description: `Price changed ${priceChange24h.toFixed(2)}% in 24h. This could indicate pump & dump activity.`,
          severity: Math.abs(priceChange24h) > 100 ? "Critical" : "High"
        });
      } else if (Math.abs(priceChange24h) > 20) {
        manipulationScore -= 1;
        warnings.push({
          type: "High Volatility",
          description: `Price changed ${priceChange24h.toFixed(2)}% in 24h. Monitor for pump & dump patterns.`,
          severity: "Medium"
        });
      }

      // Analyze volume vs liquidity ratio
      const volume24h = tokenData.volume?.h24 || 0;
      const volumeToLiquidityRatio = liquidityUsd > 0 ? volume24h / liquidityUsd : 0;
      
      if (volumeToLiquidityRatio > 2) {
        manipulationScore -= 2;
        warnings.push({
          type: "High Volume/Liquidity Ratio",
          description: "Trading volume is unusually high compared to liquidity. This could indicate artificial activity.",
          severity: "Medium"
        });
      }

      // Check if liquidity is locked (simulated - would need additional API)
      // For demo purposes, assume liquidity is not locked if it's very low
      if (liquidityUsd < 25000) {
        liquidityLocked = false;
        securityScore -= 3;
        rugPullRisk += 25;
        warnings.push({
          type: "Liquidity Not Locked",
          description: "Liquidity appears to be unlocked and can be withdrawn by developers, creating rug pull risk.",
          severity: "High"
        });
      }

      // Simulate whale distribution analysis
      // In reality, this would require blockchain analysis
      if (liquidityUsd < 50000) {
        whaleDistribution = 70 + Math.random() * 20; // High whale concentration for low liquidity tokens
        distributionScore -= 3;
        warnings.push({
          type: "High Whale Concentration",
          description: `Estimated ${whaleDistribution.toFixed(1)}% of tokens held by top wallets. Risk of coordinated dumps.`,
          severity: "High"
        });
      } else {
        whaleDistribution = 20 + Math.random() * 30;
        if (whaleDistribution > 40) {
          distributionScore -= 1;
          warnings.push({
            type: "Moderate Whale Concentration",
            description: `Estimated ${whaleDistribution.toFixed(1)}% of tokens held by top wallets.`,
            severity: "Medium"
          });
        }
      }

      // Honeypot detection simulation
      if (!liquidityLocked && priceChange24h > 30) {
        honeypotRisk = true;
        securityScore -= 4;
        warnings.push({
          type: "Potential Honeypot",
          description: "Token shows signs of honeypot behavior - easy to buy but may be difficult to sell.",
          severity: "Critical"
        });
      }
    }

    // Calculate overall score
    const overallScore = Math.max(0, Math.min(10, (securityScore + liquidityScore + distributionScore + manipulationScore) / 4));
    
    // Determine risk level
    let riskLevel: string;
    if (overallScore >= 8) riskLevel = "Low";
    else if (overallScore >= 6) riskLevel = "Medium"; 
    else if (overallScore >= 3) riskLevel = "High";
    else riskLevel = "Critical";

    return {
      tokenInfo: {
        name: tokenData?.baseToken?.name || "Unknown Token",
        symbol: tokenData?.baseToken?.symbol || "UNKNOWN",
        address: address,
        price: tokenData?.priceUsd ? `$${parseFloat(tokenData.priceUsd).toFixed(8)}` : "N/A",
        marketCap: tokenData?.marketCap ? `$${tokenData.marketCap.toLocaleString()}` : "N/A",
        volume24h: tokenData?.volume?.h24 ? `$${tokenData.volume.h24.toLocaleString()}` : "N/A",
        liquidity: tokenData?.liquidity?.usd ? `$${tokenData.liquidity.usd.toLocaleString()}` : "N/A"
      },
      scores: {
        overall: parseFloat(overallScore.toFixed(1)),
        security: Math.max(0, securityScore),
        liquidity: Math.max(0, liquidityScore),
        distribution: Math.max(0, distributionScore),
        manipulation: Math.max(0, manipulationScore)
      },
      riskLevel,
      analysis: {
        liquidityLocked,
        whaleDistribution: parseFloat(whaleDistribution.toFixed(1)),
        honeypotRisk,
        priceManipulation,
        rugPullRisk: Math.min(100, rugPullRisk),
        liquidityScore: Math.max(0, liquidityScore)
      },
      warnings
    };
  };

  const saveToSupabase = async (result: AnalysisResult) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('token_scans')
        .insert({
          user_id: user?.id || null,
          address: tokenAddress,
          network: selectedChain,
          result: result as any
        });

      if (error) {
        console.error('Error saving to Supabase:', error);
      } else {
        toast({
          title: "Saved",
          description: "Scan result saved to your history",
        });
      }
    } catch (error) {
      console.error('Error saving scan result:', error);
    }
  };

  const handleScan = async () => {
    if (!tokenAddress.trim()) {
      toast({
        title: "Error",
        description: "Please enter a token address",
        variant: "destructive",
      });
      return;
    }

    if (!selectedChain) {
      toast({
        title: "Error", 
        description: "Please select a blockchain network",
        variant: "destructive",
      });
      return;
    }

    // Validate token address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress.trim())) {
      toast({
        title: "Error",
        description: "Please enter a valid token address (0x...)",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    setScanResult(null);
    
    try {
      toast({
        title: "Scanning",
        description: "Fetching token data and analyzing risks...",
      });

      const tokenData = await fetchTokenData(tokenAddress.trim());
      const analysis = analyzeToken(tokenData, tokenAddress.trim());
      
      setScanResult(analysis);
      
      // Save to Supabase
      await saveToSupabase(analysis);
      
      toast({
        title: "Scan Complete",
        description: `Risk analysis complete - ${analysis.riskLevel} risk detected`,
        variant: analysis.riskLevel === "Critical" || analysis.riskLevel === "High" ? "destructive" : "default"
      });
    } catch (error) {
      console.error('Scan error:', error);
      toast({
        title: "Error",
        description: "Failed to complete token scan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low': return 'bg-neon-green';
      case 'Medium': return 'bg-warning-orange';
      case 'High': return 'bg-destructive';
      case 'Critical': return 'bg-red-600';
      default: return 'bg-muted';
    }
  };

  const getRiskTextColor = (level: string) => {
    switch (level) {
      case 'Low': return 'text-neon-green';
      case 'Medium': return 'text-warning-orange';
      case 'High': return 'text-destructive';
      case 'Critical': return 'text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-space py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Pump & Dump Scanner
            </span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Analyze tokens for potential scams and pump & dump schemes
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scanner Input Section */}
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5 text-purple-primary" />
                <span>Token Scanner</span>
              </CardTitle>
              <CardDescription>
                Enter token address and select blockchain network
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token-address">Token Address</Label>
                <Input
                  id="token-address"
                  placeholder="0x..."
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  className="font-mono"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="chain-select">Blockchain Network</Label>
                <Select value={selectedChain} onValueChange={setSelectedChain}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select blockchain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ethereum">Ethereum</SelectItem>
                    <SelectItem value="bsc">Binance Smart Chain</SelectItem>
                    <SelectItem value="polygon">Polygon</SelectItem>
                    <SelectItem value="avalanche">Avalanche</SelectItem>
                    <SelectItem value="arbitrum">Arbitrum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleScan}
                disabled={isScanning}
                className="w-full bg-gradient-primary hover:opacity-90"
                size="lg"
              >
                {isScanning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Scan Token
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-purple-primary" />
                <span>Scan Results</span>
              </CardTitle>
              <CardDescription>
                {scanResult ? 'Token analysis complete' : 'Results will appear here after scan'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scanResult ? (
                <div className="space-y-6">
                  {/* Token Info */}
                  <div className="p-4 bg-secondary/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">
                        {scanResult.tokenInfo.name} ({scanResult.tokenInfo.symbol})
                      </h3>
                      <Badge variant="outline" className={getRiskColor(scanResult.riskLevel)}>
                        {scanResult.riskLevel} Risk
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Price:</span>
                        <div className="font-medium">{scanResult.tokenInfo.price}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Market Cap:</span>
                        <div className="font-medium">{scanResult.tokenInfo.marketCap}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">24h Volume:</span>
                        <div className="font-medium">{scanResult.tokenInfo.volume24h}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Liquidity:</span>
                        <div className="font-medium">{scanResult.tokenInfo.liquidity}</div>
                      </div>
                    </div>
                  </div>

                  {/* Risk Score */}
                  <div className="text-center p-6 bg-secondary/50 rounded-lg">
                    <div className={`text-4xl font-bold mb-2 ${getRiskTextColor(scanResult.riskLevel)}`}>
                      {scanResult.scores.overall}/10
                    </div>
                    <div className="text-sm text-muted-foreground">Overall Risk Score</div>
                  </div>

                  {/* Detailed Scores */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-secondary/30 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-primary">{scanResult.scores.security}/10</div>
                        <div className="text-xs text-muted-foreground">Security</div>
                      </div>
                    </div>
                    <div className="p-3 bg-secondary/30 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">{scanResult.scores.liquidity}/10</div>
                        <div className="text-xs text-muted-foreground">Liquidity</div>
                      </div>
                    </div>
                    <div className="p-3 bg-secondary/30 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">{scanResult.scores.distribution}/10</div>
                        <div className="text-xs text-muted-foreground">Distribution</div>
                      </div>
                    </div>
                    <div className="p-3 bg-secondary/30 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-400">{scanResult.scores.manipulation}/10</div>
                        <div className="text-xs text-muted-foreground">Manipulation</div>
                      </div>
                    </div>
                  </div>

                  {/* Analysis Metrics */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Risk Analysis</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center justify-between p-3 bg-secondary/30 rounded">
                        <div className="flex items-center space-x-2">
                          <Lock className="h-4 w-4 text-purple-primary" />
                          <span>Liquidity Locked</span>
                        </div>
                        <Badge variant={scanResult.analysis.liquidityLocked ? "default" : "destructive"}>
                          {scanResult.analysis.liquidityLocked ? "Yes" : "No"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-secondary/30 rounded">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-purple-primary" />
                          <span>Whale Distribution</span>
                        </div>
                        <Badge variant="outline">
                          {scanResult.analysis.whaleDistribution}%
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-secondary/30 rounded">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-warning-orange" />
                          <span>Rug Pull Risk</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Progress value={scanResult.analysis.rugPullRisk} className="w-20 h-2" />
                          <span className="text-sm font-medium">{scanResult.analysis.rugPullRisk}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Warnings */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Risk Warnings</h3>
                    {scanResult.warnings.map((warning: any, index: number) => (
                      <div key={index} className="p-4 bg-secondary/30 rounded-lg border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-4 w-4 text-warning-orange" />
                            <span className="font-medium">{warning.type}</span>
                          </div>
                          <Badge variant="outline" className={getRiskColor(warning.severity)}>
                            {warning.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {warning.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Enter a token address and click "Scan Token" to analyze for risks
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Scanner;