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
  MessageCircle, 
  Download,
  Trash2,
  Eye,
  Calendar,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Star,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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

interface Chat {
  id: string;
  topic: string;
  message_count: number;
  status: string;
  created_at: string;
}

interface DashboardStats {
  totalAudits: number;
  tokensScanned: number;
  chatMessages: number;
  avgScore: number;
}

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('audits');
  const [audits, setAudits] = useState<AuditReport[]>([]);
  const [tokens, setTokens] = useState<TokenScan[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalAudits: 0,
    tokensScanned: 0,
    chatMessages: 0,
    avgScore: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch audits
      const { data: auditsData, error: auditsError } = await supabase
        .from('audit_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (auditsError) throw auditsError;

      // Fetch token scans
      const { data: tokensData, error: tokensError } = await supabase
        .from('token_scans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (tokensError) throw tokensError;

      // Fetch chats
      const { data: chatsData, error: chatsError } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (chatsError) throw chatsError;

      setAudits(auditsData || []);
      setTokens(tokensData || []);
      setChats(chatsData || []);

      // Calculate stats
      const totalChatMessages = (chatsData || []).reduce((sum, chat) => sum + chat.message_count, 0);
      const avgScore = auditsData?.length 
        ? auditsData.reduce((sum, audit) => sum + (audit.score || 0), 0) / auditsData.length 
        : 0;

      setStats({
        totalAudits: auditsData?.length || 0,
        tokensScanned: tokensData?.length || 0,
        chatMessages: totalChatMessages,
        avgScore: Math.round(avgScore * 10) / 10
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type: 'audit' | 'token' | 'chat', id: string) => {
    if (!user) return;

    try {
      let error;
      
      if (type === 'audit') {
        ({ error } = await supabase
          .from('audit_reports')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id));
      } else if (type === 'token') {
        ({ error } = await supabase
          .from('token_scans')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id));
      } else if (type === 'chat') {
        ({ error } = await supabase
          .from('chats')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id));
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: "Item deleted successfully.",
      });

      // Refresh data
      fetchDashboardData();
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
                  <p className="text-sm text-muted-foreground">Chat Messages</p>
                  <p className="text-2xl font-bold text-primary">{stats.chatMessages}</p>
                </div>
                <MessageCircle className="h-8 w-8 text-primary" />
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="audits">Audit History</TabsTrigger>
            <TabsTrigger value="scans">Token Scans</TabsTrigger>
            <TabsTrigger value="chats">Chat History</TabsTrigger>
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
                    audits.map((audit) => (
                      <div key={audit.id} className="p-4 bg-secondary/30 rounded-lg border border-border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-2 bg-primary/20 rounded">
                              <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-medium">{audit.file_name || 'Unknown Contract'}</h3>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(audit.created_at)} • {audit.vulnerabilities ? Object.keys(audit.vulnerabilities).length : 0} vulnerabilities found
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className={`text-lg font-bold ${getScoreColor(audit.score || 0)}`}>
                                {audit.score ? `${audit.score}/10` : '—'}
                              </div>
                              <Badge variant="outline">Completed</Badge>
                            </div>
                            <div className="flex space-x-2">
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
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDelete('audit', audit.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
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
                      <div key={token.id} className="p-4 bg-secondary/30 rounded-lg border border-border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-2 bg-primary/20 rounded">
                              <BarChart3 className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-medium">{token.token_name || 'Unknown Token'}</h3>
                              <p className="text-sm text-muted-foreground font-mono">
                                {truncateAddress(token.address)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(token.created_at)} • {token.chain || 'Unknown Chain'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <Badge className={getRiskColor(token.risk || 'unknown')}>
                              {token.risk || 'Unknown'} Risk
                            </Badge>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline" onClick={() => handleView(token, 'token')}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDelete('token', token.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="chats" className="mt-6">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <span>Chat History</span>
                </CardTitle>
                <CardDescription>
                  Your chatbot conversation history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {chats.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No chat history found. Start a conversation with our AI chatbot!
                    </div>
                  ) : (
                    chats.map((chat) => (
                      <div key={chat.id} className="p-4 bg-secondary/30 rounded-lg border border-border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-2 bg-primary/20 rounded">
                              <MessageCircle className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-medium">{chat.topic}</h3>
                              <p className="text-sm text-muted-foreground">
                                {chat.message_count} messages • {formatDate(chat.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <Badge variant="outline">{chat.status}</Badge>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline" onClick={() => handleView(chat, 'chat')}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDelete('chat', chat.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
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
                {selectedItem?.type === 'chat' && 'Chat Details'}
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
                  
                  {selectedItem.type === 'chat' && (
                    <div className="space-y-3">
                      <div>
                        <strong>Topic:</strong> {selectedItem.topic}
                      </div>
                      <div>
                        <strong>Message Count:</strong> {selectedItem.message_count}
                      </div>
                      <div>
                        <strong>Status:</strong>
                        <Badge className="ml-2" variant="outline">
                          {selectedItem.status}
                        </Badge>
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