import { supabase } from '../supabase';
import { toast } from 'sonner';

// Define Razorpay window interface
declare global {
    interface Window {
        Razorpay: any;
    }
}

export interface PremiumPlan {
    id: string;
    name: string;
    price: number;
    duration: 'monthly' | 'yearly';
    features: string[];
}

export const PLANS: PremiumPlan[] = [
    {
        id: 'premium_monthly',
        name: 'Premium Monthly',
        price: 49,
        duration: 'monthly',
        features: [
            'Offline Storage (App)',
            'Create up to 12 Rooms',
            '1 Year Room Expiry',
            'Priority Support'
        ]
    },
    {
        id: 'premium_yearly',
        name: 'Premium Yearly',
        price: 499, // Discounted
        duration: 'yearly',
        features: [
            'All Monthly Features',
            '2 Months Free',
            'Exclusive Badge'
        ]
    }
];

export class SubscriptionService {
    /**
     * Check if user is premium
     */
    static async isPremiumUser(userId: string): Promise<boolean> {
        try {
            if (!userId) return false;

            const { data, error } = await supabase
                .from('premium_users')
                .select('premium_until')
                .eq('id', userId)
                .single();

            if (error || !data) return false;

            const expiryDate = new Date(data.premium_until);
            return expiryDate > new Date();
        } catch (error) {
            console.error('Error checking premium status:', error);
            return false;
        }
    }

    /**
     * Initiate Razorpay Payment
     */
    static async initiatePayment(planId: string, userEmail: string, userId: string): Promise<void> {
        const plan = PLANS.find(p => p.id === planId);
        if (!plan) throw new Error('Invalid plan selected');

        const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;

        if (!keyId) {
            toast.error('Payment configuration missing. Please start locally or contact support.');
            console.error('Missing VITE_RAZORPAY_KEY_ID');
            return;
        }

        const options = {
            key: keyId,
            amount: plan.price * 100, // Amount in paise
            currency: 'INR',
            name: 'MyStudySpace',
            description: `Upgrade to ${plan.name}`,
            image: '/icons/icon-192.png', // Ensure this exists or use a remote URL
            handler: async function (response: any) {
                try {
                    // Verify payment on backend/client (Client-side mainly for MVP)
                    await SubscriptionService.handlePaymentSuccess(response, plan, userId);
                } catch (error) {
                    toast.error('Payment verification failed');
                    console.error(error);
                }
            },
            prefill: {
                email: userEmail,
            },
            theme: {
                color: '#6366f1',
            },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
    }

    /**
     * Handle successful payment
     * In a real app, this should verify signature on backend.
     * For MVP/Demo, we update the table directly via RLS policies or an Edge Function.
     * Assuming RLS allows "Users can insert own premium status" (as seen in PREMIUM_FEATURES.sql)
     */
    private static async handlePaymentSuccess(response: any, plan: PremiumPlan, userId: string) {
        const loadingToast = toast.loading('Activating premium...');

        try {
            // Calculate expiry
            const now = new Date();
            const expiry = new Date(now);
            if (plan.duration === 'monthly') {
                expiry.setMonth(expiry.getMonth() + 1);
            } else {
                expiry.setFullYear(expiry.getFullYear() + 1);
            }

            // Upsert premium status
            const { error } = await supabase
                .from('premium_users')
                .upsert({
                    id: userId,
                    plan_type: plan.duration,
                    premium_until: expiry.toISOString(),
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            toast.success('Welcome to Premium! Please refresh to see changes.', { id: loadingToast });

            // Optional: Force reload to update context
            setTimeout(() => window.location.reload(), 1500);

        } catch (error: any) {
            console.error('Activation error:', error);
            toast.error('Failed to activate premium. Contact support.', { id: loadingToast });
        }
    }
}
