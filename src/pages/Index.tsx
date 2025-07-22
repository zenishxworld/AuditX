import Hero from '@/components/Hero';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  BarChart3, 
  MessageCircle, 
  Zap, 
  Users,
  Award,
  TrendingUp,
  Lock,
  CheckCircle,
  Star
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const features = [
    {
      icon: Shield,
      title: "Advanced Security Analysis",
      description: "AI-powered vulnerability detection for smart contracts with 95%+ accuracy",
      color: "text-purple-primary"
    },
    {
      icon: BarChart3,
      title: "Real-time Risk Assessment",
      description: "Comprehensive pump & dump detection across multiple blockchain networks",
      color: "text-neon-blue"
    },
    {
      icon: MessageCircle,
      title: "Expert AI Assistant",
      description: "24/7 smart contract chatbot with deep blockchain knowledge",
      color: "text-purple-accent"
    },
    {
      icon: Zap,
      title: "Lightning Fast Results",
      description: "Get detailed audit reports and risk assessments in under 30 seconds",
      color: "text-warning-orange"
    }
  ];

  const stats = [
    { number: "10,000+", label: "Contracts Audited", icon: Shield },
    { number: "50,000+", label: "Tokens Scanned", icon: BarChart3 },
    { number: "1M+", label: "Questions Answered", icon: MessageCircle },
    { number: "99.9%", label: "Uptime", icon: CheckCircle }
  ];

  const testimonials = [
    {
      name: "Alex Chen",
      role: "DeFi Developer",
      content: "AuditX helped me identify critical vulnerabilities in my smart contract that could have cost millions. The AI analysis is incredibly detailed and accurate.",
      rating: 5
    },
    {
      name: "Sarah Williams",
      role: "Blockchain Security Researcher",
      content: "The pump & dump scanner saved me from investing in several scam tokens. The risk assessment is spot-on and the interface is intuitive.",
      rating: 5
    },
    {
      name: "Michael Rodriguez",
      role: "Smart Contract Auditor",
      content: "As a professional auditor, I use AuditX as my first line of defense. It catches issues I might miss and significantly speeds up my workflow.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Hero />
      
      {/* Audit Section */}
      <section id="audit-section" className="py-20 bg-gradient-space">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose <span className="bg-gradient-primary bg-clip-text text-transparent">AuditX</span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive blockchain security solutions powered by cutting-edge AI technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {features.map((feature, index) => (
              <Card key={index} className="bg-gradient-card border-border hover:shadow-glow transition-all duration-300 group">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-secondary/50 rounded-full group-hover:bg-secondary/70 transition-colors">
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Testimonials */}
          {/**
          <section className="py-20 bg-space-medium">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Trusted by <span className="bg-gradient-primary bg-clip-text text-transparent">Developers</span>
                </h2>
                <p className="text-xl text-muted-foreground">
                  See what our users are saying about AuditX
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {testimonials.map((testimonial, index) => (
                  <Card key={index} className="bg-gradient-card border-border">
                    <CardHeader>
                      <div className="flex items-center space-x-1 mb-2">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                      <CardDescription>{testimonial.role}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground italic">"{testimonial.content}"</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
          */}

          {/* CTA Section */}
          <section className="py-16 mt-4 mb-4 bg-gradient-hero">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Secure Your Smart Contracts?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join thousands of developers who trust AuditX for their blockchain security needs
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-lg px-8 py-6 shadow-glow"
                  onClick={() => navigate('/audit')}
                >
                  Start Free Audit
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6"
                  onClick={() => navigate('/pricing')}
                >
                  View Pricing
                </Button>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
};

export default Index;
