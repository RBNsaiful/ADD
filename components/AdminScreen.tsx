import React, { useState, useEffect, FC, FormEvent, useMemo, useRef } from 'react';
import { User, Screen, Transaction, Purchase, AppSettings, Language, PaymentMethod, AppVisibility, Notification, DeveloperSettings, Banner, Theme, PopupConfig, FaqItem } from '../types';
import { db } from '../firebase';
import { ref, update, onValue, get, remove, push, set, runTransaction, query, limitToLast, orderByChild } from 'firebase/database';
import { 
    APP_LOGO_URL,
    DEFAULT_AVATAR_URL,
    DEFAULT_APP_SETTINGS,
    PROTECTION_KEY
} from '../constants';
import ImageCropper from './ImageCropper';

// --- ICONS ---
const DashboardIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>);
const UsersIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
const OrdersIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>);
const MoneyIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>);
const SettingsIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>);
const LockIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>);
const CheckIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12" /></svg>);
const ImageIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>);
const TagIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>);
const TrashIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1-2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>);
const CopyIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>);
const EditIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);
const WalletIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>);
const BellIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>);
const ContactIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
const MenuIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>);
const MegaphoneIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 11.11V4a2 2 0 0 1 2-2h4.76c1.53 0 2.9.86 3.57 2.24l1.18 2.43a2 2 0 0 0 1.8 1.12H20a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-3.67a2 2 0 0 0-1.8 1.12l-1.18 2.43A4 4 0 0 1 9.76 20H5a2 2 0 0 1-2-2v-6.89z"/><path d="M13 11h.01"/></svg>);
const EyeIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>);
const SearchIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>);
const CodeIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>);
const RobotIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 8V4H8" /><rect x="4" y="8" width="16" height="12" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>);
const DollarIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" x2="12" y1="1" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>);
const GridIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>);
const BackIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>);
const SortIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M11 5h10"/><path d="M11 9h7"/><path d="M11 13h4"/><path d="M3 17l3 3 3-3"/><path d="M6 18V4"/></svg>);
const PlayIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>);
const PlusIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const MinusIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const ShieldIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>);
const GamepadIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="2"/></svg>);
const HelpIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>);
const GripIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/>
        <circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
    </svg>
);
const ClockIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14" /></svg>);
const PhoneIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>);
const PieChartIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>);
const HistoryIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>);
const DownloadIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>);
const UploadCloudIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/><polyline points="16 16 12 12 8 16"/></svg>);

// Offer Icons
const DiamondIcon: FC<{className?: string}> = ({className}) => (<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}><path d="M12 2L2 8.5l10 13.5L22 8.5 12 2z" /></svg>);
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
            <linearGradient id="admin-mlbb-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#1E3A8A" />
            </linearGradient>
        </defs>
        <path d="M12 2L2 8.5l10 13.5L22 8.5 12 2z" fill="url(#admin-mlbb-grad)" />
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


