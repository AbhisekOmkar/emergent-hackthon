import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, RefreshCw, Crown, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useSubscription } from '../context/SubscriptionContext';
import { toast } from 'sonner';

export default function UpgradeSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkSubscription, verifyPayment, isPremium } = useSubscription();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');

  useEffect(() => {
    const verify = async () => {
      setIsVerifying(true);
      
      // First check if already premium
      await checkSubscription();
      
      // If payment_id is provided, verify it
      if (paymentId && status === 'succeeded') {
        try {
          const result = await verifyPayment(paymentId);
          if (result.is_premium) {
            setVerified(true);
            toast.success('Payment verified! Welcome to Premium!');
          }
        } catch (error) {
          console.error('Verification error:', error);
        }
      }
      
      setIsVerifying(false);
    };

    verify();
  }, [paymentId, status, checkSubscription, verifyPayment]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md bg-white border-gray-200 shadow-lg">
          <CardContent className="p-8 text-center">
            <RefreshCw className="w-12 h-12 text-indigo-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Verifying Payment...
            </h2>
            <p className="text-gray-600">
              Please wait while we confirm your payment.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isPremium || verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-8">
        <Card className="max-w-lg bg-white border-gray-200 shadow-xl">
          <CardContent className="p-10 text-center">
            {/* Animated success icon */}
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to Premium! 🎉
            </h1>
            <p className="text-gray-600 mb-8">
              Your payment was successful. You now have access to all premium features.
            </p>

            {/* Premium badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200 rounded-full px-4 py-2 mb-8">
              <Crown className="w-5 h-5 text-amber-600" />
              <span className="font-semibold text-amber-700">Premium Member</span>
            </div>

            {/* What's unlocked */}
            <div className="text-left bg-gray-50 rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-3">You now have access to:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Conversation Flows Builder
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Advanced Analytics Dashboard
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Tools & Integrations
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Agent Evaluation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Unlimited Knowledge Bases
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Priority Support
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => navigate('/flows')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Try Conversation Flows
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="border-gray-200"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Payment not verified
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <Card className="max-w-md bg-white border-gray-200 shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Payment Processing
          </h2>
          <p className="text-gray-600 mb-6">
            Your payment is being processed. This may take a few moments.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => window.location.reload()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Check Again
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="border-gray-200"
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
