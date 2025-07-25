import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import VulnerabilityReport from '@/components/VulnerabilityReport';
import { SolidityAnalyzer, type AuditReport } from '@/lib/solidityAnalyzer';
import { supabase } from '@/integrations/supabase/client';
import { 
  Upload, 
  FileText, 
  Shield, 
  Download
} from 'lucide-react';
import { getUserPlan, getUserUsage, getPlanLimits, isOverLimit, PlanType } from '@/lib/planLimits';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Audit = () => {
  const [code, setCode] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditReport | null>(null);
  const { toast } = useToast();
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [auditCount, setAuditCount] = useState(0);
  const [planType, setPlanType] = useState<PlanType>('Free');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAuditInfo = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Fetch audit count
        const { count } = await supabase
          .from('audit_reports')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id);
        setAuditCount(count || 0);
        // Fetch plan type
        const userPlan = await getUserPlan(session.user.id);
        setPlanType(userPlan);
      }
    };
    fetchAuditInfo();
  }, []);

  const extractContractName = (code: string): string | null => {
    const match = code.match(/contract\s+(\w+)/);
    return match ? match[1] : null;
  };

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
    
    try {
      // Run the Solidity analyzer
      const analyzer = new SolidityAnalyzer(code);
      const auditReport = analyzer.analyze();
      
      // Save to Supabase if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      let fileName = extractContractName(code);
      if (!fileName) fileName = `Audit ${auditCount + 1}`;
      const score = typeof auditReport.overallScore === 'number' ? auditReport.overallScore : null;

      if (session?.user) {
        // Get user's plan type and usage
        const userPlan = await getUserPlan(session.user.id);
        setPlanType(userPlan);
        const usage = await getUserUsage(session.user.id);
        if (isOverLimit(usage, userPlan)) {
          setLimitModalOpen(true);
          setIsAuditing(false);
          return;
        }
        const { error, data } = await supabase
          .from('audit_reports')
          .insert({
            user_id: session.user.id,
            code: code,
            file_name: fileName,
            score: score,
            report: auditReport as any
          });
        // Debug logging and toast
        console.log('Supabase insert result:', { error, data });
        if (error || data) {
          toast({
            title: error ? 'Insert Error' : 'Insert Success',
            description: error ? (typeof error.message === 'string' ? error.message : JSON.stringify(error)) : JSON.stringify(data),
            variant: error ? 'destructive' : 'default',
            duration: 20000
          });
        } else {
          toast({
            title: 'Insert Unknown',
            description: 'No error and no data returned from Supabase insert.',
            variant: 'destructive',
            duration: 20000
          });
        }
        if (error) {
          console.error('Error saving audit report:', error);
        } else {
          setAuditCount((prev) => prev + 1);
          // Do not navigate away, let the dashboard update naturally
        }
      }
      
      setAuditResult(auditReport);
      setIsAuditing(false);
      
      toast({
        title: "Audit Complete",
        description: `Found ${auditReport.vulnerabilities.length} issues. Overall score: ${auditReport.overallScore}/10`,
      });

    } catch (error) {
      console.error('Error during audit:', error);
      setIsAuditing(false);
      toast({
        title: "Audit Failed",
        description: "An error occurred during analysis. Please try again.",
        variant: "destructive",
      });
    }
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

  // Utility: Download Audit Report as Markdown
  function handleDownloadReport(report: import('@/lib/solidityAnalyzer').AuditReport, contractName?: string) {
    if (!report) return;

    // Get contract name (fallback to 'SmartContract')
    const name = contractName || 'SmartContract';

    // Calculate average score
    const metrics = report.scores;
    const metricKeys = Object.keys(metrics) as (keyof typeof metrics)[];
    const metricSum = metricKeys.reduce((sum, key) => sum + (metrics[key] || 0), 0);
    const avgScore = metricSum / metricKeys.length;

    // Markdown formatting
    let md = `# Audit Report: ${name}\n\n`;
    md += `**Overall Score:** ${report.overallScore.toFixed(1)}/10\n\n`;

    // Summary (generate a simple summary)
    md += `## Summary\n`;
    md += `This report analyzes the smart contract \`${name}\` for security, performance, gas efficiency, code quality, and documentation.\n\n`;

    // Metrics
    md += `## Metrics\n`;
    metricKeys.forEach(key => {
      md += `- **${key.charAt(0).toUpperCase() + key.slice(1)}:** ${metrics[key]}/10\n`;
    });
    md += `- **Average Score:** ${avgScore.toFixed(1)}/10\n\n`;

    // Findings
    md += `## Findings\n`;
    if (report.vulnerabilities.length === 0) {
      md += `No vulnerabilities found.\n\n`;
    } else {
      report.vulnerabilities.forEach((vuln, idx) => {
        md += `### ${idx + 1}. [${vuln.severity}] ${vuln.title} (ID: ${vuln.id})\n`;
        md += `- **Line:** ${vuln.line}\n`;
        md += `- **Description:** ${vuln.description}\n`;
        if (vuln.code) {
          md += `- **Code:**\n\n\t\`${vuln.code}\`\n`;
        }
        if (vuln.suggestions && vuln.suggestions.length > 0) {
          md += `- **Suggestions:**\n`;
          vuln.suggestions.forEach(s => {
            md += `  - ${s}\n`;
          });
        }
        md += `\n`;
      });
    }

    // Suggestions
    if (report.suggestions && report.suggestions.length > 0) {
      md += `## Suggestions for Improvement\n`;
      report.suggestions.forEach((s, i) => {
        md += `- ${s}\n`;
      });
      md += `\n`;
    }

    // Footer
    md += `---\n`;
    md += `\n*Generated by AuditX – ${new Date().toLocaleDateString()}*\n`;

    // Download as Blob
    const blob = new Blob([md], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}_audit_report.md`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  }

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
                  <VulnerabilityReport vulnerabilities={auditResult.vulnerabilities} />

                  {/* Download Report */}
                  <Button variant="outline" className="w-full" onClick={() => handleDownloadReport(auditResult, extractContractName(code) || undefined)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Audit Report (Markdown)
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
      <Dialog open={limitModalOpen} onOpenChange={setLimitModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>⚠️ You’ve reached the Free Plan limit</DialogTitle>
            <DialogDescription>
              Upgrade your plan to continue using this feature.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => navigate('/pricing')}>Upgrade Now</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Audit;