interface AdminScreenProps {
    user: User;
    texts: any;
    onNavigate: (screen: Screen) => void;
    onLogout: () => void;
    language: Language;
    setLanguage: (lang: Language) => void;
    appSettings: AppSettings;
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const LiveAdminTimer: FC<{ date: string, limitMinutes: number }> = ({ date, limitMinutes }) => {
    const [remaining, setRemaining] = useState<number>(0);
    
    useEffect(() => {
        const update = () => {
            const start = new Date(date).getTime();
            const limit = limitMinutes * 60 * 1000;
            const diff = Date.now() - start;
            setRemaining(Math.max(0, limit - diff));
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [date, limitMinutes]);

    if (remaining <= 0) return <span className="text-[10px] font-black text-red-500 uppercase animate-pulse">Time Up!</span>;

    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);

    return (
        <div className="flex items-center gap-1">
            <ClockIcon className={`w-3.5 h-3.5 ${remaining < 300000 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
            <span className={`text-xs font-mono font-black ${remaining < 300000 ? 'text-red-600' : 'text-primary'}`}>
                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </span>
        </div>
    );
};

const SidebarLink: FC<{ icon: FC<{className?: string}>, label: string, active: boolean, onClick: () => void }> = ({ icon: Icon, label, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group active:scale-95 ${
            active 
            ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30' 
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
    >
        <Icon className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
        <span className={`text-sm font-bold tracking-wide`}>{label}</span>
    </button>
);

const QuickActionCard: FC<{ label: string, icon: FC<{className?: string}>, color: string, onClick: () => void, count?: number }> = ({ label, icon: Icon, color, onClick, count }) => {
    const bgColors: {[key: string]: string} = {
        orange: 'bg-orange-500',
        purple: 'bg-purple-600',
        pink: 'bg-pink-500',
        blue: 'bg-blue-500'
    };
    const shadowColors: {[key: string]: string} = {
        orange: 'shadow-orange-500/30',
        purple: 'shadow-purple-600/30',
        pink: 'shadow-pink-500/30',
        blue: 'shadow-blue-500/30'
    };

    return (
        <button 
            onClick={onClick}
            className={`relative overflow-hidden rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 hover:brightness-110 hover:-translate-y-1 ${bgColors[color]} text-white shadow-lg ${shadowColors[color]}`}
        >
            <div className="absolute top-0 right-0 p-2 opacity-10"><Icon className="w-12 h-12" /></div>
            <Icon className="w-6 h-6 mb-1 relative z-10" />
            <span className="text-xs font-bold uppercase tracking-wider relative z-10">{label}</span>
            {count !== undefined && count > 0 && (
                <span className="absolute top-2 right-2 bg-white text-red-600 text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-sm animate-pulse">
                    {count}
                </span>
            )}
        </button>
    );
};

const SmartCopy: FC<{ text: string, label?: string, iconOnly?: boolean }> = ({ text, label, iconOnly }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(text !== '' ? true : false);
        if (text !== '') setTimeout(() => setCopied(false), 1500);
    };

    return (
        <button 
            onClick={handleCopy} 
            className={`flex items-center gap-1.5 ${iconOnly ? 'p-2' : 'px-3 py-1.5'} bg-gray-100 dark:bg-gray-700/50 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all active:scale-95 border border-gray-100 dark:border-gray-600 max-w-full`}
            title="Click to copy"
        >
            {!iconOnly && <span className="font-mono text-[10px] text-gray-600 dark:text-gray-300 truncate max-w-[120px] sm:max-w-[150px]">{label || text}</span>}
            {copied ? <CheckIcon className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> : <CopyIcon className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />}
        </button>
    );
};

// --- UPDATED IMAGE PICKER COMPONENT (With Crop Support) ---
const ImagePicker: FC<{ value: string, onChange: (val: string) => void, placeholder: string, onUpload: (dataUrl: string) => void }> = ({ value, onChange, placeholder, onUpload }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Basic validation: 1MB limit for Base64 safety in Realtime DB
            if (file.size > 1024 * 1024) {
                alert("Image is too large! Please select an image under 1MB.");
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                if (reader.result) {
                    onUpload(reader.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-3">
            <div className="relative">
                <input 
                    type="text" 
                    value={value} 
                    onChange={(e) => onChange(e.target.value)} 
                    className="w-full p-3.5 border rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary/50 outline-none transition-all text-sm pr-12" 
                    placeholder={placeholder} 
                />
                <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()} 
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title="Upload & Crop"
                >
                    <UploadCloudIcon className="w-5 h-5" />
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                />
            </div>
            
            {/* Live Preview */}
            {value && (
                <div className="relative w-full h-32 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden">
                    <img src={value} alt="Preview" className="h-full w-full object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                    <div className="absolute top-2 right-2 bg-black/50 text-white text-[9px] px-2 py-1 rounded-md font-bold uppercase backdrop-blur-md pointer-events-none">
                        Preview
                    </div>
                </div>
            )}
        </div>
    );
};

const SearchInput: FC<{ value: string; onChange: (val: string) => void; placeholder: string }> = ({ value, onChange, placeholder }) => (
    <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <SearchIcon className="h-4 w-4 text-gray-400" />
        </div>
        <input
            type="text"
            className="block w-full pl-10 pr-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-2xl leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-shadow shadow-sm"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    </div>
);

const SettingToggle: FC<{ label: string, active: boolean, onClick: () => void, colorClass?: string }> = ({ label, active, onClick, colorClass = "bg-green-500" }) => (
    <div className="flex justify-between items-center p-3.5 bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-gray-800 transition-all shadow-sm hover:shadow-md">
        <span className="font-bold text-xs text-gray-700 dark:text-gray-200">{label}</span>
        <div 
            onClick={onClick} 
            className={`w-11 h-5.5 rounded-full p-1 cursor-pointer transition-colors ${active ? colorClass : 'bg-gray-300 dark:bg-gray-600'}`}
        >
            <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-md transform transition-transform ${active ? 'translate-x-5' : 'translate-x-0'}`}></div>
        </div>
    </div>
);

// --- IMPROVED COMPONENT: Interactive SVG Line Chart for Reports ---
const ReportLineChart: FC<{ data: { date: string, amount: number }[], color: string, label: string }> = ({ data, color, label }) => {
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    if (!data || data.length === 0) return <div className="h-24 flex items-center justify-center text-gray-400 text-[10px] italic">No data</div>;

    const maxAmt = Math.max(...data.map(d => d.amount), 10);
    const width = 500;
    const height = 100;
    const paddingX = 10;
    const paddingY = 15;

    const getX = (i: number) => (i / (data.length - 1)) * (width - 2 * paddingX) + paddingX;
    const getY = (val: number) => height - ((val / maxAmt) * (height - 2 * paddingY) + paddingY);

    const points = data.map((d, i) => `${getX(i)},${getY(d.amount)}`).join(' ');
    const areaPoints = `10,${height} ${points} ${width - 10},${height}`;

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const index = Math.round((x / rect.width) * (data.length - 1));
        setHoverIndex(Math.max(0, Math.min(data.length - 1, index)));
    };

    return (
        <div 
            ref={containerRef}
            onPointerMove={handlePointerMove}
            onPointerLeave={() => setHoverIndex(null)}
            className="w-full relative cursor-crosshair mt-2"
        >
            {hoverIndex !== null && (
                <div 
                    className="absolute z-20 pointer-events-none bg-white dark:bg-slate-800 shadow-xl border border-gray-100 dark:border-slate-700 px-2 py-1 rounded-lg text-[9px] font-black"
                    style={{ 
                        left: `${(hoverIndex / (data.length - 1)) * 100}%`, 
                        top: '-30px', 
                        transform: 'translateX(-50%)' 
                    }}
                >
                    <p className="text-gray-400">{data[hoverIndex].date}</p>
                    <p style={{ color }}>{data[hoverIndex].amount.toLocaleString()}</p>
                </div>
            )}
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
                <defs>
                    <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <polygon points={areaPoints} fill={`url(#grad-${label})`} />
                <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
                {hoverIndex !== null && (
                    <g>
                        <line x1={getX(hoverIndex)} y1="0" x2={getX(hoverIndex)} y2={height} stroke={color} strokeWidth="1" strokeDasharray="4" opacity="0.3" />
                        <circle cx={getX(hoverIndex)} cy={getY(data[hoverIndex].amount)} r="4" fill="white" stroke={color} strokeWidth="2" />
                    </g>
                )}
            </svg>
        </div>
    );
};

const AdminScreen: FC<AdminScreenProps> = ({ user, onNavigate, onLogout, language, setLanguage, appSettings, theme, setTheme }) => {
    // Navigation State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'offers' | 'orders' | 'deposits' | 'tools' | 'settings'>('dashboard');
    const [activeTool, setActiveTool] = useState<'wallet' | 'ai' | 'graphics' | 'ads' | 'notifications' | 'contacts' | 'faqs' | 'setup' | 'reports' | 'history'>('wallet');
    
    // Confirmation States
    const [pendingAction, setPendingAction] = useState<{ type: string; title: string; message: string; onConfirm: () => void } | null>(null);

    // User List Mode
    const [userListMode, setUserListMode] = useState<'all' | 'ad_rev' | 'active_gamers' | 'balance' | 'ai_usage' | 'ai_active'>('all');

    // Filter States
    const [orderFilter, setOrderFilter] = useState<'Pending' | 'Completed' | 'Failed'>('Pending');
    const [depositFilter, setDepositFilter] = useState<'Pending' | 'Completed' | 'Failed'>('Pending');

    // Search States
    const [userSearch, setUserSearch] = useState('');
    const [orderSearch, setOrderSearch] = useState('');
    const [depositSearch, setDepositSearch] = useState('');

    // History Tool State
    const [historyTab, setHistoryTab] = useState<'orders' | 'deposits'>('orders');
    const [historySubFilter, setHistorySubFilter] = useState<'All' | 'Completed' | 'Failed'>('All');
    const [historyLimit, setHistoryLimit] = useState(50);
    const [historySearch, setHistorySearch] = useState('');

    // Data States
    const [users, setUsers] = useState<User[]>([]);
    const [orders, setOrders] = useState<Purchase[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    
    // Global Totals for Counting (All data from snapshot)
    const [ordersCounts, setOrdersCounts] = useState({ Pending: 0, Completed: 0, Failed: 0 });
    const [depositsCounts, setDepositsCounts] = useState({ Pending: 0, Completed: 0, Failed: 0 });

    // Pagination States
    const [usersLimit, setUsersLimit] = useState(50);
    
    const [hasMoreUsers, setHasMoreUsers] = useState(true);

    const [isUsersLoading, setIsUsersLoading] = useState(false);
    const [isOrdersLoading, setIsOrdersLoading] = useState(false);
    const [isDepositsLoading, setIsDepositsLoading] = useState(false);

    // Animation State
    const [exitingItems, setExitingItems] = useState<Set<string>>(new Set());

    // Stats
    const [dashboardStats, setDashboardStats] = useState({
        totalUsers: 0,
        totalDeposit: 0,
        pendingOrders: 0,
        pendingDeposits: 0,
        todayDeposit: 0,
        todayPurchase: 0,
        totalAdRevenue: 0,
        todayAdRevenue: 0,
        activeGamers: 0,
        usersTotalBalance: 0
    });
    const [aiOverview, setAiOverview] = useState({ totalInteractions: 0, activeAiUsers: 0 });
    
    // Settings State
    const [settings, setSettings] = useState<AppSettings>(appSettings);
    const [originalSettings, setOriginalSettings] = useState<AppSettings | null>(appSettings);
    
    // Developer Settings State
    const [devSettings, setDevSettings] = useState<DeveloperSettings>(DEFAULT_APP_SETTINGS.developerSettings!);
    const [isDevUnlocked, setIsDevUnlocked] = useState(false);
    
    // Privacy Mechanism States
    const [showDevCard, setShowDevCard] = useState(false);
    const [headerTapCount, setHeaderTapCount] = useState(0);
    const tapTimeoutRef = useRef<number | null>(null);
    const historyCardTimerRef = useRef<number | null>(null);
    
    // Reports State
    const [reportDays, setReportDays] = useState(30);
    const [isReportsLoading, setIsReportsLoading] = useState(false);
    const [allHistoricalOrders, setAllHistoricalOrders] = useState<Purchase[]>([]);
    const [allHistoricalDeposits, setAllHistoricalDeposits] = useState<Transaction[]>([]);
    const [allUsersData, setAllUsersData] = useState<User[]>([]);
    
    // Custom Date Reports
    const [reportType, setReportType] = useState<'preset' | 'custom'>('preset');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    // Modals & Popups
    const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
    const [securityKeyInput, setSecurityKeyInput] = useState('');
    const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
    const [editingBannerIndex, setEditingBannerIndex] = useState<number | null>(null);
    const [tempBannerUrl, setTempBannerUrl] = useState('');
    const [tempActionUrl, setTempActionUrl] = useState('');
    const [apiKeyError, setApiKeyError] = useState('');

    // Offer State
    const [offerType, setOfferType] = useState<'diamond' | 'pubg' | 'mlbb' | 'imo' | 'levelUp' | 'membership' | 'premium' | 'special'>('diamond');
    const [offersData, setOffersData] = useState<any>({ diamond: [], pubg: [], mlbb: [], imo: [], levelUp: [], membership: [], premium: [], special: [] });
    const [editingOffer, setEditingOffer] = useState<any>(null);
    const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
    
    // Drag and Drop State for Offers
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    // Tools State
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
    const [editingMethodIndex, setEditingMethodIndex] = useState<number | null>(null);
    const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
    const [banners, setBanners] = useState<Banner[]>([]);
    const [newBannerUrl, setNewBannerUrl] = useState('');
    const [newActionUrl, setNewActionUrl] = useState('');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [newNotif, setNewNotif] = useState({ title: '', title_bn: '', message: '', message_bn: '', type: 'admin' });
    const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [contacts, setContacts] = useState<any[]>([]);
    const [editingContact, setEditingContact] = useState<any>(null);
    const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [faqs, setFaqs] = useState<FaqItem[]>([]);
    const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
    const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
    const [popupConfig, setPopupConfig] = useState<PopupConfig>({ active: false, title: 'Welcome', message: 'Welcome to our app!', imageUrl: '' });
    
    // Redesign Graphics - Banner Toggle State
    const [isAddingBanner, setIsAddingBanner] = useState(false);

    // AI Chat History Logic
    const [viewingAiHistoryUser, setViewingAiHistoryUser] = useState<User | null>(null);
    const [aiChatHistory, setAiChatHistory] = useState<any[]>([]);

    // Balance Modal
    const [balanceModalUser, setBalanceModalUser] = useState<User | null>(null);
    const [balanceAmount, setBalanceAmount] = useState('');
    const [balanceAction, setBalanceAction] = useState<'add' | 'deduct'>('add');

    // PIN Reset Modal
    const [pinModalUser, setPinModalUser] = useState<User | null>(null);
    const [newAdminPin, setNewAdminPin] = useState('');

    // Image Cropper States
    const [showCropper, setShowCropper] = useState(false);
    const [tempCropperImage, setTempCropperImage] = useState<string | null>(null);
    const [onCropCompleteCallback, setOnCropCompleteCallback] = useState<((croppedImage: string) => void) | null>(null);

    // Email Mapping for Orders/Deposits
    const userEmailMap = useMemo(() => {
        const map: Record<string, string> = {};
        users.forEach(u => { map[u.uid] = u.email; });
        return map;
    }, [users]);

    // --- HISTORY DATA CALCULATION ---
    const historyData = useMemo(() => {
        if (activeTool !== 'history') return { displayData: [], totalCompleted: 0, totalFailed: 0, count: 0, filtered: [] };

        const sourceData = historyTab === 'orders' ? allHistoricalOrders : allHistoricalDeposits;
        const filtered = sourceData.filter(item => {
            // Status Filter
            if (historySubFilter !== 'All' && item.status !== historySubFilter) return false;

            // Search Filter
            if (!historySearch) return true;
            const term = historySearch.toLowerCase();
            const email = (userEmailMap[item.userId] || '').toLowerCase();
            const id = (item.id || item.transactionId || '').toLowerCase();
            return email.includes(term) || id.includes(term);
        });
        
        const displayData = filtered.slice(0, historyLimit);
        
        const totalCompleted = filtered
            .filter(i => i.status === 'Completed')
            .reduce((acc, curr) => acc + (historyTab === 'orders' ? (curr.offer?.price || 0) : curr.amount), 0);
        
        const totalFailed = filtered
            .filter(i => i.status === 'Failed')
            .reduce((acc, curr) => acc + (historyTab === 'orders' ? (curr.offer?.price || 0) : curr.amount), 0);

        return { displayData, totalCompleted, totalFailed, count: filtered.length, filtered };
    }, [activeTool, historyTab, allHistoricalOrders, allHistoricalDeposits, historySubFilter, historySearch, userEmailMap, historyLimit]);

    // Helper to get correct icon for order card
    const getOfferIcon = (purchase: Purchase) => {
        const offer = purchase.offer;
        const offerName = (offer.name || '').toLowerCase();
        const inputType = (offer as any).inputType;

        // 1. Check for MLBB
        if (inputType === 'mlbb') return <MlbbDiamondIcon className="w-6 h-6" />;

        // 2. Check for PUBG
        if (inputType === 'pubg') {
            const isRp = (offer as any).pubgType === 'rp';
            return isRp ? <CrownIcon className="w-6 h-6 text-[#FFD700]" /> : <UcIcon className="w-6 h-6 text-yellow-500" />;
        }
        
        // 3. Check for IMO
        if (inputType === 'imo') return <ImoIcon className="w-6 h-6 text-[#00A2FF]" />;

        // 4. Check for Premium Apps (Email input)
        if (inputType === 'email') return <CrownIcon className="w-6 h-6 text-yellow-500" />;

        // 5. Check for Membership (Keywords)
        if (offerName.includes('membership')) return <IdCardIcon className="w-6 h-6 text-orange-500" />;

        // 6. Check for Level Up (Keywords)
        if (offerName.includes('level')) return <StarIcon className="w-6 h-6 text-purple-500" />;
        
        // 7. Check for Special Offer
        const isStandardDiamond = !isNaN(Number(offer.name?.split(' ')[0]));
        if (!isStandardDiamond || offerName.includes('deal') || offerName.includes('special') || offerName.includes('offer')) {
             return <FireIcon className="w-6 h-6 text-red-500" />;
        }

        // 8. Default to Diamond for everything else Free Fire related
        return <DiamondIcon className="w-6 h-6 text-blue-500" />;
    };

    // Notification Trigger Logic
    const sendTriggerNotification = async (targetUid: string, type: 'success' | 'failed' | 'admin', en: { title: string, msg: string }, bn: { title: string, msg: string }) => {
        if (settings.autoNotifActive === false && type !== 'admin') return;
        try {
            const notifRef = ref(db, 'notifications');
            await push(notifRef, {
                title: en.title,
                title_bn: bn.title,
                message: en.msg,
                message_bn: bn.msg,
                timestamp: Date.now(),
                type: type,
                targetUid,
                isAuto: true 
            });
        } catch (e) { console.error("Error sending trigger notif", e); }
    };

    const animateAndAction = async (id: string, action: () => Promise<void>) => {
        setExitingItems(prev => new Set(prev).add(id));
        setTimeout(async () => {
            await action();
            // Wait slightly more for layout to settle
            setTimeout(() => {
                setExitingItems(prev => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
            }, 100);
        }, 500); 
    };

    // --- GLOBAL AUTO REFUND WATCHER FOR ADMIN ---
    useEffect(() => {
        if (activeTab !== 'orders' && activeTab !== 'dashboard') return;
        
        const checkRefunds = async () => {
            if (settings.autoRefundActive === false) return;
            const refundLimitMs = (settings.autoRefundMinutes || 30) * 60 * 1000;
            const now = Date.now();

            orders.forEach(async (order) => {
                if (order.status === 'Pending' && order.key && order.userId) {
                    const start = new Date(order.date).getTime();
                    if (now - start >= refundLimitMs) {
                        // 1. Delete Order (Automatic removal)
                        const orderRef = ref(db, `orders/${order.userId}/${order.key}`);
                        await remove(orderRef);
                        
                        // 2. Refund balance
                        const userRef = ref(db, `users/${order.userId}`);
                        await runTransaction(userRef, (userData) => {
                            if (userData) {
                                userData.balance = (Number(userData.balance) || 0) + Number(order.offer?.price || 0);
                            }
                            return userData;
                        });

                        // 3. Update Notifications
                        await sendTriggerNotification(
                            order.userId, 
                            'failed', 
                            { 
                                title: "Order Auto-Refunded", 
                                msg: `Order ID: ${order.id} for ৳${order.offer?.price} was not processed within ${settings.autoRefundMinutes} mins and has been auto-refunded and deleted.` 
                            }, 
                            { 
                                title: "অর্ডার অটো-রিফান্ড", 
                                msg: `অর্ডার আইডি: ${order.id} (৳${order.offer?.price}) নির্দিষ্ট সময়ে সম্পন্ন না হওয়ায় এটি মুছে ফেলা হয়েছে এবং টাকা রিফান্ড করা হয়েছে।` 
                            }
                        );
                    }
                }
            });
        };

        const timer = setInterval(checkRefunds, 10000); // Check every 10s
        return () => clearInterval(timer);
    }, [orders, settings.autoRefundActive, settings.autoRefundMinutes, activeTab]);

    const handleHeaderTap = () => {
        const newCount = headerTapCount + 1;
        setHeaderTapCount(newCount);
        if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
        if (newCount >= 5) {
            setShowDevCard(prev => !prev);
            setHeaderTapCount(0);
        } else {
            tapTimeoutRef.current = window.setTimeout(() => setHeaderTapCount(0), 800);
        }
    };

    const handleLogoutClick = () => {
        setPendingAction({
            type: 'logout',
            title: 'Confirm Logout',
            message: 'Are you sure you want to log out from the Admin Panel?',
            onConfirm: () => { onLogout(); setPendingAction(null); }
        });
    };

    useEffect(() => {
        const fetchDashboardStats = () => {
            const usersRef = ref(db, 'users');
            const usersQuery = query(usersRef, limitToLast(2000)); // Increased limit to ensure we have user info for lookups
            onValue(usersQuery, (snap) => {
                if(snap.exists()) {
                    const data = snap.val();
                    const values: any[] = Object.values(data);
                    
                    const totalAdRev = values.reduce((acc: number, u: any) => acc + (u.totalEarned || 0), 0);
                    const totalInteractions = values.reduce((acc: number, u: any) => acc + (u.aiRequestCount || 0), 0);
                    
                    const todayStr = new Date().toDateString();
                    const activeAiUsersToday = values.filter((u: any) => {
                        if (!u.lastAiInteraction) return false;
                        return new Date(u.lastAiInteraction).toDateString() === todayStr;
                    }).length;
                    
                    const activeGamersCount = values.filter((u: any) => (u.gamerLevels?.unlocked || 0) >= 10).length;
                    const totalBalanceSum = values.reduce((acc: number, u: any) => acc + (Number(u.balance) || 0), 0);

                    // Also sync the users state for lookups
                    const uList: User[] = Object.keys(data).map(key => ({ ...data[key], uid: key }));
                    setUsers(uList);
                    setAllUsersData(uList);

                    setAiOverview({ totalInteractions, activeAiUsers: activeAiUsersToday });
                    setDashboardStats(prev => ({ 
                        ...prev, 
                        totalUsers: Object.keys(data).length, 
                        totalAdRevenue: totalAdRev,
                        activeGamers: activeGamersCount,
                        usersTotalBalance: totalBalanceSum
                    }));
                }
            });

            onValue(ref(db, 'orders'), (snap) => {
                if(snap.exists()) {
                    let pendingCount = 0;
                    let compCount = 0;
                    let failCount = 0;
                    let todayPurchaseAmt = 0;
                    const todayStr = new Date().toDateString();
                    const history: Purchase[] = [];
                    
                    // Filter specifically for TODAY's counts in Dashboard
                    let todayPending = 0;
                    let todayComp = 0;
                    let todayFail = 0;

                    snap.forEach(userOrders => {
                        const uOrders = userOrders.val();
                        if (uOrders) {
                            Object.keys(uOrders).forEach(key => {
                                const order = { ...uOrders[key], key, userId: userOrders.key! };
                                const orderDate = new Date(order.date).toDateString();
                                const isToday = orderDate === todayStr;

                                if (isToday) {
                                    if (order.status === 'Pending') todayPending++;
                                    else if (order.status === 'Completed') todayComp++;
                                    else if (order.status === 'Failed') todayFail++;
                                }

                                if (order.status === 'Pending') pendingCount++; // Keep global pending for badge
                                if (order.status === 'Completed' && isToday) {
                                    todayPurchaseAmt += (order.offer?.price || 0);
                                }
                                history.push(order);
                            });
                        }
                    });
                    
                    // Sort descending for history
                    history.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    setAllHistoricalOrders(history);
                    
                    // Use TODAY's counts for the filter buttons in Orders tab
                    setOrdersCounts({ Pending: todayPending, Completed: todayComp, Failed: todayFail });
                    setDashboardStats(prev => ({ ...prev, pendingOrders: pendingCount, todayPurchase: todayPurchaseAmt }));
                }
            });

            onValue(ref(db, 'transactions'), (snap) => {
                if(snap.exists()) {
                    let pendingCount = 0;
                    let todayDepositAmt = 0;
                    let todayAdRevAmt = 0;
                    let totalDep = 0;
                    const todayStr = new Date().toDateString();
                    const history: Transaction[] = [];

                    // Filter specifically for TODAY's counts in Dashboard
                    let todayPending = 0;
                    let todayComp = 0;
                    let todayFail = 0;

                    snap.forEach(userTxns => {
                        const uTxns = userTxns.val();
                        if (uTxns) {
                            Object.keys(uTxns).forEach(key => {
                                const txn = { ...uTxns[key], key, userId: userTxns.key! };
                                const txnDate = new Date(txn.date).toDateString();
                                const isToday = txnDate === todayStr;

                                if (txn.type === 'ad_reward' || txn.method === 'Ad Watch') {
                                    if (isToday) todayAdRevAmt += txn.amount;
                                    return; 
                                }

                                if (isToday) {
                                    if (txn.status === 'Pending') todayPending++;
                                    else if (txn.status === 'Completed') todayComp++;
                                    else if (txn.status === 'Failed') todayFail++;
                                }

                                if (txn.status === 'Pending') pendingCount++;

                                if (isToday) {
                                    if (txn.status === 'Completed') todayDepositAmt += txn.amount;
                                }
                                if (txn.status === 'Completed') totalDep += txn.amount;
                                history.push(txn);
                            });
                        }
                    });
                    
                    // Sort descending
                    history.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    setAllHistoricalDeposits(history);
                    
                    // Use TODAY's counts for the filter buttons in Deposits tab
                    setDepositsCounts({ Pending: todayPending, Completed: todayComp, Failed: todayFail });
                    setDashboardStats(prev => ({ 
                        ...prev, 
                        pendingDeposits: pendingCount, 
                        todayDeposit: todayDepositAmt,
                        todayAdRevenue: todayAdRevAmt,
                        totalDeposit: totalDep
                    }));
                }
            });
        };

        fetchDashboardStats();

        onValue(ref(db, 'config'), (snap) => {
            if(snap.exists()) {
                const data = snap.val();
                if(data.appSettings) {
                    const mergedSettings = { ...data.appSettings, earnSettings: { ...DEFAULT_APP_SETTINGS.earnSettings, ...(data.appSettings.earnSettings || {}) }, uiSettings: { ...DEFAULT_APP_SETTINGS.uiSettings, ...(data.appSettings.uiSettings || {}) } };
                    setSettings(mergedSettings); setOriginalSettings(mergedSettings); 
                    if (data.appSettings.developerSettings) setDevSettings(data.appSettings.developerSettings);
                    if (data.appSettings.popupNotification) setPopupConfig(data.appSettings.popupNotification);
                }
                if(data.offers) {
                    setOffersData({
                        diamond: data.offers.diamond ? Object.values(data.offers.diamond) : [],
                        pubg: data.offers.pubg ? Object.values(data.offers.pubg) : [],
                        mlbb: data.offers.mlbb ? Object.values(data.offers.mlbb) : [],
                        imo: data.offers.imo ? Object.values(data.offers.imo) : [],
                        levelUp: data.offers.levelUp ? Object.values(data.offers.levelUp) : [],
                        membership: data.offers.membership ? Object.values(data.offers.membership) : [],
                        premium: data.offers.premium ? Object.values(data.offers.premium) : [],
                        special: data.offers.special ? Object.values(data.offers.special) : [],
                    });
                }
                if(data.banners) {
                    const rawBanners = Object.values(data.banners);
                    const formattedBanners = rawBanners.map((b: any) => typeof b === 'string' ? { imageUrl: b, actionUrl: '' } : b);
                    setBanners(formattedBanners);
                }
                if(data.paymentMethods) setPaymentMethods(Object.values(data.paymentMethods));
                if (data.supportContacts) setContacts(Object.values(data.supportContacts));
                if (data.faqs) setFaqs(Object.values(data.faqs));
            }
        });
    }, []);

    // PAGINATED DATA FETCHING
    useEffect(() => {
        if (activeTab === 'users') {
            setIsUsersLoading(true);
            const usersRef = ref(db, 'users');
            const usersQuery = query(usersRef, orderByChild('totalSpent'), limitToLast(usersLimit));
            
            const unsub = onValue(usersQuery, (snap) => {
                if(snap.exists()) {
                    const data = snap.val();
                    const uList: User[] = Object.keys(data).map(key => ({ ...data[key], uid: key }))
                        .sort((a, b) => (Number(b.totalSpent) || 0) - (Number(a.totalSpent) || 0));
                    setUsers(uList);
                    setHasMoreUsers(uList.length >= usersLimit);
                } else {
                    setUsers([]);
                    setHasMoreUsers(false);
                }
                setIsUsersLoading(false);
            });
            return () => unsub();
        }
    }, [activeTab, usersLimit]);

    useEffect(() => {
        if (activeTab === 'orders') {
            setIsOrdersLoading(true);
            const ordersRef = ref(db, 'orders');
            // Load more to ensure we catch today's orders even if there are many old ones
            // Fetch a large number to ensure we get all of today's orders.
            const ordersQuery = query(ordersRef, limitToLast(3000));
            
            const unsub = onValue(ordersQuery, (snap) => {
                if(snap.exists()) {
                    let allOrders: Purchase[] = [];
                    const todayStr = new Date().toDateString();

                    snap.forEach(userOrders => {
                        const uOrders = userOrders.val();
                        if (uOrders) {
                            Object.keys(uOrders).forEach(key => {
                                const order = { ...uOrders[key], key, userId: userOrders.key! };
                                const orderDate = new Date(order.date).toDateString();
                                
                                // STRICT FILTER: ONLY SHOW TODAY'S ORDERS
                                if (orderDate === todayStr) {
                                    allOrders.push(order);
                                }
                            });
                        }
                    });
                    const filtered = allOrders.filter(o => o.status === orderFilter);
                    const sorted = filtered.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    
                    setOrders(sorted);
                } else { setOrders([]); }
                setIsOrdersLoading(false);
            });
            return () => unsub();
        }
    }, [activeTab, orderFilter]);

    useEffect(() => {
        if (activeTab === 'deposits') {
            setIsDepositsLoading(true);
            const txnsRef = ref(db, 'transactions');
            // Fetch a large number to ensure we get all of today's transactions.
            const txnsQuery = query(txnsRef, limitToLast(3000));
            
            const unsub = onValue(txnsQuery, (snap) => {
                if(snap.exists()) {
                    let allTxns: Transaction[] = [];
                    const todayStr = new Date().toDateString();

                    snap.forEach(userTxns => {
                        const uTxns = userTxns.val();
                        if (uTxns) {
                            Object.keys(uTxns).forEach(key => {
                                const txn = { ...uTxns[key], key, userId: userTxns.key! };
                                const txnDate = new Date(txn.date).toDateString();

                                // STRICT FILTER: ONLY SHOW TODAY'S TRANSACTIONS
                                if (txn.type !== 'ad_reward' && txn.method !== 'Ad Watch' && txnDate === todayStr) {
                                    allTxns.push(txn);
                                }
                            });
                        }
                    });
                    const filtered = allTxns.filter(t => t.status === depositFilter);
                    const sorted = filtered.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    
                    setTransactions(sorted);
                } else { setTransactions([]); }
                setIsDepositsLoading(false);
            });
            return () => unsub();
        }
    }, [activeTab, depositFilter]);

    useEffect(() => {
        if (activeTab === 'tools') {
             onValue(ref(db, 'notifications'), (snap) => {
                if(snap.exists()) {
                    const data = snap.val();
                    const list = Object.keys(data)
                        .map(key => ({ ...data[key], id: key }))
                        .filter(n => !n.isAuto)
                        .reverse();
                    setNotifications(list);
                }
            });
        }
    }, [activeTab]);

    const filteredUsers = useMemo(() => {
        let list = users;
        if (userListMode === 'active_gamers') list = list.filter(u => (u.gamerLevels?.unlocked || 0) >= 10);
        else if (userListMode === 'ad_rev') list = [...list].sort((a, b) => (Number(b.totalEarned) || 0) - (Number(a.totalEarned) || 0));
        else if (userListMode === 'balance') list = [...list].sort((a, b) => (Number(b.balance) || 0) - (Number(a.balance) || 0));
        else if (userListMode === 'ai_usage') list = [...list].sort((a, b) => (Number(b.aiRequestCount) || 0) - (Number(a.aiRequestCount) || 0));
        else if (userListMode === 'ai_active') {
            const todayStr = new Date().toDateString();
            list = list.filter(u => u.lastAiInteraction && new Date(u.lastAiInteraction).toDateString() === todayStr);
        }
        if (!userSearch) return list;
        const lowerTerm = userSearch.toLowerCase();
        return list.filter(u => (u.name || '').toLowerCase().includes(lowerTerm) || (u.email || '').toLowerCase().includes(lowerTerm) || (u.uid || '').toLowerCase().includes(lowerTerm) || (u.playerUid || '').toLowerCase().includes(lowerTerm));
    }, [users, userSearch, userListMode]);

    const filteredOrders = useMemo(() => {
        let result = orders;
        if (orderSearch) {
            const lowerTerm = orderSearch.toLowerCase();
            result = result.filter(o => {
                const userEmail = (userEmailMap[o.userId] || '').toLowerCase();
                return (o.id || '').toLowerCase().includes(lowerTerm) || 
                       (o.uid || '').toLowerCase().includes(lowerTerm) ||
                       userEmail.includes(lowerTerm) ||
                       o.userId.toLowerCase().includes(lowerTerm);
            });
        }
        return result;
    }, [orders, orderSearch, userEmailMap]);

    const filteredTransactions = useMemo(() => {
        let result = transactions;
        if (depositSearch) {
            const lowerTerm = depositSearch.toLowerCase();
            result = result.filter(t => {
                const userEmail = (userEmailMap[t.userId] || '').toLowerCase();
                return (t.transactionId || '').toLowerCase().includes(lowerTerm) || 
                       (t.method || '').toLowerCase().includes(lowerTerm) ||
                       userEmail.includes(lowerTerm) ||
                       t.userId.toLowerCase().includes(lowerTerm);
            });
        }
        return result;
    }, [transactions, depositSearch, userEmailMap]);

    // --- REVENUE REPORTS AGGREGATION ---
    const reportsSummary = useMemo(() => {
        let startTime = 0;
        let endTime = Date.now();

        if (reportType === 'preset') {
            startTime = Date.now() - (reportDays * 24 * 60 * 60 * 1000);
        } else {
            if (customStartDate) startTime = new Date(customStartDate).getTime();
            if (customEndDate) {
                const end = new Date(customEndDate);
                end.setHours(23, 59, 59, 999);
                endTime = end.getTime();
            }
        }
        
        const inRangeUsers = allUsersData.filter(u => (u.registrationDate || 0) >= startTime && (u.registrationDate || 0) <= endTime);
        const inRangeOrders = allHistoricalOrders.filter(o => {
            const t = new Date(o.date).getTime();
            return t >= startTime && t <= endTime;
        });
        const inRangeDeposits = allHistoricalDeposits.filter(d => {
            const t = new Date(d.date).getTime();
            return t >= startTime && t <= endTime;
        });

        const totalSales = inRangeOrders.filter(o => o.status === 'Completed').reduce((acc, curr) => acc + (curr.offer?.price || 0), 0);
        const totalDeposits = inRangeDeposits.filter(d => d.status === 'Completed').reduce((acc, curr) => acc + curr.amount, 0);
        const totalOrders = inRangeOrders.length;
        const completedOrdersCount = inRangeOrders.filter(o => o.status === 'Completed').length;

        // New Metrics: AOV & Success Rate
        const avgOrderValue = completedOrdersCount > 0 ? Math.floor(totalSales / completedOrdersCount) : 0;
        const successRate = totalOrders > 0 ? Math.floor((completedOrdersCount / totalOrders) * 100) : 0;

        const offerSalesCount: Record<string, number> = {};
        inRangeOrders.filter(o => o.status === 'Completed').forEach(o => {
            const name = o.offer?.name || o.offer?.diamonds + ' Diamonds';
            offerSalesCount[name] = (offerSalesCount[name] || 0) + 1;
        });

        const topOffers = Object.entries(offerSalesCount)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Chart Data Calculation - Improved Sorting for Chronological Order
        const getDailyData = (items: any[], isValue: boolean = true) => {
            const daily: Record<string, number> = {};
            
            // First pass: Aggregate data
            items.forEach(item => {
                const d = new Date(item.date || item.registrationDate);
                // Create a sortable key (YYYY-MM-DD)
                const sortKey = d.toISOString().split('T')[0];
                daily[sortKey] = (daily[sortKey] || 0) + (isValue ? (item.offer?.price || item.amount || 0) : 1);
            });

            // Second pass: Convert to array and sort by date key
            const sortedData = Object.entries(daily)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([dateKey, amount]) => {
                    // Convert back to display format "DD MMM"
                    const d = new Date(dateKey);
                    const displayDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                    return { date: displayDate, amount };
                });
                
            return sortedData;
        };

        return {
            newUsers: inRangeUsers.length,
            totalOrders,
            completedOrdersCount,
            failedOrders: inRangeOrders.filter(o => o.status === 'Failed').length,
            pendingOrders: inRangeOrders.filter(o => o.status === 'Pending').length,
            totalSales,
            totalDeposits,
            avgOrderValue,
            successRate,
            topOffers,
            charts: {
                sales: getDailyData(inRangeOrders.filter(o => o.status === 'Completed')),
                deposits: getDailyData(inRangeDeposits.filter(d => d.status === 'Completed')),
                users: getDailyData(inRangeUsers, false)
            }
        };
    }, [reportDays, allHistoricalOrders, allHistoricalDeposits, allUsersData, reportType, customStartDate, customEndDate]);

    const handleDownloadCSV = () => {
        const title = `Report_${reportType === 'preset' ? reportDays + 'days' : 'custom'}_${new Date().toISOString().split('T')[0]}`;
        const headers = ["Metric", "Value"];
        const rows = [
            ["Period", reportType === 'preset' ? `${reportDays} Days` : `${customStartDate} to ${customEndDate}`],
            ["Total Sales", reportsSummary.totalSales],
            ["Total Deposits", reportsSummary.totalDeposits],
            ["New Users", reportsSummary.newUsers],
            ["Total Orders", reportsSummary.totalOrders],
            ["Completed Orders", reportsSummary.completedOrdersCount],
            ["Average Order Value", reportsSummary.avgOrderValue],
            ["Success Rate (%)", reportsSummary.successRate],
            ["Pending Orders", reportsSummary.pendingOrders],
            ["Failed Orders", reportsSummary.failedOrders],
        ];

        let csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${title}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleGoToOrders = () => { setActiveTab('orders'); setOrderFilter('Completed'); };
    const handleGoToDeposits = () => { setActiveTab('deposits'); setDepositFilter('Completed'); };
    const handleGoToUsers = () => { setActiveTab('users'); setUserListMode('all'); };

    // --- NEW: History Copy Function ---
    const handleCopyHistorySummary = (filteredData: any[], totalCompleted: number, totalFailed: number) => {
        const type = historyTab === 'orders' ? 'Orders' : 'Deposits';
        const subType = historySubFilter === 'All' ? '' : `(${historySubFilter})`;
        const count = filteredData.length;
        
        const text = `
📜 ${settings.appName} ${type} History ${subType}
🔢 Total Items: ${count}
✅ Completed Amount: ৳${totalCompleted.toLocaleString()}
❌ Failed Amount: ৳${totalFailed.toLocaleString()}
------------------------------
Generated on: ${new Date().toLocaleString()}
        `;
        navigator.clipboard.writeText(text);
        alert("History summary copied!");
    };

    const isSettingsChanged = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    
    const handleSettingsSave = async (e: FormEvent) => {
        e.preventDefault();
        const currentKey = settings.aiApiKey ? settings.aiApiKey.trim() : '';
        if (currentKey.length > 0 && !/^AIza[0-9A-Za-z\-_]{35}$/.test(currentKey)) { setApiKeyError("Invalid API Key format."); return; }
        setApiKeyError(''); 
        let finalSettings = { ...settings, aiApiKey: currentKey, earnSettings: { ...settings.earnSettings, adMob: { ...settings.earnSettings?.adMob, appId: settings.earnSettings?.adMob?.appId?.trim() || '', rewardId: settings.earnSettings?.adMob?.rewardId?.trim() || '' } } } as AppSettings;
        const { developerSettings, ...safeSettings } = finalSettings;
        await update(ref(db, 'config/appSettings'), safeSettings);
        setSettings(finalSettings); setOriginalSettings(finalSettings);
    };

    const handleUnlockDevInfo = () => { setSecurityKeyInput(''); setIsSecurityModalOpen(true); };
    const handleVerifySecurityKey = (e: FormEvent) => { e.preventDefault(); if (securityKeyInput === PROTECTION_KEY) { setIsDevUnlocked(true); setIsSecurityModalOpen(false); } };
    const handleSaveDeveloperInfo = async () => { try { await update(ref(db, 'config/appSettings/developerSettings'), devSettings); setIsDevUnlocked(false); } catch (error) { } };

    const handleOrderAction = (order: Purchase, action: 'Completed' | 'Failed') => {
        const title = action === 'Completed' ? 'Approve Order?' : 'Reject Order?';
        const msg = action === 'Completed' ? 'Do you want to complete this order?' : 'Do you want to reject this order? Balance will be refunded.';
        
        setPendingAction({
            type: 'order_status',
            title: title,
            message: msg,
            onConfirm: () => {
                setPendingAction(null);
                const reasonBn = "তথ্য সঠিক নয়।";
                const reasonEn = "Information not correct.";
                animateAndAction(order.key!, async () => {
                    if (order.key && order.userId) {
                        if (action === 'Failed') {
                            const orderRef = ref(db, `orders/${order.userId}/${order.key}`);
                            await update(orderRef, { status: 'Failed' });
                            const userRef = ref(db, `users/${order.userId}`);
                            await runTransaction(userRef, (userData) => { if (userData) { userData.balance = (Number(userData.balance) || 0) + Number(order.offer?.price || 0); } return userData; });
                            // FIX: Using reasonBn for the Bengali message instead of reasonEn
                            await sendTriggerNotification(order.userId, 'failed', { title: "Order Cancelled", msg: `Your order for '${order.offer?.name || order.offer?.diamonds}' cancelled. Reason: ${reasonEn}` }, { title: "অর্ডার বাতিল", msg: `আপনার '${order.offer?.name || order.offer?.diamonds}' অর্ডারটি বাতিল হয়েছে। কারণ: ${reasonBn}` });
                        } else {
                            await update(ref(db, `orders/${order.userId}/${order.key}`), { status: 'Completed' });
                            const userRef = ref(db, `users/${order.userId}`);
                            const currentMonth = new Date().toISOString().slice(0, 7);
                            await runTransaction(userRef, (userData) => {
                                if (userData) {
                                    const price = Number(order.offer?.price || 0);
                                    userData.totalSpent = (Number(userData.totalSpent) || 0) + price;
                                    if (userData.lastMonthUpdate !== currentMonth) { userData.monthlySpent = price; userData.monthlyEarned = userData.monthlyEarned || 0; userData.lastMonthUpdate = currentMonth; }
                                    else { userData.monthlySpent = (Number(userData.monthlySpent) || 0) + price; }
                                }
                                return userData;
                            });
                            await sendTriggerNotification(order.userId, 'success', { title: "Order Successful!", msg: `Your order for '${order.offer?.name || order.offer?.diamonds}' completed successfully.` }, { title: "অর্ডার সফল!", msg: `আপনার '${order.offer?.name || order.offer?.diamonds}' অর্ডারটি সফলভাবে সম্পন্ন হয়েছে।` });
                        }
                    }
                });
            }
        });
    };

    const handleDeleteOrder = (orderId: string, userId: string) => {
        setPendingAction({
            type: 'delete_order',
            title: 'Delete Order Record?',
            message: 'This will permanently remove the order from history.',
            onConfirm: () => {
                setPendingAction(null);
                animateAndAction(orderId, async () => { await remove(ref(db, `orders/${userId}/${orderId}`)); });
            }
        });
    };

    const handleTxnAction = (txn: Transaction, action: 'Completed' | 'Failed') => {
        const title = action === 'Completed' ? 'Approve Deposit?' : 'Reject Deposit?';
        const msg = action === 'Completed' ? `Add ৳${txn.amount} to user balance?` : `Reject this ৳${txn.amount} deposit request?`;
        
        setPendingAction({
            type: 'txn_status',
            title: title,
            message: msg,
            onConfirm: () => {
                setPendingAction(null);
                const reasonBn = "ট্রানজেকশন আইডি সঠিক নয়।";
                const reasonEn = "Transaction ID not valid.";
                animateAndAction(txn.key!, async () => {
                    if (txn.key && txn.userId) {
                        if (action === 'Failed') {
                            await update(ref(db, `transactions/${txn.userId}/${txn.key}`), { status: 'Failed' });
                            await sendTriggerNotification(txn.userId, 'failed', { title: "Deposit Rejected", msg: `Deposit request for ৳${txn.amount} rejected. Reason: ${reasonEn}` }, { title: "ডিপোজিট বাতিল", msg: `আপনার ৳${txn.amount} জমার অনুরোধটি বাতিল হয়েছে। কারণ: ${reasonBn}` });
                        } else {
                            await update(ref(db, `transactions/${txn.userId}/${txn.key}`), { status: 'Completed' });
                            const userRef = ref(db, `users/${txn.userId}`);
                            await runTransaction(userRef, (userData) => { if (userData) { userData.balance = (Number(userData.balance) || 0) + Number(txn.amount); userData.totalDeposit = (Number(userData.totalDeposit) || 0) + Number(txn.amount); } return userData; });
                            await sendTriggerNotification(txn.userId, 'success', { title: "Funds Added!", msg: `৳${txn.amount} added to your account. Thank you.` }, { title: "টাকা যোগ হয়েছে!", msg: `আপনার অ্যাকাউন্টে ৳${txn.amount} যোগ করা হয়েছে। ধন্যবাদ।` });
                        }
                    }
                });
            }
        });
    };
    
    const handleDeleteTransaction = (txnId: string, userId: string) => {
        setPendingAction({
            type: 'delete_txn',
            title: 'Delete Deposit Record?',
            message: 'This will permanently remove this transaction from history.',
            onConfirm: () => {
                setPendingAction(null);
                animateAndAction(txnId, async () => { await remove(ref(db, `transactions/${userId}/${txnId}`)); });
            }
        });
    };
    
    const handleBalanceUpdate = async () => {
        if (!balanceModalUser || !balanceAmount) return;
        const amount = Number(balanceAmount);
        if (isNaN(amount) || amount <= 0) return;
        const userRef = ref(db, `users/${balanceModalUser.uid}`);
        await runTransaction(userRef, (userData) => { if(userData) { userData.balance = balanceAction === 'add' ? (userData.balance||0) + amount : (userData.balance||0) - amount; } return userData; });
        await sendTriggerNotification(balanceModalUser.uid, 'admin', { title: "Balance Update", msg: `৳${amount} ${balanceAction === 'add' ? 'added to' : 'deducted from'} your balance.` }, { title: "ব্যালেন্স আপডেট", msg: `আপনার অ্যাকাউন্টে ৳${amount} ${balanceAction === 'add' ? 'যোগ' : 'কর্তন'} করা হয়েছে।` });
        setBalanceModalUser(null); setBalanceAmount('');
    };

    const handlePinUpdate = async (forceReset: boolean = false) => {
        if (!pinModalUser) return;
        const userRef = ref(db, `users/${pinModalUser.uid}`);
        
        let updateMsgEn = "";
        let updateMsgBn = "";

        if (!forceReset && newAdminPin) {
            if (!/^\d{4}$/.test(newAdminPin)) return;
            await update(userRef, { pin: newAdminPin });
            updateMsgEn = `Your security PIN has been updated to: ${newAdminPin}`;
            updateMsgBn = `আপনার সিকিউরিটি পিন আপডেট করে '${newAdminPin}' করা হয়েছে।`;
        } else {
            await update(userRef, { pin: null });
            // FIX: Corrected instructions to point to Profile instead of Settings
            updateMsgEn = "Your security PIN has been reset. You can set a new one from the Profile option.";
            updateMsgBn = "আপনার সিকিউরিটি পিন রিসেট করা হয়েছে। আপনি প্রোফাইল অপশন থেকে নতুন পিন সেট করে নিন।";
        }

        await sendTriggerNotification(pinModalUser.uid, 'admin', { title: "Security Update", msg: updateMsgEn }, { title: "নিরাপত্তা আপডেট", msg: updateMsgBn });
        setPinModalUser(null); setNewAdminPin('');
    };

    const handleOfferDragStart = (index: number) => { dragItem.current = index; };
    const handleOfferDragEnter = (index: number) => { dragOverItem.current = index; };
    const handleOfferDrop = async () => { if (dragItem.current === null || dragOverItem.current === null) return; const listCopy = [...offersData[offerType]]; const dragItemContent = listCopy[dragItem.current]; listCopy.splice(dragItem.current, 1); listCopy.splice(dragOverItem.current, 0, dragItemContent); dragItem.current = null; dragOverItem.current = null; setOffersData({ ...offersData, [offerType]: listCopy }); try { await set(ref(db, `config/offers/${offerType}`), listCopy); } catch (err) { } };
    
    const handleSaveOffer = async (e: FormEvent) => {
        e.preventDefault();
        const path = `config/offers/${offerType}`;
        let newOffer = { ...editingOffer };
        if (!newOffer.id) newOffer.id = Date.now();
        if (newOffer.price) newOffer.price = Number(newOffer.price);
        if (newOffer.diamonds) newOffer.diamonds = Number(newOffer.diamonds);
        if (newOffer.uc) newOffer.uc = Number(newOffer.uc);
        if (offerType === 'special' && newOffer.isActive === undefined) newOffer.isActive = true;
        
        if ((offerType === 'diamond' || offerType === 'imo') && !newOffer.name) {
            newOffer.name = `${newOffer.diamonds} Diamonds`;
        }
        
        if (offerType === 'pubg') {
            if (newOffer.pubgType === 'rp') {
                // Name is required for RP, UC is 0
                newOffer.uc = 0;
            } else {
                // UC Logic
                newOffer.pubgType = 'uc';
                if (!newOffer.name) newOffer.name = `${newOffer.uc} UC`;
            }
        }

        if (offerType === 'mlbb') {
            if (newOffer.mlbbType === 'diamond') {
                newOffer.name = `${newOffer.diamonds} Diamonds`;
            }
        }

        let updatedList = [...offersData[offerType]];
        if (editingOffer.id && offersData[offerType].find((o: any) => o.id === editingOffer.id)) {
            updatedList = updatedList.map((o: any) => o.id === editingOffer.id ? newOffer : o);
        } else {
            updatedList.push(newOffer);
        }
        await set(ref(db, path), updatedList);
        setIsOfferModalOpen(false);
        setEditingOffer(null);
    };
    
    const handleDeleteOffer = async (id: number) => {
        setPendingAction({
            type: 'delete_offer',
            title: 'Delete Offer?',
            message: 'Are you sure you want to delete this offer?',
            onConfirm: async () => {
                setPendingAction(null);
                const path = `config/offers/${offerType}`;
                const updatedList = offersData[offerType].filter((o: any) => o.id !== id);
                await set(ref(db, path), updatedList);
            }
        });
    };

    const handleSortByPrice = async () => { const sorted = [...offersData[offerType]].sort((a: any, b: any) => Number(a.price) - Number(b.price)); setOffersData({ ...offersData, [offerType]: sorted }); await set(ref(db, `config/offers/${offerType}`), sorted); };
    const openAddOfferModal = () => { 
        let defaultBadge = '';
        if (offerType === 'imo') defaultBadge = "IMO";
        else if (offerType === 'mlbb') defaultBadge = "MLBB";
        else if (offerType === 'membership') defaultBadge = "BEST VALUE";
        else if (offerType === 'levelUp') defaultBadge = "ONE TIME";
        else if (offerType === 'premium') defaultBadge = "PREMIUM";
        else if (offerType === 'pubg') defaultBadge = "SEASON A10"; 

        if (offerType === 'mlbb') {
            setEditingOffer({ mlbbType: 'diamond', ribbonLabel: defaultBadge }); 
        } else if (offerType === 'pubg') {
            setEditingOffer({ pubgType: 'uc', ribbonLabel: defaultBadge }); // Default to UC
        } else {
            setEditingOffer({ ribbonLabel: defaultBadge }); 
        }
        setIsOfferModalOpen(true); 
    };

    const handleSaveMethod = async (e: FormEvent) => { e.preventDefault(); if (!editingMethod) return; const updatedMethods = [...paymentMethods]; if (editingMethodIndex !== null) updatedMethods[editingMethodIndex] = editingMethod; else updatedMethods.push(editingMethod); await set(ref(db, 'config/paymentMethods'), updatedMethods); setIsMethodModalOpen(false); setEditingMethod(null); };
    
    const handleDeleteMethod = async (index: number) => {
        setPendingAction({
            type: 'delete_method',
            title: 'Delete Method?',
            message: 'Permanently remove this payment method?',
            onConfirm: async () => {
                setPendingAction(null);
                const updatedMethods = paymentMethods.filter((_, i) => i !== index);
                await set(ref(db, 'config/paymentMethods'), updatedMethods);
            }
        });
    };

    const openAddMethodModal = () => { setEditingMethod({ name: '', accountNumber: '', logo: '', instructions: '', isActive: true }); setEditingMethodIndex(null); setIsMethodModalOpen(true); };
    const openEditMethodModal = (method: PaymentMethod, index: number) => { setEditingMethod({ ...method, isActive: method.isActive !== undefined ? method.isActive : true }); setEditingMethodIndex(index); setIsMethodModalOpen(true); };
    const handleToggleMethod = async (index: number) => { const updated = [...paymentMethods]; updated[index].isActive = !updated[index].isActive; await set(ref(db, 'config/paymentMethods'), updated); };

    const handleSaveContact = async (e: FormEvent) => { e.preventDefault(); if (!editingContact) return; const updatedContacts = [...contacts]; const contactToSave = { ...editingContact, labelKey: editingContact.title, type: 'custom' }; if (editingContactIndex !== null) updatedContacts[editingContactIndex] = contactToSave; else updatedContacts.push(contactToSave); await set(ref(db, 'config/supportContacts'), updatedContacts); setIsContactModalOpen(false); setEditingContact(null); };
    
    const handleDeleteContact = async (index: number) => {
        setPendingAction({
            type: 'delete_contact',
            title: 'Delete Contact?',
            message: 'Permanently remove this support contact?',
            onConfirm: async () => {
                setPendingAction(null);
                const updatedContacts = contacts.filter((_, i) => i !== index);
                await set(ref(db, 'config/supportContacts'), updatedContacts);
            }
        });
    };

    const openAddContactModal = () => { setEditingContact({ type: 'custom', title: '', link: '', iconUrl: '' }); setEditingContactIndex(null); setIsContactModalOpen(true); };
    const openEditContactModal = (contact: any, index: number) => { setEditingContact({ ...contact }); setEditingContactIndex(index); setIsContactModalOpen(true); };
    const handleSaveFaq = async (e: FormEvent) => { e.preventDefault(); if (!editingFaq) return; const newFaq = { ...editingFaq }; if (!newFaq.id) newFaq.id = Date.now().toString(); let updatedList = [...faqs]; if (faqs.find(f => f.id === newFaq.id)) { updatedList = updatedList.map(f => f.id === newFaq.id ? newFaq : f); } else { updatedList.push(newFaq); } await set(ref(db, 'config/faqs'), updatedList); setIsFaqModalOpen(false); setEditingFaq(null); };
    
    const handleDeleteFaq = async (id: string) => {
        setPendingAction({
            type: 'delete_faq',
            title: 'Delete FAQ?',
            message: 'Remove this question and answer?',
            onConfirm: async () => {
                setPendingAction(null);
                const updatedList = faqs.filter(f => f.id !== id);
                if (updatedList.length === 0) { await remove(ref(db, 'config/faqs')); } else { await set(ref(db, 'config/faqs'), updatedList); } setFaqs(updatedList);
            }
        });
    };

    const openAddFaqModal = () => { setEditingFaq({ id: '', question: '', question_bn: '', answer: '', answer_bn: '' }); setIsFaqModalOpen(true); };
    const openEditFaqModal = (faq: FaqItem) => { setEditingFaq({ ...faq }); setIsFaqModalOpen(true); };
    const toggleUserSelection = (uid: string) => { const newSet = new Set(selectedUserIds); if (newSet.has(uid)) newSet.delete(uid); else newSet.add(uid); setSelectedUserIds(newSet); };
    const handleSendNotification = async (e: FormEvent) => { e.preventDefault(); const notifData = { ...newNotif, timestamp: Date.now(), type: 'admin' as any }; try { if (selectedUserIds.size > 0) { const promises = Array.from(selectedUserIds).map(uid => push(ref(db, 'notifications'), { ...notifData, targetUid: uid })); await Promise.all(promises); setSelectedUserIds(new Set()); } else { await push(ref(db, 'notifications'), notifData); } setNewNotif({ title: '', title_bn: '', message: '', message_bn: '', type: 'admin' }); setIsNotifModalOpen(false); } catch (error) { } };
    
    const handleDeleteNotification = async (id: string) => {
        setPendingAction({
            type: 'delete_notif',
            title: 'Delete Broadcast?',
            message: 'This will remove the notification for all users.',
            onConfirm: async () => {
                setPendingAction(null);
                await remove(ref(db, `notifications/${id}`));
            }
        });
    };

    const handleSavePopupConfig = async () => { await update(ref(db, 'config/appSettings'), { popupNotification: popupConfig }); setSettings(prev => ({...prev, popupNotification: popupConfig})); };
    const handleAddBanner = async () => { if(!newBannerUrl) return; const updatedBanners = [...banners, { imageUrl: newBannerUrl, actionUrl: newActionUrl }]; await set(ref(db, 'config/banners'), updatedBanners); setNewBannerUrl(''); setNewActionUrl(''); setIsAddingBanner(false); };
    
    const handleDeleteBanner = async (index: number) => {
        setPendingAction({
            type: 'delete_banner',
            title: 'Delete Banner?',
            message: 'Permanently remove this image from the carousel?',
            onConfirm: async () => {
                setPendingAction(null);
                const updatedBanners = banners.filter((_, i) => i !== index);
                await set(ref(db, 'config/banners'), updatedBanners);
            }
        });
    };

    const openEditBannerModal = (index: number, banner: Banner) => { setEditingBannerIndex(index); setTempBannerUrl(banner.imageUrl); setTempActionUrl(banner.actionUrl || ''); setIsBannerModalOpen(true); };
    const handleSaveBanner = async (e: FormEvent) => { e.preventDefault(); if (editingBannerIndex !== null && tempBannerUrl) { const updatedBanners = [...banners]; updatedBanners[editingBannerIndex] = { imageUrl: tempBannerUrl, actionUrl: tempActionUrl }; await set(ref(db, 'config/banners'), updatedBanners); setIsBannerModalOpen(false); setEditingBannerIndex(null); setTempBannerUrl(''); setTempActionUrl(''); } };
    const handleUpdateLogo = async () => { if (settings.logoUrl) { await update(ref(db, 'config/appSettings'), { logoUrl: settings.logoUrl }); } };

    const handleViewAiHistory = (user: User) => {
        setViewingAiHistoryUser(user);
        const historyRef = ref(db, `ai_chats/${user.uid}/messages`);
        onValue(historyRef, (snap) => {
            if (snap.exists()) {
                const data = snap.val();
                const list = Object.values(data).sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0));
                setAiChatHistory(list);
            } else {
                setAiChatHistory([]);
            }
        });
    };

    const inputClass = "w-full p-3.5 border rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:white border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary/50 outline-none transition-all text-sm";
    
    const isOfferValid = useMemo(() => {
        if (!editingOffer) return false;
        if (offerType === 'mlbb') {
            if (editingOffer.mlbbType === 'diamond') return Number(editingOffer.diamonds) > 0 && Number(editingOffer.price) > 0;
            return editingOffer.name?.trim() && Number(editingOffer.price) > 0;
        }
        if (offerType === 'pubg') {
            if (editingOffer.pubgType === 'rp') {
                // For Royale Pass: Name and Price are required. UC is irrelevant.
                return editingOffer.name?.trim() && Number(editingOffer.price) > 0;
            } else {
                // For UC: UC Amount and Price are required.
                return Number(editingOffer.uc) > 0 && Number(editingOffer.price) > 0;
            }
        }
        if (offerType === 'diamond' || offerType === 'imo') return Number(editingOffer.diamonds) > 0 && Number(editingOffer.price) > 0;
        
        return editingOffer.name?.trim() && Number(editingOffer.price) > 0;
    }, [editingOffer, offerType]);

    const isMethodValid = editingMethod?.name?.trim() && editingMethod?.accountNumber?.trim() && editingMethod?.logo?.trim();
    const isContactValid = editingContact?.title?.trim() && editingContact?.link?.trim();
    const isFaqValid = editingFaq?.question?.trim() && editingFaq?.answer?.trim();
    const isBannerValid = tempBannerUrl?.trim();
    const isNotifValid = newNotif.title.trim().length > 0 && newNotif.message.trim().length > 0;
    
    // BACK BUTTON HIDE LOGIC FOR USERS AND SETTINGS
    const showBackButton = activeTab !== 'dashboard' && activeTab !== 'users' && activeTab !== 'settings';

    // Helper to format tab counters
    const getCounter = (status: 'Pending' | 'Completed' | 'Failed', type: 'orders' | 'deposits') => {
        const counts = type === 'orders' ? ordersCounts : depositsCounts;
        const currentCount = type === 'orders' ? filteredOrders.length : filteredTransactions.length;
        
        if (status === 'Pending') return counts[status] > 0 ? counts[status] : 0;
        
        return `${currentCount}/${counts[status]}`;
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans overflow-hidden">
            {showCropper && tempCropperImage && (
                <ImageCropper 
                    imageSrc={tempCropperImage} 
                    onCancel={() => { setShowCropper(false); setTempCropperImage(null); }}
                    onCropComplete={(croppedUrl) => {
                        if (onCropCompleteCallback) onCropCompleteCallback(croppedUrl);
                        setShowCropper(false);
                        setTempCropperImage(null);
                    }}
                />
            )}

            {isSidebarOpen && (<div className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)}></div>)}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-dark-card border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-20 flex items-center px-6 border-b border-gray-100 dark:border-gray-800"><span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Admin Panel</span></div>
                <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100%-5rem)]">
                    <SidebarLink icon={DashboardIcon} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} />
                    <SidebarLink icon={UsersIcon} label="Users" active={activeTab === 'users'} onClick={() => { setActiveTab('users'); setUserListMode('all'); setIsSidebarOpen(false); }} />
                    <SidebarLink icon={SettingsIcon} label="Settings" active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }} />
                </nav>
            </aside>

            <div className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-gray-900">
                <header className="h-16 bg-white dark:bg-dark-card border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm/50">
                    <div className="flex items-center gap-4">
                        <div>{showBackButton ? (<button onClick={() => { setActiveTab('dashboard'); setUserListMode('all'); }} className="p-2 text-primary bg-primary/5 hover:bg-primary/10 rounded-xl transition-all active:scale-90 transform flex items-center gap-2"><BackIcon className="w-5 h-5" /><span className="text-xs font-bold hidden sm:block">Back to Home</span></button>) : (<button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors md:hidden"><MenuIcon className="w-6 h-6" /></button>)}</div>
                        <h2 className="text-lg font-bold select-none cursor-pointer text-gray-800 dark:text-white" onClick={handleHeaderTap}>{activeTab === 'dashboard' ? '' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
                    </div>
                    <button onClick={handleLogoutClick} className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl hover:bg-red-100 transition-all active:scale-95"><LockIcon className="w-5 h-5" /></button>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 no-scrollbar">
                    {activeTab === 'dashboard' && (
                        <div className="animate-smart-fade-in space-y-8">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-smart-slide-up">
                                <QuickActionCard label="Orders" icon={OrdersIcon} color="orange" onClick={() => setActiveTab('orders')} count={dashboardStats.pendingOrders} />
                                <QuickActionCard label="Deposits" icon={WalletIcon} color="purple" onClick={() => setActiveTab('deposits')} count={dashboardStats.pendingDeposits} />
                                <QuickActionCard label="Offers" icon={TagIcon} color="pink" onClick={() => setActiveTab('offers')} />
                                <QuickActionCard label="Tools" icon={GridIcon} color="blue" onClick={() => setActiveTab('tools')} />
                            </div>
                            <div className="grid grid-cols-2 gap-4 animate-smart-slide-up" style={{ animationDelay: '100ms' }}>
                                <button onClick={() => { setActiveTab('deposits'); setDepositFilter('Completed'); }} className="p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-dark-card text-left active:scale-[0.98]"><div className="absolute top-0 right-0 p-4 opacity-5 transform group-hover:scale-125 transition-transform duration-500"><MoneyIcon className="w-24 h-24 text-green-600" /></div><div className="relative z-10"><div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-green-50 text-green-600 dark:bg-green-900/20 group-hover:bg-green-600 group-hover:text-white transition-colors"><MoneyIcon className="w-6 h-6" /></div><p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Deposit</p><h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">৳{dashboardStats.totalDeposit}</h3></div></button>
                                <button onClick={() => { setActiveTab('users'); setUserListMode('ad_rev'); }} className="p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-dark-card text-left active:scale-[0.98]"><div className="absolute top-0 right-0 p-4 opacity-5 transform group-hover:scale-125 transition-transform duration-500"><DollarIcon className="w-24 h-24 text-yellow-600" /></div><div className="relative z-10"><div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 group-hover:bg-yellow-600 group-hover:text-white transition-colors"><DollarIcon className="w-6 h-6" /></div><p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Ad Rev</p><h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">৳{dashboardStats.totalAdRevenue}</h3></div></button>
                                <button onClick={() => { setActiveTab('users'); setUserListMode('active_gamers'); }} className="p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-dark-card text-left active:scale-[0.98]"><div className="absolute top-0 right-0 p-4 opacity-5 transform group-hover:scale-125 transition-transform duration-500"><GamepadIcon className="w-24 h-24 text-primary" /></div><div className="relative z-10"><div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-primary/10 text-primary dark:bg-primary/20 group-hover:bg-primary group-hover:text-white transition-colors"><GamepadIcon className="w-6 h-6" /></div><p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Active Gamers</p><h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">{dashboardStats.activeGamers}</h3></div></button>
                                <button onClick={() => { setActiveTab('users'); setUserListMode('balance'); }} className="p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-dark-card text-left active:scale-[0.98]"><div className="absolute top-0 right-0 p-4 opacity-5 transform group-hover:scale-125 transition-transform duration-500"><WalletIcon className="w-24 h-24 text-orange-600" /></div><div className="relative z-10"><div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-orange-50 text-orange-600 dark:bg-orange-950/30 group-hover:bg-orange-600 group-hover:text-white transition-colors"><WalletIcon className="w-6 h-6" /></div><p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Users Balance</p><h3 className="text-xl sm:text-2xl font-black text-orange-600 dark:text-orange-400 tracking-tight">৳{Math.floor(dashboardStats.usersTotalBalance)}</h3></div></button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="space-y-4 animate-smart-fade-in">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                                <div><div className="flex items-center gap-2"><h3 className="text-xl font-black text-gray-800 dark:text-white"></h3></div><p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Filtered: {filteredUsers.length} / Total: {dashboardStats.totalUsers}</p></div>
                                <div className="flex gap-2">{selectedUserIds.size > 0 && (<button onClick={() => setIsNotifModalOpen(true)} className="px-4 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-lg animate-pulse transform active:scale-95 transition-transform">Message {selectedUserIds.size} Selected</button>)}</div>
                            </div>
                            <SearchInput value={userSearch} onChange={setUserSearch} placeholder="" />
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 animate-smart-slide-up">
                                {filteredUsers.map((u, idx) => (
                                    <div key={u.uid} className={`relative bg-white dark:bg-dark-card p-4 rounded-3xl border flex flex-col gap-3 transition-all ${selectedUserIds.has(u.uid) ? 'border-blue-500 ring-1 ring-blue-500 shadow-md' : 'border-gray-100 dark:border-gray-800 shadow-sm'}`}><div className="absolute top-4 right-4 flex items-center gap-2">{u.role === 'admin' && <span className="bg-red-100 text-red-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase font-black">Admin</span>}<input type="checkbox" checked={selectedUserIds.has(u.uid)} onChange={() => toggleUserSelection(u.uid)} className="w-5 h-5 rounded-lg text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer" /></div><div className="flex items-center gap-3"><div className="relative"><img src={u.avatarUrl || DEFAULT_AVATAR_URL} alt={u.name} className="w-12 h-12 rounded-2xl object-cover border border-gray-100 dark:border-gray-700 shadow-sm" /><div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-dark-card ${u.lastLogin && Date.now() - u.lastLogin < 300000 ? 'bg-green-500' : 'bg-gray-400'}`}></div></div><div className="flex-1 min-w-0 pr-8"><p className="font-black text-sm truncate text-gray-900 dark:text-white">{u.name}</p><div className="flex items-center gap-2 mb-1"><p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{u.email}</p><SmartCopy text={u.email} iconOnly /></div><div className="flex flex-wrap gap-2">{u.playerUid && u.playerUid.trim() !== "" && (<SmartCopy text={u.playerUid} label={u.playerUid} />)}{userListMode === 'active_gamers' ? (<span className="text-[9px] font-black bg-primary text-white px-2 py-0.5 rounded-lg flex items-center gap-1"><GamepadIcon className="w-2.5 h-2.5"/> Level {u.gamerLevels?.unlocked || 1}</span>) : userListMode === 'ad_rev' ? (<div className="flex gap-2"><span className="text-[9px] font-black bg-yellow-500 text-black px-2 py-0.5 rounded-lg">Ads: {u.totalAdsWatched || 0}</span><span className="text-[9px] font-black bg-green-500 text-white px-2 py-0.5 rounded-lg">Earn: ৳{Math.floor(u.totalEarned || 0)}</span></div>) : (userListMode === 'ai_usage' || userListMode === 'ai_active') ? (<div className="flex items-center gap-2"><span className="text-[9px] font-black bg-indigo-500 text-white px-2 py-0.5 rounded-lg flex items-center gap-1"><RobotIcon className="w-2.5 h-2.5" /> AI: {u.aiRequestCount || 0}</span><button onClick={() => handleViewAiHistory(u)} className="text-[8px] font-black bg-white dark:bg-gray-800 text-indigo-600 border border-indigo-600 px-1.5 py-0.5 rounded uppercase hover:bg-indigo-600 hover:text-white transition-all">View Chat</button></div>) : (<span className="text-[9px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-lg">Spent: ৳{Math.floor(u.totalSpent || 0)}</span>)}</div></div></div><div className={`flex justify-between items-center p-2.5 rounded-2xl border ${userListMode === 'balance' ? 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700'}`}><div><p className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">Current Balance</p><p className={`text-lg font-black ${userListMode === 'balance' ? 'text-orange-600' : 'text-primary'}`}>৳{Number(u.balance || 0).toLocaleString()}</p></div><div className="flex gap-2"><button onClick={() => { setBalanceModalUser(u); setBalanceAction('add'); setBalanceAmount(''); }} className="bg-green-500 text-white p-2.5 rounded-xl hover:bg-green-600 active:scale-90 transition-transform shadow-md"><PlusIcon className="w-4 h-4" /></button><button onClick={() => { setBalanceModalUser(u); setBalanceAction('deduct'); setBalanceAmount(''); }} className="bg-red-500 text-white p-2.5 rounded-xl hover:bg-red-600 active:scale-90 transition-transform shadow-md"><MinusIcon className="w-4 h-4" /></button>{u.pin && (<button onClick={() => { setPinModalUser(u); setNewAdminPin(''); }} className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 active:scale-90 transition-transform shadow-md"><ShieldIcon className="w-4 h-4" /></button>)}</div></div></div>
                                ))}
                            </div>
                            {isUsersLoading && (<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>)}
                            {hasMoreUsers && !isUsersLoading && (
                                <div className="flex justify-center pt-8">
                                    <button 
                                        onClick={() => setUsersLimit(prev => prev + 50)} 
                                        className="px-10 py-3.5 bg-gradient-to-r from-primary to-secondary text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl active:scale-95 transition-all hover:brightness-110"
                                    >
                                        LOAD MORE USERS
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'offers' && (
                        <div className="animate-smart-fade-in pb-10">
                            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4"><h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary hidden md:block">Manage Offers</h2><div className="flex w-full md:w-auto gap-2"><button onClick={handleSortByPrice} className="flex-1 md:flex-none py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl font-bold shadow-sm hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all text-xs flex items-center justify-center gap-2"><SortIcon className="w-4 h-4" /><span>Sort by Price</span></button><button onClick={openAddOfferModal} className="flex-1 md:flex-none py-3 px-6 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-bold shadow-lg shadow-primary/30 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all text-xs flex items-center justify-center gap-2"><PlusIcon className="w-4 h-4" /><span>Add New</span></button></div></div>
                            <div className="flex items-center gap-2 p-1.5 bg-gray-100 dark:bg-gray-800/50 rounded-2xl mb-8 overflow-x-auto no-scrollbar shadow-inner border border-gray-200 dark:border-gray-700/50">{['diamond', 'pubg', 'mlbb', 'imo', 'levelUp', 'membership', 'premium', 'special'].map((type) => (<button key={type} onClick={() => setOfferType(type as any)} className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase whitespace-nowrap transition-all duration-300 flex-shrink-0 ${offerType === type ? 'bg-white dark:bg-dark-card text-primary shadow-md transform scale-[1.02]' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'}`}>{type.replace(/([A-Z])/g, ' $1').trim()}</button>))}</div>
                            <div className="grid grid-cols-2 gap-3 animate-smart-slide-up">
                                {offersData[offerType]?.map((offer: any, index: number) => (
                                    <div key={offer.id} draggable onDragStart={() => handleOfferDragStart(index)} onDragEnter={() => handleOfferDragEnter(index)} onDragEnd={handleOfferDrop} onDragOver={(e) => e.preventDefault()} className="group relative bg-white dark:bg-dark-card rounded-2xl p-3 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-800 flex flex-col justify-between overflow-hidden cursor-move active:opacity-50"><div className="absolute top-2 left-2 opacity-30 group-hover:opacity-100 transition-opacity"><GripIcon className="w-4 h-4 text-gray-400" /></div>{offerType === 'special' && (<div className={`absolute top-0 right-0 rounded-bl-xl px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider z-10 ${offer.isActive ? 'bg-green-500 text-white' : 'bg-red-50 text-white'}`}>{offer.isActive ? 'Active' : 'Hidden'}</div>)}<div className="flex justify-between items-start mb-2 mt-2"><div className={`p-2 rounded-xl shadow-inner ${offerType === 'diamond' ? 'bg-blue-50 text-blue-500 dark:bg-blue-900/20' : offerType === 'pubg' ? 'bg-yellow-50 text-yellow-500 dark:bg-yellow-900/20' : offerType === 'levelUp' ? 'bg-purple-50 text-purple-500 dark:bg-purple-900/20' : offerType === 'membership' ? 'bg-orange-50 text-orange-500 dark:bg-orange-900/20' : offerType === 'special' ? 'bg-red-50 text-red-500 dark:bg-red-900/20' : offerType === 'mlbb' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20' : offerType === 'imo' ? 'bg-blue-50 text-[#00A2FF] dark:bg-blue-900/20' : 'bg-yellow-50 text-yellow-500 dark:bg-yellow-900/20'}`}>{offerType === 'diamond' ? <DiamondIcon className="w-5 h-5" /> : offerType === 'pubg' ? (offer.pubgType === 'rp' ? <CrownIcon className="w-5 h-5 text-[#FFD700]" /> : <UcIcon className="w-5 h-5" />) : offerType === 'levelUp' ? <StarIcon className="w-5 h-5" /> : offerType === 'membership' ? <IdCardIcon className="w-5 h-5" /> : offerType === 'special' ? <FireIcon className="w-5 h-5" /> : offerType === 'mlbb' ? <MlbbDiamondIcon className="w-5 h-5" /> : offerType === 'imo' ? <ImoIcon className="w-5 h-5" /> : <CrownIcon className="w-5 h-5" />}</div></div><div className="mb-2"><h3 className="font-extrabold text-gray-900 dark:text-white text-sm leading-tight line-clamp-1 mb-0.5">{offer.name || (offerType === 'diamond' ? `${offer.diamonds} Diamonds` : offerType === 'pubg' ? `${offer.uc} UC` : offerType === 'imo' ? `${offer.diamonds} Diamonds` : 'Package')}</h3><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{offerType === 'diamond' ? `${offer.diamonds} DM` : offerType === 'pubg' ? (offer.pubgType === 'rp' ? 'Royale Pass' : `${offer.uc} UC`) : offerType === 'special' ? offer.title : offerType === 'mlbb' ? (offer.mlbbType === 'diamond' ? 'MLBB Diamond' : 'MLBB Special') : offerType === 'imo' ? `${offer.diamonds} DM` : 'Package'}</p></div><div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800"><span className="text-lg font-black text-gray-900 dark:text-white">৳{offer.price}</span><div className="flex gap-1"><button onClick={(e) => { e.stopPropagation(); setEditingOffer(offer); setIsOfferModalOpen(true); }} className="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors active:scale-95"><EditIcon className="w-3.5 h-3.5" /></button><button onClick={(e) => { e.stopPropagation(); handleDeleteOffer(offer.id); }} className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg hover:bg-red-100 transition-colors active:scale-95"><TrashIcon className="w-3.5 h-3.5" /></button></div></div></div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="space-y-5 animate-smart-fade-in">
                            <SearchInput value={orderSearch} onChange={setOrderSearch} placeholder="" />
                            <div className="flex p-1 bg-gray-200 dark:bg-gray-800 rounded-2xl">{(['Pending', 'Completed', 'Failed'] as const).map(status => (
                                <button key={status} onClick={() => { setOrderFilter(status); }} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all active:scale-95 flex items-center justify-center gap-1.5 uppercase ${orderFilter === status ? 'bg-white dark:bg-dark-card shadow-sm text-primary' : 'text-gray-500'}`}>
                                    {status}
                                    <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black ${orderFilter === status ? 'bg-primary text-white' : 'bg-gray-300 dark:bg-gray-700 text-gray-500'}`}>
                                        {getCounter(status, 'orders')}
                                    </span>
                                </button>
                            ))}</div>
                            <div className="space-y-3 animate-smart-slide-up">
                                {filteredOrders.length === 0 ? <div className="text-center py-20 text-gray-400 text-sm">No orders found</div> : filteredOrders.map(order => {
                                    const isExiting = exitingItems.has(order.key!);
                                    const userEmail = userEmailMap[order.userId] || 'Unknown';
                                    const isPubgOrder = order.offer?.inputType === 'pubg';
                                    const isEmailOrder = order.offer?.inputType === 'email';
                                    const isMlbbOrder = order.offer?.inputType === 'mlbb';
                                    const isImoOrder = order.offer?.inputType === 'imo';
                                    
                                    // Parse UID string logic
                                    const uidStr = order.uid || '';
                                    let displayUid = uidStr;
                                    let secondaryInfo = '';
                                    let secondaryLabel = '';
                                    let playerLabel = isPubgOrder ? "PUBG Player ID" : isMlbbOrder ? "MLBB Player ID" : isImoOrder ? "IMO Details" : "Free Fire UID";

                                    if (isEmailOrder && uidStr.includes('|')) {
                                        const parts = uidStr.split('|');
                                        displayUid = parts[0].trim();
                                        secondaryInfo = parts[1]?.trim() || '';
                                        secondaryLabel = "Phone Number";
                                    } else if (isMlbbOrder && uidStr.includes('|')) {
                                        const parts = uidStr.split('|');
                                        displayUid = parts[0].replace('Player ID:', '').trim();
                                        secondaryInfo = parts[1].replace('Zone ID:', '').trim();
                                        secondaryLabel = "Zone ID";
                                    } else if (isImoOrder) {
                                        if (uidStr.includes('IMO Number:')) {
                                            playerLabel = "IMO Number";
                                            displayUid = uidStr.replace('IMO Number:', '').trim();
                                        } else if (uidStr.includes('IMO ID:')) {
                                            playerLabel = "IMO ID";
                                            displayUid = uidStr.replace('IMO ID:', '').trim();
                                        }
                                    }

                                    // Determine Category Badge
                                    let categoryBadge = { label: 'FF Diamond', color: 'bg-blue-100 text-blue-700' };
                                    const offerNameLower = (order.offer?.name || '').toLowerCase();

                                    if (order.offer?.inputType === 'mlbb') {
                                        categoryBadge = { label: 'MLBB', color: 'bg-indigo-100 text-indigo-700' };
                                    } else if (order.offer?.inputType === 'pubg') {
                                        categoryBadge = { label: 'PUBG', color: 'bg-yellow-100 text-yellow-700' };
                                    } else if (order.offer?.inputType === 'imo') {
                                        categoryBadge = { label: 'IMO', color: 'bg-cyan-100 text-cyan-700' };
                                    } else if (order.offer?.inputType === 'email') {
                                        categoryBadge = { label: 'Premium', color: 'bg-pink-100 text-pink-700' };
                                    } else if (offerNameLower.includes('level')) {
                                        categoryBadge = { label: 'Level Up', color: 'bg-purple-100 text-purple-700' };
                                    } else if (offerNameLower.includes('membership') || offerNameLower.includes('weekly') || offerNameLower.includes('monthly')) {
                                        categoryBadge = { label: 'Membership', color: 'bg-orange-100 text-orange-700' };
                                    } else if (offerNameLower.includes('special') || offerNameLower.includes('deal') || offerNameLower.includes('offer')) {
                                        categoryBadge = { label: 'Special', color: 'bg-red-100 text-red-700' };
                                    }

                                    return (
                                        <div 
                                            key={order.key} 
                                            className={`bg-white dark:bg-dark-card p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all duration-500 ease-in-out transform
                                                ${isExiting ? 'opacity-0 translate-x-full scale-95 max-h-0 py-0 my-0 overflow-hidden pointer-events-none' : 'opacity-100 max-h-[500px] mb-3'}
                                            `}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="shrink-0">{getOfferIcon(order)}</div>
                                                        <span className="font-bold text-sm block text-gray-900 dark:text-white truncate">
                                                            {order.offer?.diamonds || (order.offer as any).uc || order.offer?.name}
                                                            <span className={`ml-2 text-[9px] px-1.5 py-0.5 rounded uppercase font-black ${categoryBadge.color}`}>
                                                                {categoryBadge.label}
                                                            </span>
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className="text-[10px] text-gray-400 font-bold truncate max-w-[120px]">{userEmail}</span>
                                                        <SmartCopy text={userEmail} iconOnly />
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className="font-black text-primary text-base block">৳{order.offer?.price || 0}</span>
                                                    {order.status === 'Pending' && settings.autoRefundActive !== false && <LiveAdminTimer date={order.date} limitMinutes={settings.autoRefundMinutes || 30} />}
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl space-y-2 mb-4 border border-gray-100 dark:border-gray-700">
                                                <div>
                                                    <p className="text-[10px] text-gray-400 mb-0.5">{isEmailOrder ? "Gmail" : playerLabel}</p>
                                                    <SmartCopy text={displayUid} />
                                                </div>
                                                {secondaryInfo && (
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 mb-0.5 flex items-center gap-1">
                                                            {isEmailOrder ? <PhoneIcon className="w-2.5 h-2.5" /> : <GridIcon className="w-2.5 h-2.5" />} 
                                                            {secondaryLabel}
                                                        </p>
                                                        <SmartCopy text={secondaryInfo} label={secondaryInfo} />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-[10px] text-gray-400 mb-0.5">Order ID</p>
                                                    <SmartCopy text={order.id} />
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                {order.status === 'Pending' && (<><button onClick={() => handleOrderAction(order, 'Completed')} className="flex-1 bg-green-500 text-white py-3 rounded-xl font-bold text-xs shadow-md active:scale-95 transition-transform hover:bg-green-600">Approve</button><button onClick={() => handleOrderAction(order, 'Failed')} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold text-xs shadow-md active:scale-95 transition-transform hover:bg-green-600">Reject</button></>)}
                                                <button onClick={() => handleDeleteOrder(order.key!, order.userId)} className="px-4 py-3 bg-gray-100 dark:bg-gray-800 text-red-500 rounded-xl hover:bg-red-50 active:scale-95 transition-transform"><TrashIcon className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {isOrdersLoading && (<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>)}
                        </div>
                    )}

                    {activeTab === 'deposits' && (
                        <div className="space-y-5 animate-smart-fade-in">
                            <SearchInput value={depositSearch} onChange={setOrderSearch} placeholder="" />
                            <div className="flex p-1 bg-gray-200 dark:bg-gray-800 rounded-2xl">{(['Pending', 'Completed', 'Failed'] as const).map(status => (
                                <button key={status} onClick={() => { setDepositFilter(status); }} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all active:scale-95 flex items-center justify-center gap-1.5 uppercase ${depositFilter === status ? 'bg-white dark:bg-dark-card shadow-sm text-primary' : 'text-gray-500'}`}>
                                    {status}
                                    <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black ${depositFilter === status ? 'bg-primary text-white' : 'bg-gray-300 dark:bg-gray-700 text-gray-500'}`}>
                                        {getCounter(status, 'deposits')}
                                    </span>
                                </button>
                            ))}</div>
                            <div className="space-y-3 animate-smart-slide-up">
                                {filteredTransactions.length === 0 ? <div className="text-center py-20 text-gray-400 text-sm">No deposits found</div> : filteredTransactions.map(txn => {
                                    const isExiting = exitingItems.has(txn.key!);
                                    const userEmail = userEmailMap[txn.userId] || 'Unknown';
                                    return (
                                        <div 
                                            key={txn.key} 
                                            className={`bg-white dark:bg-dark-card p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all duration-500 ease-in-out transform
                                                ${isExiting ? 'opacity-0 translate-x-full scale-95 max-h-0 py-0 my-0 overflow-hidden pointer-events-none' : 'opacity-100 max-h-[500px] mb-3'}
                                            `}
                                        >
                                            <div className="flex justify-between mb-3">
                                                <div className="min-w-0 flex-1 pr-4">
                                                    <span className="font-bold text-sm block text-gray-900 dark:text-white">{txn.method}</span>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className="text-[10px] text-gray-400 truncate max-w-[120px]">{userEmail}</span>
                                                        <SmartCopy text={userEmail} iconOnly />
                                                    </div>
                                                </div>
                                                <span className="font-black text-green-600 text-base shrink-0">+৳{txn.amount}</span>
                                            </div>
                                            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl mb-4 flex justify-between items-center border border-gray-100 dark:border-gray-700"><span className="text-gray-500 text-xs">TrxID:</span><SmartCopy text={txn.transactionId} label={txn.transactionId} /></div>
                                            <div className="flex gap-3">
                                                {txn.status === 'Pending' && (<><button onClick={() => handleTxnAction(txn, 'Completed')} className="flex-1 bg-green-500 text-white py-3 rounded-xl font-bold text-xs shadow-md active:scale-95 transition-transform hover:bg-green-600">Approve</button><button onClick={() => handleTxnAction(txn, 'Failed')} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold text-xs shadow-md active:scale-95 transition-transform hover:bg-green-600">Reject</button></>)}
                                                <button onClick={() => handleDeleteTransaction(txn.key!, txn.userId)} className="px-4 py-3 bg-gray-100 dark:bg-gray-800 text-red-500 rounded-xl hover:bg-red-50 active:scale-95 transition-transform"><TrashIcon className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {isDepositsLoading && (<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>)}
                        </div>
                    )}

                    {activeTab === 'tools' && (
                        <div className="animate-smart-fade-in">
                            <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                                {[
                                    { id: 'wallet', label: 'Wallet', icon: WalletIcon },
                                    { id: 'ai', label: 'AI Manager', icon: RobotIcon },
                                    { id: 'graphics', label: 'Graphics', icon: ImageIcon },
                                    { id: 'ads', label: 'Ads Manager', icon: MegaphoneIcon },
                                    { id: 'notifications', label: 'Notifs', icon: BellIcon },
                                    { id: 'contacts', label: 'Contacts', icon: ContactIcon },
                                    { id: 'faqs', label: 'FAQs', icon: HelpIcon },
                                    { id: 'setup', label: 'App Config', icon: SettingsIcon },
                                    { id: 'reports', label: 'Reports', icon: PieChartIcon },
                                    { id: 'history', label: 'History', icon: ClockIcon }, // Changed icon and position
                                ].map(tool => (
                                    <button key={tool.id} onClick={() => setActiveTool(tool.id as any)} className={`flex flex-col items-center justify-center min-w-[85px] p-3.5 rounded-2xl transition-all border active:scale-95 ${activeTool === tool.id ? 'bg-primary text-white border-primary shadow-lg' : 'bg-white dark:bg-dark-card text-gray-500 border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'}`}><tool.icon className="w-6 h-6 mb-1" /><span className="text-[9px] font-black uppercase tracking-widest">{tool.label}</span></button>
                                ))}
                            </div>
                            <div className="bg-white dark:bg-dark-card p-4 rounded-[2rem] shadow-sm min-h-[300px] border border-gray-100 dark:border-gray-800 animate-smart-slide-up">
                                {activeTool === 'history' && (
                                    <div className="space-y-4 animate-smart-fade-in">
                                        <SearchInput value={historySearch} onChange={setHistorySearch} placeholder="Search..." />
                                        
                                        <div className="flex p-1 bg-gray-100 dark:bg-gray-900 rounded-2xl mb-2">
                                            <button 
                                                onClick={() => { setHistoryTab('orders'); setHistoryLimit(50); }} 
                                                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${historyTab === 'orders' ? 'bg-white dark:bg-dark-card text-primary shadow-sm' : 'text-gray-400'}`}
                                            >
                                                Orders
                                            </button>
                                            <button 
                                                onClick={() => { setHistoryTab('deposits'); setHistoryLimit(50); }} 
                                                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${historyTab === 'deposits' ? 'bg-white dark:bg-dark-card text-primary shadow-sm' : 'text-gray-400'}`}
                                            >
                                                Deposits
                                            </button>
                                        </div>
                                        
                                        {/* FIXED TAB SPACING HERE */}
                                        <div className="flex p-1 bg-gray-100 dark:bg-gray-900 rounded-xl mb-4">
                                            {['All', 'Completed', 'Failed'].map((filter) => (
                                                <button 
                                                    key={filter}
                                                    onClick={() => setHistorySubFilter(filter as any)}
                                                    className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase whitespace-nowrap transition-all ${historySubFilter === filter ? (filter === 'Completed' ? 'bg-green-500 text-white' : filter === 'Failed' ? 'bg-red-500 text-white' : 'bg-primary text-white') : 'bg-white dark:bg-dark-card text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                                >
                                                    {filter}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="space-y-3">
                                            
                                            {/* Summary Card with Long Press Logic */}
                                            <div 
                                                className="p-4 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg mb-4 relative overflow-hidden animate-smart-pop-in cursor-pointer active:scale-95 transition-all select-none touch-none"
                                                onMouseDown={() => {
                                                    historyCardTimerRef.current = window.setTimeout(() => {
                                                        const { filtered, totalCompleted, totalFailed } = historyData;
                                                        handleCopyHistorySummary(filtered, totalCompleted, totalFailed);
                                                        if (navigator.vibrate) navigator.vibrate(50);
                                                    }, 800);
                                                }}
                                                onMouseUp={() => { if (historyCardTimerRef.current) clearTimeout(historyCardTimerRef.current); }}
                                                onMouseLeave={() => { if (historyCardTimerRef.current) clearTimeout(historyCardTimerRef.current); }}
                                                onTouchStart={() => {
                                                    historyCardTimerRef.current = window.setTimeout(() => {
                                                        const { filtered, totalCompleted, totalFailed } = historyData;
                                                        handleCopyHistorySummary(filtered, totalCompleted, totalFailed);
                                                        if (navigator.vibrate) navigator.vibrate(50);
                                                    }, 800);
                                                }}
                                                onTouchEnd={() => { if (historyCardTimerRef.current) clearTimeout(historyCardTimerRef.current); }}
                                            >
                                                <div className="absolute top-0 right-0 p-2 opacity-10"><PieChartIcon className="w-16 h-16 text-white" /></div>
                                                <div className="relative z-10 flex justify-between items-start">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Found</p>
                                                        <p className="text-2xl font-black">{historyData.count}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-3 grid grid-cols-2 gap-4 relative z-10">
                                                    <div>
                                                        <p className="text-[9px] font-bold text-green-400 uppercase tracking-widest">Completed</p>
                                                        <p className="text-sm font-black text-green-300">৳{historyData.totalCompleted.toLocaleString()}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest">Failed</p>
                                                        <p className="text-sm font-black text-red-300">৳{historyData.totalFailed.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {historyData.displayData.length === 0 ? <div className="text-center py-10 text-gray-400 text-xs italic">No records found</div> : (
                                                <>
                                                    {historyData.displayData.map((item, idx) => {
                                                        const email = userEmailMap[item.userId] || 'Unknown';
                                                        // Full datetime with seconds
                                                        const dateStr = new Date(item.date).toLocaleString('en-GB', { 
                                                            day: '2-digit', month: 'short', year: 'numeric', 
                                                            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
                                                        });
                                                        const isOrder = historyTab === 'orders';
                                                        
                                                        return (
                                                            <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 flex justify-between items-center group relative overflow-hidden">
                                                                <div className="flex-1 min-w-0 pr-2">
                                                                    <p className="text-[10px] font-bold text-gray-900 dark:text-white truncate">
                                                                        {isOrder ? (item.offer?.name || item.offer?.diamonds + ' Diamonds') : item.method}
                                                                    </p>
                                                                    <p className="text-[8px] text-gray-500 font-mono truncate">{email}</p>
                                                                    <div className="flex items-center gap-1 mt-0.5">
                                                                        <span className="text-[8px] font-mono text-gray-400 bg-gray-200 dark:bg-gray-700 px-1 rounded">{item.id || item.transactionId}</span>
                                                                        <span className="text-[8px] text-gray-400 font-medium">{dateStr}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right flex flex-col items-end">
                                                                    <p className="text-xs font-black text-primary mb-1">৳{isOrder ? item.offer?.price : item.amount}</p>
                                                                    <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded ${
                                                                        item.status === 'Completed' ? 'bg-green-100 text-green-600' :
                                                                        item.status === 'Pending' ? 'bg-yellow-100 text-yellow-600' : 
                                                                        'bg-red-100 text-red-600'
                                                                    }`}>{item.status}</span>
                                                                </div>
                                                                
                                                                {/* Delete Button - UPDATED STYLE */}
                                                                <button 
                                                                    onClick={(e) => { 
                                                                        e.stopPropagation(); 
                                                                        if (isOrder) handleDeleteOrder(item.key!, item.userId);
                                                                        else handleDeleteTransaction(item.key!, item.userId);
                                                                    }}
                                                                    className="absolute right-0 top-0 bottom-0 w-12 bg-red-600 flex items-center justify-center translate-x-full group-hover:translate-x-0 transition-transform duration-200 shadow-xl"
                                                                >
                                                                    <TrashIcon className="w-5 h-5 text-white" />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                    
                                                    {historyData.count > historyLimit && (
                                                        <button 
                                                            onClick={() => setHistoryLimit(prev => prev + 50)}
                                                            className="w-full py-3 mt-4 bg-gray-100 dark:bg-gray-800 text-gray-500 font-bold text-[10px] rounded-xl uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                                        >
                                                            Load More
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {activeTool === 'reports' && (
                                    <div className="space-y-4 animate-smart-fade-in">
                                        <div className="flex items-center justify-between px-2">
                                            <div>
                                                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Business Intelligence</h3>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Performance Metrics</p>
                                            </div>
                                            <button 
                                                onClick={handleDownloadCSV}
                                                className="p-2.5 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all active:scale-90 shadow-sm flex items-center gap-2"
                                                title="Download Report CSV"
                                            >
                                                <DownloadIcon className="w-4 h-4" />
                                                <span className="text-[10px] font-bold uppercase hidden sm:inline">Export CSV</span>
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div 
                                                onClick={handleGoToOrders}
                                                className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100/50 dark:border-indigo-800/30 cursor-pointer hover:scale-[1.02] transition-transform active:scale-95"
                                            >
                                                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Total Sales</p>
                                                <h4 className="text-xl font-black text-indigo-700 dark:text-indigo-400">৳{reportsSummary.totalSales.toLocaleString()}</h4>
                                                <ReportLineChart data={reportsSummary.charts.sales} color="#6366f1" label="sales" />
                                            </div>
                                            <div 
                                                onClick={handleGoToDeposits}
                                                className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100/50 dark:border-emerald-800/30 cursor-pointer hover:scale-[1.02] transition-transform active:scale-95"
                                            >
                                                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Total Deposits</p>
                                                <h4 className="text-xl font-black text-emerald-600 dark:text-emerald-400">৳{reportsSummary.totalDeposits.toLocaleString()}</h4>
                                                <ReportLineChart data={reportsSummary.charts.deposits} color="#10b981" label="deposits" />
                                            </div>
                                            <div 
                                                onClick={handleGoToUsers}
                                                className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-3xl border border-blue-100/50 dark:border-blue-800/30 cursor-pointer hover:scale-[1.02] transition-transform active:scale-95"
                                            >
                                                <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">New Users</p>
                                                <h4 className="text-xl font-black text-blue-600 dark:text-blue-400">{reportsSummary.newUsers}</h4>
                                                <ReportLineChart data={reportsSummary.charts.users} color="#3b82f6" label="users" />
                                            </div>
                                            <div 
                                                onClick={handleGoToOrders}
                                                className="p-4 bg-purple-50/50 dark:bg-purple-900/10 rounded-3xl border border-purple-100/50 dark:border-purple-800/30 cursor-pointer hover:scale-[1.02] transition-transform active:scale-95"
                                            >
                                                <p className="text-[9px] font-black text-purple-500 uppercase tracking-widest mb-1">Completed Orders</p>
                                                <h4 className="text-xl font-black text-purple-600 dark:text-purple-400">{reportsSummary.completedOrdersCount}</h4>
                                                <div className="mt-4 flex gap-1 items-end justify-center">
                                                    <div className="w-2 bg-red-400 rounded-t-sm" style={{ height: `${(reportsSummary.failedOrders / Math.max(reportsSummary.totalOrders, 1)) * 40}px` }} title="Failed"></div>
                                                    <div className="w-2 bg-orange-400 rounded-t-sm" style={{ height: `${(reportsSummary.pendingOrders / Math.max(reportsSummary.totalOrders, 1)) * 40}px` }} title="Pending"></div>
                                                    <div className="w-2 bg-green-400 rounded-t-sm" style={{ height: `${(reportsSummary.completedOrdersCount / Math.max(reportsSummary.totalOrders, 1)) * 40}px` }} title="Completed"></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* New Metrics Section */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-center text-center">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Avg. Order Value</p>
                                                <h4 className="text-lg font-black text-gray-800 dark:text-gray-200">৳{reportsSummary.avgOrderValue.toLocaleString()}</h4>
                                            </div>
                                            <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-center text-center">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Success Rate</p>
                                                <h4 className={`text-lg font-black ${reportsSummary.successRate > 80 ? 'text-green-500' : 'text-orange-500'}`}>{reportsSummary.successRate}%</h4>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-[2rem] border border-gray-100 dark:border-gray-700">
                                            <div className="flex flex-col gap-4">
                                                <div className="flex gap-1.5 p-1 bg-gray-200 dark:bg-gray-900 rounded-2xl shadow-inner">
                                                    {[7, 30, 90, 365].map(d => (
                                                        <button 
                                                            key={d} 
                                                            onClick={() => { setReportType('preset'); setReportDays(d); }}
                                                            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all ${reportType === 'preset' && reportDays === d ? 'bg-white dark:bg-dark-card text-primary shadow-sm' : 'text-gray-400'}`}
                                                        >
                                                            {d === 365 ? '1 Year' : `${d} Days`}
                                                        </button>
                                                    ))}
                                                    <button 
                                                        onClick={() => setReportType('custom')}
                                                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all ${reportType === 'custom' ? 'bg-primary text-white shadow-md' : 'text-gray-400'}`}
                                                    >
                                                        Custom
                                                    </button>
                                                </div>
                                                
                                                {reportType === 'custom' && (
                                                    <div className="flex gap-2 animate-smart-pop-in">
                                                        <div className="flex-1">
                                                            <p className="text-[8px] font-black text-gray-400 uppercase mb-1 ml-1">Start</p>
                                                            <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="w-full bg-white dark:bg-gray-800 border-none rounded-xl text-[10px] p-2.5 focus:ring-1 focus:ring-primary outline-none shadow-sm" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-[8px] font-black text-gray-400 uppercase mb-1 ml-1">End</p>
                                                            <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="w-full bg-white dark:bg-gray-800 border-none rounded-xl text-[10px] p-2.5 focus:ring-1 focus:ring-primary outline-none shadow-sm" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-4">
                                            <h5 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">Top Selling Products</h5>
                                            <div className="space-y-3">
                                                {reportsSummary.topOffers.length === 0 ? (
                                                    <p className="text-center py-4 text-gray-400 text-[10px] italic">No order data found</p>
                                                ) : (
                                                    reportsSummary.topOffers.map((offer, i) => (
                                                        <div key={i} className="flex flex-col gap-1.5">
                                                            <div className="flex items-center justify-between px-1">
                                                                <span className="text-[11px] font-bold text-gray-800 dark:text-white truncate max-w-[150px]">{offer.name}</span>
                                                                <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-full">{offer.count} Units</span>
                                                            </div>
                                                            <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                                                <div 
                                                                    className="bg-gradient-to-r from-primary to-secondary h-full transition-all duration-1000" 
                                                                    style={{ width: `${(offer.count / reportsSummary.topOffers[0].count) * 100}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {activeTool === 'setup' && (
                                    <div className="space-y-6">
                                        <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/10">
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">App Display Name</label>
                                                    <input type="text" value={settings.appName} onChange={(e) => setSettings({...settings, appName: e.target.value})} className={inputClass} />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Domain Control Panel URL</label>
                                                    <input 
                                                        type="text" 
                                                        value={(settings as any).domainControlUrl || ''} 
                                                        onChange={(e) => setSettings({...settings, domainControlUrl: e.target.value} as any)} 
                                                        className={inputClass} 
                                                        placeholder="Enter URL here"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">App Header Logo</label>
                                                    <ImagePicker 
                                                        value={settings.logoUrl || ''} 
                                                        onChange={(val) => setSettings({...settings, logoUrl: val})} 
                                                        onUpload={(dataUrl) => {
                                                            setTempCropperImage(dataUrl);
                                                            setOnCropCompleteCallback(() => (croppedUrl) => setSettings({...settings, logoUrl: croppedUrl}));
                                                            setShowCropper(true);
                                                        }}
                                                        placeholder="Enter URL or Upload" 
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Home Notice Message</label>
                                                    <textarea value={settings.notice || ''} onChange={(e) => setSettings({...settings, notice: e.target.value})} className={inputClass} rows={2} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/30"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Auto-Refund (Minutes)</label><input type="number" value={settings.autoRefundMinutes || 30} onChange={(e) => setSettings({...settings, autoRefundMinutes: Number(e.target.value)})} className={inputClass} /></div><div className="md:col-span-2 grid grid-cols-2 gap-3"><div><label className="block text-[9px] font-black text-gray-400 uppercase mb-1 ml-1">Ad: Daily Limit</label><input type="number" value={settings.earnSettings?.dailyLimit} onChange={(e) => setSettings({...settings, earnSettings: { ...settings.earnSettings!, dailyLimit: Number(e.target.value) }})} className={inputClass} /></div><div><label className="block text-[9px] font-black text-gray-400 uppercase mb-1 ml-1">Ad: Reward (৳)</label><input type="number" value={settings.earnSettings?.rewardPerAd} onChange={(e) => setSettings({...settings, earnSettings: { ...settings.earnSettings!, rewardPerAd: Number(e.target.value) }})} className={inputClass} /></div><div><label className="block text-[9px] font-black text-gray-400 uppercase mb-1 ml-1">Ad: Cooldown (s)</label><input type="number" value={settings.earnSettings?.adCooldownSeconds} onChange={(e) => setSettings({...settings, earnSettings: { ...settings.earnSettings!, adCooldownSeconds: Number(e.target.value) }})} className={inputClass} /></div><div><label className="block text-[9px] font-black text-gray-400 uppercase mb-1 ml-1">Ad: Reset (h)</label><input type="number" value={settings.earnSettings?.resetHours} onChange={(e) => setSettings({...settings, earnSettings: { ...settings.earnSettings!, resetHours: Number(e.target.value) }})} className={inputClass} /></div></div></div></div>
                                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700"><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5 ml-1">Home Card Design Size</label><div className="grid grid-cols-2 gap-2">{[{ id: 'normal', label: 'Default' }, { id: 'small', label: 'Small' }, { id: 'smaller', label: 'Tiny' }, { id: 'extra-small', label: 'Nano' }].map(size => (<button key={size.id} type="button" onClick={() => setSettings({ ...settings, uiSettings: { ...settings.uiSettings!, cardSize: size.id as any } })} className={`py-2.5 rounded-xl text-[10px] font-black border transition-all ${settings.uiSettings?.cardSize === size.id ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700'}`}>{size.label}</button>))}</div></div>
                                        <button onClick={handleSettingsSave} disabled={!isSettingsChanged} className={`w-full py-4 font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all ${isSettingsChanged ? 'bg-primary text-white active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}`}>Update App Setup</button>
                                    </div>
                                )}
                                {activeTool === 'wallet' && (
                                    <div>
                                        <button onClick={openAddMethodModal} className="w-full py-4 mb-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl text-gray-500 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 text-sm active:scale-95 transform">+ Add Wallet</button>
                                        <div className="space-y-3 mb-8">
                                            {paymentMethods.map((method, index) => (
                                                <div key={index} className={`flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border transition-all ${method.isActive === false ? 'opacity-60 border-red-200 dark:border-red-900/30' : 'border-gray-100 dark:border-gray-700'}`}>
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative">
                                                            <img src={method.logo} className="w-10 h-10 object-contain bg-white rounded-lg p-1" />
                                                            {method.isActive === false && <div className="absolute inset-0 bg-red-500/20 rounded-lg flex items-center justify-center"><LockIcon className="w-4 h-4 text-red-600" /></div>}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                                                {method.name}
                                                                {method.isActive === false && <span className="text-[8px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase font-black">Inactive</span>}
                                                            </p>
                                                            <SmartCopy text={method.accountNumber} />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div onClick={() => handleToggleMethod(index)} className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${method.isActive !== false ? 'bg-green-500' : 'bg-gray-300'}`}>
                                                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${method.isActive !== false ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <button onClick={() => openEditMethodModal(method, index)} className="p-2 bg-blue-100 text-blue-600 rounded-lg active:scale-90 transition-transform"><EditIcon className="w-4 h-4"/></button>
                                                            <button onClick={() => handleDeleteMethod(index)} className="p-2 bg-red-100 text-red-600 rounded-lg active:scale-90 transition-transform"><TrashIcon className="w-4 h-4"/></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-3xl border border-blue-100 dark:border-blue-900/30">
                                            <div className="flex items-center gap-3 mb-4"><PlayIcon className="w-6 h-6 text-blue-600" /><h4 className="font-bold text-sm text-blue-900 dark:text-blue-100">Wallet Screen Video Tutorial</h4></div>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center p-3 bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-gray-700"><span className="font-bold text-xs">Video Player Status</span><div onClick={() => setSettings({...settings, walletVideoActive: !settings.walletVideoActive})} className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${settings.walletVideoActive ? 'bg-green-500' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${settings.walletVideoActive ? 'translate-x-6' : 'translate-x-0'}`}></div></div></div>
                                                <div><input type="text" value={settings.walletVideoUrl || ''} onChange={(e) => setSettings({...settings, walletVideoUrl: e.target.value})} className={inputClass} placeholder="YouTube Video URL" /></div>
                                                <button onClick={handleSettingsSave} disabled={!isSettingsChanged} className={`w-full py-3 rounded-2xl font-bold text-xs shadow-md transition-all ${isSettingsChanged ? 'bg-blue-600 text-white active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}`}>Save Video Settings</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {activeTool === 'ai' && (
                                    <div className="space-y-6">
                                        {/* FAST & LITE AI MANAGER UI */}
                                        <div className="bg-purple-600 p-6 rounded-3xl border border-white/10 shadow-lg">
                                            <div className="flex items-center gap-3 mb-8">
                                                <div className="p-2.5 bg-white/20 rounded-xl">
                                                    <RobotIcon className="w-6 h-6 text-white" />
                                                </div>
                                                <h3 className="font-black text-lg text-white uppercase tracking-widest">AI Manager</h3>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <button 
                                                    onClick={() => { setActiveTab('users'); setUserListMode('ai_usage'); }} 
                                                    className="bg-white/10 p-5 rounded-2xl border border-white/5 text-left active:scale-95 transition-transform"
                                                >
                                                    <p className="text-3xl font-black mb-1 text-white">{aiOverview.totalInteractions}</p>
                                                    <p className="text-[10px] font-bold text-purple-200 uppercase tracking-widest">Total Interactions</p>
                                                </button>
                                                <button 
                                                    onClick={() => { setActiveTab('users'); setUserListMode('ai_active'); }} 
                                                    className="bg-white/10 p-5 rounded-2xl border border-white/5 text-left active:scale-95 transition-transform"
                                                >
                                                    <p className="text-3xl font-black mb-1 text-white">{aiOverview.activeAiUsers}</p>
                                                    <p className="text-[10px] font-bold text-purple-200 uppercase tracking-widest">Active Today</p>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="bg-purple-50 dark:bg-purple-900/10 p-6 rounded-3xl border border-purple-100 dark:border-purple-900/40 space-y-6 shadow-sm">
                                            <SettingToggle label="Enable AI Support" active={settings.aiSupportActive ?? true} onClick={() => setSettings({...settings, aiSupportActive: !settings.aiSupportActive})} colorClass="bg-green-500" />
                                            <div><label className="block text-[10px] font-black text-purple-600 dark:text-purple-300 uppercase tracking-widest mb-2 ml-1">Bot Name</label><input type="text" value={settings.aiName || ''} onChange={(e) => setSettings({...settings, aiName: e.target.value})} className={`${inputClass} border-purple-200 dark:border-purple-800`} placeholder="AI TOM" /></div>
                                            <div><label className="block text-[10px] font-black text-purple-600 dark:text-purple-300 uppercase tracking-widest mb-2 ml-1">Gemini API Key</label><input type="password" value={settings.aiApiKey || ''} onChange={(e) => { setSettings({...settings, aiApiKey: e.target.value}); if (apiKeyError) setApiKeyError(''); }} className={`${inputClass} border-purple-200 dark:border-purple-800 ${apiKeyError ? 'border-red-500' : ''}`} placeholder="AIzaSy..." /></div>
                                            <button onClick={handleSettingsSave} disabled={!isSettingsChanged} className={`w-full py-4 font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95 ${isSettingsChanged ? 'bg-purple-600 text-white shadow-none' : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}`}>Save Settings</button>
                                        </div>
                                    </div>
                                )}
                                {activeTool === 'graphics' && (
                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest"></h3>
                                                {!isAddingBanner && (
                                                    <button 
                                                        onClick={() => setIsAddingBanner(true)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all active:scale-95"
                                                    >
                                                        <PlusIcon className="w-3.5 h-3.5" />
                                                        <span className="text-[10px] font-black uppercase tracking-wider">Add New</span>
                                                    </button>
                                                )}
                                            </div>

                                            {isAddingBanner && (
                                                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 mb-6 animate-smart-slide-down">
                                                    <div className="space-y-3">
                                                        <ImagePicker 
                                                            value={newBannerUrl} 
                                                            onChange={setNewBannerUrl} 
                                                            onUpload={(dataUrl) => {
                                                                setTempCropperImage(dataUrl);
                                                                setOnCropCompleteCallback(() => (croppedUrl) => setNewBannerUrl(croppedUrl));
                                                                setShowCropper(true);
                                                            }}
                                                            placeholder="Banner Image URL" 
                                                        />
                                                        <input type="text" value={newActionUrl} onChange={(e) => setNewActionUrl(e.target.value)} className={inputClass} placeholder="Action URL (Optional)" />
                                                        <div className="flex gap-2">
                                                            <button onClick={handleAddBanner} disabled={!newBannerUrl} className={`flex-1 py-3 rounded-xl font-bold text-xs text-white active:scale-95 transform transition-all ${newBannerUrl ? 'bg-green-500 shadow-md shadow-green-500/20' : 'bg-gray-300 cursor-not-allowed'}`}>Add Banner</button>
                                                            <button onClick={() => setIsAddingBanner(false)} className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-xl font-bold text-xs active:scale-95">Cancel</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-4">
                                                {banners.map((banner, index) => (
                                                    <div key={index} className="relative h-28 rounded-2xl overflow-hidden group border border-gray-100 dark:border-gray-800 shadow-sm">
                                                        <img src={banner.imageUrl} className="w-full h-full object-cover" />
                                                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => openEditBannerModal(index, banner)} className="bg-blue-600 text-white p-2.5 rounded-xl shadow-md active:scale-90 transform"><EditIcon className="w-4 h-4" /></button>
                                                            <button onClick={() => handleDeleteBanner(index)} className="bg-red-600 text-white p-2.5 rounded-xl shadow-md active:scale-90 transform"><TrashIcon className="w-4 h-4"/></button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {activeTool === 'ads' && (
                                    <div className="space-y-6">
                                        <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-200 dark:border-gray-700"><div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-3"><MegaphoneIcon className="w-5 h-5 text-orange-500"/><h4 className="font-bold text-sm">Reward Ad Settings</h4></div><div className="flex p-1.5 bg-gray-100 dark:bg-gray-700 rounded-2xl mb-6 shadow-inner"><button onClick={() => setSettings({...settings, earnSettings: { ...settings.earnSettings!, webAds: { ...settings.earnSettings!.webAds, active: true }, adMob: { ...settings.earnSettings!.adMob, active: false } }})} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${settings.earnSettings?.webAds?.active ? 'bg-white dark:bg-dark-card text-primary shadow-md scale-[1.02]' : 'text-gray-400'}`}>Web Video</button><button onClick={() => setSettings({...settings, earnSettings: { ...settings.earnSettings!, webAds: { ...settings.earnSettings!.webAds, active: false }, adMob: { ...settings.earnSettings!.adMob, active: true } }})} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${settings.earnSettings?.adMob?.active ? 'bg-white dark:bg-dark-card text-indigo-600 shadow-md scale-[1.02]' : 'text-gray-400'}`}>AdMob</button></div><div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-200 dark:border-gray-700">{settings.earnSettings?.webAds?.active ? (<div className="space-y-4 animate-smart-fade-in"><div className="flex items-center gap-2 mb-2"><div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div><span className="text-[10px] font-black uppercase text-primary">Web Video Setup</span></div><div><input type="text" value={settings.earnSettings?.webAds?.url || ''} onChange={(e) => setSettings({...settings, earnSettings: { ...settings.earnSettings!, webAds: { ...settings.earnSettings!.webAds, url: e.target.value } }})} className={inputClass} placeholder="Video URL" /></div><div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 ml-1">Duration (Seconds)</label><input type="number" value={settings.earnSettings?.webAds?.duration || 15} onChange={(e) => setSettings({...settings, earnSettings: { ...settings.earnSettings!, webAds: { ...settings.earnSettings!.webAds, duration: Number(e.target.value) } }})} className={inputClass} /></div></div>) : (<div className="space-y-4 animate-smart-fade-in"><div className="flex items-center gap-2 mb-2"><div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div><span className="text-[10px] font-black uppercase text-indigo-500">AdMob Setup</span></div><div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 ml-1">App ID</label><input type="text" value={settings.earnSettings?.adMob?.appId || ''} onChange={(e) => setSettings({...settings, earnSettings: { ...settings.earnSettings!, adMob: { ...settings.earnSettings!.adMob, appId: e.target.value } }})} className={inputClass} placeholder="ca-app-pub-..." /></div><div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 ml-1">Reward ID</label><input type="text" value={settings.earnSettings?.adMob?.rewardId || ''} onChange={(e) => setSettings({...settings, earnSettings: { ...settings.earnSettings!, adMob: { ...settings.earnSettings!.adMob, rewardId: e.target.value } }})} className={inputClass} placeholder="Reward Unit ID" /></div></div>)}</div></div>
                                        <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-200 dark:border-gray-700"><div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-3"><MegaphoneIcon className="w-5 h-5 text-orange-500"/><h4 className="font-bold text-sm">Banner Ads (Adsterra/Monetag)</h4></div><div className="space-y-6"><div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl"><div className="flex justify-between items-center mb-3"><span className="font-bold text-[10px] uppercase text-gray-500">Home Screen Ad</span><div onClick={() => setSettings({...settings, earnSettings: { ...settings.earnSettings!, homeAdActive: !settings.earnSettings!.homeAdActive }})} className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${settings.earnSettings?.homeAdActive ? 'bg-green-500' : 'bg-gray-300'}`}><div className={`w-3 h-3 bg-white rounded-full transition-transform ${settings.earnSettings?.homeAdActive ? 'translate-x-4' : ''}`}></div></div></div><textarea value={settings.earnSettings?.homeAdCode || ''} onChange={(e) => setSettings({...settings, earnSettings: { ...settings.earnSettings!, homeAdCode: e.target.value }})} className={`${inputClass} font-mono text-[10px]`} placeholder="Paste script code here..." rows={3} /></div><div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl"><div className="flex justify-between items-center mb-3"><span className="font-bold text-[10px] uppercase text-gray-500">Earn Screen Ad</span><div onClick={() => setSettings({...settings, earnSettings: { ...settings.earnSettings!, earnAdActive: !settings.earnSettings!.earnAdActive }})} className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${settings.earnSettings?.earnAdActive ? 'bg-green-500' : 'bg-gray-300'}`}><div className={`w-3 h-3 bg-white rounded-full transition-transform ${settings.earnSettings?.earnAdActive ? 'translate-x-4' : ''}`}></div></div></div><textarea value={settings.earnSettings?.earnAdCode || ''} onChange={(e) => setSettings({...settings, earnSettings: { ...settings.earnSettings!, earnAdCode: e.target.value }})} className={`${inputClass} font-mono text-[10px]`} placeholder="Paste script code here..." rows={3} /></div><div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl"><div className="flex justify-between items-center mb-3"><span className="font-bold text-[10px] uppercase text-gray-500">Profile Pages Ad</span><div onClick={() => setSettings({...settings, earnSettings: { ...settings.earnSettings!, profileAdActive: !settings.earnSettings!.profileAdActive }})} className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${settings.earnSettings?.profileAdActive ? 'bg-green-500' : 'bg-gray-300'}`}><div className={`w-3 h-3 bg-white rounded-full transition-transform ${settings.earnSettings?.profileAdActive ? 'translate-x-4' : ''}`}></div></div></div><textarea value={settings.earnSettings?.profileAdCode || ''} onChange={(e) => setSettings({...settings, profileAdCode: e.target.value})} className={`${inputClass} font-mono text-[10px]`} placeholder="Paste script code here..." rows={3} /></div></div></div><button onClick={handleSettingsSave} disabled={!isSettingsChanged} className={`w-full py-3.5 font-bold text-sm rounded-2xl shadow-md transition-all active:scale-95 transform ${isSettingsChanged ? 'bg-primary text-white hover:opacity-90 shadow-none' : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}`}>Save All All Ad Settings</button></div>
                                )}
                                {activeTool === 'notifications' && (
                                    <div className="space-y-6">
                                        <div className="bg-purple-50 dark:bg-purple-900/10 p-5 rounded-3xl border border-purple-100 dark:border-purple-900/20"><button onClick={() => setIsNotifModalOpen(true)} className="w-full py-3.5 bg-purple-600 text-white rounded-2xl font-bold shadow-md hover:bg-purple-700 transition-colors text-sm active:scale-95 transform">+ Create Message</button></div>
                                        <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-200 dark:border-gray-700">
                                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                                                <h4 className="font-bold text-sm text-indigo-600">Login Popup</h4>
                                                <div onClick={() => setPopupConfig({...popupConfig, active: !popupConfig.active})} className={`w-10 h-5 rounded-full p-1 cursor-pointer transition-colors ${popupConfig.active ? 'bg-green-500' : 'bg-gray-300'}`}><div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${popupConfig.active ? 'translate-x-5' : 'translate-x-0'}`}></div></div>
                                            </div>
                                            <div className="space-y-3">
                                                <input type="text" placeholder="Title" value={popupConfig.title} onChange={(e) => setPopupConfig({...popupConfig, title: e.target.value})} className={inputClass} />
                                                <textarea placeholder="Message..." value={popupConfig.message} onChange={(e) => setPopupConfig({...popupConfig, message: e.target.value})} className={inputClass} rows={2} />
                                                <ImagePicker 
                                                    value={popupConfig.imageUrl || ''} 
                                                    onChange={(val) => setPopupConfig({...popupConfig, imageUrl: val})} 
                                                    onUpload={(dataUrl) => {
                                                        setTempCropperImage(dataUrl);
                                                        setOnCropCompleteCallback(() => (croppedUrl) => setPopupConfig({...popupConfig, imageUrl: croppedUrl}));
                                                        setShowCropper(true);
                                                    }}
                                                    placeholder="Popup Image URL" 
                                                />
                                                <button onClick={handleSavePopupConfig} className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold text-xs mt-2 hover:bg-indigo-700 active:scale-95 transform">Save Popup</button>
                                            </div>
                                        </div>
                                        <div><div className="space-y-3">{notifications.map(n => (<div key={n.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl flex justify-between items-start border border-gray-100 dark:border-gray-700"><div><p className="font-bold text-sm text-gray-900 dark:text-white">{n.title}</p><p className="text-xs text-gray-500 line-clamp-1">{n.message}</p></div><button onClick={() => handleDeleteNotification(n.id)} className="text-red-500 p-2 active:scale-90 transform"><TrashIcon className="w-4 h-4"/></button></div>))}</div></div>
                                    </div>
                                )}
                                {activeTool === 'contacts' && (
                                    <div className="space-y-6">
                                        {/* ADD CONTACT BUTTON AT TOP */}
                                        <button onClick={openAddContactModal} className="w-full py-4 bg-blue-50 dark:bg-blue-900/10 text-blue-600 border-2 border-dashed border-blue-200 dark:border-blue-900/30 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transform shadow-sm hover:bg-blue-100 transition-all">+ Add Custom Contact</button>
                                        
                                        {/* CONTACT LIST BOXES IN THE MIDDLE */}
                                        <div className="space-y-3">
                                            {contacts.map((c, i) => (
                                                <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl flex justify-between items-center border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border flex items-center justify-center shadow-inner">
                                                            {c.iconUrl ? <img src={c.iconUrl} className="w-full h-full object-cover" /> : <div className="text-primary font-black uppercase text-xl">{c.title?.charAt(0)}</div>}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm text-gray-900 dark:text-white leading-none mb-1">{c.title || c.labelKey}</p>
                                                            <p className="text-[9px] text-gray-400 font-mono truncate max-w-[150px]">{c.link}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => openEditContactModal(c, i)} className="p-2.5 bg-blue-100 text-blue-600 rounded-xl active:scale-90 transform hover:bg-blue-200 transition-colors"><EditIcon className="w-4 h-4"/></button>
                                                        <button onClick={() => handleDeleteContact(i)} className="p-2.5 bg-red-100 text-red-600 rounded-xl active:scale-90 transform hover:bg-red-200 transition-colors"><TrashIcon className="w-4 h-4"/></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* GLOBAL SUPPORT INFO (LARGER BOXES) AT THE BOTTOM */}
                                        <div className="mt-10 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-md border border-gray-100 dark:border-gray-700 animate-smart-slide-up">
                                            <div className="space-y-6">
                                                <div>
                                                    <textarea 
                                                        value={settings.contactMessage || ''} 
                                                        onChange={(e) => setSettings({...settings,contactMessage: e.target.value})} 
                                                        className={`${inputClass} bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 min-h-[120px]`} 
                                                        rows={4} 
                                                        placeholder="Write a message for your support screen..." 
                                                    />
                                                </div>
                                                <div>
                                                    <input 
                                                        type="text" 
                                                        value={settings.operatingHours || ''} 
                                                        onChange={(e) => setSettings({...settings, operatingHours: e.target.value})} 
                                                        className={`${inputClass} bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700`} 
                                                        placeholder="e.g. 10:00 AM - 10:00 PM" 
                                                    />
                                                </div>
                                            </div>
                                            <button 
                                                onClick={handleSettingsSave} 
                                                disabled={!isSettingsChanged} 
                                                className={`w-full mt-8 py-4 font-black text-[11px] uppercase tracking-[0.25em] rounded-2xl shadow-xl transition-all active:scale-95 transform ${isSettingsChanged ? 'bg-primary text-white shadow-primary/30' : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}`}
                                            >
                                                Apply Settings
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {activeTool === 'faqs' && (
                                    <div>
                                        <button onClick={openAddFaqModal} className="w-full py-4 mb-6 bg-purple-50 text-purple-600 border-2 border-dashed border-purple-200 rounded-2xl font-bold text-sm active:scale-95 transform">+ Add New FAQ</button>
                                        <div className="space-y-3">{faqs.map((f, i) => (<div key={f.id || i} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800"><div className="flex justify-between items-start mb-2"><div className="flex-1 pr-4"><p className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{f.question}</p><p className="text-[10px] text-gray-400 line-clamp-2 mt-1">{f.answer}</p></div><div className="flex gap-2 shrink-0"><button onClick={() => openEditFaqModal(f)} className="text-blue-500 p-2 active:scale-90 transform bg-white dark:bg-slate-700 rounded-lg shadow-sm"><EditIcon className="w-4 h-4"/></button><button onClick={() => handleDeleteFaq(f.id)} className="text-red-500 p-2 active:scale-90 transform bg-white dark:bg-slate-700 rounded-lg shadow-sm"><TrashIcon className="w-4 h-4"/></button></div></div></div>))}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="animate-smart-fade-in pb-12">
                            <div className="bg-white dark:bg-dark-card rounded-[2.5rem] p-6 shadow-xl border border-gray-100 dark:border-gray-800">
                                <div className="space-y-3">
                                    <SettingToggle label="Maintenance Mode" active={settings.maintenanceMode} onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})} colorClass="bg-red-500" />
                                    <SettingToggle label="Header Logo" active={settings.headerLogoActive !== false} onClick={() => setSettings({...settings, headerLogoActive: !settings.headerLogoActive})} />
                                    <SettingToggle label="Gamer Quiz Access" active={settings.isQuizEnabled !== false} onClick={() => setSettings({...settings, isQuizEnabled: !settings.isQuizEnabled})} />
                                    <SettingToggle label="Login Page App Name" active={settings.loginAppNameActive !== false} onClick={() => setSettings({...settings, loginAppNameActive: !settings.loginAppNameActive})} />
                                    <SettingToggle label="Age Verification Popup" active={settings.ageVerifyActive !== false} onClick={() => setSettings({...settings, ageVerifyActive: !settings.ageVerifyActive})} colorClass="bg-blue-600" />
                                    <SettingToggle label="AI Bot Assistant" active={settings.aiSupportActive} onClick={() => setSettings({...settings, aiSupportActive: !settings.aiSupportActive})} />
                                    <SettingToggle label="Auto Notifications" active={settings.autoNotifActive !== false} onClick={() => setSettings({...settings, autoNotifActive: !settings.autoNotifActive})} />
                                    <SettingToggle label="System Animations" active={settings.uiSettings?.animationsEnabled !== false} onClick={() => setSettings({ ...settings, uiSettings: { ...settings.uiSettings!, animationsEnabled: !settings.uiSettings?.animationsEnabled } })} />
                                    <SettingToggle label="Offer Card Animation" active={settings.uiSettings?.offerAnimationEnabled !== false} onClick={() => setSettings({ ...settings, uiSettings: { ...settings.uiSettings!, offerAnimationEnabled: !settings.uiSettings?.offerAnimationEnabled } })} colorClass="bg-primary" />
                                    <SettingToggle label="Card Border Highlights" active={settings.uiSettings?.showCardBorder !== false} onClick={() => setSettings({...settings, uiSettings: { ...settings.uiSettings!, showCardBorder: !settings.uiSettings?.showCardBorder }})} colorClass="bg-orange-500" />
                                    <SettingToggle label="Wallet Vertical Spacing" active={settings.walletSpacingActive !== false} onClick={() => setSettings({...settings, walletSpacingActive: !settings.walletSpacingActive})} colorClass="bg-indigo-500" />
                                    <SettingToggle label="30min Auto-Refund" active={settings.autoRefundActive !== false} onClick={() => setSettings({...settings, autoRefundActive: !settings.autoRefundActive})} />
                                    <SettingToggle label="Force VPN (Ads)" active={settings.earnSettings?.vpnRequired} onClick={() => setSettings({...settings, earnSettings: { ...settings.earnSettings!, vpnRequired: !settings.earnSettings?.vpnRequired }})} colorClass="bg-red-500" />
                                    <SettingToggle label="VPN Requirement Notice" active={settings.earnSettings?.vpnNoticeActive} onClick={() => setSettings({...settings, earnSettings: { ...settings.earnSettings!, vpnNoticeActive: !settings.earnSettings?.vpnNoticeActive }})} colorClass="bg-orange-500" />
                                    
                                    <div className="h-px bg-gray-100 dark:bg-gray-800 my-6"></div>
                                    
                                    {/* EXPLICIT IMO TOGGLE */}
                                    <SettingToggle 
                                        label="IMO Tab" 
                                        active={settings.visibility?.imo ?? true} 
                                        onClick={() => setSettings({...settings, visibility: {...settings.visibility!, imo: !settings.visibility?.imo}})} 
                                        colorClass="bg-[#00A2FF]"
                                    />

                                    {/* EXPLICIT MLBB TOGGLE */}
                                    <SettingToggle 
                                        label="MLBB Tab" 
                                        active={settings.visibility?.mlbb ?? true} 
                                        onClick={() => setSettings({...settings, visibility: {...settings.visibility!, mlbb: !settings.visibility?.mlbb}})} 
                                        colorClass="bg-[#1E3A8A]"
                                    />

                                    {/* EXPLICIT PUBG UC TOGGLE */}
                                    <SettingToggle 
                                        label="PUBG UC Section" 
                                        active={settings.visibility?.pubg ?? true} 
                                        onClick={() => setSettings({...settings, visibility: {...settings.visibility!, pubg: !settings.visibility?.pubg}})} 
                                        colorClass="bg-yellow-500"
                                    />

                                    {Object.keys(settings.visibility || {}).filter(k => k !== 'pubg' && k !== 'mlbb' && k !== 'imo').map((key) => (
                                        <SettingToggle 
                                            key={key} 
                                            label={`${key.replace(/([A-Z])/g, ' $1').trim()} Tab`} 
                                            active={settings.visibility![key as keyof AppVisibility]} 
                                            onClick={() => setSettings({...settings, visibility: {...settings.visibility!, [key]: !settings.visibility![key as keyof AppVisibility]}})} 
                                        />
                                    ))}
                                </div>

                                <div className="mt-10">
                                    <button 
                                        onClick={handleSettingsSave} 
                                        disabled={!isSettingsChanged} 
                                        className={`w-full py-4 font-black text-xs uppercase tracking-[0.25em] rounded-2xl shadow-xl transition-all duration-300
                                            ${isSettingsChanged 
                                                ? 'bg-gradient-to-r from-primary to-secondary text-white active:scale-95 opacity-100 shadow-primary/30' 
                                                : 'bg-gray-100 dark:bg-dark-card text-gray-400 cursor-not-allowed opacity-50 shadow-none'
                                            }`}
                                    >
                                        Apply Changes
                                    </button>
                                </div>
                            </div>
                            
                            {showDevCard && (<div className="mt-8 bg-red-50 p-5 rounded-3xl border border-red-200"><div className="flex items-center gap-3 mb-4"><CodeIcon className="w-5 h-5 text-red-600" /><h4 className="font-bold text-sm text-red-700">Developer Info (Locked)</h4>{isDevUnlocked ? <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold font-black">UNLOCKED</span> : <button onClick={handleUnlockDevInfo} className="text-[10px] bg-white text-red-500 px-3 py-1 rounded-full font-bold shadow-sm font-black">Unlock</button>}</div>{isDevUnlocked && (<div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label>Title</label><input type="text" value={devSettings.title} onChange={(e) => setDevSettings({...devSettings, title: e.target.value})} className={inputClass} /></div><div><label>URL</label><input type="text" value={devSettings.url} onChange={(e) => setDevSettings({...devSettings, url: e.target.value})} className={inputClass} /></div><div className="md:col-span-2"><label>Description</label><input type="text" value={devSettings.description} onChange={(e) => setDevSettings({...devSettings, description: e.target.value})} className={inputClass} /></div><button onClick={handleSaveDeveloperInfo} className="md:col-span-2 py-3 bg-green-600 text-white font-bold rounded-2xl active:scale-95 transform font-black">Save Info</button></div>)}</div>)}
                        </div>
                    )}
                </main>
            </div>

            {/* Confirmation Dialog */}
            {pendingAction && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-smart-fade-in">
                    <div className="bg-white dark:bg-dark-card rounded-3xl p-6 w-full max-w-xs animate-smart-pop-in shadow-2xl border border-gray-100 dark:border-gray-800 text-center">
                        <h3 className="text-xl font-bold text-center mb-2">{pendingAction.title}</h3>
                        <p className="text-center text-gray-500 dark:text-gray-400 mb-6 text-sm">{pendingAction.message}</p>
                        <div className="flex space-x-3">
                            <button onClick={() => setPendingAction(null)} className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                            <button onClick={pendingAction.onConfirm} className="flex-1 bg-primary text-white font-bold py-3 rounded-xl hover:opacity-90 transition-colors shadow-lg shadow-primary/30">Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI CHAT HISTORY MODAL */}
            {viewingAiHistoryUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-smart-fade-in">
                    <div className="w-full max-w-md h-[80vh] bg-white dark:bg-dark-card rounded-[2.5rem] flex flex-col shadow-2xl animate-smart-pop-in border border-white/10 overflow-hidden text-center">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-dark-bg/50">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">AI Chat History</h3>
                                <p className="text-[10px] font-bold text-primary uppercase">{viewingAiHistoryUser.name} ({viewingAiHistoryUser.email})</p>
                            </div>
                            <button onClick={() => setViewingAiHistoryUser(null)} className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-all active:scale-90"><LockIcon className="w-5 h-5 rotate-45" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                            {aiChatHistory.length === 0 ? (
                                <div className="h-full flex items-center justify-center opacity-30 flex-col"><RobotIcon className="w-12 h-12 mb-2"/><p className="text-xs font-bold uppercase tracking-widest">No messages found</p></div>
                            ) : (
                                aiChatHistory.map((msg, i) => (
                                    <div key={i} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm relative break-words whitespace-pre-wrap text-left ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-100 dark:border-gray-700'}`}>
                                            <p>{msg.text}</p>
                                            <p className={`text-[8px] mt-1 opacity-50 text-right ${msg.role === 'user' ? 'text-white' : 'text-gray-500'}`}>
                                                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-dark-bg/50">
                            <button onClick={() => setViewingAiHistoryUser(null)} className="w-full py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/30">Close Viewer</button>
                        </div>
                    </div>
                </div>
            )}

            {isOfferModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-dark-card p-6 rounded-3xl w-full max-sm shadow-2xl">
                        <h3 className="text-xl font-bold mb-6 text-center">{editingOffer?.id ? 'Edit' : 'Add'} {offerType}</h3>
                        <form onSubmit={handleSaveOffer} className="space-y-4">
                            {offerType === 'mlbb' && (
                                <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setEditingOffer({...editingOffer, mlbbType: 'diamond'})}
                                        className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${editingOffer?.mlbbType === 'diamond' ? 'bg-white dark:bg-dark-card text-primary shadow-sm' : 'text-gray-500'}`}
                                    >
                                        DIAMOND PACK
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setEditingOffer({...editingOffer, mlbbType: 'other'})}
                                        className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${editingOffer?.mlbbType === 'other' ? 'bg-white dark:bg-dark-card text-primary shadow-sm' : 'text-gray-500'}`}
                                    >
                                        OTHER (NAME)
                                    </button>
                                </div>
                            )}

                            {/* --- PUBG CATEGORY SELECTOR --- */}
                            {offerType === 'pubg' && (
                                <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setEditingOffer({...editingOffer, pubgType: 'uc'})}
                                        className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${(!editingOffer?.pubgType || editingOffer?.pubgType === 'uc') ? 'bg-white dark:bg-dark-card text-yellow-600 shadow-sm' : 'text-gray-500'}`}
                                    >
                                        UC TOP UP
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setEditingOffer({...editingOffer, pubgType: 'rp'})}
                                        className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${editingOffer?.pubgType === 'rp' ? 'bg-white dark:bg-dark-card text-yellow-600 shadow-sm' : 'text-gray-500'}`}
                                    >
                                        PACKAGE / RP
                                    </button>
                                </div>
                            )}

                            {(offerType === 'mlbb' && editingOffer?.mlbbType === 'diamond') || offerType === 'diamond' || offerType === 'imo' || offerType === 'special' || offerType === 'levelUp' || offerType === 'membership' ? (
                                <input type="number" placeholder="Diamonds" value={editingOffer?.diamonds || ''} onChange={e => setEditingOffer({...editingOffer, diamonds: Number(e.target.value)})} className={inputClass} />
                            ) : null}

                            {offerType === 'pubg' && (!editingOffer?.pubgType || editingOffer?.pubgType === 'uc') && (
                                <input type="number" placeholder="UC Amount" value={editingOffer?.uc || ''} onChange={e => setEditingOffer({...editingOffer, uc: e.target.value})} className={inputClass} />
                            )}

                            {(offerType === 'mlbb' && editingOffer?.mlbbType === 'other') || (offerType === 'pubg' && editingOffer?.pubgType === 'rp') || (offerType !== 'diamond' && offerType !== 'pubg' && offerType !== 'mlbb' && offerType !== 'imo') ? (
                                <input type="text" placeholder={offerType === 'pubg' ? "Package Name (e.g. Royale Pass A10)" : "Offer Name"} value={editingOffer?.name || ''} onChange={e => setEditingOffer({...editingOffer, name: e.target.value})} className={inputClass} />
                            ) : null}

                            {/* New Badge Text Input */}
                            <input type="text" placeholder="Offer Badge Text (Optional)" value={editingOffer?.ribbonLabel || ''} onChange={e => setEditingOffer({...editingOffer, ribbonLabel: e.target.value})} className={inputClass} />

                            {offerType === 'special' && (
                                <input type="text" placeholder="Title" value={editingOffer?.title || ''} onChange={e => setEditingOffer({...editingOffer, title: e.target.value})} className={inputClass} />
                            )}

                            {offerType === 'premium' && (
                                <textarea placeholder="Description (Optional)" value={editingOffer?.description || ''} onChange={e => setEditingOffer({...editingOffer, description: e.target.value})} className={inputClass} rows={2} />
                            )}

                            {offerType === 'special' && (
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" checked={editingOffer?.isActive || false} onChange={e => setEditingOffer({...editingOffer, isActive: e.target.checked})} />
                                    <label>Active</label>
                                </div>
                            )}

                            <input type="number" placeholder="Price" value={editingOffer?.price || ''} onChange={e => setEditingOffer({...editingOffer, price: e.target.value})} className={inputClass} />
                            
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setIsOfferModalOpen(false)} className="flex-1 py-3 bg-gray-100 font-bold rounded-2xl text-xs active:scale-95 transform">Cancel</button>
                                <button type="submit" disabled={!isOfferValid} className={`flex-1 py-3 rounded-2xl text-xs font-bold text-white active:scale-95 transform ${isOfferValid ? 'bg-primary' : 'bg-gray-300'}`}>Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isMethodModalOpen && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white dark:bg-dark-card p-6 rounded-3xl w-full max-w-sm shadow-2xl"><h3 className="text-lg font-bold mb-4">Payment Method</h3><form onSubmit={handleSaveMethod} className="space-y-4"><input type="text" placeholder="Name" value={editingMethod?.name || ''} onChange={e => setEditingMethod({...editingMethod!, name: e.target.value})} className={inputClass} /><input type="text" placeholder="Number" value={editingMethod?.accountNumber || ''} onChange={e => setEditingMethod({...editingMethod!, accountNumber: e.target.value})} className={inputClass} />
                <ImagePicker 
                    value={editingMethod?.logo || ''} 
                    onChange={(val) => setEditingMethod({...editingMethod!, logo: val})} 
                    onUpload={(dataUrl) => {
                        setTempCropperImage(dataUrl);
                        setOnCropCompleteCallback(() => (croppedUrl) => setEditingMethod({...editingMethod!, logo: croppedUrl}));
                        setShowCropper(true);
                    }}
                    placeholder="Logo URL" 
                />
            <textarea placeholder="Instructions" value={editingMethod?.instructions || ''} onChange={e => setEditingMethod({...editingMethod!, instructions: e.target.value})} className={inputClass} rows={3} /><div className="flex items-center gap-2 p-1 bg-gray-50 dark:bg-gray-800 rounded-xl mb-2"><input type="checkbox" checked={editingMethod?.isActive !== false} onChange={e => setEditingMethod({...editingMethod!, isActive: e.target.checked})} className="w-4 h-4 text-primary" /><label className="text-xs font-bold">Active for Users</label></div><div className="flex gap-3"><button type="button" onClick={() => setIsMethodModalOpen(false)} className="flex-1 py-3 bg-gray-100 rounded-2xl text-xs font-bold active:scale-95 transform font-black">Cancel</button><button type="submit" disabled={!isMethodValid} className="flex-1 py-3 bg-primary text-white rounded-2xl text-xs font-bold active:scale-95 transform font-black">Save</button></div></form></div></div>)}
            {isContactModalOpen && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"><div className="bg-white dark:bg-dark-card p-6 rounded-3xl w-full max-w-sm shadow-2xl"><h3 className="text-lg font-black mb-6 text-center uppercase tracking-widest text-primary">Support Contact</h3><form onSubmit={handleSaveContact} className="space-y-4"><div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 ml-1 font-black">Contact Title (Name)</label><input type="text" placeholder="e.g. My Official YouTube" value={editingContact?.title || ''} onChange={e => setEditingContact({...editingContact, title: e.target.value})} className={inputClass} /></div><div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 ml-1 font-black">Logo/Icon</label>
                <ImagePicker 
                    value={editingContact?.iconUrl || ''} 
                    onChange={(val) => setEditingContact({...editingContact, iconUrl: val})} 
                    onUpload={(dataUrl) => {
                        setTempCropperImage(dataUrl);
                        setOnCropCompleteCallback(() => (croppedUrl) => setEditingContact({...editingContact, iconUrl: croppedUrl}));
                        setShowCropper(true);
                    }}
                    placeholder="Icon URL" 
                />
            </div><div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 ml-1 font-black">Target Link (URL)</label><input type="text" placeholder="https://youtube.com/..." value={editingContact?.link || ''} onChange={e => setEditingContact({...editingContact, link: e.target.value})} className={inputClass} /></div><div className="flex gap-3 pt-2"><button type="button" onClick={() => setIsContactModalOpen(false)} className="flex-1 py-3.5 bg-gray-100 dark:bg-gray-800 rounded-2xl text-xs font-bold active:scale-95 transform text-gray-500 font-black">Cancel</button><button type="submit" disabled={!isContactValid} className={`flex-1 py-3.5 rounded-2xl text-xs font-bold text-white active:scale-95 transform font-black ${isContactValid ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-gray-300'}`}>Save Contact</button></div></form></div></div>)}
            {isFaqModalOpen && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"><div className="bg-white dark:bg-dark-card p-6 rounded-3xl w-full max-md shadow-2xl overflow-y-auto max-h-[90vh]"><h3 className="text-lg font-black mb-6 text-center uppercase tracking-widest text-primary">Manage FAQ</h3><form onSubmit={handleSaveFaq} className="space-y-4"><div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 ml-1 font-black">Question (EN)</label><input type="text" placeholder="e.g. How to buy?" value={editingFaq?.question || ''} onChange={e => setEditingFaq({...editingFaq!, question: e.target.value})} className={inputClass} /></div><div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 ml-1 font-black">Question (BN)</label><input type="text" placeholder="উদা: কীভাবে কিনব?" value={editingFaq?.question_bn || ''} onChange={e => setEditingFaq({...editingFaq!, question_bn: e.target.value})} className={inputClass} /></div><div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 ml-1 font-black">Answer (EN)</label><textarea rows={3} placeholder="Answer in English..." value={editingFaq?.answer || ''} onChange={e => setEditingFaq({...editingFaq!, answer: e.target.value})} className={inputClass} /></div><div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 ml-1 font-black">Answer (BN)</label><textarea rows={3} placeholder="বাংলায় উত্তর..." value={editingFaq?.answer_bn || ''} onChange={e => setEditingFaq({...editingFaq!, answer_bn: e.target.value})} className={inputClass} /></div><div className="flex gap-3 pt-2"><button type="button" onClick={() => setIsFaqModalOpen(false)} className="flex-1 py-3.5 bg-gray-100 dark:bg-gray-800 rounded-2xl text-xs font-bold active:scale-95 transform text-gray-500 font-black">Cancel</button><button type="submit" disabled={!isFaqValid} className={`flex-1 py-3.5 rounded-2xl text-xs font-bold text-white active:scale-95 transform font-black ${isFaqValid ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-gray-300'}`}>Save FAQ</button></div></form></div></div>)}
            {isNotifModalOpen && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"><div className="bg-white dark:bg-dark-card p-6 rounded-3xl w-full max-w-sm shadow-2xl animate-smart-pop-in"><h3 className="text-lg font-black mb-4 text-center uppercase tracking-wider text-primary">Broadcast Message</h3><form onSubmit={handleSendNotification} className="space-y-3"><div className="grid grid-cols-2 gap-2"><input type="text" placeholder="Title (EN)" value={newNotif.title} onChange={e => setNewNotif({...newNotif, title: e.target.value})} className={inputClass} /><input type="text" placeholder="Title (BN)" value={newNotif.title_bn} onChange={e => setNewNotif({...newNotif, title_bn: e.target.value})} className={inputClass} /></div><textarea placeholder="Message (EN)" value={newNotif.message} onChange={e => setNewNotif({...newNotif, message: e.target.value})} className={inputClass} rows={2} /><textarea placeholder="Message (BN)" value={newNotif.message_bn} onChange={e => setNewNotif({...newNotif, message_bn: e.target.value})} className={inputClass} rows={2} /><div className="flex gap-3 mt-4"><button type="button" onClick={() => setIsNotifModalOpen(false)} className="flex-1 py-3.5 bg-gray-100 dark:bg-gray-800 rounded-2xl text-xs font-bold active:scale-95 transform transition-all uppercase tracking-widest text-gray-500 font-black">Cancel</button><button type="submit" disabled={!isNotifValid} className={`flex-1 py-3.5 rounded-2xl text-xs font-bold text-white active:scale-95 transform transition-all uppercase tracking-widest font-black ${isNotifValid ? 'bg-gradient-to-r from-primary to-secondary shadow-lg' : 'bg-gray-300'}`}>Send Now</button></div></form></div></div>)}
            {isSecurityModalOpen && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white dark:bg-dark-card p-6 rounded-3xl w-full max-w-xs text-center"><LockIcon className="w-12 h-12 text-red-500 mx-auto mb-4" /><h3 className="text-lg font-bold mb-2">Security Check</h3><form onSubmit={handleVerifySecurityKey}><input type="password" value={securityKeyInput} onChange={e => setSecurityKeyInput(e.target.value)} className={`${inputClass} text-center tracking-widest mb-4`} autoFocus /><div className="flex gap-2"><button type="button" onClick={() => setIsSecurityModalOpen(false)} className="flex-1 py-3 bg-gray-100 rounded-2xl text-xs font-bold active:scale-95 transform font-black">Cancel</button><button type="submit" className="flex-1 py-3 bg-red-500 text-white rounded-2xl text-xs font-bold active:scale-95 transform font-black">Unlock</button></div></form></div></div>)}
            {balanceModalUser && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white dark:bg-dark-card p-6 rounded-3xl w-full max-w-xs text-center shadow-2xl"><h3 className="text-lg font-bold mb-4">{balanceAction === 'add' ? 'Add' : 'Deduct'} Balance</h3><p className="text-sm text-gray-500 mb-4">{balanceModalUser.name} (৳{Math.floor(balanceModalUser.balance)})</p><input type="number" value={balanceAmount} onChange={e => setBalanceAmount(e.target.value)} className={inputClass} placeholder="Amount" autoFocus /><div className="flex gap-3 mt-4"><button onClick={() => setBalanceModalUser(null)} className="flex-1 py-3 bg-gray-100 rounded-2xl text-xs font-bold active:scale-95 transform font-black">Cancel</button><button onClick={handleBalanceUpdate} className="flex-1 py-3 bg-green-500 text-white rounded-2xl text-xs font-bold active:scale-95 transform font-black">Confirm</button></div></div></div>)}
            
            {/* PIN Management Modal */}
            {pinModalUser && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"><div className="bg-white dark:bg-dark-card p-6 rounded-3xl w-full max-w-xs shadow-2xl text-center"><h3 className="text-lg font-bold mb-1 text-center">Manage PIN</h3><p className="text-[10px] text-gray-500 text-center mb-6 uppercase tracking-widest">{pinModalUser.name}</p><div className="space-y-4"><div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Set New 4-Digit PIN</label><input type="password" inputMode="numeric" maxLength={4} value={newAdminPin} onChange={e => setNewAdminPin(e.target.value.replace(/\D/g,''))} className={`${inputClass} text-center tracking-[1em] text-2xl font-black`} placeholder="----" /></div><div className="flex flex-col gap-2 pt-2"><button onClick={() => {
                 setPendingAction({
                    type: 'update_pin',
                    title: 'Change User PIN?',
                    message: `Are you sure you want to change the PIN for ${pinModalUser.name} to '${newAdminPin}'?`,
                    onConfirm: () => {
                        setPendingAction(null);
                        handlePinUpdate(false);
                    }
                 });
            }} disabled={newAdminPin.length > 0 && newAdminPin.length < 4} className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-lg transition-all ${newAdminPin.length === 4 ? 'bg-blue-600 shadow-blue-500/30' : newAdminPin.length === 0 ? 'bg-gray-400' : 'bg-gray-200'}`}>{newAdminPin.length === 4 ? 'Update PIN' : 'Enter 4 Digits'}</button><button onClick={() => { 
                 setPendingAction({
                    type: 'reset_pin',
                    title: 'Reset Security PIN?',
                    message: `This will remove the PIN for ${pinModalUser.name}. They will need to set a new one.`,
                    onConfirm: () => {
                        setPendingAction(null);
                        setNewAdminPin(''); 
                        handlePinUpdate(true);
                    }
                 });
            }} className="w-full py-3.5 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest border border-red-100 dark:border-red-900/30">Reset / Remove PIN</button><button onClick={() => setPinModalUser(null)} className="w-full py-3.5 text-gray-400 font-bold text-[10px] uppercase">Close</button></div></div></div></div>)}

            {isBannerModalOpen && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white dark:bg-dark-card p-6 rounded-3xl w-full max-sm shadow-2xl text-center"><h3 className="text-lg font-bold mb-4">Edit Banner</h3><form onSubmit={handleSaveBanner} className="space-y-4">
                <ImagePicker 
                    value={tempBannerUrl} 
                    onChange={setTempBannerUrl} 
                    onUpload={(dataUrl) => {
                        setTempCropperImage(dataUrl);
                        setOnCropCompleteCallback(() => (croppedUrl) => setTempBannerUrl(croppedUrl));
                        setShowCropper(true);
                    }}
                    placeholder="Image URL" 
                />
            <input type="text" placeholder="Action URL" value={tempActionUrl} onChange={e => setTempActionUrl(e.target.value)} className={inputClass} /><div className="flex gap-3"><button type="button" onClick={() => setIsBannerModalOpen(false)} className="flex-1 py-3 bg-gray-100 rounded-2xl text-xs font-bold active:scale-95 transform font-black">Cancel</button><button type="submit" disabled={!tempBannerUrl} className="flex-1 py-3 bg-primary text-white rounded-2xl text-xs font-bold active:scale-95 transform font-black">Save</button></div></form></div></div>)}
        </div>
    );
};

export default AdminScreen;