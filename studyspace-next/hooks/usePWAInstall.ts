// src/hooks/usePWAInstall.ts
// Hook to capture PWA installation prompt and expose install capability

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallState {
    canInstall: boolean;
    isInstalled: boolean;
    promptInstall: () => Promise<boolean>;
}

export function usePWAInstall(): PWAInstallState {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed (standalone mode)
        const isStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;

        if (isStandalone) {
            setIsInstalled(true);
            return;
        }

        // Capture the install prompt
        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        // Handle successful installation
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const promptInstall = useCallback(async (): Promise<boolean> => {
        if (!deferredPrompt) {
            // For iOS, show instructions since it doesn't support beforeinstallprompt
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            if (isIOS) {
                alert('To install: tap the Share button, then "Add to Home Screen"');
            }
            return false;
        }

        try {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                setDeferredPrompt(null);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error prompting PWA install:', error);
            return false;
        }
    }, [deferredPrompt]);

    return {
        canInstall: !!deferredPrompt || (/iPad|iPhone|iPod/.test(navigator.userAgent) && !isInstalled),
        isInstalled,
        promptInstall,
    };
}
