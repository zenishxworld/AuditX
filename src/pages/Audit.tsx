import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  Shield, 
  Zap, 
  TrendingUp, 
  BookOpen, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download
} from 'lucide-react';

const Audit = () => {
  const [code, setCode] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);
  const { toast } = useToast();

  const handleAudit = async () => {
    if (!code.trim()) {
      toast({
        title: "Error",
        description: "Please enter Solidity code to audit",
        variant: "destructive",
      });
      return;
    }

    setIsAuditing(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockResult = {
        overallScore: 7.5,
        scores: {
          security: 8.0,
          gasEfficiency: 7.0,
          performance: 7.5,
          codeQuality: 8.5,
          documentation: 6.0
        },
        vulnerabilities: [
          {
            severity: 'High',
            type: 'Reentrancy',
            description: 'Potential reentrancy attack in withdraw function',
            line: 42,
            suggestion: 'Use the checks-effects-interactions pattern'
          },
          {
            severity: 'Medium',
            type: 'Integer Overflow',
            description: 'Potential integer overflow in calculation',
            line: 28,
            suggestion: 'Use SafeMath library for arithmetic operations'
          },
          {
            severity: 'Low',
            type: 'Gas Optimization',
            description: 'Loop can be optimized for gas efficiency',
            line: 15,
            suggestion: 'Consider using mapping instead of array iteration'
          }
        ]
      };
      
      setAuditResult(mockResult);
      setIsAuditing(false);
      toast({
        title: "Audit Complete",
        description: "Your smart contract has been analyzed successfully",
      });
    }, 3000);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCode(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'bg-destructive';
      case 'Medium': return 'bg-warning-orange';
      case 'Low': return 'bg-yellow-500';
      default: return 'bg-muted';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'High': return <XCircle className="h-4 w-4" />;
      case 'Medium': return <AlertTriangle className="h-4 w-4" />;
      case 'Low': return <CheckCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-space py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Smart Contract Auditor
            </span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Upload or paste your Solidity code for comprehensive security analysis
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Code Input Section */}
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-purple-primary" />
                <span>Solidity Code</span>
              </CardTitle>
              <CardDescription>
                Enter your smart contract code or upload a .sol file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload .sol file
                    </span>
                  </Button>
                </Label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".sol"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              
              <Textarea
                placeholder="// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MyContract {
    // Your Solidity code here...
}"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
              />
              
              <Button 
                onClick={handleAudit}
                disabled={isAuditing}
                className="w-full bg-gradient-primary hover:opacity-90"
                size="lg"
              >
                {isAuditing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Auditing...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Audit Contract
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
                <span>Audit Results</span>
              </CardTitle>
              <CardDescription>
                {auditResult ? 'Security analysis complete' : 'Results will appear here after audit'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditResult ? (
                <div className="space-y-6">
                  {/* Overall Score */}
                  <div className="text-center p-6 bg-secondary/50 rounded-lg">
                    <div className="text-4xl font-bold text-purple-primary mb-2">
                      {auditResult.overallScore}/10
                    </div>
                    <div className="text-sm text-muted-foreground">Overall Security Score</div>
                  </div>

                  {/* Detailed Scores */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Detailed Analysis</h3>
                    {Object.entries(auditResult.scores).map(([key, score]) => (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="font-medium">{score as number}/10</span>
                        </div>
                        <Progress value={(score as number) * 10} className="h-2" />
                      </div>
                    ))}
                  </div>

                  {/* Vulnerabilities */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Vulnerabilities Found</h3>
                    {auditResult.vulnerabilities.map((vuln: any, index: number) => (
                      <div key={index} className="p-4 bg-secondary/30 rounded-lg border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getSeverityIcon(vuln.severity)}
                            <span className="font-medium">{vuln.type}</span>
                          </div>
                          <Badge variant="outline" className={getSeverityColor(vuln.severity)}>
                            {vuln.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {vuln.description}
                        </p>
                        <p className="text-sm font-medium text-purple-primary">
                          Line {vuln.line}: {vuln.suggestion}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Download Report */}
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download Full Report (PDF)
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Upload your contract code and click "Audit Contract" to get started
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

export default Audit;