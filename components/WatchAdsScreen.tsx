
import React, { useState, FC, useRef, useEffect } from 'react';
import { DEFAULT_AVATAR_URL } from '../constants';
import type { User, EarnSettings } from '../types';
import { db } from '../firebase';
import { ref, update, runTransaction, push } from 'firebase/database';
import VideoAdPlayer from './VideoAdPlayer';
import AdRenderer from './AdRenderer';

// Icons
const PlayCircleIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" /></svg>);
const ClockIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14" /></svg>);
const GiftIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>);
const TotalEarnedIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" x2="12" y1="1" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>);
const TotalAdsIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 20h9"/><path d="M3 12h5l-1.42 1.42A2 2 0 0 0 6.17 16H9"/><path d="M3 20h2"/><path d="M17 4h4"/><path d="M17 8h4"/><path d="M17 12h4"/><path d="M3 4h10v10H3z"/></svg>);
const AdMobIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6v12"/><path d="M8 10l4-4 4 4"/></svg>); 
const ZapIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>);
const ShieldIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>);

const AppAlert: FC<{ message: string, onClose: () => void }> = ({ message, onClose }) => (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-smart-fade-in">
        <div className="w-full max-w-xs bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl animate-smart-pop-in border border-gray-100 dark:border-gray-700 text-center text-black dark:text-white">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <p className="text-[13.5px] font-bold leading-relaxed mb-6">{message}</p>
            <button 
                onClick={onClose}
                className="w-full py-3.5 bg-gradient-to-r from-primary to-secondary text-white font-black rounded-2xl shadow-lg active:scale-95 transition-all text-xs uppercase tracking-widest"
            >
                OK
            </button>
        </div>
    </div>
);

interface WatchAdsScreenProps {
    user: User;
    texts: any;
    onRewardEarned: (amount: number, showAnim: boolean) => void;
    earnSettings?: EarnSettings;
}

const InfoItem: FC<{ icon: FC<{className?: string}>, label: string, value: string | number }> = ({ icon: Icon, label, value }) => (
    <div className="flex-1 flex flex-col items-center justify-center p-2 text-center">
        <div className="p-3 bg-white/10 rounded-full mb-2">
            <Icon className="w-6 h-6 text-white" />
        </div>
        <p className="text-2xl font-black text-white drop-shadow-md">
            {value}
        </p>
        <p className="text-xs font-bold text-white/70 uppercase tracking-wider mt-1">{label}</p>
    </div>
);

