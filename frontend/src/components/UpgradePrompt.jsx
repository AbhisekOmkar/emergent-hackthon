import { useNavigate } from 'react-router-dom';
import { Crown, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useSubscription } from '../context/SubscriptionContext';

export function UpgradePrompt({ 
  feature = "this feature",
  title,
  description,
  showCard = true,
  className = ""
}) {
  const navigate = useNavigate();
  const { isPremium, isLoading } = useSubscription();

  if (isLoading) {
    return null;
  }

  if (isPremium) {
    return null;
  }

  const content = (
    <div className={`text-center ${className}`}>
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4">
        <Crown className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {title || `Upgrade to Unlock ${feature}`}
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {description || `${feature} is a premium feature. Upgrade to access this and many other powerful features.`}
      </p>
      <Button
        onClick={() => navigate('/upgrade')}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Upgrade to Premium
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );

  if (showCard) {
    return (
      <Card className="bg-white border-gray-200 shadow-lg">
        <CardContent className="p-8">
          {content}
        </CardContent>
      </Card>
    );
  }

  return content;
}

export function PremiumBadge({ className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200 text-amber-700 text-xs font-semibold px-2 py-1 rounded-full ${className}`}>
      <Crown className="w-3 h-3" />
      Premium
    </span>
  );
}

export function FeatureGate({ 
  children, 
  feature,
  fallback,
  showPrompt = true 
}) {
  const { isPremium, isLoading } = useSubscription();

  if (isLoading) {
    return null;
  }

  if (isPremium) {
    return children;
  }

  if (fallback) {
    return fallback;
  }

  if (showPrompt) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-8">
        <UpgradePrompt feature={feature} />
      </div>
    );
  }

  return null;
}

export function LockedFeatureOverlay({ 
  children, 
  feature,
  className = "" 
}) {
  const navigate = useNavigate();
  const { isPremium, isLoading } = useSubscription();

  if (isLoading || isPremium) {
    return children;
  }

  return (
    <div className={`relative ${className}`}>
      <div className="opacity-50 pointer-events-none filter blur-sm">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <div className="text-center p-6">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6 text-gray-500" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Premium Feature</h4>
          <p className="text-sm text-gray-600 mb-4 max-w-xs">
            Upgrade to access {feature}
          </p>
          <Button
            size="sm"
            onClick={() => navigate('/upgrade')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Crown className="w-4 h-4 mr-1" />
            Upgrade
          </Button>
        </div>
      </div>
    </div>
  );
}

export default UpgradePrompt;
