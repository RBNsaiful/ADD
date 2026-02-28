
import React, { FC, useEffect, useState, useMemo } from 'react';
import { User } from '../types';
import { db } from '../firebase';
import { ref, onValue, query, limitToLast, orderByChild } from 'firebase/database';
import { DEFAULT_AVATAR_URL } from '../constants';

interface RankingScreenProps {
    user: User;
    texts: any;
    adCode?: string;
    adActive?: boolean;
    onClose?: () => void;
    earnVisible?: boolean; 
}

const ArrowLeftIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
    </svg>
);
const CrownIcon: FC<{className?: string, fill?: string}> = ({className, fill = "currentColor"}) => (
    <svg viewBox="0 0 24 24" fill={fill} className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M2 4L5 16H19L22 4L15 9L12 3L9 9L2 4Z" stroke="none" />
    </svg>
);
const TrophyIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
);
const ShoppingBagIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>);
const GiftIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
);

const PremiumSpinner: FC = () => (
    <div className="relative h-12 w-12 animate-spin">
        <svg viewBox="0 0 24 24" className="w-full h-full">
            <defs>
                <linearGradient id="loader-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
            </defs>
            <circle 
                cx="12" cy="12" r="10" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3" 
                className="opacity-10 text-gray-400"
            />
            <path 
                fill="url(#loader-gradient)" 
                d="M12 2a10 10 0 0 1 10 10h-2a8 8 0 0 0-8-8V2z"
            />
        </svg>
    </div>
);