const WatchAdsScreen: FC<WatchAdsScreenProps> = ({ user, texts, onRewardEarned, earnSettings }) => {
    const [showWebAd, setShowWebAd] = useState(false);
    const [showAdMobSimulator, setShowAdMobSimulator] = useState(false);
    const [isRewardPending, setIsRewardPending] = useState(false);
    const [timerString, setTimerString] = useState<string | null>(null);
    const [adCooldown, setAdCooldown] = useState(0);
    const [enableAnimations, setEnableAnimations] = useState(true);
    const [showVpnWarning, setShowVpnWarning] = useState(false);
    const [vpnMode, setVpnMode] = useState<'notice' | 'force'>('notice');
    const [isAdLoading, setIsAdLoading] = useState(false);
    const [isCheckingVpn, setIsCheckingVpn] = useState(false);
    const [appAlert, setAppAlert] = useState<string | null>(null);
    
    const resetTimerRef = useRef<number | null>(null);

    const dailyLimit = earnSettings?.dailyLimit ?? 20;
    const rewardAmount = earnSettings?.rewardPerAd ?? 5;
    const cooldownTime = earnSettings?.adCooldownSeconds ?? 10;
    const resetHours = earnSettings?.resetHours ?? 24;
    const webAdActive = earnSettings?.webAds?.active ?? true;
    const webAdUrl = earnSettings?.webAds?.url || '';
    const webAdDuration = earnSettings?.webAds?.duration || 15;
    const adMobActive = earnSettings?.adMob?.active ?? false;
    const adMobRewardId = earnSettings?.adMob?.rewardId || '';
    const earnAdCode = earnSettings?.earnAdCode || '';
    const earnAdActive = earnSettings?.earnAdActive ?? true;

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        const checkCooldown = () => {
            if (user.adsWatchedInfo?.lastAdTimestamp) {
                const now = Date.now();
                const diff = (now - user.adsWatchedInfo.lastAdTimestamp) / 1000;
                const remaining = Math.ceil(cooldownTime - diff);
                if (remaining > 0) { setAdCooldown(remaining); } else { setAdCooldown(0); }
            }
        };
        checkCooldown();
        const interval = setInterval(checkCooldown, 1000);
        return () => clearInterval(interval);
    }, [user.adsWatchedInfo?.lastAdTimestamp, cooldownTime]);

    useEffect(() => {
        const checkReset = () => {
            if (user.adsWatchedInfo?.limitReachedAt) {
                const now = Date.now();
                const limitReachedTime = user.adsWatchedInfo.limitReachedAt;
                const resetDurationMs = resetHours * 60 * 60 * 1000;
                const timePassed = now - limitReachedTime;

                if (timePassed >= resetDurationMs) {
                    if (user.uid) {
                        const userRef = ref(db, 'users/' + user.uid);
                        update(userRef, {
                            adsWatchedInfo: { count: 0, date: new Date().toISOString().split('T')[0], limitReachedAt: null }
                        });
                    }
                    setTimerString(null);
                } else {
                    const remainingMs = resetDurationMs - timePassed;
                    const hours = Math.floor((remainingMs / (1000 * 60 * 60)) % 24);
                    const minutes = Math.floor((remainingMs / (1000 * 60)) % 60);
                    const seconds = Math.floor((remainingMs / 1000) % 60);
                    
                    // Force 00:00:00 format
                    const fH = String(hours).padStart(2, '0');
                    const fM = String(minutes).padStart(2, '0');
                    const fS = String(seconds).padStart(2, '0');
                    setTimerString(`${fH}:${fM}:${fS}`);
                }
            } else { setTimerString(null); }
        };
        checkReset();
        resetTimerRef.current = window.setInterval(checkReset, 1000);
        return () => { if (resetTimerRef.current) clearInterval(resetTimerRef.current); };
    }, [user.adsWatchedInfo?.limitReachedAt, resetHours, user.uid]);

    useEffect(() => {
        const savedPref = localStorage.getItem('settings_reward_anim');
        if (savedPref !== null) { setEnableAnimations(savedPref === 'true'); }
    }, []);

    const toggleAnimations = () => {
        const newState = !enableAnimations;
        setEnableAnimations(newState);
        localStorage.setItem('settings_reward_anim', String(newState));
    };

    const verifyConnection = async () => {
        if (!navigator.onLine) return false;
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 4000);
            await fetch('https://www.google.com/favicon.ico?' + Date.now(), { method: 'HEAD', mode: 'no-cors', signal: controller.signal });
            clearTimeout(id);
            return true;
        } catch (e) { return false; }
    };

    const checkIpLocation = async (): Promise<boolean> => {
        const allowedCountries = ['US', 'GB', 'CA', 'DE', 'AU', 'SG', 'IN'];
        const providers = [
            'https://ipapi.co/json/',
            'https://api.country.is',
            'https://ipinfo.io/json'
        ];

        for (const url of providers) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);
                const response = await fetch(url, { signal: controller.signal });
                const data = await response.json();
                clearTimeout(timeoutId);

                const country = data.country_code || data.country || '';
                if (country && allowedCountries.includes(country.toUpperCase())) {
                    return true;
                }
                if (country) return false; 
            } catch (e) {
                continue;
            }
        }
        return !earnSettings?.vpnRequired; 
    };

    const handleStartAd = async () => {
        if (isAdLoading || isCheckingVpn || adCooldown > 0) return;

        setIsAdLoading(true);
        const isOnline = await verifyConnection();
        if (!isOnline) {
            setIsAdLoading(false);
            setAppAlert("No Internet Connection!");
            return;
        }

        if ((user.adsWatchedInfo?.count || 0) >= dailyLimit) {
            setIsAdLoading(false);
            setAppAlert(texts.adLimitReached);
            return;
        }

        const isSessionNoticeVerified = sessionStorage.getItem('vpn_notice_seen') === 'true';
        const needsCheck = earnSettings?.vpnRequired || earnSettings?.vpnNoticeActive;

        if (needsCheck) {
            setIsCheckingVpn(true);
            const isVpnOk = await checkIpLocation();
            setIsCheckingVpn(false);

            if (!isVpnOk) {
                if (earnSettings?.vpnRequired || !isSessionNoticeVerified) {
                    setVpnMode(earnSettings?.vpnRequired ? 'force' : 'notice');
                    setShowVpnWarning(true);
                    setIsAdLoading(false);
                    return;
                }
            } else {
                sessionStorage.setItem('vpn_notice_seen', 'true');
            }
        }

        setIsAdLoading(false);
        startAdFlow();
    };

    const startAdFlow = () => {
        if (adMobActive) { playAdMobAd(); } 
        else if (webAdActive) { playWebAd(); } 
    };

    const handleConfirmVpnPopup = async () => {
        setShowVpnWarning(false);
        setIsCheckingVpn(true);
        const isVpnOk = await checkIpLocation();
        setIsCheckingVpn(false);

        if (isVpnOk) {
            sessionStorage.setItem('vpn_notice_seen', 'true');
            startAdFlow();
        } else if (vpnMode === 'force') {
            setAppAlert("❌ VPN Still Not Detected!");
        } else {
            sessionStorage.setItem('vpn_notice_seen', 'true');
            startAdFlow();
        }
    };

    const playWebAd = () => {
        if (webAdUrl) { setShowWebAd(true); setIsRewardPending(false); } 
    };

    const playAdMobAd = async () => {
        setIsAdLoading(true);
        // @ts-ignore
        const nativeAdMob = window.admob || window.AdMob;
        if (nativeAdMob) {
            try {
                // @ts-ignore
                const rewardVideo = new nativeAdMob.RewardVideo({ id: adMobRewardId || 'ca-app-pub-3940256099942544/5224354917' });
                // @ts-ignore
                rewardVideo.on('load', async () => { await rewardVideo.show(); });
                // @ts-ignore
                rewardVideo.on('reward', () => { handleRewardClaim(); });
                // @ts-ignore
                rewardVideo.on('dismiss', () => { setIsAdLoading(false); });
                await rewardVideo.load();
            } catch (err) { setIsAdLoading(false); }
        } else {
            setIsAdLoading(false);
            setShowAdMobSimulator(true);
            setTimeout(() => { setShowAdMobSimulator(false); handleRewardClaim(); }, 5000);
        }
    };

    const handleRewardClaim = async () => {
        if (!user.uid) return;
        const userRef = ref(db, 'users/' + user.uid);
        const today = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().toISOString().slice(0, 7);

        try {
            let rewarded = false;
            await runTransaction(userRef, (userData) => {
                if (userData) {
                    const currentInfo = userData.adsWatchedInfo || { count: 0, date: today };
                    if (currentInfo.date !== today) { currentInfo.count = 0; currentInfo.date = today; currentInfo.limitReachedAt = null; }
                    if (currentInfo.count < dailyLimit) {
                        userData.balance = (userData.balance || 0) + rewardAmount;
                        userData.totalEarned = (userData.totalEarned || 0) + rewardAmount;
                        
                        // MONTHLY TRACKING
                        if (userData.lastMonthUpdate !== currentMonth) {
                            userData.monthlyEarned = rewardAmount;
                            userData.monthlySpent = 0;
                            userData.lastMonthUpdate = currentMonth;
                        } else {
                            userData.monthlyEarned = (Number(userData.monthlyEarned) || 0) + rewardAmount;
                        }

                        userData.totalAdsWatched = (userData.totalAdsWatched || 0) + 1;
                        currentInfo.count = (currentInfo.count || 0) + 1;
                        currentInfo.lastAdTimestamp = Date.now();
                        if (currentInfo.count >= dailyLimit) currentInfo.limitReachedAt = Date.now();
                        userData.adsWatchedInfo = currentInfo;
                        rewarded = true;
                        return userData;
                    }
                }
                return userData;
            });
            if (rewarded) { 
                // Track Analytics Reward Event
                if ((window as any).gtag) {
                    (window as any).gtag('event', 'ad_reward_earned', {
                        reward_value: rewardAmount,
                        user_id: user.uid,
                        total_ads: user.totalAdsWatched + 1
                    });
                }
                onRewardEarned(rewardAmount, enableAnimations); 
            }
        } catch (error) { console.error("Reward Error:", error); }
    };

    const currentCount = user.adsWatchedInfo?.count || 0;
    const isLocked = !!user.adsWatchedInfo?.limitReachedAt; 
    const progressPercentage = Math.min((currentCount / dailyLimit) * 100, 100);

    return (
        <div className="relative bg-gradient-to-b from-primary to-secondary min-h-screen pt-0 pb-24 text-white overflow-x-hidden animate-smart-fade-in">
            {appAlert && <AppAlert message={appAlert} onClose={() => setAppAlert(null)} />}
            
            {showWebAd && (
                <VideoAdPlayer 
                    videoUrl={webAdUrl}
                    onComplete={() => setIsRewardPending(true)}
                    onClose={() => { setShowWebAd(false); if (isRewardPending) { handleRewardClaim(); setIsRewardPending(false); } }}
                    duration={webAdDuration}
                    texts={texts}
                />
            )}

            {showAdMobSimulator && (
                <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center">
                    <div className="bg-white text-black p-8 rounded-3xl text-center max-w-xs shadow-2xl animate-smart-pop-in">
                        <AdMobIcon className="w-12 h-12 mx-auto mb-4 text-blue-600"/>
                        <h3 className="font-bold text-lg mb-2">Native Reward Ad</h3>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2"><div className="bg-blue-600 h-1.5 rounded-full animate-[width_5s_linear]"></div></div>
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{texts.watchingVideo}</p>
                    </div>
                </div>
            )}

            {showVpnWarning && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-dark-card w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl animate-smart-pop-in border border-white/10">
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6"><ShieldIcon className="w-10 h-10 text-red-500" /></div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-wide">{texts.vpnRequiredTitle}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">{texts.vpnRequiredDesc}</p>
                        <div className="flex flex-col gap-3">
                            <button onClick={handleConfirmVpnPopup} className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl active:scale-95 transition-all shadow-lg shadow-red-500/30">{texts.yesConnected}</button>
                            <button onClick={() => setShowVpnWarning(false)} className="w-full py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 font-bold rounded-2xl active:scale-95 transition-all">{texts.cancel}</button>
                        </div>
                    </div>
                </div>
            )}

            <main className="w-full px-4 space-y-5 pt-8">
                <header className="flex flex-col items-center text-center mb-4 animate-fade-in-up">
                    <img src={user.avatarUrl || DEFAULT_AVATAR_URL} className="w-20 h-20 rounded-full object-cover border-4 border-white/20 shadow-lg mb-4" />
                    <h1 className="text-2xl font-extrabold drop-shadow-lg uppercase tracking-wider">{texts.watchAdsScreenTitle}</h1>
                </header>

                <div 
                    className="bg-black/20 backdrop-blur-sm p-5 rounded-2xl border border-white/20 shadow-lg animate-fade-in-up" 
                    style={{ animationDelay: '150ms' }}
                >
                    <div className="w-full bg-black/30 rounded-full h-2.5 mb-5 overflow-hidden">
                        <div 
                            className="bg-gradient-to-r from-primary to-secondary h-2.5 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(124,58,237,0.35)]"
                            style={{ width: `${progressPercentage}%` }}>
                        </div>
                    </div>

                    {isLocked ? (
                        <div className="bg-white/10 rounded-xl border border-white/10 overflow-hidden flex flex-col items-center">
                            <div className="bg-red-500/20 w-full py-2 flex items-center justify-center gap-2 border-b border-white/5">
                                <ClockIcon className="w-4 h-4 text-red-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-red-100">{texts.adLimitReached}</span>
                            </div>
                            <button 
                                disabled
                                className="w-full py-5 text-3xl font-mono font-black text-yellow-300 tracking-[0.2em] flex flex-col items-center justify-center bg-black/40"
                            >
                                {timerString || "00:00:00"}
                                <span className="text-[9px] font-bold text-white/40 uppercase tracking-[0.3em] mt-1">Countdown Reset</span>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleStartAd}
                            disabled={isAdLoading || isCheckingVpn || adCooldown > 0}
                            className={`w-full text-white font-bold py-4 px-4 rounded-xl flex items-center justify-center text-lg shadow-lg transition-all duration-300 transform 
                                ${isAdLoading || isCheckingVpn || adCooldown > 0
                                    ? 'bg-slate-700 cursor-not-allowed text-slate-400' 
                                    : 'bg-gradient-to-r from-primary to-secondary hover:opacity-90 active:scale-95 shadow-primary/30'}`}
                        >
                            {isCheckingVpn ? (
                                <div className="flex items-center">
                                    <div className="keep-animating animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                    <span>{texts.verifyingVpn}</span>
                                </div>
                            ) : isAdLoading ? (
                                <div className="flex items-center">
                                    <div className="keep-animating animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                    <span>{texts.loadingAd}</span>
                                </div>
                            ) : adCooldown > 0 ? (
                                <span className="flex items-center font-mono text-lg">
                                    <ClockIcon className="w-6 h-6 mr-2" />
                                    {texts.nextAdIn} {adCooldown}s
                                </span>
                            ) : (
                                <span className="flex items-center">
                                    <PlayCircleIcon className="w-7 h-7 mr-3" />
                                    {texts.watchAnAd}
                                </span>
                            )}
                        </button>
                    )}
                </div>

                <div className="bg-black/20 backdrop-blur-sm p-5 rounded-2xl border border-white/20 shadow-lg animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                    <div className="flex justify-around items-start">
                        <InfoItem icon={TotalEarnedIcon} label={texts.totalEarned} value={`${texts.currency}${Math.floor(user.totalEarned)}`} />
                        <InfoItem icon={TotalAdsIcon} label={texts.totalAdsWatched} value={user.totalAdsWatched} />
                    </div>
                </div>
                
                <div className="bg-black/20 backdrop-blur-sm p-5 rounded-2xl border border-white/20 shadow-lg animate-fade-in-up" style={{ animationDelay: '450ms' }}>
                    <div className="flex justify-around items-start">
                        <InfoItem icon={GiftIcon} label={texts.rewardPerAd} value={`${texts.currency}${rewardAmount}`} />
                        <InfoItem icon={ClockIcon} label={texts.dailyAdLimit} value={dailyLimit} />
                    </div>
                </div>

                <div className="flex items-center justify-between bg-black/20 backdrop-blur-sm p-4 rounded-xl border border-white/10 shadow-sm animate-fade-in-up" style={{ animationDelay: '550ms' }}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <ZapIcon className="w-5 h-5 text-purple-300" />
                        </div>
                        <span className="text-sm font-bold text-white/90">{texts.rewardAnimToggle}</span>
                    </div>
                    
                    <button 
                        onClick={toggleAnimations}
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out relative ${enableAnimations ? 'bg-green-500' : 'bg-slate-600'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${enableAnimations ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                </div>

                {earnAdActive && earnAdCode && (
                    <div className="mt-8 animate-fade-in w-full flex justify-center">
                        <AdRenderer code={earnAdCode} active={earnAdActive} />
                    </div>
                )}
            </main>
        </div>
    );
};

export default WatchAdsScreen;
