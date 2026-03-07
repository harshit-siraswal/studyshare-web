import { useEffect, useMemo, useState } from "react";
import { Check, Crown, Loader2, Sparkles, Wallet } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import * as api from "@/lib/api";
import {
  AI_RECHARGE_PACKS,
  buildAiTokenBudgetSnapshot,
  estimateRechargeVisibleTokens,
  formatVisibleAiTokens,
} from "@/lib/aiTokens";
import { AI_RECHARGE_LIMITS, PLANS, SubscriptionService } from "@/lib/subscription";

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "premium" | "recharge";
}

const DEFAULT_BASE_BUDGET = 40160;
const DEFAULT_BUDGET_INR = 1;

const PremiumModal = ({
  isOpen,
  onClose,
  mode = "premium",
}: PremiumModalProps) => {
  const { user } = useAuth();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [selectedRechargeRupees, setSelectedRechargeRupees] = useState<number>(49);
  const [customRechargeValue, setCustomRechargeValue] = useState("");
  const [baseBudget, setBaseBudget] = useState(DEFAULT_BASE_BUDGET);
  const [premiumBudget, setPremiumBudget] = useState(DEFAULT_BASE_BUDGET * 10);
  const [budgetInr, setBudgetInr] = useState(DEFAULT_BUDGET_INR);
  const [premiumMultiplier, setPremiumMultiplier] = useState(10);

  useEffect(() => {
    if (!isOpen || !user) return;

    let active = true;
    const loadPreview = async () => {
      try {
        const result = await api.getMyProfile();
        const profile = result?.profile ?? {};
        const snapshot = buildAiTokenBudgetSnapshot(profile);
        if (!active) return;
        setBaseBudget(Math.max(1, snapshot.freeBudget));
        setPremiumBudget(Math.max(1, snapshot.premiumBudget));
        setBudgetInr(Math.max(DEFAULT_BUDGET_INR, snapshot.budgetInr));
        setPremiumMultiplier(Math.max(1, snapshot.premiumMultiplier));
      } catch (error) {
        console.error("Failed to load AI token preview:", error);
      }
    };

    loadPreview();
    return () => {
      active = false;
    };
  }, [isOpen, user]);

  const freeVisibleTokens = useMemo(
    () => formatVisibleAiTokens(baseBudget),
    [baseBudget],
  );
  const premiumVisibleTokens = useMemo(
    () => formatVisibleAiTokens(premiumBudget),
    [premiumBudget],
  );

  const rechargeRupees = useMemo(() => {
    const custom = Number(customRechargeValue.trim());
    if (Number.isFinite(custom) && custom > 0) {
      return Math.round(custom);
    }
    return selectedRechargeRupees;
  }, [customRechargeValue, selectedRechargeRupees]);

  const estimatedRechargeTokens = useMemo(
    () => estimateRechargeVisibleTokens(rechargeRupees, baseBudget, budgetInr),
    [rechargeRupees, baseBudget, budgetInr],
  );
  const isRechargeOnly = mode === "recharge";
  const showPremiumPlans = mode === "premium";
  const showRechargeSection = mode === "recharge";

  const handleUpgrade = async (planId: string) => {
    if (!user) {
      toast.error("Please login to upgrade");
      return;
    }

    setLoadingPlanId(planId);
    try {
      await SubscriptionService.initiatePayment(planId, user.email || "", user.uid);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Premium checkout failed. Please try again.");
    } finally {
      setLoadingPlanId(null);
    }
  };

  const handleRecharge = async () => {
    if (!user) {
      toast.error("Please login to recharge AI tokens");
      return;
    }

    if (
      !Number.isFinite(rechargeRupees) ||
      rechargeRupees < AI_RECHARGE_LIMITS.min ||
      rechargeRupees > AI_RECHARGE_LIMITS.max
    ) {
      toast.error(
        `Recharge amount must be between INR ${AI_RECHARGE_LIMITS.min} and INR ${AI_RECHARGE_LIMITS.max}.`,
      );
      return;
    }

    setRechargeLoading(true);
    try {
      await SubscriptionService.initiateAiRechargePayment(
        rechargeRupees,
        user.email || "",
        user.uid,
      );
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("AI token recharge failed. Please try again.");
    } finally {
      setRechargeLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl border-border/70 bg-background/95 p-0 backdrop-blur-xl">
        <div className="overflow-hidden rounded-2xl">
          <div className="border-b border-border/60 bg-gradient-to-br from-primary/12 via-background to-background px-6 py-6">
            <DialogHeader className="gap-3 text-left">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                {isRechargeOnly ? (
                  <Wallet className="h-6 w-6" />
                ) : (
                  <Crown className="h-6 w-6" />
                )}
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold tracking-tight">
                  {isRechargeOnly ? "AI Token Recharge" : "StudyShare Premium"}
                </DialogTitle>
                <DialogDescription className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {isRechargeOnly ? (
                    <>
                      Pick a student-friendly top-up and add AI tokens to your account
                      instantly. Recharge values follow the same token economics as
                      the Android app.
                    </>
                  ) : (
                    <>
                      Free users get {freeVisibleTokens} AI tokens every 30 days.
                      Premium includes {premiumVisibleTokens} AI tokens every 30 days.
                    </>
                  )}
                </DialogDescription>
              </div>
            </DialogHeader>
          </div>

          <div className="space-y-6 px-6 py-6">
            {showPremiumPlans && (
              <div className="grid gap-4 md:grid-cols-2">
                {PLANS.map((plan) => {
                  const isQuarterly = plan.duration === "quarterly";
                  const isLoading = loadingPlanId === plan.id;

                  return (
                    <Card
                      key={plan.id}
                      className={`relative border-border/70 p-5 shadow-sm ${
                        isQuarterly
                          ? "border-primary/40 bg-primary/5"
                          : "bg-card/80"
                      }`}
                    >
                      {isQuarterly && (
                        <Badge className="absolute right-4 top-4 bg-primary text-primary-foreground">
                          Best Value
                        </Badge>
                      )}

                      <div className="mb-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <h3 className="text-lg font-semibold">{plan.name}</h3>
                        </div>
                        <div className="flex items-end gap-2">
                          <span className="text-3xl font-bold tracking-tight">INR {plan.price}</span>
                          <span className="pb-1 text-sm text-muted-foreground">
                            /{plan.duration === "monthly" ? "month" : "quarter"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {plan.duration === "quarterly"
                            ? "90-day access with best-value pricing."
                            : "30-day access with all premium tools."}
                        </p>
                      </div>

                      <div className="mb-5 rounded-xl border border-border/60 bg-background/70 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                          AI Token Access
                        </p>
                        <p className="mt-1 text-sm font-medium text-foreground">
                          {premiumVisibleTokens} AI tokens every 30 days
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {premiumMultiplier}x the free plan allowance.
                        </p>
                      </div>

                      <ul className="mb-5 space-y-3">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-3 text-sm text-foreground">
                            <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                              <Check className="h-3 w-3" />
                            </span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        className="w-full"
                        variant={isQuarterly ? "default" : "outline"}
                        disabled={!!loadingPlanId}
                        onClick={() => handleUpgrade(plan.id)}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isQuarterly ? (
                          "Buy INR 149 Plan"
                        ) : (
                          "Buy INR 49 Plan"
                        )}
                      </Button>
                    </Card>
                  );
                })}
              </div>
            )}

            {showRechargeSection && (
              <Card className="border-border/70 bg-card/80 p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    <h3 className="text-lg font-semibold">Student AI Recharge</h3>
                  </div>
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                    Low-cost micro top-ups for students. Pick a pack below to see
                    how many AI tokens you will receive.
                  </p>
                </div>
                <Badge variant="secondary" className="border border-primary/20 bg-primary/10 text-primary">
                  Starts from INR 19
                </Badge>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {AI_RECHARGE_PACKS.map((pack) => {
                  const selected = selectedRechargeRupees === pack && !customRechargeValue.trim();
                  return (
                    <button
                      key={pack}
                      type="button"
                      onClick={() => {
                        setSelectedRechargeRupees(pack);
                        setCustomRechargeValue("");
                      }}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary/5"
                      }`}
                    >
                      INR {pack}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                <Input
                  type="number"
                  min={AI_RECHARGE_LIMITS.min}
                  max={AI_RECHARGE_LIMITS.max}
                  value={customRechargeValue}
                  onChange={(event) => setCustomRechargeValue(event.target.value)}
                  placeholder={`Custom recharge amount (INR ${AI_RECHARGE_LIMITS.min} - INR ${AI_RECHARGE_LIMITS.max})`}
                />
                <Button
                  className="w-full"
                  variant="outline"
                  disabled={rechargeLoading}
                  onClick={handleRecharge}
                >
                  {rechargeLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Recharge AI Tokens"
                  )}
                </Button>
              </div>

              <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Recharge Preview
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  About {estimatedRechargeTokens} AI tokens for INR {rechargeRupees}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Recharge amount is converted using the same AI token economics as
                  the Android app.
                </p>
              </div>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumModal;
