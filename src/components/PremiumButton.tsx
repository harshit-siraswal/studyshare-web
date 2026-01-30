import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import PremiumModal from "./PremiumModal";

interface PremiumButtonProps {
    minimal?: boolean; // If true, just renders the crown icon (for mobile/dense headers)
    className?: string; // Allow styling overrides
}

const PremiumButton = ({ minimal, className }: PremiumButtonProps) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button
                variant="default"
                size={minimal ? "icon" : "default"}
                onClick={() => setOpen(true)}
                className={`bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg ${className}`}
            >
                <Crown className={`w-4 h-4 ${minimal ? "" : "mr-2"}`} />
                {!minimal && "Get Premium"}
            </Button>

            <PremiumModal isOpen={open} onClose={() => setOpen(false)} />
        </>
    );
};

export default PremiumButton;
