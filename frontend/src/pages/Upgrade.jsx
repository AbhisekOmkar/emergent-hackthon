import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Crown, Check, Sparkles, Zap, GitBranch, BarChart3, 
  Wrench, Bot, PhoneCall, Database, Shield, RefreshCw,
  ArrowRight, Star
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useSubscription } from '../context/SubscriptionContext';
import { toast } from 'sonner';

export default function Upgrade() {
  const navigate = useNavigate();
  const { isPremium, isLoading, createCheckout } = useSubscription();
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);

  const handleUpgrade = async () => {
    setIsCreatingCheckout(true);
    try {
      const result = await createCheckout(window.location.origin + '/upgrade/success');
      
      if (result.checkout_url) {
        window.location.href = result.checkout_url;
      } else {
        toast.error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout process');
    }
    setIsCreatingCheckout(false);
  };

  const premiumFeatures = [
    {
      icon: GitBranch,
      title: "Conversation Flows",
      description: "Build visual conversation flows with drag-and-drop editor",
      color: "text-indigo-500"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Detailed insights into agent performance and conversations",
      color: "text-emerald-500"
    },
    {
      icon: Wrench,
      title: "Tools & Integrations",
      description: "Connect external APIs and custom tools to your agents",
      color: "text-amber-500"
    },
    {
      icon: PhoneCall,
      title: "Agent Evaluation",
      description: "Test and evaluate your agents with real conversations",
      color: "text-blue-500"
    },
    {
      icon: Database,
      title: "Unlimited Knowledge Bases",
      description: "Upload unlimited documents for agent context",
      color: "text-purple-500"
    },
    {
      icon: Shield,
      title: "Priority Support",
      description: "Get help when you need it with priority support",
      color: "text-red-500"
    }
  ];

  const freeFeatures = [
    "Create Voice Agents",
    "Basic Agent Testing",
    "Limited Knowledge Base",
    "Community Support"
  ];

  if (isPremium) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <Card className="max-w-md bg-white border-gray-200 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-6">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">You're Premium!</h1>
            <p className="text-gray-600 mb-6">
              You have access to all features. Thank you for your support!
            </p>
            <Button
              onClick={() => navigate('/dashboard')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white py-16 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="bg-white/20 text-white border-white/30 mb-4">
            <Sparkles className="w-3 h-3 mr-1" />
            One-time Payment
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Upgrade to Premium
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Unlock the full potential of IntelliAX with advanced features for building powerful voice agents
          </p>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="max-w-6xl mx-auto px-8 -mt-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <Card className="bg-white border-gray-200 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-gray-900">Free Plan</CardTitle>
              <CardDescription>Get started with basic features</CardDescription>
              <div className="pt-4">
                <span className="text-4xl font-bold text-gray-900">$0</span>
                <span className="text-gray-500 ml-2">forever</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-3 mb-6">
                {freeFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-gray-600">
                    <Check className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full" disabled>
                Current Plan
              </Button>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="bg-white border-2 border-indigo-500 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
              BEST VALUE
            </div>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <CardTitle className="text-xl text-gray-900">Premium</CardTitle>
              </div>
              <CardDescription>Everything you need to build amazing agents</CardDescription>
              <div className="pt-4">
                <span className="text-4xl font-bold text-gray-900">$49</span>
                <span className="text-gray-500 ml-2">one-time</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-3 mb-6">
                {premiumFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <feature.icon className={`w-5 h-5 ${feature.color} flex-shrink-0 mt-0.5`} />
                    <div>
                      <span className="font-medium text-gray-900">{feature.title}</span>
                      <p className="text-sm text-gray-500">{feature.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <Button 
                onClick={handleUpgrade}
                disabled={isCreatingCheckout || isLoading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-6 text-lg"
              >
                {isCreatingCheckout ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Creating Checkout...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Upgrade Now
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-gray-500 mt-3">
                Secure payment powered by Dodo Payments
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-8 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          What's Included in Premium
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {premiumFeatures.map((feature, index) => (
            <Card key={index} className="bg-white border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className={`w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto px-8 pb-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          <Card className="bg-white border-gray-200">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Is this a subscription?</h3>
              <p className="text-gray-600 text-sm">
                No, this is a one-time payment. Pay once and get lifetime access to all premium features.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Can I still use free features?</h3>
              <p className="text-gray-600 text-sm">
                Yes! Agent creation and basic testing are always free. Premium unlocks advanced features like flows, analytics, and tools.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">What payment methods are accepted?</h3>
              <p className="text-gray-600 text-sm">
                We accept all major credit cards, debit cards, and various local payment methods through our secure payment processor.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
