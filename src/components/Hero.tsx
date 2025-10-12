import { Button } from '@/components/ui/button';
import { Shield, Zap, MessageCircle, BarChart3, ArrowRight, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Hero = () => {
  const navigate = useNavigate();
  const features = [
    {
      icon: Shield,
      title: "Smart Contract Audit",
      description: "AI-powered security analysis for your Solidity contracts"
    },
    {
      icon: BarChart3,
      title: "Pump & Dump Scanner",
      description: "Detect risky tokens and potential scams before investing"
    },
    {
      icon: MessageCircle,
      title: "Public Wallet Inspection",
      description: (
        <>
          <div>Get instant about wallets, contracts and on-chain risk.</div>
          <ul className="mt-2 text-left list-disc ml-4">
          </ul>
        </>
      )
    },
    {
      icon: Zap,
      title: "Security Insights",
      description: "Detailed vulnerability reports with actionable recommendations"
    }
  ];

  const scrollToAudit = () => {
    const auditSection = document.getElementById('audit-section');
    if (auditSection) {
      auditSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const { user, openAuthModal } = useAuth();

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-space">
        <div className="absolute inset-0 bg-gradient-hero opacity-30" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-purple-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          {/* <div className="inline-flex items-center space-x-2 bg-secondary/50 backdrop-blur-sm px-4 py-2 rounded-full mb-8 border border-border">
            <Star className="h-4 w-4 text-purple-primary" />
            <span className="text-sm font-medium">Trusted by 10,000+ developers</span>
          </div> */}

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              AuditX
            </span>
            <br />
            <span className="text-foreground">
              A Web3 Security Toolkit
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            The all-in-one platform to audit code, assess token risk, and inspect wallet exposure. Protect your investments and code quality with unified, intelligent security checks.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="bg-gradient-primary hover:opacity-90 text-lg px-8 py-6 shadow-glow animate-pulse-glow"
              onClick={() => {
                if (!user) {
                  openAuthModal();
                } else {
                  navigate('/audit');
                }
              }}
            >
              Audit Your Contract
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 border-purple-primary/50 hover:bg-purple-primary/10"
              onClick={() => navigate('/docs')}
            >
              Learn More
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-6 bg-gradient-card rounded-lg border border-border hover:border-purple-primary/50 transition-all duration-300 hover:shadow-glow"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-3 bg-purple-primary/20 rounded-full group-hover:bg-purple-primary/30 transition-colors">
                    <feature.icon className="h-6 w-6 text-purple-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <div className="text-sm text-muted-foreground">{feature.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;