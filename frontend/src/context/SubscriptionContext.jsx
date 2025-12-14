import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const { user, isLoaded } = useUser();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState(null);

  const checkSubscription = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API}/payments/status/${user.id}`);
      setIsPremium(response.data.is_premium || false);
      setSubscriptionData(response.data);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setIsPremium(false);
    }
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (isLoaded) {
      checkSubscription();
    }
  }, [isLoaded, checkSubscription]);

  const createCheckout = async (returnUrl) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const response = await axios.post(`${API}/payments/create-checkout`, {
      user_id: user.id,
      user_email: user.primaryEmailAddress?.emailAddress || '',
      user_name: user.fullName || user.firstName || '',
      return_url: returnUrl || window.location.origin + '/upgrade/success'
    });

    return response.data;
  };

  const verifyPayment = async (paymentId) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const response = await axios.post(
      `${API}/payments/verify-payment/${paymentId}?user_id=${user.id}`
    );

    if (response.data.is_premium) {
      setIsPremium(true);
      await checkSubscription();
    }

    return response.data;
  };

  const value = {
    isPremium,
    isLoading,
    subscriptionData,
    checkSubscription,
    createCheckout,
    verifyPayment,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

export default SubscriptionContext;
