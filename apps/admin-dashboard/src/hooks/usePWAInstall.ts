import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

export function usePWAInstall() {
    const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return (
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as unknown as { standalone?: boolean }).standalone === true
        );
    });

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e as BeforeInstallPromptEvent);
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setInstallPrompt(null);
            console.log('[PWA] Aplikasi Laksana POS berhasil diinstal.');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const installApp = async (): Promise<boolean> => {
        if (!installPrompt) {
            return false;
        }

        try {
            await installPrompt.prompt();
            const choiceResult = await installPrompt.userChoice;
            if (choiceResult.outcome === 'accepted') {
                setIsInstalled(true);
                setInstallPrompt(null);
                return true;
            }
        } catch (error) {
            console.error('[PWA] Error saat meminta instalasi:', error);
        }
        return false;
    };

    return {
        isInstallable: !!installPrompt && !isInstalled,
        isInstalled,
        installApp
    };
}
