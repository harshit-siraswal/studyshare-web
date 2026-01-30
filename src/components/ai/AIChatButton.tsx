/**
 * AIChatButton - Floating action button to open AI assistant
 */

import React from 'react';
import { Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AIChatButtonProps {
    onClick: () => void;
    className?: string;
}

export function AIChatButton({ onClick, className }: AIChatButtonProps) {
    return (
        <Button
            onClick={onClick}
            size="lg"
            className={cn(
                "fixed bottom-20 right-4 z-50 rounded-full w-14 h-14 p-0 shadow-lg",
                "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700",
                "animate-pulse hover:animate-none transition-all duration-300",
                "md:bottom-6 md:right-6",
                className
            )}
            aria-label="Open AI Assistant"
        >
            <Bot className="h-6 w-6 text-white" />
        </Button>
    );
}
