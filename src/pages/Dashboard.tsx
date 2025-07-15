import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
  Star
} from 'lucide-react';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('audits');

  // Mock data
  const auditHistory = [
    {
      id: 1,
      contractName: 'TokenContract.sol',
      date: '2024-01-15',
      score: 8.5,
      status: 'Completed',
      vulnerabilities: 2
    },
    {
      id: 2,
      contractName: 'DeFiProtocol.sol',
      date: '2024-01-14',
      score: 7.2,
      status: 'Completed',
      vulnerabilities: 5
    },
    {
      id: 3,
      contractName: 'NFTMarketplace.sol',
      date: '2024-01-13',
      score: 9.1,
      status: 'Completed',
      vulnerabilities: 1
    }
  ];

  const scannedTokens = [
    {
      id: 1,
      tokenName: 'SafeMoon',
      address: '0x8076c74c5e3f5852037f31ff0093eeb8c8add8d3',
      riskLevel: 'High',
      date: '2024-01-15',
      chain: 'BSC'
    },
    {
      id: 2,
      tokenName: 'DogeCoin2.0',
      address: '0x1234567890123456789012345678901234567890',
      riskLevel: 'Medium',
      date: '2024-01-14',
      chain: 'Ethereum'
    }
  ];

  const chatHistory = [
    {
      id: 1,
      topic: 'Reentrancy Prevention',
      messages: 12,
      lastMessage: '2024-01-15 10:30 AM',
      status: 'Active'
    },
    {
      id: 2,
      topic: 'Gas Optimization',
      messages: 8,
      lastMessage: '2024-01-14 3:20 PM',
      status: 'Completed'
    }
  ];

  const subscription = {
    plan: 'Pro',
    status: 'Active',
    nextBilling: '2024-02-15',
    usage: {
      audits: { used: 23, limit: 50 },
      scans: { used: 15, limit: 100 },
      chatMessages: { used: 456, limit: 1000 }
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-neon-green';
      case 'Medium': return 'bg-warning-orange';
      case 'High': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-neon-green';
    if (score >= 6) return 'text-warning-orange';
    return 'text-destructive';
  };

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
                  <p className="text-2xl font-bold text-purple-primary">23</p>
                </div>
                <Shield className="h-8 w-8 text-purple-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tokens Scanned</p>
                  <p className="text-2xl font-bold text-purple-primary">15</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Chat Messages</p>
                  <p className="text-2xl font-bold text-purple-primary">456</p>
                </div>
                <MessageCircle className="h-8 w-8 text-purple-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Score</p>
                  <p className="text-2xl font-bold text-neon-green">8.3</p>
                </div>
                <TrendingUp className="h-8 w-8 text-neon-green" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="audits">Audit History</TabsTrigger>
            <TabsTrigger value="scans">Token Scans</TabsTrigger>
            <TabsTrigger value="chats">Chat History</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>
          
          <TabsContent value="audits" className="mt-6">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-purple-primary" />
                  <span>Audit History</span>
                </CardTitle>
                <CardDescription>
                  View and manage your smart contract audits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditHistory.map((audit) => (
                    <div key={audit.id} className="p-4 bg-secondary/30 rounded-lg border border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-purple-primary/20 rounded">
                            <FileText className="h-4 w-4 text-purple-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">{audit.contractName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {audit.date} • {audit.vulnerabilities} vulnerabilities found
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className={`text-lg font-bold ${getScoreColor(audit.score)}`}>
                              {audit.score}/10
                            </div>
                            <Badge variant="outline">{audit.status}</Badge>
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                            <Button size="sm" variant="outline" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="scans" className="mt-6">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-purple-primary" />
                  <span>Token Scans</span>
                </CardTitle>
                <CardDescription>
                  View your pump & dump analysis history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scannedTokens.map((token) => (
                    <div key={token.id} className="p-4 bg-secondary/30 rounded-lg border border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-purple-primary/20 rounded">
                            <BarChart3 className="h-4 w-4 text-purple-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">{token.tokenName}</h3>
                            <p className="text-sm text-muted-foreground font-mono">
                              {token.address.slice(0, 20)}...
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {token.date} • {token.chain}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Badge className={getRiskColor(token.riskLevel)}>
                            {token.riskLevel} Risk
                          </Badge>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <Button size="sm" variant="outline" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="chats" className="mt-6">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5 text-purple-primary" />
                  <span>Chat History</span>
                </CardTitle>
                <CardDescription>
                  Your chatbot conversation history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {chatHistory.map((chat) => (
                    <div key={chat.id} className="p-4 bg-secondary/30 rounded-lg border border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-purple-primary/20 rounded">
                            <MessageCircle className="h-4 w-4 text-purple-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">{chat.topic}</h3>
                            <p className="text-sm text-muted-foreground">
                              {chat.messages} messages • Last: {chat.lastMessage}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Badge variant="outline">{chat.status}</Badge>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <Button size="sm" variant="outline" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="billing" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-purple-primary" />
                    <span>Subscription</span>
                  </CardTitle>
                  <CardDescription>
                    Manage your subscription and billing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Current Plan</span>
                    <Badge className="bg-gradient-primary text-primary-foreground">
                      {subscription.plan}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <Badge variant="outline" className="bg-neon-green/20 text-neon-green">
                      {subscription.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Next Billing</span>
                    <span className="text-sm text-muted-foreground">
                      {subscription.nextBilling}
                    </span>
                  </div>
                  <Button className="w-full" variant="outline">
                    Manage Subscription
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-purple-primary" />
                    <span>Usage</span>
                  </CardTitle>
                  <CardDescription>
                    Track your plan usage
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Contract Audits</span>
                      <span>{subscription.usage.audits.used}/{subscription.usage.audits.limit}</span>
                    </div>
                    <Progress 
                      value={(subscription.usage.audits.used / subscription.usage.audits.limit) * 100} 
                      className="h-2"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Token Scans</span>
                      <span>{subscription.usage.scans.used}/{subscription.usage.scans.limit}</span>
                    </div>
                    <Progress 
                      value={(subscription.usage.scans.used / subscription.usage.scans.limit) * 100} 
                      className="h-2"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Chat Messages</span>
                      <span>{subscription.usage.chatMessages.used}/{subscription.usage.chatMessages.limit}</span>
                    </div>
                    <Progress 
                      value={(subscription.usage.chatMessages.used / subscription.usage.chatMessages.limit) * 100} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;