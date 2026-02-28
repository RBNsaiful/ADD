
import React, { useState, useEffect, useMemo, FC, useRef, useLayoutEffect } from 'react';
import AuthScreen from './components/AuthScreen';
import HomeScreen from './components/HomeScreen';
import ProfileScreen from './components/ProfileScreen';
import WalletScreen from './components/WalletScreen';
import MyOrdersScreen from './components/MyOrdersScreen';
import MyTransactionScreen from './components/MyTransactionScreen';
import ContactUsScreen from './components/ContactUsScreen';
import ChangePasswordScreen from './components/ChangePasswordScreen';
import WatchAdsScreen from './components/WatchAdsScreen';
import EditProfileScreen from './components/EditProfileScreen';
import NotificationScreen from './components/NotificationScreen';
import AdminScreen from './components/AdminScreen'; 
import RankingScreen from './components/RankingScreen'; 
import GamerTestScreen from './components/GamerTestScreen';
import BottomNav from './components/BottomNav';
import RewardAnimation from './components/RewardAnimation';
import AiSupportBot from './components/AiSupportBot'; 
import PwaInstallPrompt from './components/PwaInstallPrompt';
import { TEXTS, DIAMOND_OFFERS as initialDiamondOffers, PUBG_OFFERS as initialPubgOffers, LEVEL_UP_PACKAGES as initialLevelUpPackages, MEMBERSHIPS as initialMemberships, PREMIUM_APPS as initialPremiumApps, APP_LOGO_URL, DEFAULT_APP_SETTINGS, PAYMENT_METHODS as initialPaymentMethods, BANNER_IMAGES as initialBanners, SUPPORT_CONTACTS as initialContacts, IMO_OFFERS as initialImoOffers } from './constants';
import type { User, Language, Theme, Screen, DiamondOffer, PubgOffer, LevelUpPackage, Membership, PremiumApp, Notification, AppSettings, PaymentMethod, SupportContact, Banner, SpecialOffer, AppVisibility } from './types';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, onValue, remove, runTransaction, push } from 'firebase/database';

// Helper for smart balance formatting
const formatBalance = (val: number) => Number(val || 0).toFixed(2).replace(/\.00$/, "");

const ArrowLeftIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>);
const WalletHeaderIcon: FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" />
        <path d="M16 10h6v4h-6z" />
    </svg>
);
const BellIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
);
const MaintenanceIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
);
const XIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);

interface HeaderProps {
    appName: string;
    logoUrl: string;
    logoActive: boolean;
    screen: Screen;
    texts: any;
    onBack: () => void;
    user: User | null;
    onNavigate: (screen: Screen) => void;
    isBalancePulsing: boolean;
    onBalancePulseEnd: () => void;
    hasUnreadNotifications: boolean;
}

