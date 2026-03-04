import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Crown, Loader2 } from "lucide-react";
import { PLANS, SubscriptionService } from "@/lib/subscription";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface PremiumModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PremiumModal = ({ isOpen, onClose }: PremiumModalProps) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleUpgrade = async (planId: string) => {
        if (!user) {
            toast.error("Please login to upgrade");
            return;
        }

        setLoading(true);
        try {
            await SubscriptionService.initiatePayment(planId, user.email || '', user.uid);
            setLoading(false);
            onClose();
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="bg-amber-100 p-3 rounded-full">
                            <Crown className="w-8 h-8 text-amber-500" />
                        </div>
                    </div>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                        Upgrade to Premium
                    </DialogTitle>
                    <DialogDescription className="text-lg mt-2">
                        Unlock the full potential of your study experience
                    </DialogDescription>
                </DialogHeader>

                <div className="grid md:grid-cols-2 gap-6 mt-6">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative border rounded-xl p-6 flex flex-col ${plan.duration === "quarterly"
                                ? "border-amber-500 bg-amber-500/5 shadow-lg scale-105"
                                : "border-border bg-card"
                                }`}
                        >
                            {plan.duration === "quarterly" && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                                    Best Value
                                </div>
                            )}

                            <div className="mb-4">
                                <h3 className="text-xl font-bold">{plan.name}</h3>
                                <div className="flex items-baseline gap-1 mt-2">
                                    <span className="text-3xl font-bold">₹{plan.price}</span>
                                    <span className="text-muted-foreground">/{plan.duration === "monthly" ? "mo" : "3mo"}</span>
                                </div>
                                {plan.duration === "quarterly" && (
                                    <p className="text-xs text-muted-foreground mt-1">90-day access with best value pricing</p>
                                )}
                            </div>

                            <ul className="space-y-3 flex-1 mb-6">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm">
                                        <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded-full shrink-0">
                                            <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <Button
                                size="lg"
                                className={plan.duration === "quarterly" ? "bg-amber-500 hover:bg-amber-600" : ""}
                                onClick={() => handleUpgrade(plan.id)}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Get Started"}
                            </Button>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PremiumModal;
