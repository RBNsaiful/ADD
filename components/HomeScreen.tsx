
import React, { useState, useRef, useEffect, FC } from 'react';
import type { User, DiamondOffer, PubgOffer, LevelUpPackage, Membership, GenericOffer, PremiumApp, Screen, AppVisibility, Banner, SpecialOffer, UiSettings } from '../types';
import PurchaseModal from './PurchaseModal';
import { db } from '../firebase';
import { ref, push, runTransaction, onValue } from 'firebase/database';
import AdRenderer from './AdRenderer';

interface HomeScreenProps {
  user: User;
  texts: any;
  onPurchase: (price: number) => void;
  diamondOffers: DiamondOffer[];
  pubgOffers: PubgOffer[];
  mlbbOffers: any[]; 
  imoOffers: any[]; // New prop for IMO
  levelUpPackages: LevelUpPackage[];
  memberships: Membership[];
  premiumApps: PremiumApp[];
  specialOffers?: SpecialOffer[];
  onNavigate: (screen: Screen) => void;
  bannerImages: Banner[];
  visibility?: AppVisibility;
  homeAdActive?: boolean;
  homeAdCode?: string;
  uiSettings?: UiSettings;
  onInsufficientBalance: (amount: number) => void;
}

const DiamondIcon: FC<{className?: string}> = ({className}) => (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M12 2L2 8.5l10 13.5L22 8.5 12 2z" />
    </svg>
);

const UcIcon: FC<{className?: string}> = ({className}) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
        <path d="M8.5 9V12C8.5 13.933 10.067 15.5 12 15.5C13.933 15.5 15.5 13.933 15.5 12V9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
);

const RoyalePassIcon: FC<{className?: string}> = ({className}) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
            <linearGradient id="rp-wing-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF7CC" />
                <stop offset="30%" stopColor="#FFD700" />
                <stop offset="70%" stopColor="#FDB931" />
                <stop offset="100%" stopColor="#996515" />
            </linearGradient>
            <linearGradient id="rp-shield-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1E3A8A" />
                <stop offset="100%" stopColor="#172554" />
            </linearGradient>
            <filter id="rp-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.2" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
        
        {/* Wings */}
        <path d="M23 7C23 7 19 8 16 11C16 11 20 5 23 7Z" fill="url(#rp-wing-gold)" />
        <path d="M1 7C1 7 5 8 8 11C8 11 4 5 1 7Z" fill="url(#rp-wing-gold)" />
        <path d="M2.5 9C1 10 3 14 6 15C3 13 2 11 2.5 9Z" fill="url(#rp-wing-gold)" />
        <path d="M21.5 9C23 10 21 14 18 15C21 13 22 11 21.5 9Z" fill="url(#rp-wing-gold)" />
        
        {/* Main Wing Body */}
        <path d="M12 17L18 13C20 10 22 5 22 5C19 6 15 8 12 11C9 8 5 6 2 5C2 5 4 10 6 13L12 17Z" fill="url(#rp-wing-gold)" stroke="#B8860B" strokeWidth="0.5" filter="url(#rp-glow)" />

        {/* Central Shield */}
        <path d="M12 19L7 14V10C7 10 9 9 12 8C15 9 17 10 17 10V14L12 19Z" fill="url(#rp-shield-fill)" stroke="url(#rp-wing-gold)" strokeWidth="1" />
        
        {/* Corrected Upright Royal Crown (Spikes pointing UP) */}
        <path 
            d="M9.5 11.5L10.5 14L12 12L13.5 14L14.5 11.5V15.5H9.5V11.5Z" 
            fill="url(#rp-wing-gold)" 
            filter="url(#rp-glow)"
        />
        <circle cx="9.5" cy="10.8" r="0.7" fill="url(#rp-wing-gold)" />
        <circle cx="12" cy="10.2" r="0.7" fill="url(#rp-wing-gold)" />
        <circle cx="14.5" cy="10.8" r="0.7" fill="url(#rp-wing-gold)" />
        
        {/* Shine dots */}
        <circle cx="12" cy="17.5" r="0.5" fill="white" fillOpacity="0.8" />
    </svg>
);

