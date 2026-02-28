import type { FC } from 'react';

export type Language = 'en' | 'bn';
export type Theme = 'light' | 'dark';
export type Screen = 'home' | 'wallet' | 'profile' | 'myOrders' | 'myTransaction' | 'contactUs' | 'changePassword' | 'watchAds' | 'editProfile' | 'notifications' | 'admin' | 'aiChat' | 'ranking' | 'gamerTest';

export interface User {
  name: string;
  email: string;
  balance: number;
  pin?: string; // 4-digit security PIN
  gamerBalance?: number; // Isolated PX Coins for the game
  uid: string; // Firebase Auth UID
  playerUid?: string; // Free Fire UID (Game ID)
  avatarUrl?: string;
  avatarUpdateCount?: number; // Counter for profile picture changes
  totalAdsWatched: number;
  totalEarned: number;
  totalSpent?: number; // Lifetime purchases
  totalDeposit?: number; // Lifetime money added
  monthlySpent?: number; // NEW: Purchases in current month
  monthlyEarned?: number; // NEW: Earnings in current month
  lastMonthUpdate?: string; // NEW: Format "YYYY-MM" to detect reset
  role?: 'user' | 'admin';
  isBanned?: boolean;
  authMethod?: 'password' | 'google'; 
  aiRequestCount?: number; 
  registrationDate?: number; 
  lastLogin?: number; 
  adsWatchedInfo?: {
      count: number;
      lastAdTimestamp?: number;
      limitReachedAt?: number; 
  };
  gamerLevels?: {
    unlocked: number;
    points: number;
  };
}

export interface Banner {
  id?: string;
  imageUrl: string;
  actionUrl?: string;
}

export interface DiamondOffer {
  id: number;
  diamonds: number;
  price: number;
  name?: string;
  ribbonLabel?: string;
}

export interface PubgOffer {
  id: number;
  uc: number;
  price: number;
  name?: string;
  pubgType?: 'uc' | 'rp';
  ribbonLabel?: string;
}

export interface LevelUpPackage {
  id: number;
  name: string;
  price: number;
  diamonds?: number;
  ribbonLabel?: string;
}

export interface Membership {
  id: number;
  name: string;
  price: number;
  diamonds?: number;
  ribbonLabel?: string;
}

export interface PremiumApp {
  id: number;
  name: string;
  price: number;
  description?: string;
  ribbonLabel?: string;
}

export interface SpecialOffer {
  id: number;
  name: string; 
  title: string; 
  price: number;
  diamonds: number;
  isActive: boolean;
  ribbonLabel?: string;
}

export interface GenericOffer {
  id: number;
  name: string;
  price: number;
  icon?: FC<{ className?: string }>;
  diamonds?: number;
  inputType?: 'uid' | 'email' | 'pubg' | 'mlbb' | 'imo';
  ribbonLabel?: string;
}

export interface PaymentMethod {
  name:string;
  logo: string;
  accountNumber: string;
  instructions?: string;
  isActive?: boolean;
}

export interface SupportContact {
  type: string;
  labelKey: string;
  link: string;
  iconUrl?: string; // Added for custom logos
  title?: string;
}

export interface FaqItem {
    id: string;
    question: string;
    question_bn?: string;
    answer: string;
    answer_bn?: string;
}

export type PurchaseStatus = 'Completed' | 'Pending' | 'Failed';
export type TransactionStatus = 'Completed' | 'Pending' | 'Failed';

export interface Purchase {
  id: string;
  key?: string;
  offer: DiamondOffer | GenericOffer;
  price: number;
  date: string;
  status: PurchaseStatus;
  uid: string;
  userId: string; 
}

export interface Transaction {
  id:string;
  key?: string;
  amount: number;
  date: string;
  method: string; 
  status: TransactionStatus;
  userId: string;
  type?: 'deposit' | 'ad_reward'; 
}

export interface Notification {
  id: string;
  title: string;
  title_bn?: string;
  message: string;
  message_bn?: string;
  timestamp: number;
  type: 'success' | 'failed' | 'admin' | 'bonus' | 'offer';
  targetUid?: string; 
  isAuto?: boolean; 
}

export interface AppVisibility {
  diamonds: boolean;
  pubg: boolean;
  mlbb: boolean;
  imo: boolean;
  levelUp: boolean;
  membership: boolean;
  premium: boolean;
  earn: boolean;
  ranking: boolean;
  specialOffers: boolean; 
}

export interface EarnSettings {
    dailyLimit: number;
    rewardPerAd: number;
    adCooldownSeconds: number;
    resetHours: number;
    vpnRequired?: boolean; 
    vpnNoticeActive?: boolean; 

    webAds: {
        active: boolean;
        url: string; 
        duration: number; 
    };

    adMob: {
        active: boolean;
        appId: string; 
        rewardId: string;
        interstitialId?: string;
        bannerId?: string;
    };

    homeAdCode?: string;
    homeAdActive?: boolean; 
    earnAdCode?: string;
    earnAdActive?: boolean; 
    
    profileAdCode?: string;
    profileAdActive?: boolean;
}

export interface DeveloperSettings {
    title: string;
    url: string;
    message: string;
    description: string;
}

export interface UiSettings {
    cardSize: 'normal' | 'small' | 'smaller' | 'extra-small';
    animationsEnabled: boolean;
    offerAnimationEnabled: boolean;
    showCardBorder: boolean; 
}

export interface PopupConfig {
    active: boolean;
    title: string;
    message: string;
    imageUrl?: string;
}

export interface AppSettings {
  appName: string;
  maintenanceMode: boolean;
  headerLogoActive?: boolean; 
  loginAppNameActive?: boolean; 
  aiSupportActive?: boolean; 
  aiApiKey?: string; 
  aiName?: string; 
  notice?: string;
  logoUrl?: string;
  contactMessage?: string; 
  operatingHours?: string; 
  visibility?: AppVisibility;
  earnSettings?: EarnSettings;
  developerSettings?: DeveloperSettings;
  uiSettings?: UiSettings;
  popupNotification?: PopupConfig; 
  walletVideoActive?: boolean; 
  walletVideoUrl?: string; 
  walletSpacingActive?: boolean; 
  autoNotifActive?: boolean; 
  isQuizEnabled?: boolean; 
  autoRefundActive?: boolean;
  autoRefundMinutes?: number;
  ageVerifyActive?: boolean;
  domainControlUrl?: string;
}