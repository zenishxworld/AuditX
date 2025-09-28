import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
  import { 
    FileText, 
    Shield, 
    BarChart3, 
    Wallet,
    Download,
    Trash2,
    Eye,
    Calendar,
    CreditCard,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Star,
    Loader2,
    Crown,
    Infinity
  } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { FREE_LIMITS, PRO_LIMITS, PREMIUM_LIMITS, getUserPlan, getUserUsage, PlanType, getPlanLimits } from '@/lib/planLimits';

interface AuditReport {
  id: string;
  file_name: string | null;
  score: number | null;
  vulnerabilities: any;
  report_url: string | null;
  created_at: string;
}

interface TokenScan {
  id: string;
  token_name: string | null;
  address: string;
  risk: string | null;
  chain: string | null;
  created_at: string;
}

// Chat feature removed

interface DashboardStats {
  totalAudits: number;
  tokensScanned: number;
  avgScore: number;
  walletInspector: number;
  planType: PlanType;
}

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('audits');
  const [audits, setAudits] = useState<AuditReport[]>([]);
  const [tokens, setTokens] = useState<TokenScan[]>([]);
  
  const [stats, setStats] = useState<DashboardStats>({
    totalAudits: 0,
    tokensScanned: 0,
    avgScore: 0,
    walletInspector: 0,
    planType: 'Free'
  });
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (user) {
        await fetchDashboardData();
      }
    };
    run();
    return () => { mounted = false; };
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [auditsRes, tokensRes, planType] = await Promise.all([
        supabase
          .from('audit_reports')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('token_scans')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        getUserPlan(user.id),
      ]);

      if (auditsRes.error) throw auditsRes.error;
      if (tokensRes.error) throw tokensRes.error;

      const auditsData = auditsRes.data || [];
      const tokensData = tokensRes.data || [];
      // Attempt to fetch wallet inspector history if table exists
      let walletInspectionsCount = 0;
      try {
        const walletRes = await supabase
          .from('wallet_inspections' as any)
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (!walletRes.error) {
          walletInspectionsCount = (walletRes.data || []).length;
        }
      } catch (_) {
        // Fallback silently if table is not available
      }
      const avgScore = auditsData.length
        ? auditsData.reduce((sum, audit) => sum + (audit.score || 0), 0) / auditsData.length
        : 0;

      setAudits(auditsData);
      setTokens(tokensData);
      setStats({
        totalAudits: auditsData.length,
        tokensScanned: tokensData.length,
        avgScore: Math.round(avgScore * 10) / 10,
        walletInspector: walletInspectionsCount,
        planType,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type: 'audit' | 'token', id: string) => {
    if (!user) return;

    try {
      let error;
      let deleted = false;
      if (type === 'audit') {
        const { error: delError, count } = await supabase
          .from('audit_reports')
          .delete({ count: 'exact' })
          .eq('id', id)
          .eq('user_id', user.id);
        error = delError;
        deleted = !error && count && count > 0;
        if (deleted) setAudits((prev) => prev.filter((a) => a.id !== id));
      } else if (type === 'token') {
        const { error: delError, count } = await supabase
          .from('token_scans')
          .delete({ count: 'exact' })
          .eq('id', id)
          .eq('user_id', user.id);
        error = delError;
        deleted = !error && count && count > 0;
        if (deleted) setTokens((prev) => prev.filter((t) => t.id !== id));
      }

      if (error) throw error;
      if (deleted) {
        toast({
          title: "Success",
          description: "Item deleted successfully.",
        });
        await fetchDashboardData();
      } else {
        toast({
          title: "Error",
          description: "Item could not be deleted. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = (reportUrl: string) => {
    if (reportUrl) {
      window.open(reportUrl, '_blank');
    } else {
      toast({
        title: "Error",
        description: "Report URL not available.",
        variant: "destructive",
      });
    }
  };

  const handleView = (item: any, type: string) => {
    setSelectedItem({ ...item, type });
    setIsModalOpen(true);
  };

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'bg-green-500/20 text-green-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'high': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

  const getAuditRiskLevel = (score: number | null) => {
    if (score === null || score === undefined) return { label: 'Unknown', color: 'bg-gray-500/20 text-gray-400' };
    if (score < 50) return { label: 'High Risk', color: 'bg-red-500/20 text-red-400' };
    if (score < 80) return { label: 'Medium Risk', color: 'bg-yellow-500/20 text-yellow-400' };
    return { label: 'Low Risk', color: 'bg-green-500/20 text-green-400' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-space py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-space py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Dashboard
            </span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Track your audits, scans, and subscription usage
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Audits</p>
                  <p className="text-2xl font-bold text-primary">{stats.totalAudits}</p>
                </div>
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tokens Scanned</p>
                  <p className="text-2xl font-bold text-primary">{stats.tokensScanned}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Inspected Wallet</p>
                  <p className="text-2xl font-bold text-primary">{stats.walletInspector}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          
          
          <Card className="bg-gradient-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Score</p>
                  <p className={`text-2xl font-bold ${getScoreColor(stats.avgScore)}`}>
                    {stats.avgScore || '—'}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="audits">Audit History</TabsTrigger>
            <TabsTrigger value="scans">Token Scans</TabsTrigger>
            <TabsTrigger value="wallet">Wallet Inspector</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>
          
          <TabsContent value="audits" className="mt-6">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span>Audit History</span>
                </CardTitle>
                <CardDescription>
                  View and manage your smart contract audits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {audits.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No audits found. Start by auditing your first smart contract!
                    </div>
                  ) : (
                    audits.map((audit) => {
                      const risk = getAuditRiskLevel(audit.score);
                      return (
                        <div key={audit.id} className="p-4 bg-secondary/30 rounded-lg border border-border flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex items-center space-x-4">
                            <div className="p-2 bg-primary/20 rounded">
                              <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-medium text-lg">{audit.file_name || 'Unknown Contract'}</h3>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="text-sm text-muted-foreground">{formatDate(audit.created_at)}</span>
                                <span className="text-sm text-muted-foreground">Score: {audit.score !== null ? audit.score : '—'}</span>
                                <Badge className={risk.color}>{risk.label}</Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 mt-2 md:mt-0">
                            <Button size="sm" variant="outline" onClick={() => handleView(audit, 'audit')}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            {audit.report_url && (
                              <Button size="sm" variant="outline" onClick={() => handleDownload(audit.report_url!)}>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="scans" className="mt-6">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span>Token Scans</span>
                </CardTitle>
                <CardDescription>
                  View your token scan analysis history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tokens.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No token scans found. Start by scanning your first token!
                    </div>
                  ) : (
                    tokens.map((token) => (
                      <div key={token.id} className="p-4 bg-secondary/30 rounded-lg border border-border flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-primary/20 rounded">
                            <BarChart3 className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium text-lg">{token.token_name || 'Unknown Token'}</h3>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-sm text-muted-foreground font-mono">{truncateAddress(token.address)}</span>
                              <Badge className={getRiskColor(token.risk || 'unknown')}>{token.risk || 'Unknown'} Risk</Badge>
                              <span className="text-xs text-muted-foreground">{token.chain || 'Unknown Chain'}</span>
                              <span className="text-xs text-muted-foreground">{formatDate(token.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-2 md:mt-0">
                          <Button size="sm" variant="outline" onClick={() => handleView(token, 'token')}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="wallet" className="mt-6">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  <span>Wallet Inspector</span>
                </CardTitle>
                <CardDescription>
                  Inspect any Ethereum wallet’s risk, holdings, and activity.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Launch the full Wallet Inspector tool to analyze addresses in depth.
                  </p>
                  <Button className="w-fit" variant="outline" onClick={() => window.location.assign('/wallet-inspector')}>
                    <Eye className="h-4 w-4 mr-2" />
                    Open Wallet Inspector
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="mt-6">
            <Card className="bg-gradient-card border-border max-w-lg mx-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {stats.planType === 'Free' && 'Free Plan'}
                      {stats.planType === 'Pro' && 'Pro Plan'}
                      {stats.planType === 'Premium' && 'Premium Plan'}
                    </CardTitle>
                    <CardDescription>Your current subscription and usage</CardDescription>
                  </div>
                  <div className="p-3 bg-primary/20 rounded-full">
                    {stats.planType === 'Free' && <Shield className="h-6 w-6 text-primary" />}
                    {stats.planType === 'Pro' && <Star className="h-6 w-6 text-primary" />}
                    {stats.planType === 'Premium' && <Crown className="h-6 w-6 text-primary" />}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Plan Features */}
                <div className="bg-secondary/30 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Your Plan Features</h3>
                  <div className="space-y-2">
                    {stats.planType === 'Free' && (
                      <>
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                          <span>5 contract audits per month</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                          <span>3 token scans per month</span>
                        </div>
                        
                      </>
                    )}
                    {stats.planType === 'Pro' && (
                      <>
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                          <span>50 contract audits per month</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                          <span>50 token scans per month</span>
                        </div>
                        
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                          <span>Priority support</span>
                        </div>
                      </>
                    )}
                    {stats.planType === 'Premium' && (
                      <>
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                          <span>Unlimited contract audits</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                          <span>Unlimited token scans</span>
                        </div>
                        
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                          <span>Dedicated support</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Usage Stats */}
                <div>
                  <h3 className="font-medium mb-3">Current Usage</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Contract Audits</span>
                        {stats.planType === 'Premium' ? (
                          <span>{stats.totalAudits} / <Infinity className="h-4 w-4 inline" /></span>
                        ) : (
                          <span>
                            {stats.totalAudits} / {stats.planType === 'Pro' ? PRO_LIMITS.audits : FREE_LIMITS.audits}
                          </span>
                        )}
                      </div>
                      {stats.planType !== 'Premium' && (
                        <Progress 
                          value={stats.planType === 'Pro' 
                            ? (stats.totalAudits / PRO_LIMITS.audits) * 100 
                            : (stats.totalAudits / FREE_LIMITS.audits) * 100
                          } 
                          className="h-2" 
                        />
                      )}
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Token Scans</span>
                        {stats.planType === 'Premium' ? (
                          <span>{stats.tokensScanned} / <Infinity className="h-4 w-4 inline" /></span>
                        ) : (
                          <span>
                            {stats.tokensScanned} / {stats.planType === 'Pro' ? PRO_LIMITS.tokens : FREE_LIMITS.tokens}
                          </span>
                        )}
                      </div>
                      {stats.planType !== 'Premium' && (
                        <Progress 
                          value={stats.planType === 'Pro' 
                            ? (stats.tokensScanned / PRO_LIMITS.tokens) * 100 
                            : (stats.tokensScanned / FREE_LIMITS.tokens) * 100
                          } 
                          className="h-2" 
                        />
                      )}
                    </div>
                    
                  </div>
                </div>

                {stats.planType !== 'Premium' && (
                  <Button
                    className="w-full mt-4"
                    onClick={() => window.location.assign('/pricing')}
                  >
                    {stats.planType === 'Free' ? 'Upgrade Plan' : 'Upgrade to Premium'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* View Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedItem?.type === 'audit' && 'Audit Details'}
                {selectedItem?.type === 'token' && 'Token Scan Details'}
                
              </DialogTitle>
              <DialogDescription>
                View detailed information about this item
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedItem && (
                <>
                  {selectedItem.type === 'audit' && (
                    <div className="space-y-3">
                      <div>
                        <strong>File Name:</strong> {selectedItem.file_name || 'Unknown'}
                      </div>
                      <div>
                        <strong>Score:</strong> 
                        <span className={getScoreColor(selectedItem.score || 0)}>
                          {selectedItem.score ? ` ${selectedItem.score}/10` : ' —'}
                        </span>
                      </div>
                      <div>
                        <strong>Date:</strong> {formatDate(selectedItem.created_at)}
                      </div>
                      {selectedItem.vulnerabilities && (
                        <div>
                          <strong>Vulnerabilities:</strong>
                          <pre className="mt-2 p-3 bg-secondary rounded text-sm overflow-auto max-h-40">
                            {JSON.stringify(selectedItem.vulnerabilities, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {selectedItem.type === 'token' && (
                    <div className="space-y-3">
                      <div>
                        <strong>Token Name:</strong> {selectedItem.token_name || 'Unknown'}
                      </div>
                      <div>
                        <strong>Address:</strong> 
                        <code className="ml-2 p-1 bg-secondary rounded text-sm">
                          {selectedItem.address}
                        </code>
                      </div>
                      <div>
                        <strong>Risk Level:</strong>
                        <Badge className={`ml-2 ${getRiskColor(selectedItem.risk || 'unknown')}`}>
                          {selectedItem.risk || 'Unknown'}
                        </Badge>
                      </div>
                      <div>
                        <strong>Chain:</strong> {selectedItem.chain || 'Unknown'}
                      </div>
                      <div>
                        <strong>Date:</strong> {formatDate(selectedItem.created_at)}
                      </div>
                    </div>
                  )}
                  
                  
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Dashboard;