const MlbbDiamondIcon: FC<{className?: string}> = ({className}) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
            <linearGradient id="mlbb-diamond-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#4338CA" />
            </linearGradient>
        </defs>
        <path d="M12 2L2 8.5l10 13.5L22 8.5 12 2z" fill="url(#mlbb-diamond-grad)" />
        <path d="M12 2L2 8.5H22L12 2Z" fill="white" fillOpacity="0.1" />
        <path d="M12 2V22" stroke="white" strokeWidth="0.5" strokeOpacity="0.2" />
    </svg>
);

const MlbbWeeklyIcon: FC<{className?: string}> = ({className}) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
            <linearGradient id="blue-crystal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="100%" stopColor="#1E40AF" />
            </linearGradient>
        </defs>
        <circle cx="12" cy="13" r="9" stroke="#1E40AF" strokeWidth="1.5" strokeDasharray="2 1" />
        <path d="M12 6L6 13L12 21L18 13L12 6Z" fill="url(#blue-crystal-grad)" />
        <path d="M12 6L6 13H18L12 6Z" fill="white" fillOpacity="0.3" />
        <path d="M9 3L10.5 5H13.5L15 3L13.5 7H10.5L9 3Z" fill="#1D4ED8" />
        <circle cx="12" cy="3" r="1" fill="#60A5FA" />
        <path d="M5 10L6 11M18 10L19 11" stroke="#3B82F6" strokeWidth="1" strokeLinecap="round" />
    </svg>
);

const StarIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>);
const IdCardIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><line x1="6" y1="9" x2="10" y2="9"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="6" y1="15" x2="10" y2="15"/><line x1="14" y1="9" x2="18" y2="9"/><line x1="14" y1="12" x2="18" y2="12"/><line x1="14" y1="15" x2="18" y2="15"/></svg>);
const CrownIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>);
const FireIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.5-3.3.3 1.3 1 2 2.5 2.8z"/></svg>);

