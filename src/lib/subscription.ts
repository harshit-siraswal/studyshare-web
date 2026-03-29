import { toast } from 'sonner';
import { createAiTokenRechargeOrder, createPaymentOrder, verifyPayment } from './api';

interface RazorpayPaymentSuccessPayload {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

interface RazorpayCheckoutOptions {
    key: string;
    amount: number;
    currency: 'INR';
    name: string;
    description: string;
    image: string;
    order_id: string;
    handler: (response: RazorpayPaymentSuccessPayload) => Promise<void>;
    prefill: {
        email: string;
    };
    theme: {
        color: string;
    };
}

interface RazorpayInstance {
    open: () => void;
}

let razorpayLoadPromise: Promise<void> | null = null;

// Define Razorpay window interface
declare global {
    interface Window {
        Razorpay: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
    }
}

// Razorpay Key ID is public by design (safe for frontend), but must come
// from environment or backend order response, never from hardcoded source.

export interface PremiumPlan {
    id: string;
    name: string;
    price: number;
    duration: 'monthly' | 'quarterly';
    features: string[];
}

export const PLANS: PremiumPlan[] = [
    {
        id: 'premium_monthly',
        name: 'Premium Monthly',
        price: 49,
        duration: 'monthly',
        features: [
            'Offline PDF downloads',
            '1 Year Room Expiry',
            'Premium profile badge'
        ]
    },
    {
        id: 'premium_quarterly',
        name: 'Premium Quarterly',
        price: 149,
        duration: 'quarterly',
        features: [
            'Offline PDF downloads',
            '1 Year Room Expiry',
            'Premium profile badge'
        ]
    }
];

export const AI_RECHARGE_LIMITS = {
    min: 10,
    max: 5000,
} as const;

export class SubscriptionService {
    private static ensureRazorpayLoaded(): Promise<void> {
        if (typeof window === 'undefined') {
            return Promise.reject(new Error('Razorpay can only load in the browser.'));
        }

        if (typeof window.Razorpay !== 'undefined') {
            return Promise.resolve();
        }

        if (razorpayLoadPromise) {
            return razorpayLoadPromise;
        }

        razorpayLoadPromise = new Promise((resolve, reject) => {
            const existing = document.querySelector('script[data-razorpay-sdk="true"]') as HTMLScriptElement | null;
            if (existing) {
                existing.addEventListener('load', () => resolve(), { once: true });
                existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay SDK.')), { once: true });
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.defer = true;
            script.setAttribute('data-razorpay-sdk', 'true');
            script.onload = () => resolve();
            script.onerror = () => {
                razorpayLoadPromise = null;
                reject(new Error('Failed to load Razorpay SDK.'));
            };
            document.head.appendChild(script);
        });

        return razorpayLoadPromise;
    }

    private static resolveRazorpayKey(order: Record<string, unknown>): string {
        const candidates = [
            import.meta.env.VITE_RAZORPAY_KEY_ID,
            // backend may include key id in different shapes
            order?.key,
            order?.key_id,
            order?.keyId,
            order?.razorpay_key_id,
            order?.razorpayKeyId,
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

        const backendPlanId = plan.duration === 'quarterly' ? 'quarterly' : 'monthly';
        const order = await createPaymentOrder(plan.price * 100, backendPlanId) as Record<string, unknown>;
        const keyId = SubscriptionService.resolveRazorpayKey(order);

        if (!keyId) {
            toast.error('Payment setup incomplete. Please contact support.');
            console.error('Unable to resolve Razorpay key ID');
            return;
        }

        try {
            await SubscriptionService.ensureRazorpayLoaded();
        } catch (error) {
            toast.error('Payment SDK failed to load. Please try again.');
            console.error(error);
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
            handler: async function (response: RazorpayPaymentSuccessPayload) {
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

    static async initiateAiRechargePayment(
        rechargeRupees: number,
        userEmail: string,
        _userId: string,
    ): Promise<void> {
        if (!Number.isFinite(rechargeRupees) || rechargeRupees < AI_RECHARGE_LIMITS.min || rechargeRupees > AI_RECHARGE_LIMITS.max) {
            throw new Error(`Recharge amount must be between INR ${AI_RECHARGE_LIMITS.min} and INR ${AI_RECHARGE_LIMITS.max}.`);
        }

        const order = await createAiTokenRechargeOrder(Math.round(rechargeRupees)) as Record<string, unknown>;
        const keyId = SubscriptionService.resolveRazorpayKey(order);

        if (!keyId) {
            toast.error('Payment setup incomplete. Please contact support.');
            console.error('Unable to resolve Razorpay key ID');
            return;
        }

        try {
            await SubscriptionService.ensureRazorpayLoaded();
        } catch (error) {
            toast.error('Payment SDK failed to load. Please try again.');
            console.error(error);
            return;
        }

        const options = {
            key: keyId,
            amount: Number(order.amount || rechargeRupees * 100),
            currency: 'INR' as const,
            name: 'StudyShare',
            description: `AI Token Recharge (INR ${Math.round(rechargeRupees)})`,
            image: '/icons/icon-192.png',
            order_id: String(order.id),
            handler: async function (response: RazorpayPaymentSuccessPayload) {
                try {
                    const result = await verifyPayment(
                        response.razorpay_order_id,
                        response.razorpay_payment_id,
                        response.razorpay_signature
                    );
                    toast.success(result.message || 'AI tokens added. Please refresh to see your updated balance.');
                    setTimeout(() => window.location.reload(), 1500);
                } catch (error) {
                    toast.error('AI token recharge verification failed');
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
