
import React, { useState, useEffect, FC, useRef } from 'react';

interface PwaInstallPromptProps {
    appName: string;
    logoUrl: string;
}

const XIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);

const DownloadIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
);

const PwaInstallPrompt: FC<PwaInstallPromptProps> = ({ appName, logoUrl }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const hasBeenShownRef = useRef(false);

    useEffect(() => {
        if ((window as any).deferredPrompt) {
            setDeferredPrompt((window as any).deferredPrompt);
            initShowTimer();
        }

        const readyHandler = (e: any) => {
            setDeferredPrompt(e.detail);
            initShowTimer();
        };

        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            (window as any).deferredPrompt = e;
            initShowTimer();
        };

        function initShowTimer() {
            if (hasBeenShownRef.current) return;
            
            const timer = setTimeout(() => {
                const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
                    || (navigator as any).standalone 
                    || document.referrer.includes('android-app://');

                if (!isStandalone) {
                    setIsVisible(true);
                    hasBeenShownRef.current = true;
                    // Auto hide after 20 seconds if not interacted
                    setTimeout(() => { setIsVisible(false); }, 20000);
                }
            }, 5000);
            
            return () => clearTimeout(timer);
        }

        window.addEventListener('beforeinstallprompt', handler);
        window.addEventListener('pwa-prompt-ready', readyHandler as EventListener);
        
        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('pwa-prompt-ready', readyHandler as EventListener);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            alert("To install: Open browser menu and select 'Add to Home Screen'");
            setIsVisible(false);
            return;
        }
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        (window as any).deferredPrompt = null;
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed top-2 left-0 right-0 z-[200] px-3 md:hidden animate-smart-slide-down keep-animating">
            <div className="bg-gradient-to-r from-primary to-secondary rounded-[20px] shadow-[0_12px_35px_rgba(0,0,0,0.25)] border border-white/20 p-2 flex items-center justify-between gap-3 overflow-hidden relative backdrop-blur-md">
                
                {/* Subtle Shine Effect */}
                <div className="absolute top-0 left-0 w-full h-full bg-white/5 opacity-20 pointer-events-none"></div>

                <div className="flex items-center gap-2.5 relative z-10 pl-1">
                    {logoUrl ? (
                        <div className="w-9 h-9 rounded-[12px] overflow-hidden shadow-lg border-2 border-white/40 bg-white flex-shrink-0">
                            <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                        </div>
                    ) : null}
                    <h4 className="font-black text-[11px] text-white truncate max-w-[140px] uppercase tracking-wide drop-shadow-sm">
                        {appName}
                    </h4>
                </div>

                <div className="flex items-center gap-2 relative z-10 pr-0.5">
                    <button 
                        onClick={handleInstallClick}
                        className="bg-white text-primary text-[10px] font-black px-4 py-2 rounded-[14px] shadow-xl active:scale-95 transition-all flex items-center gap-1.5 uppercase tracking-tighter"
                    >
                        <DownloadIcon className="w-3.5 h-3.5" />
                        Install App
                    </button>
                    <button 
                        onClick={() => setIsVisible(false)}
                        className="p-1.5 text-white/70 hover:text-white transition-colors active:scale-90"
                    >
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PwaInstallPrompt;