const AppAlert: FC<{ message: string, onClose: () => void }> = ({ message, onClose }) => (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-smart-fade-in">
        <div className="w-full max-w-xs bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl animate-smart-pop-in border border-gray-100 dark:border-gray-700 text-center text-black dark:text-white">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
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

const BannerCarousel: FC<{ images: Banner[] }> = ({ images }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const timeoutRef = useRef<number | null>(null);
    const touchStartRef = useRef<number | null>(null);

    const resetTimeout = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    };

    useEffect(() => {
        resetTimeout();
        timeoutRef.current = window.setTimeout(
            () =>
                setCurrentIndex((prevIndex) =>
                    prevIndex === images.length - 1 ? 0 : prevIndex + 1
                ),
            3000
        );

        return () => {
            resetTimeout();
        };
    }, [currentIndex, images.length]);

    const goToSlide = (slideIndex: number) => {
        setCurrentIndex(slideIndex);
    };

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartRef.current = e.targetTouches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStartRef.current) return;
        const touchEnd = e.changedTouches[0].clientX;
        const diff = touchStartRef.current - touchEnd;

        if (diff > 50) {
            nextSlide();
        } else if (diff < -50) {
            prevSlide();
        }
        touchStartRef.current = null;
    };

    if (!images || images.length === 0) return null;

    return (
        <div 
            className="relative h-40 md:h-64 lg:h-80 w-full overflow-hidden rounded-2xl shadow-lg mb-6 group keep-animating touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {images.map((banner, index) => (
                <div
                    key={index}
                    className={`absolute inset-0 h-full w-full transition-opacity duration-1000 ease-in-out keep-animating ${
                        currentIndex === index ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                >
                    {banner.actionUrl ? (
                        <a href={banner.actionUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                            <img
                                src={banner.imageUrl}
                                alt={`Banner ${index + 1}`}
                                className="h-full w-full object-cover pointer-none select-none"
                            />
                        </a>
                    ) : (
                        <img
                            src={banner.imageUrl}
                            alt={`Banner ${index + 1}`}
                            className="h-full w-full object-cover pointer-none select-none"
                        />
                    )}
                </div>
            ))}

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
                {images.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 keep-animating ${
                            currentIndex === index ? 'bg-white scale-125' : 'bg-white/50'
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                    ></button>
                ))}
            </div>
        </div>
    );
};


const PackageCard: FC<{ 
    name: string; 
    price: number; 
    texts: any; 
    onBuy: () => void; 
    icon: FC<{className?: string}>; 
    description?: string; 
    diamonds?: number; 
    uc?: number;
    isSpecial?: boolean; 
    isPremium?: boolean;
    isLevelUp?: boolean;
    isMembership?: boolean;
    isMlbb?: boolean;
    isImo?: boolean;
    isPubgRp?: boolean; // New prop for PUBG Royale Pass
    ribbonLabel?: string;
    size?: 'normal' | 'small' | 'smaller' | 'extra-small';
    showBorder?: boolean;
}> = ({ name, price, texts, onBuy, icon: Icon, description, diamonds, uc, isSpecial, isPremium, isLevelUp, isMembership, isMlbb, isImo, isPubgRp, ribbonLabel, size = 'normal', showBorder = true }) => {
    
    const sizeConfig = {
        'normal': {
            padding: 'p-2',
            iconSize: isPubgRp ? 'w-14 h-14' : 'w-10 h-10',
            titleSize: 'text-xs',
            descSize: 'text-[9px]',
            priceSize: 'text-sm',
            btnSize: 'text-xs py-1.5',
            minHeight: 'min-h-[1.8rem]'
        },
        'small': {
            padding: 'p-1.5',
            iconSize: isPubgRp ? 'w-12 h-12' : 'w-8 h-8',
            titleSize: 'text-[10px] leading-tight',
            descSize: 'text-[8px]',
            priceSize: 'text-xs',
            btnSize: 'text-[10px] py-1',
            minHeight: 'min-h-[1.5rem]'
        },
        'smaller': {
            padding: 'p-1',
            iconSize: isPubgRp ? 'w-8 h-8' : 'w-6 h-6',
            titleSize: 'text-[9px] leading-tight',
            descSize: 'text-[7px]',
            priceSize: 'text-[10px]',
            btnSize: 'text-[9px] py-0.5',
            minHeight: 'min-h-0'
        },
        'extra-small': {
            padding: 'p-0.5',
            iconSize: 'w-5 h-5',
            titleSize: 'text-[8px] leading-tight',
            descSize: 'hidden',
            priceSize: 'text-[9px]',
            btnSize: 'text-[8px] py-0.5 h-5 flex items-center justify-center',
            minHeight: 'min-h-0'
        }
    };

    const s = sizeConfig[size] || sizeConfig.normal;

    const borderGradient = isSpecial 
        ? 'bg-gradient-to-r from-red-600/40 via-orange-500/40 to-red-600/40'
        : isPubgRp
            ? 'bg-gradient-to-r from-[#1E3A8A] via-[#3B82F6] to-[#1E3A8A] shadow-[0_0_15px_rgba(59,130,246,0.4)]' // Royal Blue Glow Border
            : isMlbb
                ? 'bg-gradient-to-r from-blue-700/40 via-indigo-800/40 to-purple-900/40'
                : isImo
                    ? 'bg-gradient-to-r from-cyan-400/40 via-blue-400/40 to-blue-500/40'
                    : isPremium || isMembership
                        ? 'bg-gradient-to-r from-yellow-500/40 via-orange-500/40 to-yellow-500/40'
                        : 'bg-gradient-to-r from-primary/40 via-secondary/40 to-primary/40';

    const btnGradient = isSpecial 
        ? 'bg-gradient-to-r from-red-600 to-orange-600 shadow-red-500/20' 
        : isPubgRp
            ? 'bg-gradient-to-r from-[#D4AF37] via-[#FDB931] to-[#D4AF37] shadow-amber-500/40 border border-[#FDB931]/50' // Metallic Gold Button
            : isMlbb
                ? 'bg-gradient-to-r from-blue-800 to-indigo-900 shadow-blue-500/30'
                : isImo
                    ? 'bg-gradient-to-r from-[#00A2FF] to-[#0066FF] shadow-blue-400/30'
                    : (isPremium || isMembership)
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 shadow-yellow-500/30'
                        : 'bg-gradient-to-r from-primary to-secondary shadow-primary/30';

    const iconColor = isSpecial 
        ? 'text-red-500' 
        : isPubgRp
            ? '' // Icon handles its own color
            : isMlbb
                ? 'text-blue-500'
                : isImo
                    ? 'text-[#00A2FF]'
                    : (isPremium || isMembership)
                        ? 'text-yellow-500' 
                        : 'text-primary';

    const bgContainerClass = isPubgRp 
        ? 'bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#1E3A8A] shadow-[0_0_20px_rgba(37,99,235,0.3)] border border-blue-400/20' // Premium Royal Blue
        : showBorder 
            ? 'bg-light-card dark:bg-dark-card' 
            : '';

    return (
        <div 
            className={`group relative rounded-2xl shadow-md hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 h-full overflow-hidden
                ${showBorder ? `p-[1px] ${borderGradient}` : `p-0 ${bgContainerClass}`}
            `}
        >
            <div className={`rounded-[calc(1rem-1px)] ${s.padding} flex flex-col items-center justify-between h-full text-center relative overflow-hidden ${bgContainerClass}`}>
                
                {/* 1. Special Offer (Red "LIMITED") - Always takes precedence if isSpecial */}
                {isSpecial && (
                    <div className="absolute -right-7 top-2 w-24 bg-gradient-to-r from-red-600 to-orange-600 text-white text-[8px] font-black py-1 rotate-45 shadow-sm uppercase tracking-tighter z-10 text-center">
                        {texts.limited}
                    </div>
                )}
                
                {/* 2. Dynamic Ribbon (Custom Text OR Default Type Text) */}
                {!isSpecial && (ribbonLabel || isPremium || isMembership || isMlbb || isImo || isPubgRp || isLevelUp) && (
                    <div 
                        className={`absolute -right-8 top-3 w-28 bg-gradient-to-r ${
                            isPubgRp ? 'from-[#D4AF37] to-[#FDB931]' : 
                            isMlbb ? 'from-blue-600 to-indigo-800' : 
                            isImo ? 'from-[#00A2FF] to-[#00A2FF]' : 
                            (isPremium || isMembership) ? 'from-yellow-500 to-orange-500' :
                            isLevelUp ? 'from-primary to-secondary' : 
                            'from-primary to-secondary' // Default for Diamonds (Updated to match card theme)
                        } text-white text-[8px] font-black py-1 rotate-45 shadow-sm uppercase tracking-tighter z-10 text-center flex items-center justify-center`}
                        style={{ transformOrigin: 'center' }}
                    >
                        {ribbonLabel || (
                            isMembership ? texts.bestValueLabel : 
                            isMlbb ? "MLBB" : 
                            isImo ? "IMO" : 
                            isPubgRp ? "SEASON A10" : 
                            isPremium ? texts.premiumLabel :
                            isLevelUp ? texts.oneTimeLabel :
                            ""
                        )}
                    </div>
                )}

                <div className="flex flex-col items-center justify-center flex-grow py-1 w-full relative z-10">
                    {/* Shine Effect for RP */}
                    {isPubgRp && (
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-t-[calc(1rem-1px)]"></div>
                    )}

                    <div className={`mb-1 group-hover:scale-110 transition-transform duration-300 ${iconColor}`}>
                        <Icon className={`${s.iconSize}`}/>
                    </div>
                    
                    <div className="w-full">
                        <h3 className={`${s.titleSize} font-black ${isPubgRp ? 'text-[#FFD700] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]' : isPremium ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-600' : 'text-light-text dark:text-dark-text'} tracking-tight line-clamp-2 ${s.minHeight} flex items-center justify-center not-italic`}>
                            {name}
                        </h3>
                        {diamonds !== undefined && diamonds > 0 && (
                            <div className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 ${isMlbb || isImo ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100'} rounded-full border dark:border-blue-800/50`}>
                                <CircleDiamondIcon className={`w-2.5 h-2.5 ${isMlbb ? 'text-blue-500' : isImo ? 'text-[#00A2FF]' : 'text-blue-500'}`} />
                                <span className={`text-[9px] font-black ${isMlbb ? 'text-blue-600 dark:text-blue-400' : isImo ? 'text-[#00A2FF] dark:text-cyan-400' : 'text-blue-600 dark:text-blue-400'}`}>{diamonds}</span>
                            </div>
                        )}
                        {uc !== undefined && uc > 0 && (
                            <div className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-full border border-yellow-100 dark:border-yellow-800/50">
                                <UcIcon className="w-2.5 h-2.5 text-yellow-500" />
                                <span className="text-[9px] font-black text-yellow-600 dark:text-yellow-400">{uc}</span>
                            </div>
                        )}
                    </div>
                    
                    {description && <p className={`${s.descSize} ${isPubgRp ? 'text-[#FDB931] opacity-90' : 'text-gray-500 dark:text-gray-400'} font-bold line-clamp-1 mt-0.5 not-italic`}>{description}</p>}
                </div>

                <div className="w-full mt-1 flex flex-col items-center relative z-10">
                    <p className={`${s.priceSize} font-black ${isPubgRp ? 'text-[#FFD700] drop-shadow-sm' : isMlbb ? 'text-blue-700' : isImo ? 'text-[#00A2FF]' : 'text-primary'} mb-1`}>{texts.currency}{price}</p>
                    <button 
                        onClick={onBuy} 
                        className={`w-full text-white font-black uppercase tracking-wider ${s.btnSize} rounded-lg transition-all active:scale-95 shadow-lg ${btnGradient}`}
                    >
                        {texts.buyNow}
                    </button>
                </div>
            </div>
        </div>
    );
};

const CircleDiamondIcon: FC<{className?: string}> = ({className}) => (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M12 2L2 8.5l10 13.5L22 8.5 12 2z" />
    </svg>
);

const HomeScreen: FC<HomeScreenProps> = ({ user, texts, onPurchase, diamondOffers, pubgOffers, mlbbOffers, imoOffers, levelUpPackages, memberships, premiumApps, specialOffers = [], onNavigate, bannerImages, visibility, homeAdActive, homeAdCode, uiSettings, onInsufficientBalance }) => {
  const [selectedOffer, setSelectedOffer] = useState<GenericOffer | null>(null);
  const [activeTab, setActiveTab] = useState('');
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [appAlert, setAppAlert] = useState<string | null>(null);
  
  const showDiamond = visibility?.diamonds ?? true;
  const showPubg = visibility?.pubg ?? true;
  const showMlbb = visibility?.mlbb ?? true;
  const showImo = visibility?.imo ?? true;
  const showLevelUp = visibility?.levelUp ?? true;
  const showMembership = visibility?.membership ?? true;
  const showPremium = visibility?.premium ?? true;
  const showSpecial = visibility?.specialOffers ?? true;

  const cardSize = uiSettings?.cardSize || 'normal';
  const showCardBorder = uiSettings?.showCardBorder !== false;
  const isOfferAnimationEnabled = uiSettings?.offerAnimationEnabled !== false;

  const visibleTabs = [
      { id: 'diamonds', label: texts.diamondOffers, visible: showDiamond, isNudged: true },
      { id: 'pubg', label: texts.pubgOffers, visible: showPubg, isNudged: true },
      { id: 'mlbb', label: texts.mlbbOffers, visible: showMlbb, isNudged: true },
      { id: 'imo', label: texts.imoOffers, visible: showImo, isNudged: true },
      { id: 'level-up', label: texts.levelUpPackages, visible: showLevelUp, isNudged: true },
      { id: 'memberships', label: texts.memberships, visible: showMembership, isNudged: true },
      { id: 'special', label: texts.specialOffersTab, visible: showSpecial, isNudged: false }, 
      { id: 'premium-apps', label: texts.premiumApps, visible: showPremium && premiumApps && premiumApps.length > 0, isNudged: false },
  ].filter(t => t.visible);

  useEffect(() => {
      if (visibleTabs.length > 0) {
          const isActiveVisible = visibleTabs.find(t => t.id === activeTab);
          if (!isActiveVisible) {
              setActiveTab(visibleTabs[0].id);
          }
      } else {
          setActiveTab('');
      }
  }, [visibleTabs.length, activeTab, visibility]);

  useEffect(() => {
      const hasNudged = sessionStorage.getItem('hasPlayedNudge');
      if (!hasNudged) {
          setShowScrollHint(true);
          sessionStorage.setItem('hasPlayedNudge', 'true');
          const timer = setTimeout(() => { setShowScrollHint(false); }, 3000); 
          return () => clearTimeout(timer);
      }
  }, []);

  const handleBuyClick = (offer: GenericOffer) => {
    setSelectedOffer(offer);
  };

  const handleCloseModal = () => {
    setSelectedOffer(null);
  };
  
  const handleConfirmPurchase = async (identifier: string) => {
    if (!selectedOffer || !user.uid) return;
    const userRef = ref(db, 'users/' + user.uid);
    const orderRef = ref(db, 'orders/' + user.uid);

    try {
        let isInsufficient = false;
        await runTransaction(userRef, (userData) => {
            if (userData) {
                if (userData.balance >= selectedOffer.price) {
                    userData.balance -= selectedOffer.price;
                    return userData;
                } else { 
                    isInsufficient = true;
                    return; 
                }
            }
            return userData;
        });

        if (isInsufficient) {
            setAppAlert(texts.insufficientBalance);
            return;
        }

        const orderId = Math.floor(10000000 + Math.random() * 90000000).toString();
        const offerForDB = { 
            id: selectedOffer.id, 
            name: selectedOffer.name, 
            price: selectedOffer.price, 
            diamonds: selectedOffer.diamonds || 0,
            inputType: selectedOffer.inputType 
        };
        await push(orderRef, { uid: identifier, offer: offerForDB, price: selectedOffer.price, status: 'Pending', date: new Date().toISOString(), id: orderId });
        
        if ((window as any).gtag) {
            (window as any).gtag('event', 'purchase', {
                transaction_id: orderId,
                value: selectedOffer.price,
                currency: 'BDT',
                items: [{
                    item_id: String(selectedOffer.id),
                    item_name: selectedOffer.name,
                    price: selectedOffer.price
                }]
            });
        }

        onPurchase(selectedOffer.price);
    } catch (error) {
        setAppAlert(texts.insufficientBalance);
    }
  };

  const renderContent = () => {
    const animationClass = isOfferAnimationEnabled 
        ? "opacity-0 animate-smart-slide-down keep-animating" 
        : "";
    
    switch(activeTab) {
        case 'diamonds':
            return diamondOffers.map((offer, index) => (
              <div key={offer.id} className={animationClass} style={isOfferAnimationEnabled ? { animationDelay: `${index * 80}ms` } : {}}>
                  <PackageCard 
                    name={`${offer.diamonds}`} 
                    description={texts.diamondsLabel} 
                    price={offer.price} 
                    texts={texts} 
                    icon={CircleDiamondIcon} 
                    size={cardSize} 
                    showBorder={showCardBorder} 
                    ribbonLabel={offer.ribbonLabel}
                    onBuy={() => handleBuyClick({id: offer.id, name: `${offer.diamonds} ${texts.diamondsLabel}`, price: offer.price, icon: CircleDiamondIcon, diamonds: offer.diamonds, inputType: 'uid'})} 
                  />
              </div>
            ));
        case 'pubg':
            return pubgOffers.map((offer, index) => {
                const isRp = offer.pubgType === 'rp';
                return (
                    <div key={offer.id} className={animationClass} style={isOfferAnimationEnabled ? { animationDelay: `${index * 80}ms` } : {}}>
                        <PackageCard 
                            name={isRp ? (offer.name || 'Royale Pass') : `${offer.uc}`} 
                            description={isRp ? undefined : texts.ucLabel} 
                            price={offer.price} 
                            texts={texts} 
                            icon={isRp ? RoyalePassIcon : UcIcon} 
                            size={cardSize} 
                            isPremium={!isRp} 
                            isPubgRp={isRp}
                            ribbonLabel={offer.ribbonLabel || (isRp ? undefined : texts.pubgUcLabel)}
                            showBorder={showCardBorder} 
                            onBuy={() => handleBuyClick({id: offer.id, name: isRp ? (offer.name || 'Royale Pass') : `${offer.uc} ${texts.ucLabel}`, price: offer.price, icon: isRp ? RoyalePassIcon : UcIcon, inputType: 'pubg'})} 
                        />
                    </div>
                );
            });
        case 'mlbb':
            return mlbbOffers.map((offer, index) => {
                const isDiamondType = offer.mlbbType === 'diamond';
                return (
                    <div key={offer.id} className={animationClass} style={isOfferAnimationEnabled ? { animationDelay: `${index * 80}ms` } : {}}>
                        <PackageCard 
                            name={isDiamondType ? `${offer.diamonds}` : offer.name} 
                            description={isDiamondType ? texts.diamondsLabel : undefined}
                            price={offer.price} 
                            texts={texts} 
                            icon={isDiamondType ? MlbbDiamondIcon : MlbbWeeklyIcon} 
                            size={cardSize} 
                            isMlbb={true}
                            ribbonLabel={offer.ribbonLabel || (!isDiamondType ? "SPECIAL" : undefined)}
                            showBorder={showCardBorder} 
                            onBuy={() => handleBuyClick({id: offer.id, name: isDiamondType ? `${offer.diamonds} Diamonds` : offer.name, price: offer.price, icon: isDiamondType ? MlbbDiamondIcon : MlbbWeeklyIcon, inputType: 'mlbb'})} 
                        />
                    </div>
                );
            });
        case 'imo':
            return imoOffers.map((offer, index) => {
                const cleanName = (offer.diamonds ? `${offer.diamonds}` : String(offer.name).replace(/\s*Diamonds/gi, '').trim());
                return (
                    <div key={offer.id} className={animationClass} style={isOfferAnimationEnabled ? { animationDelay: `${index * 80}ms` } : {}}>
                        <PackageCard 
                            name={cleanName} 
                            description={texts.diamondsLabel}
                            price={offer.price} 
                            texts={texts} 
                            icon={CircleDiamondIcon} 
                            size={cardSize} 
                            isImo={true}
                            ribbonLabel={offer.ribbonLabel}
                            showBorder={showCardBorder} 
                            onBuy={() => handleBuyClick({id: offer.id, name: `${cleanName} Diamonds`, price: offer.price, icon: CircleDiamondIcon, inputType: 'imo'})} 
                        />
                    </div>
                );
            });
        case 'level-up':
            return levelUpPackages.map((pkg, index) => (
                 <div key={pkg.id} className={animationClass} style={isOfferAnimationEnabled ? { animationDelay: `${index * 80}ms` } : {}}>
                    <PackageCard 
                        name={texts[pkg.name] || pkg.name} 
                        price={pkg.price} 
                        texts={texts} 
                        icon={StarIcon} 
                        size={cardSize} 
                        diamonds={pkg.diamonds}
                        isLevelUp={true}
                        ribbonLabel={pkg.ribbonLabel || texts.oneTimeLabel}
                        showBorder={showCardBorder} 
                        onBuy={() => handleBuyClick({id: pkg.id, name: texts[pkg.name] || pkg.name, price: pkg.price, icon: StarIcon, diamonds: pkg.diamonds, inputType: 'uid'})} 
                    />
                </div>
            ));
        case 'memberships':
            return memberships.map((mem, index) => (
                <div key={mem.id} className={animationClass} style={isOfferAnimationEnabled ? { animationDelay: `${index * 80}ms` } : {}}>
                    <PackageCard 
                        name={texts[mem.name] || mem.name} 
                        price={mem.price} 
                        texts={texts} 
                        icon={IdCardIcon} 
                        size={cardSize} 
                        diamonds={mem.diamonds}
                        isMembership={true}
                        ribbonLabel={mem.ribbonLabel || texts.bestValueLabel}
                        showBorder={showCardBorder} 
                        onBuy={() => handleBuyClick({id: mem.id, name: texts[mem.name] || mem.name, price: mem.price, icon: IdCardIcon, diamonds: mem.diamonds, inputType: 'uid'})} 
                    />
                </div>
            ));
        case 'special':
            return specialOffers.filter(offer => offer.isActive).map((offer, index) => (
                <div key={offer.id} className={`${animationClass} h-full`} style={isOfferAnimationEnabled ? { animationDelay: `${index * 100}ms` } : {}}>
                    <PackageCard 
                        name={offer.name} 
                        description={offer.title} 
                        diamonds={offer.diamonds}
                        price={offer.price} 
                        texts={texts} 
                        icon={FireIcon} 
                        isSpecial={true} 
                        size={cardSize}
                        ribbonLabel={offer.ribbonLabel}
                        showBorder={showCardBorder}
                        onBuy={() => handleBuyClick({id: offer.id, name: offer.name, price: offer.price, icon: FireIcon, diamonds: offer.diamonds, inputType: 'uid'})} 
                    />
                </div>
            ));
        case 'premium-apps':
            return premiumApps.map((app, index) => (
                <div key={app.id} className={animationClass} style={isOfferAnimationEnabled ? { animationDelay: `${index * 80}ms` } : {}}>
                    <PackageCard 
                        name={app.name} 
                        description={app.description} 
                        price={app.price} 
                        texts={texts} 
                        icon={CrownIcon} 
                        size={cardSize} 
                        isPremium={true} 
                        ribbonLabel={app.ribbonLabel}
                        showBorder={showCardBorder} 
                        onBuy={() => handleBuyClick({id: app.id, name: app.name, price: app.price, icon: CrownIcon, inputType: 'email'})} 
                    />
                </div>
            ));
        default:
            return null;
    }
  };

  const tabWidthClass = visibleTabs.length === 1 ? 'w-full' : visibleTabs.length === 2 ? 'w-1/2' : 'w-[33.333%]';

  return (
    <div>
      {appAlert && <AppAlert message={appAlert} onClose={() => setAppAlert(null)} />}
      <main className="p-4 overflow-x-hidden">
        <div className="opacity-0 animate-smart-slide-down" style={{ animationDelay: '100ms' }}>
            <BannerCarousel images={bannerImages} />
        </div>
        
        {visibleTabs.length > 0 ? (
            <div className="my-4 -mx-4 px-4 opacity-0 animate-smart-slide-up" style={{ animationDelay: '200ms' }}>
                <div className="overflow-x-auto no-scrollbar snap-x snap-mandatory">
                    <div className={`flex items-center min-w-full ${showScrollHint ? 'keep-animating animate-scroll-nudge' : ''}`}>
                        {visibleTabs.map(tab => {
                            const isTabActive = activeTab === tab.id;
                            const isMlbbTab = tab.id === 'mlbb';
                            const isImoTab = tab.id === 'imo';
                            
                            let activeStyle = 'bg-primary border-primary text-white shadow-md shadow-primary/30 scale-[1.01]';
                            if (isMlbbTab && isTabActive) {
                                activeStyle = 'bg-[#1E3A8A] border-[#1E3A8A] text-white shadow-md shadow-blue-900/30 scale-[1.01]';
                            } else if (isImoTab && isTabActive) {
                                activeStyle = 'bg-[#00A2FF] border-[#00A2FF] text-white shadow-md shadow-blue-500/30 scale-[1.01]';
                            }

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-shrink-0 ${tabWidthClass} px-1.5 py-3 transition-all duration-300 snap-start
                                        ${isTabActive ? 'z-10' : ''}
                                        ${tab.isNudged ? 'keep-animating entry-nudge' : ''}
                                    `}
                                >
                                    <div className={`w-full h-full flex items-center justify-center rounded-xl font-black uppercase text-[10px] sm:text-sm transition-all duration-300 border-2 shadow-sm text-center leading-tight whitespace-normal py-2.5
                                        ${isTabActive 
                                            ? activeStyle 
                                            : 'bg-light-card dark:bg-dark-card text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:text-primary dark:hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-800'
                                        }
                                    `}>
                                        {tab.label}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        ) : null}

        <div className="animate-smart-fade-in" style={{ animationDelay: '300ms' }}>
            {renderContent() && (
                <div key={activeTab} className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 items-stretch`}>
                    {renderContent()}
                </div>
            )}
        </div>

        <div className="mt-8 animate-fade-in w-full flex justify-center min-h-[60px]">
            {homeAdActive ? <AdRenderer code={homeAdCode || ''} active={homeAdActive} /> : null}
        </div>
      </main>
      
      {selectedOffer && (
        <PurchaseModal 
          offer={selectedOffer} 
          onClose={handleCloseModal} 
          onConfirm={handleConfirmPurchase} 
          onSuccess={() => { handleCloseModal(); onNavigate('myOrders'); }} 
          texts={texts} 
          userBalance={user.balance} 
          userPin={user.pin}
          defaultUid={user.playerUid} 
          onInsufficientBalanceClick={(amt) => { handleCloseModal(); onInsufficientBalance(amt); }} 
        />
      )}
    </div>
  );
};

export default HomeScreen;
