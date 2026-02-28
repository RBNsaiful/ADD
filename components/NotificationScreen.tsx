
import React, { FC, useEffect, useState } from 'react';
import { Notification } from '../types';
import { db } from '../firebase';
import { ref, remove } from 'firebase/database';

interface NotificationScreenProps {
  texts: any;
  notifications: Notification[];
  onRead: () => void;
}

const BellIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className={className}>
        <defs>
            <filter id="iconShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="1.2" />
                <feOffset dx="0" dy="1.2" result="offsetblur" />
                <feComponentTransfer>
                    <feFuncA type="linear" slope="0.4" />
                </feComponentTransfer>
                <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
        <path filter="url(#iconShadow)" d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
    </svg>
);

const TrashIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1-2-2h4a2 2 0 0 1 2 2v2"/></svg>
);

const LockIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);

const NotificationCard: FC<{ 
    n: Notification, 
    texts: any, 
    isUnread: boolean, 
    onDeleteRequest: (n: Notification) => void,
    isRemoving: boolean
}> = ({ n, texts, isUnread, onDeleteRequest, isRemoving }) => {
    const isGlobalBn = texts.cancel !== 'Cancel';
    const [localIsBn, setLocalIsBn] = useState(isGlobalBn);
    const [isFocused, setIsFocused] = useState(false);
    const [showStatusDot, setShowStatusDot] = useState(true);

    useEffect(() => {
        setLocalIsBn(isGlobalBn);
    }, [isGlobalBn]);

    useEffect(() => {
        const timer = setTimeout(() => setShowStatusDot(false), 5000);
        return () => clearTimeout(timer);
    }, []);

    const formatDateTime = (timestamp: number) => {
        const date = new Date(timestamp);
        const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        const day = date.getDate();
        const monthIndex = date.getMonth();

        if (localIsBn) {
            const bnMonths = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
            const bnDigits: {[key: string]: string} = { '0':'০','1':'১','2':'২','3':'৩','4':'৪','5':'৫','6':'৬','7':'৭','8':'৮','9':'৯' };
            const bnDay = String(day).split('').map(d => bnDigits[d] || d).join('');
            return { time, date: `${bnDay} ${bnMonths[monthIndex]}` };
        } else {
            const enMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return { time, date: `${day} ${enMonths[monthIndex]}` };
        }
    };

    const dateTime = formatDateTime(n.timestamp);

    const displayTitle = localIsBn 
        ? (n.title_bn || "নোটিফিকেশন") 
        : (n.title || "Notification");
    const displayMessage = localIsBn 
        ? (n.message_bn || "কোনো বার্তা নেই।") 
        : (n.message || "No message content available.");

    const typeColors = {
        success: 'bg-green-500',
        failed: 'bg-red-500',
        admin: 'bg-gradient-to-r from-primary to-secondary',
        bonus: 'bg-orange-500',
        offer: 'bg-purple-500'
    };

    const canDelete = n.isAuto === true;

    return (
        <div 
            onClick={() => setIsFocused(!isFocused)}
            className={`
                keep-animating relative flex items-stretch gap-3 p-4 rounded-[1.4rem] cursor-pointer
                bg-white dark:bg-[#1E293B]
                shadow-md border border-gray-100 dark:border-gray-800
                transition-all duration-500 ease-in-out origin-right transform
                ${isUnread ? 'ring-2 ring-primary/20 bg-primary/5' : ''}
                ${isRemoving ? 'translate-x-full opacity-0 pointer-events-none max-h-0 py-0 my-0 overflow-hidden' : 'opacity-100 max-h-[500px] mb-0'}
                scale-[1.02] transform-none h-auto
            `}
        >
            <style>{`
                @keyframes bell-wiggle {
                    0% { transform: rotate(0); }
                    10% { transform: rotate(15deg); }
                    20% { transform: rotate(-15deg); }
                    30% { transform: rotate(10deg); }
                    40% { transform: rotate(-10deg); }
                    50% { transform: rotate(0); }
                    100% { transform: rotate(0); }
                }
                .app-theme-bell-white {
                    animation: bell-wiggle 4.5s infinite;
                    transform-origin: top center;
                }
            `}</style>

            <div className="flex flex-col items-center flex-shrink-0 w-[52px] no-shrink">
                <div className="relative mb-1">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/20">
                        <BellIcon className="w-6 h-6 app-theme-bell-white" />
                    </div>
                    {showStatusDot && (
                        <div className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#1E293B] ${typeColors[n.type] || typeColors.admin} shadow-sm`}></div>
                    )}
                </div>
                
                <div className="flex flex-col items-center mt-1.5 space-y-0.5">
                    <span className="text-[7.5px] text-gray-500 dark:text-gray-300 font-black uppercase tracking-tighter">
                        {dateTime.time}
                    </span>
                    <span className="text-[6.8px] text-primary dark:text-secondary font-black uppercase whitespace-nowrap bg-primary/5 dark:bg-white/5 px-1.5 py-0.5 rounded-full border border-primary/10">
                        {dateTime.date}
                    </span>
                </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center pb-1">
                <div className="flex items-center gap-1.5 mb-1">
                    <h3 className={`text-[12.5px] font-black leading-tight text-gray-900 dark:text-white break-words`}>
                        {displayTitle}
                    </h3>
                </div>
                <p className={`text-[11.5px] leading-relaxed font-medium text-gray-700 dark:text-gray-300 break-words ${isUnread ? '' : 'opacity-80'}`}>
                    {displayMessage}
                </p>
            </div>

            <div className="w-[38px] flex flex-col items-end justify-between flex-shrink-0 py-0.5 no-shrink">
                <div className="h-6 flex items-start justify-end w-full">
                    {isFocused && canDelete && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteRequest(n); }}
                            className="p-1.5 bg-red-600 text-white rounded-lg shadow-md animate-smart-pop-in hover:bg-red-700 active:scale-90 transition-all"
                            title="Direct Delete"
                        >
                            <TrashIcon className="w-2.5 h-2.5" />
                        </button>
                    )}
                    {isFocused && !canDelete && (
                         <div className="p-1.5 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-lg animate-smart-pop-in cursor-not-allowed">
                             <LockIcon className="w-2.5 h-2.5 opacity-40" />
                         </div>
                    )}
                </div>

                <button 
                    onClick={(e) => { e.stopPropagation(); setLocalIsBn(!localIsBn); }}
                    className="px-2 py-0.5 rounded-md bg-primary/15 dark:bg-primary/25 text-[7.5px] font-black text-primary border border-primary/30 shadow-sm hover:bg-primary hover:text-white transition-all uppercase tracking-tighter"
                >
                    {localIsBn ? 'EN' : 'BN'}
                </button>
            </div>
        </div>
    );
};

