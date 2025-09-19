import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Crown,
  Check,
  Loader2,
  ExternalLink,
  AlertTriangle,
  Calendar,
  Users,
  FolderOpen
} from 'lucide-react';
import { Subscription, SubscriptionPlan } from '../types';
import { subscriptionApi } from '../services/api';

export default function SubscriptionManager() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    setIsLoading(true);
    try {
      const [subscriptionResponse, plansResponse] = await Promise.all([
        subscriptionApi.getCurrent(),
        subscriptionApi.getPlans()
      ]);

      setSubscription(subscriptionResponse);
      setPlans(plansResponse.plans);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to load subscription data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    if (planId === 'free') return;

    try {
      setIsLoading(true);
      const response = await subscriptionApi.createCheckoutSession({
        tier: planId as 'professional' | 'enterprise',
        success_url: `${window.location.origin}/settings/billing?success=true`,
        cancel_url: `${window.location.origin}/settings/billing?cancelled=true`
      });

      // Redirect to Stripe Checkout
      window.location.href = response.checkout_url;
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to create checkout session');
      setIsLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      setIsLoading(true);
      const response = await subscriptionApi.createPortalSession(
        `${window.location.origin}/settings/billing`
      );

      // Open customer portal in new tab
      window.open(response.portal_url, '_blank');
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to open billing portal');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('de-DE');
  };

  if (isLoading && !subscription && !plans.length) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Current Subscription Status */}
      {subscription && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <Crown className="h-5 w-5 mr-2 text-primary-600" />
              Current Subscription
            </h2>
            {subscription.is_active && (
              <button
                onClick={handleManageBilling}
                disabled={isLoading}
                className="flex items-center px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-md transition-colors"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Manage Billing
                <ExternalLink className="h-4 w-4 ml-2" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Crown className="h-5 w-5 text-primary-600 mr-2" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Plan</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                {subscription.plan.name}
              </span>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <AlertTriangle className={`h-5 w-5 mr-2 ${
                  subscription.status === 'active' ? 'text-green-600' : 'text-yellow-600'
                }`} />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</span>
              </div>
              <span className={`text-lg font-semibold capitalize ${
                subscription.status === 'active'
                  ? 'text-green-600'
                  : 'text-yellow-600'
              }`}>
                {subscription.status}
              </span>
            </div>

            {subscription.current_period_end && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Calendar className="h-5 w-5 text-primary-600 mr-2" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {subscription.cancel_at_period_end ? 'Expires' : 'Renews'}
                  </span>
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatDate(subscription.current_period_end)}
                </span>
              </div>
            )}
          </div>

          {subscription.cancel_at_period_end && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="text-sm text-yellow-800 dark:text-yellow-200">
                  Your subscription will be cancelled at the end of the current period.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
          </div>
        </div>
      )}

      {/* Available Plans */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Available Plans
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = subscription?.plan.id === plan.id;
            const isFree = plan.id === 'free';
            const isPopular = plan.id === 'professional';

            return (
              <div
                key={plan.id}
                className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 transition-all ${
                  isCurrentPlan
                    ? 'border-primary-500 ring-2 ring-primary-200'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                } ${isPopular ? 'transform scale-105' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-6">
                  {/* Plan Header */}
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {plan.name}
                    </h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        {formatPrice(plan.price, plan.currency)}
                      </span>
                      {!isFree && (
                        <span className="text-gray-600 dark:text-gray-400">
                          /{plan.interval}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Plan Features */}
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Plan Limits */}
                  <div className="space-y-2 mb-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center text-gray-600 dark:text-gray-400">
                        <Users className="h-3 w-3 mr-1" />
                        Users
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {plan.max_users === -1 ? 'Unlimited' : plan.max_users}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center text-gray-600 dark:text-gray-400">
                        <FolderOpen className="h-3 w-3 mr-1" />
                        Projects
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {plan.max_projects === -1 ? 'Unlimited' : plan.max_projects}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isLoading || isCurrentPlan || isFree}
                    className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                      isCurrentPlan
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                        : isFree
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                        : isPopular
                        ? 'bg-primary-600 hover:bg-primary-700 text-white'
                        : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : isFree ? (
                      'Free Plan'
                    ) : (
                      `Upgrade to ${plan.name}`
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}