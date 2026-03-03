import { toast } from 'sonner';
import { createPaymentOrder, verifyPayment } from './api';

// Define Razorpay window interface
declare global {
    interface Window {
        Razorpay: any;
    }
}

// Razorpay Key ID is public by design (safe for frontend). Keep a hard fallback
// so production does not break when Vercel env is accidentally missing.
const FALLBACK_RAZORPAY_KEY_ID = 'rzp_live_S9IWIDxf81JDDM';

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
    private static resolveRazorpayKey(order: Record<string, unknown>): string {
        const candidates = [
            import.meta.env.VITE_RAZORPAY_KEY_ID,
            // backend may include key id in different shapes
            order?.key,
            order?.key_id,
            order?.keyId,
            order?.razorpay_key_id,
            order?.razorpayKeyId,
            FALLBACK_RAZORPAY_KEY_ID,
        ];

        for (const candidate of candidates) {
            if (typeof candidate === 'string' && candidate.trim().startsWith('rzp_')) {
                return candidate.trim();
            }
        }
        return '';
    }

    /**
     * Check if user is premium
     */
    static async isPremiumUser(userId: string): Promise<boolean> {
        try {
            if (!userId) return false;

            const { data } = await import('../supabase').then(({ supabase }) =>
                supabase
                    .from('users')
                    .select('subscription_tier, subscription_end_date')
                    .eq('id', userId)
                    .maybeSingle()
            );

            if (!data || !data.subscription_tier || data.subscription_tier === 'free') return false;
            const expiryDate = data.subscription_end_date ? new Date(data.subscription_end_date) : null;
            return !expiryDate || expiryDate > new Date();
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

        const backendPlanId = plan.duration === 'yearly' ? 'max' : 'pro';
        const order = await createPaymentOrder(plan.price * 100, backendPlanId) as Record<string, unknown>;
        const keyId = SubscriptionService.resolveRazorpayKey(order);

        if (!keyId) {
            toast.error('Payment setup incomplete. Please contact support.');
            console.error('Unable to resolve Razorpay key ID');
            return;
        }

        if (typeof window.Razorpay === 'undefined') {
            toast.error('Payment SDK failed to load. Please refresh and try again.');
            console.error('window.Razorpay is unavailable');
            return;
        }

        const options = {
            key: keyId,
            amount: plan.price * 100, // Amount in paise
            currency: 'INR',
            name: 'StudyShare',
            description: `Upgrade to ${plan.name}`,
            image: '/icons/icon-192.png', // Ensure this exists or use a remote URL
            order_id: order.id,
            handler: async function (response: any) {
                try {
                    await verifyPayment(
                        response.razorpay_order_id,
                        response.razorpay_payment_id,
                        response.razorpay_signature
                    );
                    toast.success('Welcome to Premium! Please refresh to see changes.');
                    setTimeout(() => window.location.reload(), 1500);
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
}
