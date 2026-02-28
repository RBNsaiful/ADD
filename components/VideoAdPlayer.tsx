
import React, { useRef, useState, useEffect, FC } from 'react';

interface VideoAdPlayerProps {
    videoUrl: string;
    onComplete: () => void;
    onClose: () => void;
    duration?: number;
    texts: any;
}

const XIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);

const RefreshIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><polyline points="21 3 21 8 16 8"/>
    </svg>
);

const VideoAdPlayer: FC<VideoAdPlayerProps> = ({ videoUrl, onComplete, onClose, duration = 15, texts }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [timeLeft, setTimeLeft] = useState<number>(duration);
    const [canClose, setCanClose] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isContentReady, setIsContentReady] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isPausedByVisibility, setIsPausedByVisibility] = useState(false);
    const [retryKey, setRetryKey] = useState(0);
    
    const timerRef = useRef<number | null>(null);
    const loadStartTimeRef = useRef<number>(Date.now());
    const isVideoFile = videoUrl.match(/\.(mp4|webm|ogg|mov)$/i);

    const getEmbedUrl = (url: string) => {
        const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/|embed\/)([^&?]*))/);
        if (ytMatch) {
            const videoId = ytMatch[1];
            const origin = window.location.origin;
            return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&rel=0&playsinline=1&enablejsapi=1&origin=${origin}`;
        }
        return url;
    };

    const embedSrc = !isVideoFile ? getEmbedUrl(videoUrl) : '';

    const handleRetry = () => {
        setIsLoading(true);
        setIsContentReady(false);
        setHasError(false);
        setTimeLeft(duration);
        loadStartTimeRef.current = Date.now();
        setRetryKey(prev => prev + 1);
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    // Watchdog: If nothing happens in 20s, assume failure
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (!isContentReady && !hasError) {
                handleLoadError();
            }
        }, 20000);
        return () => clearTimeout(timeout);
    }, [isContentReady, hasError, retryKey]);

    // Handle Page Visibility
    useEffect(() => {
        const handleVisibilityChange = () => {
            const isHidden = document.hidden;
            setIsPausedByVisibility(isHidden);
            if (videoRef.current) {
                if (isHidden) videoRef.current.pause();
                else if (isContentReady) videoRef.current.play().catch(() => {});
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isContentReady]);

    // TIMER LOGIC
    const startTimer = () => {
        if (timerRef.current) return;
        timerRef.current = window.setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    timerRef.current = null;
                    setCanClose(true);
                    onComplete(); 
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    useEffect(() => {
        if (isPausedByVisibility || hasError || !isContentReady) {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        } else if (isContentReady && !canClose && !timerRef.current) {
            startTimer();
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isPausedByVisibility, isContentReady, canClose, hasError]);

    const handleLoadSuccess = () => {
        const loadDuration = Date.now() - loadStartTimeRef.current;
        console.log(`Ad verification: Content loaded in ${loadDuration}ms`);
        
        // SECURITY CHECK: Reduced threshold to 800ms.
        // Local error pages (Refused to connect) load instantly (< 100ms).
        // CDNs can be fast, but 800ms is a safe minimum for a real external request.
        if (loadDuration < 800) {
            console.error("Ad blocked: Suspiciously fast load (likely a connection error page)");
            handleLoadError();
            return;
        }

        setIsLoading(false);
        setIsContentReady(true);
        setHasError(false);
    };

    const handleLoadError = () => {
        setIsLoading(false);
        setIsContentReady(false);
        setHasError(true);
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const radius = 20;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (timeLeft / duration) * circumference;

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-smart-fade-in overflow-hidden">
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-50 bg-gradient-to-b from-black/80 to-transparent">
                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border backdrop-blur-md transition-all duration-300 ${isPausedByVisibility ? 'bg-orange-500 border-orange-400' : isLoading ? 'bg-blue-600 border-blue-400 animate-pulse' : 'bg-black/40 border-white/10 text-white/70'}`}>
                    {isPausedByVisibility ? texts.adPaused : isLoading ? "Verifying..." : texts.adInProgress}
                </div>

                <div className="relative w-14 h-14 flex items-center justify-center">
                    {!canClose ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 50 50">
                                <circle cx="25" cy="25" r={radius} fill="rgba(0,0,0,0.3)" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                                <circle
                                    cx="25" cy="25" r={radius} fill="transparent" stroke="white" strokeWidth="4"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={isContentReady ? offset : circumference}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000 linear"
                                />
                            </svg>
                            <span className="text-white font-black text-base font-mono relative z-10">
                                {isContentReady ? timeLeft : duration}
                            </span>
                        </div>
                    ) : (
                        <button onClick={onClose} className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-all animate-smart-pop-in">
                            <XIcon className="w-6 h-6" />
                        </button>
                    )}
                </div>
            </div>

            <div className="relative w-full h-full flex items-center justify-center bg-black">
                {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black z-20">
                        <div className="keep-animating w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                        <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest animate-pulse">Wait! Checking Ad Content...</p>
                    </div>
                )}

                {hasError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/98 z-40 p-8 text-center animate-smart-pop-in">
                        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/40">
                            <XIcon className="w-10 h-10 text-red-500" />
                        </div>
                        <h3 className="font-black text-2xl mb-2 uppercase">{texts.adFailed}</h3>
                        <p className="text-xs text-white/50 mb-8 max-w-[260px] leading-relaxed">{texts.adFailedDesc || "System detected a connection error. Please try again."}</p>
                        <div className="flex gap-4">
                             <button onClick={onClose} className="px-6 py-4 bg-gray-800 text-white rounded-2xl font-black active:scale-95 transition-transform uppercase text-[10px] tracking-widest">Close</button>
                             <button onClick={handleRetry} className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-all hover:bg-primary hover:text-white">
                                <RefreshIcon className="w-7 h-7" />
                            </button>
                        </div>
                    </div>
                )}

                {isPausedByVisibility && isContentReady && !canClose && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-30 backdrop-blur-sm">
                        <div className="p-8 bg-white rounded-[40px] text-black text-center max-w-[280px]">
                             <p className="font-black text-xl mb-1">{texts.adPaused}</p>
                             <p className="text-sm text-gray-500">{texts.stayOnScreen}</p>
                        </div>
                    </div>
                )}

                {isVideoFile ? (
                    <video 
                        key={retryKey}
                        ref={videoRef} src={videoUrl} 
                        className={`w-full h-full object-contain transition-opacity duration-500 ${isContentReady ? 'opacity-100' : 'opacity-0'}`} 
                        playsInline autoPlay muted 
                        onCanPlay={handleLoadSuccess} onError={handleLoadError} 
                    />
                ) : (
                    <iframe 
                        key={retryKey}
                        src={embedSrc} 
                        className={`w-full h-full border-none transition-opacity duration-500 ${isContentReady ? 'opacity-100' : 'opacity-0'}`} 
                        onLoad={handleLoadSuccess} 
                        onError={handleLoadError} 
                        allow="autoplay; encrypted-media" 
                    />
                )}
            </div>
        </div>
    );
};

export default VideoAdPlayer;
