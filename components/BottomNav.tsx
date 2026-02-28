import React, { FC, useState, useEffect } from 'react';
import type { Screen } from '../types';

// SVG Icons
const HomeIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>);
const WalletIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>);
const GiftIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>);
const UserIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);

interface BottomNavProps {
  activeScreen: Screen;
  setActiveScreen: (screen: Screen) => void;
  texts: any;
  earnEnabled: boolean;
}

const BottomNav: FC<BottomNavProps> = ({ activeScreen, setActiveScreen, texts, earnEnabled }) => {
  const [isAnimatingWallet, setIsAnimatingWallet] = useState(false);

  useEffect(() => {
    const handleDeposit = (event: CustomEvent) => {
      setIsAnimatingWallet(true);
      setTimeout(() => {
        setIsAnimatingWallet(false);
      }, 1000);
    };

    document.addEventListener('wallet-deposit', handleDeposit as EventListener);
    return () => {
      document.removeEventListener('wallet-deposit', handleDeposit as EventListener);
    };
  }, []);

  const allNavItems = [
    { screen: 'home' as Screen, label: texts.navHome, Icon: HomeIcon, visible: true },
    { screen: 'wallet' as Screen, label: texts.navWallet, Icon: WalletIcon, visible: true },
    { screen: 'watchAds' as Screen, label: texts.navEarn, Icon: GiftIcon, visible: earnEnabled },
    { screen: 'profile' as Screen, label: texts.navProfile, Icon: UserIcon, visible: true },
  ];

  const visibleNavItems = allNavItems.filter(item => item.visible);

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-4 pt-1 pb-1 z-50 md:hidden">
      <div 
        className="relative bg-light-card/95 dark:bg-dark-card/95 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-[20px] shadow-2xl shadow-black/20"
      >
        <div className="flex justify-around items-center h-[60px] px-1">
          {visibleNavItems.map((item) => {
            const isActive = activeScreen === item.screen;
            const Icon = item.Icon;
            const isWallet = item.screen === 'wallet';
            
            return (
              <button
                key={item.screen}
                onClick={() => setActiveScreen(item.screen)}
                className="flex flex-col items-center justify-center flex-1 transition-all duration-300 ease-in-out active:scale-90 group"
                aria-current={isActive ? 'page' : undefined}
              >
                <div className={`relative w-[34px] h-[34px] rounded-full flex items-center justify-center transition-all duration-300
                  ${isActive 
                    ? 'bg-gradient-to-br from-primary to-secondary text-white shadow-lg shadow-primary/30' 
                    : 'bg-gray-100 dark:bg-dark-bg text-gray-500 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-slate-700'
                  }
                  ${isWallet && isAnimatingWallet ? 'animate-wallet-scale' : ''}
                  `}
                >
                    <Icon className={`w-[18px] h-[18px] transition-colors duration-300 ${isActive ? 'text-white' : 'text-inherit'}`} />
                    
                    {isWallet && isAnimatingWallet && (
                         <div className="absolute inset-0 pointer-events-none">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div 
                                    key={i}
                                    className="absolute left-1/2 top-1/2 w-1 h-1 bg-yellow-400 rounded-full animate-gold-sparkle"
                                    style={{
                                        transform: `rotate(${i * 60}deg)`,
                                        animationDelay: `${i * 0.05}s`
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
                <span className={`text-[10px] mt-0.5 font-medium transition-all duration-300 capitalize ${isActive ? 'text-primary font-bold' : 'text-gray-400 dark:text-gray-500'}`}>
                    {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BottomNav;