const RankingScreen: FC<RankingScreenProps> = ({ user, texts, onClose, earnVisible = true }) => {
    const [activeTab, setActiveTab] = useState<'transaction' | 'earning'>('transaction');
    const [traders, setTraders] = useState<User[]>([]);
    const [earners, setEarners] = useState<User[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);

    const currentMonthKey = useMemo(() => new Date().toISOString().slice(0, 7), []);

    useEffect(() => {
        const usersRef = ref(db, 'users');
        
        const tradersQuery = query(usersRef, orderByChild('monthlySpent'), limitToLast(100));
        const unsubscribeTraders = onValue(tradersQuery, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const list: User[] = Object.entries(data)
                    .map(([key, val]: [string, any]) => ({ ...val, uid: key }))
                    .filter(u => u.lastMonthUpdate === currentMonthKey)
                    .sort((a, b) => (Number(b.monthlySpent) || 0) - (Number(a.monthlySpent) || 0));
                setTraders(list);
            }
            checkLoading();
        });

        const earnersQuery = query(usersRef, orderByChild('monthlyEarned'), limitToLast(100));
        const unsubscribeEarners = onValue(earnersQuery, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const list: User[] = Object.entries(data)
                    .map(([key, val]: [string, any]) => ({ ...val, uid: key }))
                    .filter(u => u.lastMonthUpdate === currentMonthKey)
                    .sort((a, b) => (Number(b.monthlyEarned) || 0) - (Number(a.monthlyEarned) || 0));
                setEarners(list);
            }
            checkLoading();
        });

        function checkLoading() {
            setTimeout(() => setInitialLoading(false), 500);
        }

        return () => {
            unsubscribeTraders();
            unsubscribeEarners();
        };
    }, [currentMonthKey]);

    const activeList = useMemo(() => {
        return activeTab === 'transaction' ? traders : earners;
    }, [activeTab, traders, earners]);

    const { top3, rest, myRank, myScore } = useMemo(() => {
        const sorted = activeList;
        const myIndex = sorted.findIndex(u => u.uid === user.uid);
        const myRankVal = myIndex !== -1 ? myIndex + 1 : null;
        const myScoreVal = myIndex !== -1 ? (activeTab === 'transaction' ? (user.monthlySpent || 0) : (user.monthlyEarned || 0)) : 0;

        return {
            top3: sorted.slice(0, 3),
            rest: sorted.slice(3),
            myRank: myRankVal,
            myScore: myScoreVal
        };
    }, [activeList, activeTab, user.uid, user.monthlySpent, user.monthlyEarned]);

    return (
        <div className="fixed inset-0 z-50 bg-[#F8FAFC] dark:bg-[#0B1120] flex flex-col font-sans overflow-hidden animate-smart-fade-in text-slate-900 dark:text-white keep-animating">
            
            {/* --- HEADER --- */}
            <div className="relative z-50 pt-safe-top px-4 pb-4 bg-white/90 dark:bg-[#1E293B]/90 backdrop-blur-xl sticky top-0 border-b border-gray-200 dark:border-gray-800 shadow-sm keep-animating">
                <div className="relative flex items-center justify-center h-14 mb-4 mt-2">
                    <button 
                        onClick={onClose} 
                        className="absolute left-0 p-2.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-slate-600 dark:text-slate-300 z-10 active:scale-90"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                    
                    <h1 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary uppercase tracking-widest animate-smart-pop-in">
                        {texts.ranking}
                    </h1>
                </div>

                <div className="flex p-1.5 bg-gray-100 dark:bg-gray-950 rounded-[1.4rem] border border-gray-200 dark:border-gray-800 shadow-inner relative overflow-hidden">
                    <button 
                        onClick={() => setActiveTab('transaction')}
                        className={`flex-1 relative flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-[10.5px] font-black transition-all duration-500 ease-out z-10 uppercase tracking-wider
                            ${activeTab === 'transaction' 
                                ? 'text-white scale-[1.02]' 
                                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
                            }`}
                    >
                        {activeTab === 'transaction' && (
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 rounded-xl shadow-[0_8px_20px_-6px_rgba(79,70,229,0.5)] animate-smart-pop-in"></div>
                        )}
                        <ShoppingBagIcon className={`w-3.5 h-3.5 relative z-10 transition-transform duration-300 ${activeTab === 'transaction' ? 'scale-110' : 'opacity-40'}`} />
                        <span className="relative z-10">{texts.monthlyTraders}</span>
                    </button>

                    {earnVisible && (
                        <button 
                            onClick={() => setActiveTab('earning')}
                            className={`flex-1 relative flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-[10.5px] font-black transition-all duration-500 ease-out z-10 uppercase tracking-wider
                                ${activeTab === 'earning' 
                                    ? 'text-white scale-[1.02]' 
                                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
                                }`}
                        >
                            {activeTab === 'earning' && (
                                <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-rose-500 to-fuchsia-600 rounded-xl shadow-[0_8px_20px_-6px_rgba(236,72,153,0.5)] animate-smart-pop-in"></div>
                            )}
                            <GiftIcon className={`w-3.5 h-3.5 relative z-10 transition-transform duration-300 ${activeTab === 'earning' ? 'scale-110' : 'opacity-40'}`} />
                            <span className="relative z-10">{texts.monthlyEarners}</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-40 pb-32 no-scrollbar keep-animating">
                
                {initialLoading ? (
                    <div className="flex flex-col items-center justify-center py-40">
                         <PremiumSpinner />
                    </div>
                ) : activeList.length > 0 ? (
                    <>
                        <div className="relative pt-16 pb-12 px-4 keep-animating">
                            <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/5 to-transparent dark:from-primary/10 pointer-events-none" />

                            <div className="flex justify-center items-end gap-2 sm:gap-6 relative z-10">
                                
                                {/* RANK 2 */}
                                {top3[1] && (
                                    <div className="flex flex-col items-center w-1/3 order-1 animate-smart-slide-up" style={{ animationDelay: '100ms' }}>
                                        <div className="mb-2">
                                            <CrownIcon className="w-6 h-6 sm:w-7 sm:h-7 text-slate-300 drop-shadow-sm" fill="currentColor" />
                                        </div>
                                        <div className="relative">
                                            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-br from-slate-200 to-slate-400 shadow-lg">
                                                <img 
                                                    src={top3[1].avatarUrl || DEFAULT_AVATAR_URL} 
                                                    className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-800"
                                                    alt="Rank 2"
                                                />
                                            </div>
                                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 bg-slate-500 text-white rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white dark:border-slate-800 shadow-md">2</div>
                                        </div>
                                        <div className="text-center mt-4">
                                            <p className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[80px] mx-auto">{top3[1].name}</p>
                                            <div className="mt-1.5 px-2.5 py-0.5 rounded-lg bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10 shadow-sm backdrop-blur-sm inline-block">
                                                <p className="text-[11px] font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                                                    {texts.currency}{Math.floor(activeTab === 'transaction' ? (top3[1].monthlySpent || 0) : (top3[1].monthlyEarned || 0)).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* RANK 1 */}
                                {top3[0] && (
                                    <div className="flex flex-col items-center w-1/3 order-2 -mt-10 sm:-mt-14 animate-smart-slide-up z-20">
                                        <div className="mb-2 relative">
                                            <CrownIcon className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400 drop-shadow-md animate-bounce" fill="currentColor" />
                                            <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-30 animate-pulse"></div>
                                        </div>
                                        <div className="relative">
                                            <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full p-1.5 bg-gradient-to-br from-yellow-300 via-yellow-500 to-orange-500 shadow-2xl shadow-yellow-500/20">
                                                <img 
                                                    src={top3[0].avatarUrl || DEFAULT_AVATAR_URL} 
                                                    className="w-full h-full rounded-full object-cover border-4 border-white dark:border-slate-900"
                                                    alt="Rank 1"
                                                />
                                            </div>
                                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full flex items-center justify-center text-xs font-black border-2 border-white dark:border-slate-800 shadow-lg">1</div>
                                        </div>
                                        <div className="text-center mt-5">
                                            <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-white truncate max-w-[100px] mx-auto">{top3[0].name}</p>
                                            <div className="mt-2 px-4 py-1 rounded-xl bg-white/80 dark:bg-white/10 border border-white dark:border-white/20 shadow-md backdrop-blur-md inline-block">
                                                <p className="text-[13px] font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                                                    {texts.currency}{Math.floor(activeTab === 'transaction' ? (top3[0].monthlySpent || 0) : (top3[0].monthlyEarned || 0)).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* RANK 3 */}
                                {top3[2] && (
                                    <div className="flex flex-col items-center w-1/3 order-3 animate-smart-slide-up" style={{ animationDelay: '200ms' }}>
                                        <div className="mb-2">
                                            <CrownIcon className="w-6 h-6 sm:w-7 sm:h-7 text-amber-600 opacity-80 drop-shadow-sm" fill="currentColor" />
                                        </div>
                                        <div className="relative">
                                            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full p-1 bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg">
                                                <img 
                                                    src={top3[2].avatarUrl || DEFAULT_AVATAR_URL} 
                                                    className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-800"
                                                    alt="Rank 3"
                                                />
                                            </div>
                                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-amber-700 text-white rounded-full flex items-center justify-center text-[9px] font-black border-2 border-white dark:border-slate-800 shadow-md">3</div>
                                        </div>
                                        <div className="text-center mt-4">
                                            <p className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[70px] mx-auto">{top3[2].name}</p>
                                            <div className="mt-1.5 px-2.5 py-0.5 rounded-lg bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10 shadow-sm backdrop-blur-sm inline-block">
                                                <p className="text-[11px] font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                                                    {texts.currency}{Math.floor(activeTab === 'transaction' ? (top3[2].monthlySpent || 0) : (top3[2].monthlyEarned || 0)).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-4 space-y-3 pb-6">
                            {rest.map((rUser, index) => {
                                const rank = index + 4;
                                const isMe = rUser.uid === user.uid;
                                const score = activeTab === 'transaction' ? (rUser.monthlySpent || 0) : (rUser.monthlyEarned || 0);

                                return (
                                    <div 
                                        key={rUser.uid} 
                                        className={`relative flex items-center p-3.5 rounded-2xl transition-all border ${isMe ? 'bg-primary/5 border-primary/30 shadow-md scale-[1.01]' : 'bg-white dark:bg-[#1E293B] border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md'}`}
                                    >
                                        <div className="relative">
                                            <img src={rUser.avatarUrl || DEFAULT_AVATAR_URL} className="w-12 h-12 rounded-full object-cover border border-gray-100 dark:border-gray-700 shadow-sm" alt="User" />
                                            {isMe && (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
                                                    <span className="text-[6px] font-black">Y</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0 pl-4">
                                            <p className={`text-[14px] font-black truncate leading-tight ${isMe ? 'text-primary' : 'text-slate-800 dark:text-slate-100'}`}>
                                                {rUser.name}
                                            </p>
                                            <div className="flex items-center mt-1.5">
                                                <div className="px-2 py-0.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-inner">
                                                    <span className="text-[12px] font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                                                        {texts.currency}{Math.floor(score).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pl-2 flex items-center justify-center min-w-[40px]">
                                            <span className={`text-[17px] font-extrabold bg-clip-text text-transparent ${isMe ? 'bg-gradient-to-r from-primary to-secondary' : 'bg-gradient-to-r from-slate-400 to-slate-600 dark:from-slate-500 dark:to-slate-300'}`}>
                                                {rank}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center pt-40 opacity-40">
                        <TrophyIcon className="w-10 h-10 text-gray-400 mb-2" />
                        <p className="text-xs font-bold uppercase tracking-widest">No data available</p>
                    </div>
                )}
            </div>

            {/* MY FIXED BOTTOM CARD */}
            {myRank && myRank > 3 && !initialLoading && (
                <div className="absolute bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-white via-white to-transparent dark:from-[#0B1120] dark:via-[#0B1120]">
                    <div className="flex items-center p-3.5 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white shadow-xl shadow-primary/30 border border-white/20">
                         <img src={user.avatarUrl || DEFAULT_AVATAR_URL} className="w-12 h-12 rounded-full object-cover border-2 border-white/30" alt="Me" />
                        <div className="flex-1 min-w-0 pl-4">
                            <p className="text-sm font-black truncate">{user.name}</p>
                            <div className="mt-1 inline-block px-2 py-0.5 rounded-lg bg-white/20 backdrop-blur-sm border border-white/10">
                                <p className="text-[11px] font-bold text-white">
                                    {texts.currency}{Math.floor(myScore).toLocaleString()} — Position: #{myRank}
                                </p>
                            </div>
                        </div>
                        <div className="pl-2">
                             <span className="text-[18px] font-black opacity-50">#{myRank}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RankingScreen;