const Header: FC<HeaderProps> = ({ appName, logoUrl, logoActive, screen, texts, onBack, user, onNavigate, isBalancePulsing, onBalancePulseEnd, hasUnreadNotifications }) => {
    if (user && user.role && user.role.toLowerCase() === 'admin') return null;
    if (screen === 'watchAds' || screen === 'gamerTest') return null; 

    const isSubScreen = (['myOrders', 'myTransaction', 'contactUs', 'wallet', 'changePassword', 'editProfile', 'notifications'] as Screen[]).includes(screen);
    const titleMap: { [key in Screen]?: string } = {
        myOrders: texts.myOrders,
        myTransaction: texts.myTransaction,
        contactUs: texts.contactUs,
        wallet: texts.navWallet,
        changePassword: texts.changePasswordTitle,
        watchAds: texts.watchAdsScreenTitle,
        editProfile: texts.editProfileTitle,
        notifications: texts.notifications, 
        ranking: texts.ranking, 
    };

    if (screen === 'admin' || screen === 'profile' || screen === 'aiChat' || screen === 'ranking' || screen === 'gamerTest') return null;

    const DesktopNavLink = ({ target, label }: { target: Screen, label: string }) => (
        <button 
            onClick={() => onNavigate(target)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${screen === target ? 'bg-primary/10 text-primary' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
        >
            {label}
        </button>
    );

    if (isSubScreen) {
        return (
            <header className="bg-light-bg dark:bg-dark-bg p-4 flex items-center justify-between sticky top-0 z-20 h-16 border-b border-gray-200 dark:border-gray-800 shadow-sm md:px-8 relative">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-16">
                    <h1 className="w-full text-center truncate text-[1.12rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary tracking-widest uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,0.1)]">
                        {titleMap[screen]}
                    </h1>
                </div>

                <div className="flex-1 flex justify-start items-center gap-4 z-10">
                    <button onClick={onBack} className="text-gray-500 dark:text-gray-400 p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-dark-card transition-all active:scale-90 bg-white/50 dark:bg-white/5">
                        <ArrowLeftIcon className="w-6 h-6"/>
                    </button>
                    <div className="hidden md:flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                        <span onClick={() => onNavigate('home')} className="hover:text-primary cursor-pointer transition-colors">Home</span>
                        <span className="mx-2 opacity-50">/</span>
                        <span className="text-gray-900 dark:text-white uppercase font-bold tracking-tight">{titleMap[screen]}</span>
                    </div>
                </div>

                <div className="flex-1 flex justify-end z-10">
                     <div className="hidden md:block">
                        {user && (
                            <button onClick={() => onNavigate('wallet')} className="flex items-center space-x-2 text-primary font-bold px-3 py-1 rounded-full hover:bg-primary/5 transition-colors border border-primary/20">
                                <WalletHeaderIcon className="w-5 h-5" />
                                <span>{formatBalance(user.balance)}{texts.currency}</span>
                            </button>
                        )}
                     </div>
                </div>
            </header>
        );
    }

    return (
        <header className="bg-light-bg dark:bg-dark-bg p-4 md:px-8 flex items-center justify-between sticky top-0 z-20 h-16 shadow-sm border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-4 md:gap-8">
                <div className="flex items-center gap-2 cursor-pointer group" onClick={() => onNavigate('home')}>
                    {logoActive && (
                        <div className="w-8 h-8 rounded-lg overflow-hidden shadow-lg shadow-primary/20 border border-white/20 group-hover:scale-110 transition-transform duration-300">
                            <img src={logoUrl} alt="App Logo" className="w-full h-full object-cover" />
                        </div>
                    )}
                    <h1 className="ml-1.5 text-[1.77rem] md:text-[2.12rem] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary drop-shadow-[0_2px_2px_rgba(0,0,0,0.2)] dark:drop-shadow-[0_2px_5px_rgba(124,58,237,0.3)]">
                        {appName}
                    </h1>
                </div>
                {user && (
                    <div className="hidden md:flex items-center space-x-2">
                        <DesktopNavLink target="home" label={texts.navHome} />
                        <DesktopNavLink target="wallet" label={texts.navWallet} />
                        <DesktopNavLink target="watchAds" label={texts.navEarn} />
                        <DesktopNavLink target="profile" label={texts.navProfile} />
                    </div>
                )}
            </div>
            
            {user && (
                <div className="flex items-center space-x-4">
                     <button onClick={() => onNavigate('notifications')} className="relative w-[35.1px] h-[35.1px] flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Notifications">
                        <BellIcon className="w-[21.1px] h-[21.1px]" />
                        {hasUnreadNotifications && (<span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-800 animate-pulse"></span>)}
                    </button>
                    <button onClick={() => onNavigate('wallet')} className="flex items-center space-x-2 bg-gradient-to-r from-primary to-secondary text-white font-bold px-[17.2px] py-[6.9px] rounded-full text-[16.0px] hover:opacity-90 transition-opacity shadow-lg shadow-primary/30 active:scale-95 transition-transform" data-testid="header-wallet-button">
                        <WalletHeaderIcon className="w-[21.1px] h-[21.1px]" />
                        <span onAnimationEnd={onBalancePulseEnd} className={isBalancePulsing ? 'animate-balance-pulse' : ''}>{formatBalance(user.balance)}{texts.currency}</span>
                    </button>
                    <div onClick={() => onNavigate('profile')} className="hidden md:block w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 cursor-pointer hover:border-primary transition-colors">
                        <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                </div>
            )}
        </header>
    );
};


const App: FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true); 
  const [loading, setLoading] = useState(true); 
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme | null) || 'light');
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('language') as Language | null) || 'en');
  const [activeScreen, setActiveScreen] = useState<Screen>('home');
  const [prefilledWalletAmount, setPrefilledWalletAmount] = useState<number | null>(null);
  
  const isLoggingOutRef = useRef(false);

  const resetLogoutLock = () => {
      isLoggingOutRef.current = false;
  };

  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
      const saved = localStorage.getItem('cachedAppSettings');
      return saved ? { ...DEFAULT_APP_SETTINGS, ...JSON.parse(saved) } : DEFAULT_APP_SETTINGS;
  });
  
  const [diamondOffers, setDiamondOffers] = useState<DiamondOffer[]>(initialDiamondOffers);
  const [pubgOffers, setPubgOffers] = useState<PubgOffer[]>(initialPubgOffers);
  const [mlbbOffers, setMlbbOffers] = useState<any[]>([]); 
  const [imoOffers, setImoOffers] = useState<any[]>(initialImoOffers);
  const [levelUpPackages, setLevelUpPackages] = useState<LevelUpPackage[]>(initialLevelUpPackages);
  const [memberships, setMemberships] = useState<Membership[]>(initialMemberships);
  const [premiumApps, setPremiumApps] = useState<PremiumApp[]>(initialPremiumApps);
  const [specialOffers, setSpecialOffers] = useState<SpecialOffer[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(initialPaymentMethods);
  const [banners, setBanners] = useState<Banner[]>(initialBanners);
  const [supportContacts, setSupportContacts] = useState<SupportContact[]>(initialContacts);

  const [isBalancePulsing, setIsBalancePulsing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [showRewardAnim, setShowRewardAnim] = useState(false);
  const [earnedAmount, setEarnedAmount] = useState(0);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  
  const prevBalanceRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    const timer = setTimeout(() => window.scrollTo(0, 0), 0);
    return () => clearTimeout(timer);
  }, [activeScreen]);

  // --- GLOBAL AUTO-REFUND BACKGROUND WATCHER (FOR USER) ---
  useEffect(() => {
      if (!user || !user.uid || appSettings.autoRefundActive === false) return;

      const checkMyRefunds = async () => {
          const ordersRef = ref(db, 'orders/' + user.uid);
          const refundLimitMs = (appSettings.autoRefundMinutes || 30) * 60 * 1000;
          const now = Date.now();

          onValue(ordersRef, (snapshot) => {
              if (snapshot.exists()) {
                  const data = snapshot.val();
                  Object.keys(data).forEach(async (key) => {
                      const order = data[key];
                      if (order.status === 'Pending') {
                          const start = new Date(order.date).getTime();
                          if (now - start >= refundLimitMs) {
                              // Trigger Refund & Delete
                              const orderPath = `orders/${user.uid}/${key}`;
                              const userRef = ref(db, `users/${user.uid}`);
                              
                              // Check if we are already deleting this (prevent race condition)
                              await remove(ref(db, orderPath));
                              
                              await runTransaction(userRef, (userData) => {
                                  if (userData) {
                                      userData.balance = (Number(userData.balance) || 0) + Number(order.offer?.price || 0);
                                  }
                                  return userData;
                              });

                              // Push detailed notification
                              await push(ref(db, 'notifications'), {
                                  title: "Auto-Refund Successful",
                                  title_bn: "অটো-রিফান্ড সফল হয়েছে",
                                  message: `Order #${order.id} for ৳${order.offer?.price} was not processed in time and has been refunded to your wallet.`,
                                  message_bn: `আপনার #${order.id} অর্ডারটি (৳${order.offer?.price}) নির্দিষ্ট সময়ে প্রসেস না হওয়ায় টাকা রিফান্ড করা হয়েছে।`,
                                  timestamp: Date.now(),
                                  type: 'failed',
                                  targetUid: user.uid,
                                  isAuto: true
                              });
                          }
                      }
                  });
              }
          }, { onlyOnce: true });
      };

      const interval = setInterval(checkMyRefunds, 15000); // Check every 15s
      return () => clearInterval(interval);
  }, [user?.uid, appSettings.autoRefundActive, appSettings.autoRefundMinutes]);

  useEffect(() => {
      const configRef = ref(db, 'config');
      const unsubscribeConfig = onValue(configRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
              if (data.appSettings) {
                  setAppSettings(prev => {
                      const dbSettings = data.appSettings;
                      const newSettings = {
                          ...prev,
                          ...dbSettings,
                          visibility: { ...prev.visibility, ...(dbSettings.visibility || {}) },
                          earnSettings: { 
                              ...DEFAULT_APP_SETTINGS.earnSettings, 
                              ...prev.earnSettings, 
                              ...(dbSettings.earnSettings || {}),
                              webAds: { ...DEFAULT_APP_SETTINGS.earnSettings.webAds, ...(dbSettings.earnSettings?.webAds || {}) },
                              adMob: { ...DEFAULT_APP_SETTINGS.earnSettings.adMob, ...(dbSettings.earnSettings?.adMob || {}) },
                          },
                          developerSettings: {
                              ...DEFAULT_APP_SETTINGS.developerSettings,
                              ...(dbSettings.developerSettings || {})
                          },
                          uiSettings: {
                              ...DEFAULT_APP_SETTINGS.uiSettings,
                              ...(dbSettings.uiSettings || {})
                          },
                          walletSpacingActive: dbSettings.walletSpacingActive !== undefined ? dbSettings.walletSpacingActive : prev.walletSpacingActive,
                          walletVideoActive: dbSettings.walletVideoActive !== undefined ? dbSettings.walletVideoActive : prev.walletVideoActive,
                          maintenanceMode: dbSettings.maintenanceMode !== undefined ? dbSettings.maintenanceMode : prev.maintenanceMode,
                      };
                      localStorage.setItem('cachedAppSettings', JSON.stringify(newSettings));
                      return newSettings;
                  });
              }
              if (data.offers) {
                  if (data.offers.diamond) setDiamondOffers(Object.values(data.offers.diamond));
                  
                  // PUBG OFFERS: Merge Local Demo Offer (Royale Pass) if missing in DB
                  if (data.offers.pubg) {
                      const fetchedPubg = Object.values(data.offers.pubg) as PubgOffer[];
                      const hasRp = fetchedPubg.some(o => o.pubgType === 'rp');
                      if (!hasRp) {
                          // Force include the constant RP offer for demo purposes if not present
                          const demoRp = initialPubgOffers.find(o => o.pubgType === 'rp');
                          if (demoRp) fetchedPubg.push(demoRp);
                      }
                      setPubgOffers(fetchedPubg);
                  } else {
                      setPubgOffers(initialPubgOffers);
                  }

                  if (data.offers.mlbb) setMlbbOffers(Object.values(data.offers.mlbb));
                  if (data.offers.imo) setImoOffers(Object.values(data.offers.imo));
                  if (data.offers.levelUp) setLevelUpPackages(Object.values(data.offers.levelUp));
                  if (data.offers.membership) setMemberships(Object.values(data.offers.membership));
                  if (data.offers.premium) setPremiumApps(Object.values(data.offers.premium));
                  if (data.offers.special) setSpecialOffers(Object.values(data.offers.special));
              }
              if (data.paymentMethods) setPaymentMethods(Object.values(data.paymentMethods));
              if (data.banners) {
                  const rawBanners = Object.values(data.banners);
                  const formattedBanners = rawBanners.map((b: any) => 
                      typeof b === 'string' ? { imageUrl: b, actionUrl: '' } : b
                  );
                  setBanners(formattedBanners);
              }
              if (data.supportContacts) setSupportContacts(Object.values(data.supportContacts));
          }
      }, (error) => {});
      return () => unsubscribeConfig();
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
        if (isLoggingOutRef.current) {
            if (firebaseUser) { signOut(auth).catch(err => {}); }
            return;
        }

        if (firebaseUser) {
            const userRef = ref(db, 'users/' + firebaseUser.uid);
            const unsubscribeData = onValue(userRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const userData = { ...data, uid: firebaseUser.uid, playerUid: data.playerUid || '', role: data.role || 'user', isBanned: data.isBanned || false };
                    
                    const providers = firebaseUser.providerData.map(p => p.providerId);
                    const isGoogleSession = providers.includes('google.com');
                    const isPasswordSession = providers.includes('password');

                    if (data.loginProvider === 'password' && isGoogleSession && !isPasswordSession) { signOut(auth).catch(() => {}); return; }
                    if (data.loginProvider === 'google' && isPasswordSession && !isGoogleSession) { signOut(auth).catch(() => {}); return; }

                    if (userData.role === 'admin') { if (activeScreen !== 'admin') setActiveScreen('admin'); } else if (activeScreen === 'admin') { setActiveScreen('home'); }

                    setUser(userData);
                } else {
                    setUser({ name: firebaseUser.displayName || 'User', email: firebaseUser.email || '', balance: 0, uid: firebaseUser.uid, playerUid: '', avatarUrl: firebaseUser.photoURL || undefined, totalAdsWatched: 0, totalEarned: 0, role: 'user', isBanned: false });
                }
                setLoading(false);
                setAuthChecking(false); 
            }, (error) => {
                setUser(null);
                setLoading(false);
                setAuthChecking(false);
                signOut(auth).catch(() => {}); 
            });
            return () => unsubscribeData();
        } else {
            setUser(null);
            setNotifications([]); 
            setLoading(false);
            setAuthChecking(false);
        }
    });
    return () => unsubscribeAuth();
  }, []); 

  useEffect(() => {
      const notifRef = ref(db, 'notifications');
      const unsubscribeNotifs = onValue(notifRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
              const notifList: Notification[] = Object.keys(data).map(key => ({ ...data[key], id: key })).sort((a, b) => b.timestamp - a.timestamp);
              const relevantNotifs = notifList.filter(n => !n.targetUid || (user && n.targetUid === user.uid));
              setNotifications(relevantNotifs);
              const lastReadTimestamp = Number(localStorage.getItem('lastReadTimestamp') || 0);
              const hasNew = relevantNotifs.some(n => n.timestamp > lastReadTimestamp);
              setHasUnreadNotifications(hasNew);
          } else {
              setNotifications([]);
              setHasUnreadNotifications(false);
          }
      }, (error) => {});
      return () => unsubscribeNotifs();
  }, [user?.uid]);

  useEffect(() => {
      if (user && appSettings.popupNotification?.active && activeScreen !== 'admin') {
          const sessionKey = `shown_popup_${user.uid}`;
          const hasSeenThisSession = sessionStorage.getItem(sessionKey);
          if (!hasSeenThisSession) {
              setTimeout(() => setShowLoginPopup(true), 1200); 
              sessionStorage.setItem(sessionKey, 'true');
          }
      }
  }, [user?.uid, appSettings.popupNotification?.active, activeScreen]);

  useEffect(() => {
      if (user) {
          if (prevBalanceRef.current !== null && user.balance > prevBalanceRef.current) {
              document.dispatchEvent(new CustomEvent('wallet-deposit'));
              setIsBalancePulsing(true);
          }
          prevBalanceRef.current = user.balance;
      } else {
          prevBalanceRef.current = null;
      }
  }, [user?.balance]);

  const handleMarkNotificationsAsRead = () => {
      if (notifications.length > 0) {
          const latestTimestamp = notifications[0].timestamp;
          localStorage.setItem('lastReadTimestamp', latestTimestamp.toString());
          setHasUnreadNotifications(false);
      }
  };

  useEffect(() => {
    localStorage.setItem('theme', theme);
    const root = window.document.documentElement;
    if (theme === 'dark') { root.classList.add('dark'); } else { root.classList.remove('dark'); }
    document.querySelector('body')?.classList.add('font-sans');
  }, [theme]);
  
  useEffect(() => { localStorage.setItem('language', language); }, [language]);
  
  const handleLogout = async () => {
    isLoggingOutRef.current = true;
    try { 
        setUser(null); 
        setNotifications([]);
        setHasUnreadNotifications(false);
        setIsBalancePulsing(false);
        setEarnedAmount(0);
        setShowRewardAnim(false);
        setActiveScreen('home'); 
        localStorage.removeItem('lastReadTimestamp'); 
        sessionStorage.clear(); 
        await signOut(auth); 
    } catch (error) { setUser(null); }
  };
  
  const handleRewardEarned = (amount: number, showAnim: boolean = true) => { 
      setEarnedAmount(amount); 
      if (showAnim) { setShowRewardAnim(true); }
      setIsBalancePulsing(true); 
  };
  const handlePurchase = (price: number) => { setIsBalancePulsing(true); };

  const texts = useMemo(() => TEXTS[language], [language]);
  const handleBack = () => {
      if (activeScreen === 'wallet' || activeScreen === 'notifications') { setActiveScreen('home'); } else if((['myOrders', 'myTransaction', 'contactUs', 'changePassword', 'editProfile', 'ranking', 'gamerTest'] as Screen[]).includes(activeScreen)) { setActiveScreen('profile'); } else if (activeScreen === 'admin') { setActiveScreen('profile'); }
  }
  const handleSuccessNavigate = (screen: Screen) => { setActiveScreen(screen); };

  const handleInsufficientBalanceRedirect = (amount: number) => {
    setPrefilledWalletAmount(amount);
    setActiveScreen('wallet');
  };

  const animationsEnabled = appSettings.uiSettings?.animationsEnabled ?? true;

  if (authChecking || loading) return (<div className="min-h-screen w-full flex items-center justify-center bg-gray-100 dark:bg-gray-900"><div className="keep-animating animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>);

  if (!user) {
    return (
      <div className="min-h-screen w-full flex justify-center bg-gray-100 dark:bg-gray-900 font-sans">
        <div className="w-full max-w-md min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text relative shadow-2xl overflow-x-hidden flex flex-col items-center justify-center p-4">
            <AuthScreen texts={texts} appName={appSettings.appName} logoUrl={appSettings.logoUrl || APP_LOGO_URL} onLoginAttempt={resetLogoutLock} appSettings={appSettings} />
            <PwaInstallPrompt appName={appSettings.appName} logoUrl={appSettings.logoUrl || APP_LOGO_URL} />
        </div>
      </div>
    );
  }

  if (user.role && user.role.toLowerCase() === 'admin') {
      return ( <AdminScreen user={user} texts={texts} onNavigate={handleSuccessNavigate} onLogout={handleLogout} language={language} setLanguage={setLanguage} appSettings={appSettings} theme={theme} setTheme={setTheme} /> );
  }

  if (appSettings.maintenanceMode) {
      return (
          <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-6 text-center">
              <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 animate-pulse"><MaintenanceIcon className="w-12 h-12 text-red-500" /></div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">Under Maintenance</h1>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8">{appSettings.notice || "We are currently updating our servers to provide you with a better experience. You are logged in, but services are temporarily unavailable."}</p>
              <button onClick={handleLogout} className="px-6 py-3 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">Logout</button>
          </div>
      )
  }

  if (user.isBanned) {
      return (
          <div className="min-h-screen w-full flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/10 p-6 text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-2">Account Suspended</h1>
              <p className="text-gray-600 font-medium dark:text-gray-400">Your account has been suspended for violating our terms.</p>
              <button onClick={handleLogout} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg font-bold">Logout</button>
          </div>
      )
  }

  const renderScreen = () => {
    switch (activeScreen) {
      case 'home': return <HomeScreen user={user} texts={texts} onPurchase={handlePurchase} diamondOffers={diamondOffers} pubgOffers={pubgOffers} mlbbOffers={mlbbOffers} imoOffers={imoOffers} levelUpPackages={levelUpPackages} memberships={memberships} premiumApps={premiumApps} specialOffers={specialOffers} onNavigate={handleSuccessNavigate} bannerImages={banners} visibility={appSettings.visibility} homeAdActive={appSettings.earnSettings?.homeAdActive} homeAdCode={appSettings.earnSettings?.homeAdCode} uiSettings={appSettings.uiSettings} onInsufficientBalance={handleInsufficientBalanceRedirect} />;
      case 'wallet': return <WalletScreen user={user} texts={texts} onNavigate={handleSuccessNavigate} paymentMethods={paymentMethods} videoActive={appSettings.walletVideoActive} videoUrl={appSettings.walletVideoUrl} spacingActive={appSettings.walletSpacingActive} adCode={appSettings.earnSettings?.profileAdCode} adActive={appSettings.earnSettings?.profileAdActive} initialAmount={prefilledWalletAmount} onPrefillConsumed={() => setPrefilledWalletAmount(null)} appSettings={appSettings} />;
      case 'profile': return <ProfileScreen user={user} texts={texts} onLogout={handleLogout} setActiveScreen={handleSuccessNavigate} theme={theme} setTheme={setTheme} language={language} setLanguage={setLanguage} appSettings={appSettings} />;
      case 'myOrders': return <MyOrdersScreen user={user} texts={texts} appSettings={appSettings} adCode={appSettings.earnSettings?.profileAdCode} adActive={appSettings.earnSettings?.profileAdActive} />;
      case 'myTransaction': return <MyTransactionScreen user={user} texts={texts} adCode={appSettings.earnSettings?.profileAdCode} adActive={appSettings.earnSettings?.profileAdActive} />;
      case 'contactUs': return <ContactUsScreen texts={texts} contacts={supportContacts} adCode={appSettings.earnSettings?.profileAdCode} adActive={appSettings.earnSettings?.profileAdActive} appSettings={appSettings} />;
      case 'changePassword': return <ChangePasswordScreen texts={texts} onPasswordChanged={() => handleSuccessNavigate('profile')} onNavigate={handleSuccessNavigate} adCode={appSettings.earnSettings?.profileAdCode} adActive={appSettings.earnSettings?.profileAdActive} />;
      case 'watchAds': if (appSettings.visibility && !appSettings.visibility.earn) return null; return <WatchAdsScreen user={user} texts={texts} onRewardEarned={handleRewardEarned} earnSettings={appSettings.earnSettings} />;
      case 'editProfile': return <EditProfileScreen user={user} texts={texts} onNavigate={handleSuccessNavigate} adCode={appSettings.earnSettings?.profileAdCode} adActive={appSettings.earnSettings?.profileAdActive} />;
      case 'notifications': return <NotificationScreen texts={texts} notifications={notifications} onRead={handleMarkNotificationsAsRead} />;
      case 'ranking': if (appSettings.visibility && !appSettings.visibility.ranking) return null; return <RankingScreen user={user} texts={texts} adCode={appSettings.earnSettings?.profileAdCode} adActive={appSettings.earnSettings?.profileAdActive} onClose={() => handleSuccessNavigate('profile')} />;
      case 'gamerTest': return <GamerTestScreen user={user} texts={texts} onClose={() => handleSuccessNavigate('profile')} />;
      default: return <HomeScreen user={user} texts={texts} onPurchase={handlePurchase} diamondOffers={diamondOffers} pubgOffers={pubgOffers} mlbbOffers={mlbbOffers} imoOffers={imoOffers} levelUpPackages={levelUpPackages} memberships={memberships} premiumApps={premiumApps} specialOffers={specialOffers} onNavigate={handleSuccessNavigate} bannerImages={banners} visibility={appSettings.visibility} homeAdActive={appSettings.earnSettings?.homeAdActive} homeAdCode={appSettings.earnSettings?.homeAdCode} uiSettings={appSettings.uiSettings} onInsufficientBalance={handleInsufficientBalanceRedirect} />;
    }
  };

  const isFullScreenPage = activeScreen === 'profile' || activeScreen === 'watchAds' || activeScreen === 'ranking' || activeScreen === 'gamerTest';

  return (
    <div className="min-h-screen w-full flex justify-center bg-gray-100 dark:bg-gray-900 font-sans overflow-y-scroll">
        {!animationsEnabled && ( <style>{` *:not(.keep-animating):not(.keep-animating *), *:not(.keep-animating):not(.keep-animating *)::before, *:not(.keep-animating):not(.keep-animating *)::after { animation: none !important; transition: none !important; } .opacity-0:not(.keep-animating):not(.keep-animating *) { opacity: 1 !important; transform: none !important; } `}</style> )}
        
        <div className="w-full max-w-md md:max-w-7xl min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text relative shadow-2xl overflow-x-hidden">
            <Header appName={appSettings.appName} logoUrl={appSettings.logoUrl || APP_LOGO_URL} logoActive={appSettings.headerLogoActive ?? true} screen={activeScreen} texts={texts} onBack={handleBack} user={user} onNavigate={handleSuccessNavigate} isBalancePulsing={isBalancePulsing} onBalancePulseEnd={() => setIsBalancePulsing(false)} hasUnreadNotifications={hasUnreadNotifications} />
            
            <div className={!isFullScreenPage ? 'pb-24 md:pb-10' : ''}>
                <div className={`h-full w-full ${['wallet', 'profile', 'changePassword', 'editProfile', 'contactUs', 'myOrders', 'myTransaction', 'notifications', 'ranking', 'gamerTest'].includes(activeScreen) ? 'md:max-w-3xl md:mx-auto md:mt-6' : ''}`}>
                    {renderScreen()}
                </div>
            </div>
            
            <AiSupportBot user={user} appSettings={appSettings} diamondOffers={diamondOffers} paymentMethods={paymentMethods} supportContacts={supportContacts} levelUpPackages={levelUpPackages} memberships={memberships} premiumApps={premiumApps} specialOffers={specialOffers} activeScreen={activeScreen} setActiveScreen={handleSuccessNavigate} texts={texts} />

            {!['aiChat', 'ranking', 'admin', 'gamerTest'].includes(activeScreen) && ( <BottomNav activeScreen={activeScreen} setActiveScreen={handleSuccessNavigate} texts={texts} earnEnabled={appSettings.visibility?.earn ?? true} /> )}

            <PwaInstallPrompt appName={appSettings.appName} logoUrl={appSettings.logoUrl || APP_LOGO_URL} />
            
            {showRewardAnim && (<RewardAnimation amount={earnedAmount} texts={texts} onAnimationEnd={() => setShowRewardAnim(false)} />)}
            
            {showLoginPopup && appSettings.popupNotification && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-smart-fade-in">
                    <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden animate-smart-pop-in">
                        {appSettings.popupNotification.imageUrl ? (
                            <div className="w-full h-48 bg-gray-100 dark:bg-gray-700 animate-smart-fade-in">
                                <img src={appSettings.popupNotification.imageUrl} alt="Announcement" className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="pt-10"></div>
                        )}
                        <div className="p-6 text-center">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3 leading-tight tracking-tight px-2">{appSettings.popupNotification.title}</h3>
                            <p className="text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap px-1">{appSettings.popupNotification.message}</p>
                            <div className="px-4">
                                <button 
                                    onClick={() => setShowLoginPopup(false)} 
                                    className="mt-8 mb-2 w-full py-3.5 bg-gradient-to-r from-primary to-secondary text-white font-black rounded-2xl shadow-xl shadow-primary/30 hover:brightness-110 active:scale-[0.96] transition-all uppercase tracking-[0.2em] text-[11px]"
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default App;
