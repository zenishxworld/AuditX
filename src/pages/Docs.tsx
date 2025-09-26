import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  BookOpen, 
  Shield, 
  BarChart3, 
  MessageCircle, 
  AlertTriangle,
  CheckCircle,
  Code,
  Search,
  Mail,
  ExternalLink,
  FileText
} from 'lucide-react';

const Docs = () => {
  const sections = [
    {
      id: 'audit-guide',
      title: 'Smart Contract Auditor Guide',
      icon: Shield,
      content: [
        {
          subtitle: 'Getting Started',
          text: 'Learn how to use our AI-powered smart contract auditor to identify vulnerabilities and improve code quality.'
        },
        {
          subtitle: 'Supported Features',
          text: 'Our auditor analyzes Solidity contracts for security issues, gas optimization, code quality, and documentation.'
        },
        {
          subtitle: 'Understanding Reports',
          text: 'Audit reports include overall scores, detailed analysis, vulnerability classifications, and actionable recommendations.'
        }
      ]
    },
    {
      id: 'scanner-guide',
      title: 'Pump & Dump Scanner',
      icon: BarChart3,
      content: [
        {
          subtitle: 'What is Pump & Dump?',
          text: 'Pump and dump schemes involve artificially inflating token prices through coordinated buying, then selling at peak prices to unsuspecting investors.'
        },
        {
          subtitle: 'Risk Indicators',
          text: 'Our scanner analyzes liquidity locks, whale concentration, honeypot behavior, and price manipulation patterns.'
        },
        {
          subtitle: 'Risk Levels',
          text: 'Tokens are classified as Low, Medium, or High risk based on multiple on-chain metrics and behavioral analysis.'
        }
      ]
    },
    {
      
      icon: MessageCircle,
      content: [
        {
          subtitle: 'How to Use',
          text: 'Ask questions about smart contract development, security best practices, Solidity syntax, and blockchain concepts.'
        },
        {
          subtitle: 'Example Questions',
          text: 'Try asking about reentrancy attacks, gas optimization, ERC standards, DeFi protocols, or testing strategies.'
        },
        {
          subtitle: 'Best Practices',
          text: 'Be specific with your questions and provide context when asking about code-related issues for better responses.'
        }
      ]
    },
    {
      id: 'payment-policy',
      title: 'Payment & Refund Policy',
      icon: CheckCircle,
      content: [
        {
          subtitle: 'Subscription Plans',
          text: 'We offer Free, Pro, and Premium plans with different feature limits and capabilities.'
        },
        {
          subtitle: 'Payment Methods',
          text: 'We accept major credit cards and support secure payment processing through Stripe.'
        },
        {
          subtitle: 'Refund Policy',
          text: 'All paid subscriptions come with a 30-day money-back guarantee. Contact support for refund requests.'
        }
      ]
    }
  ];

  const faqs = [
    {
      question: "How accurate are the audit results?",
      answer: "Our AI-powered auditor achieves 95%+ accuracy in detecting common vulnerabilities. However, we recommend manual review for critical applications."
    },
    {
      question: "Which blockchain networks are supported?",
      answer: "We support Ethereum, Binance Smart Chain, Polygon, Avalanche, and Arbitrum for token scanning. Smart contract auditing works with any Solidity code."
    },
    {
      question: "Can I integrate AuditX with my development workflow?",
      answer: "Yes! Premium subscribers get API access to integrate our auditing capabilities directly into their CI/CD pipelines."
    },
    {
      question: "What file formats are supported for audits?",
      answer: "You can upload .sol files or paste Solidity code directly into our editor. We support contracts of any size and complexity."
    },
    {
      question: "How does the pump & dump detection work?",
      answer: "Our scanner analyzes on-chain data including holder distribution, liquidity locks, transaction patterns, and price movements to identify risky tokens."
    },
    {
      question: "Is my code kept private?",
      answer: "Yes, we take privacy seriously. Your code is analyzed securely and never stored or shared with third parties."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-space py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Documentation & Help
            </span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Learn how to use AuditX effectively and get answers to common questions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {sections.map((section) => (
              <Card key={section.id} className="bg-gradient-card border-border" id={section.id}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <section.icon className="h-5 w-5 text-purple-primary" />
                    <span>{section.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {section.content.map((item, index) => (
                    <div key={index}>
                      <h3 className="font-semibold text-lg mb-2">{item.subtitle}</h3>
                      <p className="text-muted-foreground leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}

            {/* FAQ Section */}
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-purple-primary" />
                  <span>Frequently Asked Questions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {faqs.map((faq, index) => (
                  <div key={index} className="border-l-4 border-purple-primary/50 pl-4">
                    <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Navigation */}
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-purple-primary" />
                  <span>Quick Navigation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {sections.map((section) => (
                  <Button
                    key={section.id}
                    variant="ghost"
                    className="w-full justify-start text-left"
                    onClick={() => document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    <section.icon className="h-4 w-4 mr-2" />
                    {section.title}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Search 
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="h-5 w-5 text-purple-primary" />
                  <span>Search Docs</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input placeholder="Search documentation..." className="w-full" />
              </CardContent>
            </Card>*/}

            {/* Quick Links */}
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ExternalLink className="h-5 w-5 text-purple-primary" />
                  <span>Quick Links</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Code className="h-4 w-4 mr-2" />
                  API Documentation
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Sample Contracts
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Security Guidelines
                </Button>
              </CardContent>
            </Card>

            {/* Contact Support */}
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-purple-primary" />
                  <span>Contact Support</span>
                </CardTitle>
                <CardDescription>
                  Can't find what you're looking for? Get in touch!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="support-email">Email</Label>
                  <Input 
                    id="support-email"
                    type="email" 
                    placeholder="your.email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-message">Message</Label>
                  <Textarea 
                    id="support-message"
                    placeholder="Describe your issue or question..."
                    rows={4}
                  />
                </div>
                <Button className="w-full bg-gradient-primary hover:opacity-90">
                  Send Message
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Docs;