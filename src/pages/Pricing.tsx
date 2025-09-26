import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Check,
  X,
  Star,
  Shield,
  MessageCircle,
  Download,
  Zap,
  Crown,
  Sparkles
} from 'lucide-react';

const Pricing = () => {
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        { name: '5 contract audits per month', included: true },
        { name: 'Basic security analysis', included: true },
        { name: '3 token scans per month', included: true },
        { name: 'Basic security tools', included: true },
        { name: 'Community support', included: true },
        { name: 'PDF reports', included: false },
        { name: 'Premium features', included: false },
        { name: 'Priority support', included: false }
      ],
      cta: 'Get Started',
      popular: false,
      icon: Shield
    },
    {
      name: 'Pro',
      price: '$29',
      period: 'month',
      description: 'For serious developers',
      features: [
        { name: '50 contract audits per month', included: true },
        { name: 'Advanced security analysis', included: true },
        { name: '50 token scans per month', included: true },
        { name: 'Advanced security tools', included: true },
        { name: 'PDF report downloads', included: true },
        { name: 'Gas optimization tips', included: true },
        { name: 'Priority support', included: true },
        { name: 'API access', included: false }
      ],
      cta: 'Choose Pro',
      popular: true,
      icon: Star
    },
    {
      name: 'Premium',
      price: '$99',
      period: 'month',
      description: 'For teams and enterprises',
      features: [
        { name: 'Unlimited contract audits', included: true },
        { name: 'Enterprise-grade analysis', included: true },
        { name: 'Unlimited token scans', included: true },
        { name: 'Premium security features', included: true },
        { name: 'Custom PDF reports', included: true },
        { name: 'API access', included: true },
        { name: 'White-label solutions', included: true },
        { name: 'Dedicated support', included: true }
      ],
      cta: 'Choose Premium',
      popular: false,
      icon: Crown
    }
  ];

  const handlePayment = async (planName: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to upgrade your plan.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    setSelectedPlan(planName);
    setIsProcessing(true);

    try {
      // Since the user_subscriptions table doesn't exist yet in the database,
      // we'll use localStorage as a temporary solution
      localStorage.setItem('userPlanType', planName);
      
      // Simulate payment processing
      setTimeout(() => {
        toast({
          title: "Payment Successful!",
          description: `You have successfully subscribed to the ${planName} plan.`,
        });
        setIsProcessing(false);
        setSelectedPlan('');
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error updating subscription:', JSON.stringify(error));
      toast({
        title: "Error",
        description: `Failed to update subscription: ${error.message || JSON.stringify(error)}`,
        variant: "destructive",
      });
      setIsProcessing(false);
      setSelectedPlan('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-space py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Choose Your Plan
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Select the perfect plan for your smart contract security needs
          </p>
          <div className="inline-flex items-center space-x-2 bg-secondary/50 backdrop-blur-sm px-4 py-2 rounded-full">
            <Sparkles className="h-4 w-4 text-purple-primary" />
            <span className="text-sm font-medium">30-day money-back guarantee</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => {
            const isHovered = hoveredPlan === plan.name;
            const isPro = plan.name === 'Pro';
            // Highlight if hovered, or if Pro and nothing else is hovered
            const highlight = isHovered || (isPro && !hoveredPlan);
            return (
              <Card
                key={plan.name}
                className={`relative bg-gradient-card border-border transition-all duration-300 ${
                  highlight ? 'ring-2 ring-purple-primary shadow-glow' : ''
                }`}
                onMouseEnter={() => setHoveredPlan(plan.name)}
                onMouseLeave={() => setHoveredPlan(null)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-primary text-primary-foreground px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-purple-primary/20 rounded-full">
                      <plan.icon className="h-8 w-8 text-purple-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-purple-primary">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        {feature.included ? (
                          <Check className="h-4 w-4 text-neon-green" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span
                          className={`text-sm ${
                            feature.included ? 'text-foreground' : 'text-muted-foreground'
                          }`}
                        >
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <Button
                    onClick={() => {
                      if (plan.name === 'Free') {
                        navigate('/');
                      } else {
                        handlePayment(plan.name);
                      }
                    }}
                    disabled={isProcessing && selectedPlan === plan.name}
                    className={`w-full ${
                      highlight
                        ? 'bg-gradient-primary hover:opacity-90'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                    size="lg"
                  >
                    {isProcessing && selectedPlan === plan.name ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                        Processing...
                      </>
                    ) : (
                      plan.cta
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">What's included in the audit?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our AI-powered audits include security vulnerability detection, gas optimization suggestions, 
                  code quality analysis, and detailed recommendations for improvement.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">How accurate is the pump & dump scanner?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our scanner analyzes multiple on-chain metrics including liquidity locks, holder distribution, 
                  and transaction patterns with 95%+ accuracy in detecting high-risk tokens.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Can I cancel my subscription?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes, you can cancel your subscription at any time. We offer a 30-day money-back guarantee 
                  for all paid plans with no questions asked.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Do you offer team discounts?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! We offer special pricing for teams of 5+ developers. Contact us for enterprise 
                  pricing and custom solutions tailored to your organization.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;