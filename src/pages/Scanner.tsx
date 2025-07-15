import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  Users, 
  Lock,
  DollarSign,
  PieChart,
  Activity
} from 'lucide-react';

const Scanner = () => {
  const [tokenAddress, setTokenAddress] = useState('');
  const [selectedChain, setSelectedChain] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const { toast } = useToast();

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

    setIsScanning(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockResult = {
        tokenInfo: {
          name: "SafeMoon",
          symbol: "SAFEMOON",
          totalSupply: "1000000000000000",
          decimals: 9,
          price: "$0.0000012",
          marketCap: "$1.2M"
        },
        riskLevel: "High",
        riskScore: 8.5,
        analysis: {
          liquidityLocked: false,
          whaleDistribution: 75,
          honeypotRisk: true,
          priceManipulation: true,
          rugPullRisk: 90
        },
        warnings: [
          {
            type: "Liquidity Risk",
            description: "Liquidity is not locked and can be withdrawn by developers",
            severity: "High"
          },
          {
            type: "Whale Concentration",
            description: "Top 10 holders control 75% of total supply",
            severity: "High"
          },
          {
            type: "Honeypot Detection",
            description: "Token may prevent selling after purchase",
            severity: "Critical"
          },
          {
            type: "Price Manipulation",
            description: "Unusual price movements detected in recent transactions",
            severity: "Medium"
          }
        ],
        holderDistribution: [
          { range: "Top 1%", percentage: 45 },
          { range: "Top 5%", percentage: 65 },
          { range: "Top 10%", percentage: 75 },
          { range: "Others", percentage: 25 }
        ]
      };
      
      setScanResult(mockResult);
      setIsScanning(false);
      toast({
        title: "Scan Complete",
        description: "Token analysis finished successfully",
      });
    }, 3000);
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
                    </div>
                  </div>

                  {/* Risk Score */}
                  <div className="text-center p-6 bg-secondary/50 rounded-lg">
                    <div className={`text-4xl font-bold mb-2 ${getRiskTextColor(scanResult.riskLevel)}`}>
                      {scanResult.riskScore}/10
                    </div>
                    <div className="text-sm text-muted-foreground">Risk Score</div>
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