const NotificationScreen: FC<NotificationScreenProps> = ({ texts, notifications, onRead }) => {
    const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
    const [displayLimit, setDisplayLimit] = useState(20);
    
    // SMART BULK DELETE STATES
    const [deleteStreak, setDeleteStreak] = useState(0);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);

    const isBn = texts.cancel !== 'Cancel';

    useEffect(() => {
        const timer = setTimeout(() => { onRead(); }, 3000);
        return () => clearTimeout(timer);
    }, [onRead]);

    const handleDeleteClick = (n: Notification) => {
        if (!n.isAuto) return; 
        const id = n.id;
        
        // Immediate Animation state
        setRemovingIds(prev => new Set(prev).add(id));
        
        // Increment Delete Streak
        const newStreak = deleteStreak + 1;
        setDeleteStreak(newStreak);

        // Direct Database Removal
        setTimeout(async () => {
            try {
                await remove(ref(db, `notifications/${id}`));
                
                // --- SMART POPUP LOGIC ---
                // Trigger after 3rd deletion attempts (on 4th potential one)
                if (newStreak >= 3) {
                    const DISMISS_KEY = 'bulk_notif_dismissed_at';
                    const lastDismissed = localStorage.getItem(DISMISS_KEY);
                    const now = Date.now();
                    
                    // Check if 24 hours (86,400,000 ms) have passed since last dismissal
                    const isSuppressed = lastDismissed && (now - Number(lastDismissed)) < 86400000;
                    
                    if (!isSuppressed) {
                        setShowBulkModal(true);
                    }
                }
            } catch (e) {
                console.error("Direct delete failed", e);
                setRemovingIds(prev => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
            } finally {
                setRemovingIds(prev => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
            }
        }, 450);
    };

    const handleDismissBulk = () => {
        const DISMISS_KEY = 'bulk_notif_dismissed_at';
        localStorage.setItem(DISMISS_KEY, Date.now().toString());
        setShowBulkModal(false);
        setDeleteStreak(0);
    };

    const handleBulkDelete = async () => {
        setIsBulkProcessing(true);
        // Filter: Only system notifications that user is allowed to delete
        const systemNotifs = notifications.filter(n => n.isAuto === true);
        
        try {
            const deletePromises = systemNotifs.map(n => remove(ref(db, `notifications/${n.id}`)));
            await Promise.all(deletePromises);
            setShowBulkModal(false);
            setDeleteStreak(0);
        } catch (e) {
            console.error("Bulk delete failed", e);
        } finally {
            setIsBulkProcessing(false);
        }
    };

    const visibleNotifications = notifications.slice(0, displayLimit);
    const hasMore = notifications.length > displayLimit;

    return (
        <div className="min-h-full bg-[#F8FAFC] dark:bg-[#0B1120] animate-smart-fade-in pb-32">
             <div className="max-w-xl mx-auto p-4">
                {notifications.length > 0 ? (
                    <>
                        <div className="space-y-3">
                            {visibleNotifications.map((n) => {
                                const lastReadTime = Number(localStorage.getItem('lastReadTimestamp') || 0);
                                const isUnread = n.timestamp > lastReadTime;
                                return (
                                    <NotificationCard 
                                        key={n.id} 
                                        n={n} 
                                        texts={texts} 
                                        isUnread={isUnread} 
                                        onDeleteRequest={handleDeleteClick} 
                                        isRemoving={removingIds.has(n.id)}
                                    />
                                );
                            })}
                        </div>

                        {hasMore && (
                            <div className="mt-10 flex justify-center animate-smart-fade-in">
                                <button 
                                    onClick={() => setDisplayLimit(p => p + 20)}
                                    className="px-10 py-3.5 bg-gradient-to-r from-primary to-secondary text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/30 active:scale-95 transition-all hover:brightness-110"
                                >
                                    MORE
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-40 text-center opacity-30 animate-smart-fade-in">
                        <div className="w-16 h-16 bg-primary/5 dark:bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                            <BellIcon className="w-7 h-7 grayscale opacity-50" />
                        </div>
                        <h3 className="text-gray-600 dark:text-gray-300 font-bold mb-1 text-sm">{texts.noNotificationsTitle}</h3>
                        <p className="text-gray-400 dark:text-gray-500 text-[10px] uppercase tracking-widest">{texts.noNotifications}</p>
                    </div>
                )}
             </div>

             {/* SMART BULK DELETE MODAL (CLEAN & POSITIVE) */}
             {showBulkModal && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-smart-fade-in">
                    <div className="bg-white dark:bg-[#1E293B] rounded-[2.5rem] p-8 w-full max-w-xs animate-smart-pop-in shadow-2xl border border-gray-100 dark:border-gray-800 text-center">
                        <div className="w-20 h-20 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <TrashIcon className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-[1.15rem] font-black text-gray-900 dark:text-white leading-tight mb-4 px-2">
                            {isBn 
                                ? "আপনি কি সব নোটিফিকেশন একসাথে ক্লিয়ার করতে চান?" 
                                : "Do you want to clear all notifications at once?"}
                        </h3>
                        <div className="flex flex-col gap-3 mt-4">
                            <button
                                onClick={handleBulkDelete}
                                disabled={isBulkProcessing}
                                className="w-full bg-gradient-to-r from-primary to-secondary text-white font-black py-4 rounded-2xl hover:brightness-110 transition-all shadow-lg shadow-primary/30 active:scale-95 uppercase tracking-widest text-[11px] flex items-center justify-center h-12"
                            >
                                {isBulkProcessing ? (
                                    <div className="keep-animating animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                ) : (
                                    isBn ? "হ্যাঁ, সব ক্লিয়ার করুন" : "CLEAR ALL"
                                )}
                            </button>
                            <button
                                onClick={handleDismissBulk}
                                disabled={isBulkProcessing}
                                className="w-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold py-4 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors uppercase tracking-widest text-[11px]"
                            >
                                {isBn ? "এখন না" : "CANCEL"}
                            </button>
                        </div>
                    </div>
                </div>
             )}
        </div>
    );
};

export default NotificationScreen;
