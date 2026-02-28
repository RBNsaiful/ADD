import React, { useState, useRef, useEffect, FC } from 'react';
import type { User, Purchase, AppSettings } from '../types';
import { db } from '../firebase';
import { ref, onValue, remove, update, runTransaction, push } from 'firebase/database';
import AdRenderer from './AdRenderer';

interface MyOrdersScreenProps {
  user: User;
  texts: any;
  appSettings: AppSettings;
  adCode?: string;
  adActive?: boolean;
}

const CopyIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>);
const CheckIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12" /></svg>);
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

const MlbbDiamondIcon: FC<{className?: string}> = ({className}) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
            <linearGradient id="order-mlbb-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
        </defs>
        <path d="M12 2L2 8.5l10 13.5L22 8.5 12 2z" fill="url(#order-mlbb-grad)" />
        <path d="M12 2L2 8.5H22L12 2Z" fill="white" fillOpacity="0.2" />
    </svg>
);

const ImoIcon: FC<{className?: string}> = ({className}) => (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M12 2L2 8.5l10 13.5L22 8.5 12 2z" />
    </svg>
);

const StarIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>);
const IdCardIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="2" y="4" width="20" height="18" rx="2" ry="2"/><line x1="6" y1="9" x2="10" y2="9"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="6" y1="15" x2="10" y2="15"/><line x1="14" y1="9" x2="18" y2="9"/><line x1="14" y1="12" x2="18" y2="12"/><line x1="14" y1="15" x2="18" y2="15"/></svg>);
const CrownIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>);
const FireIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.5-3.3.3 1.3 1 2 2.5 2.8z"/></svg>);
const TrashIcon: FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1-2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>);
const ClockIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14" /></svg>);
const XCircleIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>);
const CalendarIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);
const MailIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>);
const ShoppingBagIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>);
const PhoneIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>);
const ShareIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>);

const GamepadIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="6" y1="11" x2="10" y2="11"/><line x1="8" y1="9" x2="8" y2="13"/><line x1="15" y1="12" x2="15.01" y2="12"/><line x1="18" y1="10" x2="18.01" y2="10"/>
        <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.01.152v3.516a4 4 0 0 0 3.998 3.998c.044.001.087.002.13.002h10.384a4 4 0 0 0 3.998-3.998c.001-.044.002-.087.002-.13V8.742c0-.05-.004-.1-.01-.152A4 4 0 0 0 17.32 5z"/>
    </svg>
);

const WavyPath = () => (
  <svg className="absolute w-full h-full top-0 left-0" preserveAspectRatio="none" viewBox="0 0 350 210">
    <path d="M0 70 C50 30, 100 110, 150 70 S250 30, 300 70 S400 110, 450 70" stroke="rgba(255, 255, 255, 0.2)" fill="none" strokeWidth="2" />
    <path d="M0 140 C50 100, 100 180, 150 140 S250 100, 300 140 S400 180, 450 140" stroke="rgba(255, 255, 255, 0.2)" fill="none" strokeWidth="2" />
  </svg>
);

const OrderTimer: FC<{ date: string, limitMinutes: number, onExpire: () => void, texts: any }> = ({ date, limitMinutes, onExpire, texts }) => {
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const hasExpiredCalled = useRef(false);
    const limitMs = limitMinutes * 60 * 1000;

    useEffect(() => {
        const calculate = () => {
            const start = new Date(date).getTime();
            const now = Date.now();
            const diff = now - start;
            const remaining = Math.max(0, limitMs - diff);
            setTimeLeft(remaining);

            if (remaining === 0 && !hasExpiredCalled.current) {
                hasExpiredCalled.current = true;
                onExpire();
            }
        };

        calculate();
        const interval = setInterval(calculate, 1000);
        return () => clearInterval(interval);
    }, [date, limitMs, onExpire]);

    if (timeLeft <= 0) return null;

    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    const progress = (timeLeft / limitMs) * 100;

    return (
        <div className="mt-2 p-2 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/10">
            <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-black text-primary/60 uppercase tracking-widest">{texts.autoRefundTimerLabel || "Auto-Refund Timer"}</span>
                <span className={`text-[11px] font-mono font-black ${progress < 20 ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-1000 linear ${progress < 20 ? 'bg-red-500' : progress < 50 ? 'bg-yellow-500' : 'bg-primary'}`}
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
    );
};

const StatusBadge: FC<{ status: Purchase['status'], texts: any }> = ({ status, texts }) => {
    const config = {
        Completed: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckIcon, label: texts.statusCompleted },
        Pending: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: ClockIcon, label: texts.statusPending },
        Failed: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircleIcon, label: texts.statusFailed },
    };
    
    const { color, icon: Icon, label } = config[status];

    return (
        <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${color} border border-transparent`}>
            <Icon className="w-3 h-3" />
            <span>{label}</span>
        </div>
    );
};

const ConfirmationDialog: FC<{ title: string; message: string; onConfirm: () => void; onCancel: () => void; confirmText: string; cancelText: string; }> = ({ title, message, onConfirm, onCancel, confirmText, cancelText }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-smart-fade-in">
        <div className="bg-light-card dark:bg-dark-card rounded-3xl p-6 w-full max-w-xs animate-smart-pop-in shadow-2xl border border-gray-100 dark:border-gray-800">
            <h3 className="text-xl font-bold text-center mb-2">{title}</h3>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-6 text-sm">{message}</p>
            <div className="flex space-x-3">
                <button
                    onClick={onCancel}
                    className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                    {cancelText}
                </button>
                <button
                    onClick={onConfirm}
                    className="flex-1 bg-red-600 text-white font-black py-3 rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/40"
                >
                    {confirmText}
                </button>
            </div>
        </div>
    </div>
);

const PurchaseCard: FC<{ purchase: Purchase, user: User, texts: any, appSettings: AppSettings, index: number, onDelete: (p: Purchase) => void, onAutoRefund: (p: Purchase) => void }> = ({ purchase, user, texts, appSettings, index, onDelete, onAutoRefund }) => {
    const [copied, setCopied] = useState(false);
    const [showCopyFeedback, setShowCopyFeedback] = useState(false);

    const isBn = texts.cancel !== 'Cancel';

    // Helper: Calculate time ago string (e.g., "5 mins ago", "2 days ago")
    const getTimeAgo = (dateStr: string) => {
        const now = new Date();
        const past = new Date(dateStr);
        const diffMs = now.getTime() - past.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return isBn ? "এইমাত্র" : "Just now";
        if (diffMins < 60) return isBn ? `${diffMins} মিনিট আগে` : `${diffMins} mins ago`;
        if (diffHours < 24) return isBn ? `${diffHours} ঘণ্টা আগে` : `${diffHours} hours ago`;
        if (diffDays === 1) return isBn ? "গতকাল" : "Yesterday";
        return isBn ? `${diffDays} দিন আগে` : `${diffDays} days ago`;
    };

    const handleSmartCopy = () => {
        const inputType = purchase.offer?.inputType;
        const appName = appSettings.appName || "FF SHOP";
        
        let lines: string[] = [];

        // --- 1. Header ---
        lines.push(isBn ? `🛒 অর্ডার রিসিট - ${appName}` : `🛒 ORDER RECEIPT - ${appName}`);

        // --- 2. User Name ---
        const userName = user.name || "Customer";
        lines.push(isBn ? `👤 নাম: ${userName}` : `👤 Name: ${userName}`);

        // --- 3. Item Name ---
        let itemTitle = purchase.offer?.name;
        if (!itemTitle || !isNaN(Number(itemTitle))) { // If name is missing or just a number
             if (purchase.offer?.diamonds) itemTitle = `${purchase.offer.diamonds} Diamonds`;
             else if ((purchase.offer as any)?.uc) itemTitle = `${(purchase.offer as any).uc} UC`;
             else itemTitle = purchase.offer?.name || "Item";
        }
        lines.push(isBn ? `📦 আইটেম: ${itemTitle}` : `📦 Item: ${itemTitle}`);

        // --- 4. Price ---
        lines.push(isBn ? `💰 মূল্য: ${texts.currency}${purchase.offer?.price || 0}` : `💰 Price: ${texts.currency}${purchase.offer?.price || 0}`);

        // --- 5. Dynamic User Data ---
        let cleanUid = purchase.uid || '';
        
        if (inputType === 'email') {
            const parts = cleanUid.split('|');
            const email = parts[0]?.trim();
            const phone = parts[1]?.trim();
            
            if (email) lines.push(`📧 Email: ${email}`);
            if (phone) lines.push(`📞 Phone: ${phone}`);
            
        } else if (inputType === 'mlbb') {
            const parts = cleanUid.split('|');
            const id = parts[0]?.replace('Player ID:', '').trim();
            const zone = parts[1]?.replace('Zone ID:', '').trim();
            
            lines.push(isBn ? `🎮 প্লেয়ার আইডি: ${id}` : `🎮 Player ID: ${id}`);
            lines.push(isBn ? `📍 জোন আইডি: ${zone}` : `📍 Zone ID: ${zone}`);
            
        } else if (inputType === 'imo') {
            let val = cleanUid;
            let label = "IMO";
            if (cleanUid.includes('IMO Number:')) {
                label = isBn ? "ইমো নম্বর" : "IMO Number";
                val = cleanUid.replace('IMO Number:', '').trim();
            } else if (cleanUid.includes('IMO ID:')) {
                label = isBn ? "ইমো আইডি" : "IMO ID";
                val = cleanUid.replace('IMO ID:', '').trim();
            }
            lines.push(`📱 ${label}: ${val}`);
            
        } else if (inputType === 'pubg') {
             const val = cleanUid.replace(/Player ID:|UID:|ID:/gi, '').trim();
             lines.push(isBn ? `🎮 প্লেয়ার আইডি: ${val}` : `🎮 Player ID: ${val}`);
             
        } else {
             // Default UID
             const val = cleanUid.replace(/Player ID:|UID:|ID:/gi, '').trim();
             const label = isBn ? "ইউআইডি" : "UID"; 
             lines.push(`🎮 ${label}: ${val}`);
        }

        // --- 6. Order ID ---
        lines.push(isBn ? `🆔 অর্ডার আইডি: ${purchase.id}` : `🆔 Order ID: ${purchase.id}`);

        // --- 7. Time ---
        const dateObj = new Date(purchase.date);
        const dateStr = dateObj.toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        const timeAgo = getTimeAgo(purchase.date);
        lines.push(isBn ? `⏱️ সময়: ${dateStr} (${timeAgo})` : `⏱️ Time: ${dateStr} (${timeAgo})`);

        // --- 8. Status ---
        const statusText = isBn 
            ? (purchase.status === 'Completed' ? 'সম্পন্ন' : purchase.status === 'Pending' ? 'পেন্ডিং' : 'বাতিল') 
            : purchase.status;
        const statusIcon = purchase.status === 'Completed' ? '✅' : (purchase.status === 'Pending' ? '⏳' : '❌');
        
        lines.push(isBn ? `${statusIcon} স্ট্যাটাস: ${statusText}` : `${statusIcon} Status: ${statusText}`);

        // --- 9. Divider & Dynamic CTA ---
        const domainUrl = appSettings.domainControlUrl;
        if (domainUrl && domainUrl.trim() !== '') {
            lines.push(`━━━━━━━━━━━━━━━━`);
            const ctaText = isBn ? "এখনই টপ আপ করুন" : "Top Up Now";
            lines.push(`🔥 ${ctaText}: ${domainUrl.trim()}`);
        }

        const textToCopy = lines.join('\n');
        
        navigator.clipboard.writeText(textToCopy);
        
        // Haptic Feedback
        if (navigator.vibrate) navigator.vibrate(50);
        
        // Visual Feedback
        setShowCopyFeedback(true);
        setTimeout(() => setShowCopyFeedback(false), 2000);
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        if (navigator.vibrate) navigator.vibrate(50);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getIconAndConfig = (p: Purchase) => {
        const offer = p.offer;
        const offerName = (offer.name || '').toLowerCase();
        const inputType = (offer as any).inputType;

        if (inputType === 'imo') {
            return {
                Icon: ImoIcon,
                bgClass: 'from-[#00A2FF]/10 to-blue-500/10 text-[#00A2FF]',
                indicator: 'bg-[#00A2FF]',
                subtitle: texts.imoOffers || "IMO Top up",
                borderClass: 'border-[#00A2FF]/20 dark:border-[#00A2FF]/30',
                accentText: 'text-[#00A2FF]'
            };
        }
        if (inputType === 'mlbb') {
            return {
                Icon: MlbbDiamondIcon,
                bgClass: 'from-blue-500/10 to-indigo-500/10 text-blue-600',
                indicator: 'bg-blue-600',
                subtitle: "MLBB Top up",
                borderClass: 'border-blue-600/20 dark:border-blue-600/30',
                accentText: 'text-blue-700'
            };
        }
        if (inputType === 'email') {
            return {
                Icon: CrownIcon,
                bgClass: 'from-yellow-500/10 to-orange-500/10 text-yellow-600',
                indicator: 'bg-yellow-500',
                subtitle: texts.premiumLabel || "Premium",
                borderClass: 'border-yellow-500/20 dark:border-yellow-500/30',
                accentText: 'text-yellow-600'
            };
        }
        if (inputType === 'pubg') {
            return {
                Icon: UcIcon,
                bgClass: 'from-yellow-500/10 to-orange-500/10 text-yellow-500',
                indicator: 'bg-yellow-500',
                subtitle: "PUBG Top up",
                borderClass: 'border-yellow-500/20 dark:border-yellow-500/30',
                accentText: 'text-yellow-600'
            };
        }
        if (offerName.includes('membership')) {
            return {
                Icon: IdCardIcon,
                bgClass: 'from-orange-500/10 to-red-500/10 text-orange-600',
                indicator: 'bg-orange-500',
                subtitle: "Membership",
                borderClass: 'border-orange-500/20 dark:border-orange-500/30',
                accentText: 'text-orange-600'
            };
        }
        if (offerName.includes('level')) {
            return {
                Icon: StarIcon,
                bgClass: 'from-purple-500/10 to-indigo-500/10 text-purple-600',
                indicator: 'bg-purple-600',
                subtitle: "Level Up",
                borderClass: 'border-purple-600/20 dark:border-purple-600/30',
                accentText: 'text-purple-600'
            };
        }
        
        const isStandardDiamond = !isNaN(Number(offer.name?.split(' ')[0]));
        if (!isStandardDiamond || offerName.includes('deal') || offerName.includes('special') || offerName.includes('offer')) {
             return {
                Icon: FireIcon,
                bgClass: 'from-red-500/10 to-orange-500/10 text-red-600',
                indicator: 'bg-red-600',
                subtitle: "Special Offer",
                borderClass: 'border-red-600/20 dark:border-red-600/30',
                accentText: 'text-red-600'
            };
        }

        return {
            Icon: DiamondIcon,
            bgClass: 'from-primary/10 to-secondary/10 text-primary',
            indicator: 'bg-primary',
            subtitle: "Free Fire Top up",
            borderClass: 'border-primary/20 dark:border-primary/30',
            accentText: 'text-primary'
        };
    };

    const config = getIconAndConfig(purchase);
    const MainIcon = config.Icon;
    const uidStr = purchase.uid || '';
    const isEmailData = uidStr.includes('@') || purchase.offer?.inputType === 'email';
    const isMlbbData = purchase.offer?.inputType === 'mlbb';
    const isImoData = purchase.offer?.inputType === 'imo';
    
    let displayLabel = texts.uid;
    let DataIcon = GamepadIcon;
    let displayValue: React.ReactNode = uidStr;
    
    if (isEmailData) {
        displayLabel = "Email"; 
        DataIcon = MailIcon;
        if (uidStr.includes('|')) {
            const parts = uidStr.split('|');
            displayValue = (
                <div className="flex flex-col gap-0.5">
                    <span className="truncate font-semibold">{parts[0].trim()}</span>
                    <div className="flex items-center gap-1.5 mt-0.5 pt-1 border-t border-gray-200 dark:border-gray-700/50">
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold flex items-center gap-1">
                             <PhoneIcon className={`w-3 h-3 ${config.accentText}`} /> Number:
                        </span>
                        <span className="font-mono text-xs truncate">{parts[1].trim()}</span>
                    </div>
                </div>
            );
        } else {
            displayValue = uidStr.split('|')[0].trim();
        }
    } else if (purchase.offer?.inputType === 'pubg') {
        displayLabel = "Player ID";
    } else if (isMlbbData) {
        displayLabel = "MLBB ID & Zone";
    } else if (isImoData) {
        DataIcon = PhoneIcon;
        if (uidStr.includes('IMO Number:')) {
            displayLabel = texts.imoId || "IMO Number";
            displayValue = uidStr.replace('IMO Number:', '').trim();
        } else if (uidStr.includes('IMO ID:')) {
            displayLabel = "IMO ID";
            displayValue = uidStr.replace('IMO ID:', '').trim();
            DataIcon = IdCardIcon;
        } else {
            displayLabel = "IMO Info";
        }
    }

    const isAutoRefundActive = appSettings.autoRefundActive !== false;
    const refundMinutes = appSettings.autoRefundMinutes || 30;

    return (
        <div 
            onClick={handleSmartCopy}
            className={`group relative bg-light-card dark:bg-dark-card rounded-2xl p-0 shadow-md hover:shadow-xl transition-all duration-300 border ${config.borderClass} overflow-hidden cursor-pointer active:scale-[0.98]`}
        >
            {/* Smart Copy Feedback Overlay */}
            {showCopyFeedback && (
                <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center animate-smart-fade-in rounded-2xl">
                    <div className="bg-white dark:bg-dark-card p-3 rounded-full mb-2 shadow-xl animate-smart-pop-in">
                        <CheckIcon className="w-8 h-8 text-green-500" />
                    </div>
                    <span className="text-white font-black uppercase tracking-widest text-xs animate-smart-slide-up">{texts.smartCopyActive}</span>
                </div>
            )}

            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                purchase.status === 'Completed' ? 'bg-green-500' : 
                purchase.status === 'Pending' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>

            <div className="p-4 pl-5">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                         <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.bgClass} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                            <MainIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className={`font-extrabold text-base leading-tight ${config.accentText}`}>
                                {purchase.offer?.diamonds || (purchase.offer as any).uc || purchase.offer?.name}
                            </h3>
                            <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{config.subtitle}</p>
                        </div>
                    </div>
                    <div className="text-right">
                         <div className={`bg-light-bg dark:bg-dark-bg px-2 py-1 rounded-lg border ${config.borderClass}`}>
                             <span className={`font-bold text-sm ${config.accentText}`}>{texts.currency}{purchase.offer?.price || 0}</span>
                         </div>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-2 grid grid-cols-2 gap-y-2 gap-x-2 text-xs border border-gray-100 dark:border-gray-800/50">
                    <div className="col-span-2 sm:col-span-1">
                        <p className="text-[10px] text-gray-400 mb-0.5 flex items-center gap-1">
                            <DataIcon className={`w-3 h-3 ${config.accentText}`} /> {displayLabel}
                        </p>
                        <div className="font-mono font-semibold text-gray-700 dark:text-gray-300 text-xs overflow-hidden">
                            {displayValue}
                        </div>
                    </div>
                    <div className="col-span-2 sm:col-span-1 text-left sm:text-right">
                         <p className="text-[10px] text-gray-400 mb-0.5 flex items-center gap-1 sm:justify-end">
                            <CalendarIcon className="w-3 h-3" /> Date
                        </p>
                        <p className="font-medium text-gray-700 dark:text-gray-300 text-[10px]">
                             {new Date(purchase.date).toLocaleString(undefined, {
                                month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                             })}
                        </p>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                         <div className="flex-1">
                            <p className="text-[10px] text-gray-400 mb-0.5">Order ID</p>
                            <div className="flex items-center space-x-2">
                                <span className="font-mono text-[10px] font-medium text-gray-600 dark:text-gray-400 select-all">{purchase.id}</span>
                                <button onClick={(e) => { e.stopPropagation(); handleCopy(purchase.id); }} className={`hover:${config.accentText} transition-colors text-gray-400`}>
                                    {copied ? <CheckIcon className="w-3 h-3 text-green-500" /> : <CopyIcon className="w-3 h-3" />}
                                </button>
                            </div>
                         </div>
                         <div className="flex items-center">
                            <StatusBadge status={purchase.status} texts={texts} />
                         </div>
                    </div>
                </div>

                {purchase.status === 'Pending' && isAutoRefundActive && (
                    <OrderTimer 
                        date={purchase.date} 
                        limitMinutes={refundMinutes}
                        onExpire={() => onAutoRefund(purchase)} 
                        texts={texts}
                    />
                )}
            </div>

            {/* ONLY ALLOW HIDING FAILED ORDERS */}
            {purchase.status === 'Failed' && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(purchase); }}
                    className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all opacity-0 group-hover:opacity-100 z-30"
                >
                    <TrashIcon className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
};

const MyOrdersScreen: FC<MyOrdersScreenProps> = ({ user, texts, appSettings, adCode, adActive }) => {
    const [orders, setOrders] = useState<Purchase[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [displayLimit, setDisplayLimit] = useState(20);
    const [orderToDelete, setOrderToDelete] = useState<Purchase | null>(null);
    const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
    
    const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => {
        const saved = localStorage.getItem(`hidden_orders_${user.uid}`);
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });

    const isBn = texts.cancel !== 'Cancel';
    const orderLabel = isBn ? 'অর্ডার' : 'ORDER';

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        if (!user.uid) return;
        setIsLoading(true);
        const ordersRef = ref(db, 'orders/' + user.uid);
        const unsubscribe = onValue(ordersRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const orderList = Object.keys(data).map(key => ({
                    ...data[key],
                    key: key
                })).reverse();
                setOrders(orderList);
            } else {
                setOrders([]);
            }
            setIsLoading(false);
        }, (err) => {
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [user.uid]);

    const handleDeleteClick = (p: Purchase) => {
        setOrderToDelete(p);
    };

    const handleAutoRefund = async (p: Purchase) => {
        if (p.status !== 'Pending' || !p.key || !user.uid) return;
        const orderRef = ref(db, `orders/${user.uid}/${p.key}`);
        await remove(orderRef);
        const userRef = ref(db, `users/${user.uid}`);
        await runTransaction(userRef, (userData) => {
            if (userData) {
                userData.balance = (Number(userData.balance) || 0) + Number(p.offer?.price || 0);
            }
            return userData;
        });
        const notifRef = ref(db, 'notifications');
        await push(notifRef, {
            title: "Order Auto-Refunded",
            title_bn: "অর্ডার অটো-রিফান্ড",
            message: `Your order #${p.id} for ৳${p.offer?.price} took too long and has been auto-refunded to your wallet.`,
            message_bn: `আপনার #${p.id} অর্ডারটি (৳${p.offer?.price}) নির্দিষ্ট সময়ে প্রসেস না হওয়ায় টাকা রিফান্ড করা হয়েছে।`,
            timestamp: Date.now(),
            type: 'failed',
            targetUid: user.uid,
            isAuto: true
        });
    };

    const handleConfirmDelete = () => {
        if (orderToDelete && user.uid && orderToDelete.key) {
             const key = orderToDelete.key;
             setOrderToDelete(null);
             setExitingIds(prev => new Set(prev).add(key));
             setTimeout(() => {
                setHiddenIds(prev => {
                    const next = new Set(prev);
                    next.add(key);
                    localStorage.setItem(`hidden_orders_${user.uid}`, JSON.stringify(Array.from(next)));
                    return next;
                });
                setExitingIds(prev => {
                    const next = new Set(prev);
                    next.delete(key);
                    return next;
                });
             }, 500);
        }
    };

    const visibleOrders = orders.filter(o => !hiddenIds.has(o.key || ''));
    const completedOrders = visibleOrders.filter(o => o.status === 'Completed');
    const totalSpent = completedOrders.reduce((acc, curr) => acc + (curr.offer?.price || 0), 0);
    const completedCount = completedOrders.length;
    const displayedOrders = visibleOrders.slice(0, displayLimit);
    const hasMore = visibleOrders.length > displayLimit;

    return (
        <div className="p-4 animate-smart-fade-in pb-32">
            <div className="max-w-lg mx-auto">
                <div className="relative bg-gradient-to-r from-primary to-secondary p-5 rounded-2xl text-white shadow-xl mb-6 overflow-hidden animate-smart-slide-down flex items-center justify-between">
                    <WavyPath />
                    <div className="relative z-10">
                        <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest mb-1">{texts.totalSpent}</p>
                        <h3 className="text-2xl font-extrabold text-white tracking-tight">{texts.currency}{totalSpent.toLocaleString()}</h3>
                        <p className="text-[8px] text-white/60 mt-1 font-semibold uppercase tracking-widest">{orderLabel} {completedCount}</p>
                    </div>
                    <div className="relative z-10 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-white/10">
                         <ShoppingBagIcon className="w-6 h-6 text-white" />
                    </div>
                </div>

                <div className="space-y-0 mt-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 animate-smart-fade-in">
                            <div className="keep-animating animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                        </div>
                    ) : visibleOrders.length > 0 ? (
                        <>
                            {displayedOrders.map((p, index) => {
                                const isExiting = exitingIds.has(p.key || '');
                                return (
                                    <div 
                                        key={p.key || p.id}
                                        className={`keep-animating transition-all duration-500 ease-in-out transform
                                            ${isExiting 
                                                ? 'opacity-0 translate-x-20 max-h-0 mb-0 mt-0 py-0 overflow-hidden pointer-events-none' 
                                                : 'opacity-100 translate-x-0 max-h-[1000px] pb-3'}
                                        `}
                                    >
                                        <PurchaseCard 
                                            purchase={p} 
                                            user={user}
                                            texts={texts} 
                                            appSettings={appSettings}
                                            index={index} 
                                            onDelete={handleDeleteClick}
                                            onAutoRefund={handleAutoRefund}
                                        />
                                    </div>
                                );
                            })}

                            {hasMore && (
                                <div className="mt-8 flex justify-center">
                                    <button 
                                        onClick={() => setDisplayLimit(p => p + 20)}
                                        className="px-10 py-3.5 bg-gradient-to-r from-primary to-secondary text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl active:scale-95 transition-all"
                                    >
                                        LOAD MORE
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-20 animate-smart-fade-in">
                            <p className="text-gray-400">{texts.ordersEmpty}</p>
                        </div>
                    )}
                </div>
            </div>

            {orderToDelete && (
                <ConfirmationDialog
                    title={texts.deleteConfirmTitle}
                    message={texts.deleteConfirmMessage}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setOrderToDelete(null)}
                    confirmText={texts.deleteConfirmButton}
                    cancelText={texts.cancel}
                />
            )}

            {adCode && (
                <div className="mt-8 animate-fade-in w-full flex justify-center min-h-[250px]">
                    <AdRenderer code={adCode} active={adActive} />
                </div>
            )}
        </div>
    );
};

export default MyOrdersScreen;