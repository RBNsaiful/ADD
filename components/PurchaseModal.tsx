
import React, { useState, FC, ChangeEvent, useEffect, useRef, useMemo } from 'react';
import type { GenericOffer, User } from '../types';

interface PurchaseModalProps {
  offer: GenericOffer;
  onClose: () => void;
  onConfirm: (uid: string) => Promise<void>;
  onSuccess?: () => void;
  texts: any;
  userBalance: number;
  userPin?: string; 
  defaultUid?: string;
  onInsufficientBalanceClick?: (amount: number) => void;
}

// Top 40 popular countries for IMO with specific digit lengths for validation
const IMO_COUNTRIES = [
  { name: 'Bangladesh', code: '+880', short: 'BD', flag: '🇧🇩', min: 10, max: 11 },
  { name: 'Saudi Arabia', code: '+966', short: 'SA', flag: '🇸🇦', min: 9, max: 10 },
  { name: 'UAE', code: '+971', short: 'AE', flag: '🇦🇪', min: 9, max: 9 },
  { name: 'Malaysia', code: '+60', short: 'MY', flag: '🇲🇾', min: 9, max: 10 },
  { name: 'Qatar', code: '+974', short: 'QA', flag: '🇶🇦', min: 8, max: 8 },
  { name: 'Oman', code: '+968', short: 'OM', flag: '🇴🇲', min: 8, max: 8 },
  { name: 'Kuwait', code: '+965', short: 'KW', flag: '🇰🇼', min: 8, max: 8 },
  { name: 'Bahrain', code: '+973', short: 'BH', flag: '🇧🇭', min: 8, max: 8 },
  { name: 'India', code: '+91', short: 'IN', flag: '🇮🇳', min: 10, max: 10 },
  { name: 'Pakistan', code: '+92', short: 'PK', flag: '🇵🇰', min: 10, max: 10 },
  { name: 'Singapore', code: '+65', short: 'SG', flag: '🇸🇬', min: 8, max: 8 },
  { name: 'Maldives', code: '+960', short: 'MV', flag: '🇲🇻', min: 7, max: 7 },
  { name: 'Jordan', code: '+962', short: 'JO', flag: '🇯🇴', min: 9, max: 9 },
  { name: 'Egypt', code: '+20', short: 'EG', flag: '🇪🇬', min: 10, max: 10 },
  { name: 'Lebanon', code: '+961', short: 'LB', flag: '🇱🇧', min: 8, max: 8 },
  { name: 'Turkey', code: '+90', short: 'TR', flag: '🇹🇷', min: 10, max: 10 },
  { name: 'Iraq', code: '+964', short: 'IQ', flag: '🇮🇶', min: 10, max: 10 },
  { name: 'Libya', code: '+218', short: 'LY', flag: '🇱🇾', min: 9, max: 9 },
  { name: 'Italy', code: '+39', short: 'IT', flag: '🇮🇹', min: 10, max: 10 },
  { name: 'United Kingdom', code: '+44', short: 'GB', flag: '🇬🇧', min: 10, max: 10 },
  { name: 'USA', code: '+1', short: 'US', flag: '🇺🇸', min: 10, max: 10 },
  { name: 'Canada', code: '+1', short: 'CA', flag: '🇨🇦', min: 10, max: 10 },
  { name: 'France', code: '+33', short: 'FR', flag: '🇫🇷', min: 9, max: 9 },
  { name: 'Germany', code: '+49', short: 'DE', flag: '🇩🇪', min: 10, max: 11 },
  { name: 'Spain', code: '+34', short: 'ES', flag: '🇪🇸', min: 9, max: 9 },
  { name: 'South Africa', code: '+27', short: 'ZA', flag: '🇿🇦', min: 9, max: 9 },
  { name: 'Nigeria', code: '+234', short: 'NG', flag: '🇳🇬', min: 10, max: 10 },
  { name: 'Morocco', code: '+212', short: 'MA', flag: '🇲🇦', min: 9, max: 9 },
  { name: 'Algeria', code: '+213', short: 'DZ', flag: '🇩🇿', min: 9, max: 9 },
  { name: 'Sudan', code: '+249', short: 'SD', flag: '🇸🇩', min: 9, max: 9 },
  { name: 'Yemen', code: '+967', short: 'YE', flag: '🇾🇪', min: 9, max: 9 },
  { name: 'Indonesia', code: '+62', short: 'ID', flag: '🇮🇩', min: 10, max: 12 },
  { name: 'Philippines', code: '+63', short: 'PH', flag: '🇵🇭', min: 10, max: 10 },
  { name: 'Sri Lanka', code: '+94', short: 'LK', flag: '🇱🇰', min: 9, max: 9 },
  { name: 'Nepal', code: '+977', short: 'NP', flag: '🇳🇵', min: 10, max: 10 },
  { name: 'Afghanistan', code: '+93', short: 'AF', flag: '🇦🇫', min: 9, max: 9 },
  { name: 'Iran', code: '+98', short: 'IR', flag: '🇮🇷', min: 10, max: 10 },
  { name: 'Russia', code: '+7', short: 'RU', flag: '🇷🇺', min: 10, max: 10 },
  { name: 'Japan', code: '+81', short: 'JP', flag: '🇯🇵', min: 10, max: 10 },
  { name: 'Australia', code: '+61', short: 'AU', flag: '🇦🇺', min: 9, max: 9 },
];

const PURCHASE_SUCCESS_SOUND = "https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3"; 

const Spinner: FC = () => (
    <div className="keep-animating animate-spin rounded-full h-5 w-5 border-b-2 border-white/30 border-t-white"></div>
);

const CheckIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12" /></svg>);

const SearchIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
);

const DiamondIcon: FC<{className?: string}> = ({className}) => (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M12 2L2 8.5l10 13.5L22 8.5 12 2z" />
    </svg>
);

const MlbbDiamondIcon: FC<{className?: string}> = ({className}) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
            <linearGradient id="modal-mlbb-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#1E40AF" />
            </linearGradient>
        </defs>
        <path d="M12 2L2 8.5l10 13.5L22 8.5 12 2z" fill="url(#modal-mlbb-grad)" />
    </svg>
);

const ShieldLockIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><rect x="9" y="11" width="6" height="4" rx="1"/><path d="M10 11V9a2 2 0 1 1 4 0v2"/></svg>
);

const formatBalance = (val: number) => Number(val || 0).toFixed(2).replace(/\.00$/, "");

const PurchaseModal: FC<PurchaseModalProps> = ({ offer, onClose, onConfirm, onSuccess, texts, userBalance, userPin, defaultUid, onInsufficientBalanceClick }) => {
  const isEmailType = offer.inputType === 'email';
  const isPubgType = offer.inputType === 'pubg';
  const isMlbbType = offer.inputType === 'mlbb';
  const isImoType = offer.inputType === 'imo';
  
  // DYNAMIC CATEGORY CONFIG
  const config = useMemo(() => {
    const offerName = (offer.name || '').toLowerCase();
    
    if (isImoType) {
        return {
            accent: 'text-[#00A2FF]',
            btn: 'from-[#00A2FF] to-[#0066FF]',
            ring: 'ring-[#00A2FF]/20',
            border: 'focus:border-[#00A2FF]',
            shadow: 'shadow-blue-500/30'
        };
    }
    if (isPubgType) {
        return {
            accent: 'text-yellow-500',
            btn: 'from-yellow-500 to-orange-500',
            ring: 'ring-yellow-500/20',
            border: 'focus:border-yellow-500',
            shadow: 'shadow-yellow-500/30'
        };
    }
    if (isMlbbType) {
        return {
            accent: 'text-blue-600',
            btn: 'from-blue-600 to-indigo-800',
            ring: 'ring-blue-600/20',
            border: 'focus:border-blue-600',
            shadow: 'shadow-blue-600/30'
        };
    }
    if (isEmailType) {
        return {
            accent: 'text-yellow-600',
            btn: 'from-yellow-500 to-orange-500',
            ring: 'ring-yellow-500/20',
            border: 'focus:border-yellow-500',
            shadow: 'shadow-yellow-500/30'
        };
    }
    if (offerName.includes('deal') || offerName.includes('special') || offerName.includes('offer')) {
        return {
            accent: 'text-red-500',
            btn: 'from-red-600 to-orange-600',
            ring: 'ring-red-500/20',
            border: 'focus:border-red-500',
            shadow: 'shadow-red-500/30'
        };
    }
    // Default Purple (Primary)
    return {
        accent: 'text-primary',
        btn: 'from-primary to-secondary',
        ring: 'ring-primary/20',
        border: 'focus:border-primary',
        shadow: 'shadow-primary/30'
    };
  }, [offer, isImoType, isPubgType, isMlbbType, isEmailType]);

  const [imoInputMode, setImoInputMode] = useState<'number' | 'id'>('number');
  const [selectedCountry, setSelectedCountry] = useState(IMO_COUNTRIES[0]);
  const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  
  // Separate states for IMO Number and IMO ID to prevent data loss on tab switch
  const [imoNumberValue, setImoNumberValue] = useState('');
  const [imoIdValue, setImoIdValue] = useState('');
  
  // Shared input value state for other types
  const [inputValue, setInputValue] = useState(isEmailType ? '' : (isImoType ? '' : (defaultUid || '')));
  const [extraValue, setExtraValue] = useState(''); 
  
  const [inputError, setInputError] = useState('');
  const [extraError, setExtraError] = useState('');
  
  const [status, setStatus] = useState<'idle' | 'pin-required' | 'processing' | 'button-success' | 'success'>('idle');
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
      if (status === 'success') {
          try {
              if (!audioRef.current) {
                  audioRef.current = new Audio(PURCHASE_SUCCESS_SOUND);
                  audioRef.current.volume = 0.5;
              }
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(e => console.log("Audio playback was blocked", e));
              
              if (navigator.vibrate) navigator.vibrate(100);
          } catch (err) { console.error("Audio system error", err); }
      }
  }, [status]);

  const insufficientBalance = userBalance < offer.price;
  
  const styles = (isEmailType || isMlbbType || isImoType) ? {
      container: "p-5",
      title: "text-lg mb-3",
      offerBox: "p-2 mb-3",
      icon: "w-10 h-10",
      offerName: "text-xl",
      price: "text-lg",
      balanceBox: "p-2.5 mb-3 space-y-1",
      balanceText: "text-xs",
      inputLabel: "text-[10px] mb-1",
      input: "p-3 rounded-xl text-sm",
      inputGroup: "mb-2",
      footer: "mt-4 gap-2",
      btn: "py-3 rounded-xl",
      successContainer: "py-8",
      successIcon: "w-16 h-16",
      successTitle: "text-xl"
  } : {
      container: "p-6",
      title: "text-xl mb-5",
      offerBox: "p-4 mb-5",
      icon: "w-12 h-12",
      offerName: "text-2xl",
      price: "text-xl",
      balanceBox: "p-3 mb-5 space-y-2",
      balanceText: "text-sm",
      inputLabel: "text-[11px] mb-1.5",
      input: "p-3.5 rounded-2xl text-base",
      inputGroup: "mb-4",
      footer: "mt-6 gap-3",
      btn: "py-3.5 rounded-xl",
      successContainer: "py-10",
      successIcon: "w-20 h-20",
      successTitle: "text-2xl"
  };

  const handleInputFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      event.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  const validateInput = (value: string): boolean => {
    if (!value.trim()) {
        if (isEmailType) setInputError(texts.emailRequired);
        else if (isPubgType) setInputError(texts.pubgIdRequired);
        else if (isMlbbType) setInputError(texts.mlbbIdRequired);
        else if (isImoType) {
            setInputError(imoInputMode === 'number' ? texts.imoIdRequired : "IMO ID is required");
        }
        else setInputError(texts.uidRequired);
        return false;
    }

    if (isEmailType) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail|yahoo)\.com$/;
        if (!emailRegex.test(value.toLowerCase())) { setInputError("Invalid Email"); return false; }
    } else if (isPubgType) {
        if (!/^\d+$/.test(value)) { setInputError(texts.digitsOnly); return false; }
        if (value.length < 8 || value.length > 12) { setInputError(texts.pubgIdInvalid); return false; }
    } else if (isMlbbType) {
        if (!/^\d+$/.test(value)) { setInputError(texts.digitsOnly); return false; }
        if (value.length < 8 || value.length > 10) { setInputError(texts.mlbbIdInvalid); return false; }
    } else if (isImoType) {
        if (imoInputMode === 'number') {
            if (!/^\d+$/.test(value)) { setInputError(texts.digitsOnly); return false; }
            // Specific length validation based on selected country
            if (value.length < selectedCountry.min || value.length > selectedCountry.max) {
                setInputError("Invalid number");
                return false;
            }
        } else {
            if (value.length < 4) { setInputError("Too short"); return false; }
        }
    } else {
        if (!/^\d+$/.test(value)) { setInputError(texts.digitsOnly); return false; }
        if (value.length < 8 || value.length > 15) { setInputError(texts.invalidUid); return false; }
    }
    setInputError('');
    return true;
  };

  const validateExtra = (value: string): boolean => {
      if (!isEmailType && !isMlbbType) return true; 
      if (!value.trim()) { 
          setExtraError(isMlbbType ? texts.mlbbZoneRequired : texts.required); 
          return false; 
      }
      
      if (isEmailType) {
          const bdPhoneRegex = /^01[3-9]\d{8}$/;
          if (!bdPhoneRegex.test(value)) { setExtraError(texts.invalidPhone); return false; }
      } else if (isMlbbType) {
          if (!/^\d+$/.test(value)) { setExtraError(texts.digitsOnly); return false; }
          if (value.length < 4 || value.length > 5) { setExtraError(texts.mlbbZoneInvalid); return false; }
      }
      
      setExtraError('');
      return true;
  };
  
  const handleBlur = () => { 
      const currentVal = isImoType ? (imoInputMode === 'number' ? imoNumberValue : imoIdValue) : inputValue;
      validateInput(currentVal); 
  };
  const handleExtraBlur = () => { validateExtra(extraValue); };
  
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (isImoType) {
          if (imoInputMode === 'number') {
              if (/^\d*$/.test(newValue)) {
                  setImoNumberValue(newValue);
                  if (inputError) setInputError('');
              }
          } else {
              setImoIdValue(newValue);
              if (inputError) setInputError('');
          }
      } else if (isEmailType) {
          setInputValue(newValue);
          if (inputError) setInputError('');
      } else {
          if (/^\d*$/.test(newValue)) {
              setInputValue(newValue);
              if (inputError) setInputError('');
          }
      }
  };

  const handleExtraChange = (e: ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (/^\d*$/.test(val)) {
          if (isEmailType && val.length > 11) return;
          if (isMlbbType && val.length > 5) return;
          setExtraValue(val);
          if (extraError) setExtraError('');
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, type: 'main' | 'extra') => {
      if (isImoType && imoInputMode === 'id') return; 
      if ((type === 'main' && !isEmailType) || type === 'extra') {
          if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
      }
  };

  const startConfirmFlow = async () => {
      const currentVal = isImoType ? (imoInputMode === 'number' ? imoNumberValue : imoIdValue) : inputValue;
      const isMainValid = validateInput(currentVal);
      const isExtraValid = validateExtra(extraValue);
      if (!isMainValid || ((isEmailType || isMlbbType) && !isExtraValid) || insufficientBalance) return;

      if (userPin && userPin.trim() !== "") {
          setStatus('pin-required');
          setEnteredPin('');
          setPinError('');
      } else {
          await executePurchase();
      }
  };

  const handlePinSubmit = async () => {
      if (enteredPin === userPin) {
          await executePurchase();
      } else {
          setPinError(texts.incorrectPin);
          if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
      }
  };

  const executePurchase = async () => {
    setStatus('processing');
    let finalData = '';
    
    if (isEmailType) {
        finalData = `${inputValue.toLowerCase()} | ${extraValue}`;
    } else if (isMlbbType) {
        finalData = `Player ID: ${inputValue} | Zone ID: ${extraValue}`;
    } else if (isImoType) {
        if (imoInputMode === 'number') {
            finalData = `IMO Number: ${selectedCountry.code} ${imoNumberValue}`;
        } else {
            finalData = `IMO ID: ${imoIdValue}`;
        }
    } else {
        finalData = inputValue;
    }
    
    await onConfirm(finalData);
    setStatus('button-success');
    
    setTimeout(() => {
        setStatus('success');
        setTimeout(() => {
          if (onSuccess) onSuccess(); else onClose();
        }, 3000); 
    }, 500);
  };

  const handleInsufficientClick = () => {
      const requiredAmount = Math.max(0, offer.price - userBalance);
      onInsufficientBalanceClick?.(requiredAmount);
  };

  const handleEnteredPinChange = (val: string) => {
      if (/^\d*$/.test(val) && val.length <= 4) {
          setEnteredPin(val);
          setPinError('');
      }
  };

  // STRICT VALIDATION FOR IMO NUMBER REAL-TIME
  const isImoValid = isImoType 
    ? (imoInputMode === 'number' 
        ? (imoNumberValue.length >= selectedCountry.min && imoNumberValue.length <= selectedCountry.max)
        : (imoIdValue.length >= 4))
    : true;

  const isConfirmDisabled = 
    (isImoType ? (imoInputMode === 'number' ? !imoNumberValue : !imoIdValue) : !inputValue) || 
    !isImoValid ||
    !!inputError || 
    ((isEmailType || isMlbbType) && (!extraValue || !!extraError)) || 
    status === 'processing' || 
    status === 'button-success' || 
    insufficientBalance;
  
  const getOfferIcon = () => {
      if (offer.icon) return <offer.icon className={`${styles.icon} mb-1 ${config.accent} drop-shadow-md`} />;
      if (isMlbbType) return <MlbbDiamondIcon className={`${styles.icon} mb-1 drop-shadow-md`} />;
      return <DiamondIcon className={`${styles.icon} mb-1 ${config.accent} drop-shadow-md`} />;
  }

  const filteredCountries = countrySearch.trim() === '' 
    ? IMO_COUNTRIES 
    : IMO_COUNTRIES.filter(c => 
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
        c.code.includes(countrySearch) ||
        c.short.toLowerCase().includes(countrySearch.toLowerCase())
    );

  const displayInputValue = isImoType ? (imoInputMode === 'number' ? imoNumberValue : imoIdValue) : inputValue;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-smart-fade-in">
      <div 
        className={`bg-light-card dark:bg-dark-card rounded-3xl ${styles.container} w-full max-w-xs animate-smart-pop-in shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden relative`}
        onClick={(e) => e.stopPropagation()} 
      >
        {status === 'idle' || status === 'processing' || status === 'button-success' ? (
          <div className="w-full">
            <h3 className={`${styles.title} font-bold text-center text-gray-900 dark:text-white uppercase tracking-widest`}>Purchase</h3>
            
            <div className={`flex flex-col items-center text-center ${styles.offerBox} bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700`}>
                {getOfferIcon()}
                <h4 className={`${styles.offerName} font-extrabold text-gray-900 dark:text-white leading-tight`}>{offer.name}</h4>
                <p className="text-[9px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mt-0.5">{texts.packagePrice}</p>
                <p className={`${styles.price} font-black mt-0.5 ${config.accent}`}>{texts.currency}{offer.price.toLocaleString()}</p>
            </div>
            
            <div className={`${styles.balanceText} ${styles.balanceBox} bg-white dark:bg-dark-bg rounded-xl border border-gray-100 dark:border-gray-700 text-light-text dark:text-dark-text shadow-sm`}>
                <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">{texts.balance}</span>
                    <span className="font-bold">{texts.currency}{formatBalance(userBalance)}</span>
                </div>
                <div className={`flex justify-between font-bold border-t border-gray-200 dark:border-gray-700 mt-0.5 pt-0.5`}>
                    <span>{texts.newBalance}</span>
                    <span className={insufficientBalance ? 'text-red-500' : 'text-green-500'}>
                        {texts.currency}{formatBalance(userBalance - offer.price)}
                    </span>
                </div>
            </div>

            {isImoType && (
                <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-4 border border-gray-200 dark:border-gray-700">
                    <button 
                        onClick={() => { setImoInputMode('number'); setInputError(''); }}
                        className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all uppercase tracking-wider ${imoInputMode === 'number' ? 'bg-[#00A2FF] text-white shadow-md' : 'text-gray-400'}`}
                    >
                        IMO Number
                    </button>
                    <button 
                        onClick={() => { setImoInputMode('id'); setInputError(''); }}
                        className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all uppercase tracking-wider ${imoInputMode === 'id' ? 'bg-[#00A2FF] text-white shadow-md' : 'text-gray-400'}`}
                    >
                        IMO ID
                    </button>
                </div>
            )}

            <div className={styles.inputGroup}>
              <label className={`${styles.inputLabel} font-semibold text-gray-500 dark:text-gray-400 block ml-1`}>
                  {isImoType ? (imoInputMode === 'number' ? 'COUNTRY' : 'IMO ID') : isEmailType ? texts.email : isPubgType ? texts.pubgId : isMlbbType ? texts.mlbbId : texts.uid}
              </label>
              
              <div className="flex gap-2 items-stretch w-full">
                {isImoType && imoInputMode === 'number' && (
                    <div className="shrink-0">
                        <button 
                            onClick={() => setIsCountryPickerOpen(true)}
                            className={`h-full bg-gray-50 dark:bg-dark-bg border rounded-xl px-2 py-3 text-sm font-black outline-none flex items-center justify-center min-w-[75px] shadow-sm hover:bg-gray-100 transition-all text-[#00A2FF]
                                ${isCountryPickerOpen ? 'border-[#00A2FF] ring-2 ring-[#00A2FF]/20' : 'border-gray-200 dark:border-gray-700 focus:border-[#00A2FF] focus:ring-2 focus:ring-[#00A2FF]/20'}
                            `}
                        >
                            <span className="font-mono tracking-tighter">{selectedCountry.code}</span>
                            <svg className="ml-1 opacity-50" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                    </div>
                )}
                
                <input
                    type={isEmailType ? 'email' : 'text'}
                    inputMode={isEmailType ? 'email' : (isImoType && imoInputMode === 'id' ? 'text' : 'numeric')}
                    value={displayInputValue}
                    onChange={handleInputChange}
                    onKeyDown={(e) => handleKeyDown(e, 'main')}
                    onBlur={handleBlur}
                    onFocus={handleInputFocus}
                    placeholder={isImoType ? (imoInputMode === 'number' ? 'Number' : 'IMO ID') : isEmailType ? texts.email : isPubgType ? texts.pubgId : isMlbbType ? texts.mlbbId : texts.uid}
                    className={`flex-1 min-w-0 ${styles.input} bg-gray-50 dark:bg-dark-bg border outline-none font-medium transition-all
                        ${inputError 
                            ? 'border-red-500 ring-2 ring-red-500/20' 
                            : `border-gray-200 dark:border-gray-700 ${config.border} focus:ring-2 ${config.ring}`
                        }
                    `}
                    disabled={status === 'processing' || status === 'button-success'}
                    maxLength={isImoType && imoInputMode === 'number' ? selectedCountry.max : isPubgType ? 10 : isMlbbType ? 10 : isImoType ? 25 : !isEmailType ? 15 : undefined}
                />
              </div>
              {inputError && <p className="text-red-500 text-[9px] mt-1 font-bold ml-1 animate-fade-in">{inputError}</p>}
            </div>

            {(isEmailType || isMlbbType) && (
                <div className="mb-2 animate-fade-in">
                    <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 block mb-1 ml-1">
                        {isEmailType ? texts.accountNumberLabel : texts.mlbbZone}
                    </label>
                    <input
                        type="tel"
                        inputMode="numeric"
                        value={extraValue}
                        onChange={handleExtraChange}
                        onKeyDown={(e) => handleKeyDown(e, 'extra')}
                        onBlur={handleExtraBlur}
                        onFocus={handleInputFocus}
                        placeholder={isEmailType ? texts.phonePlaceholder : texts.mlbbZone}
                        className={`w-full p-3 bg-gray-50 dark:bg-dark-bg border rounded-xl outline-none font-medium transition-all text-sm
                            ${extraError 
                                ? 'border-red-500 ring-2 ring-red-500/20' 
                                : `border-gray-200 dark:border-gray-700 ${config.border} focus:ring-2 ${config.ring}`
                            }
                        `}
                        disabled={status === 'processing' || status === 'button-success'}
                        maxLength={isEmailType ? 11 : 5}
                    />
                    {extraError && <p className="text-red-500 text-[9px] mt-1 font-bold ml-1 animate-fade-in">{extraError}</p>}
                </div>
            )}
            
            {insufficientBalance && (
                <button 
                    onClick={handleInsufficientClick}
                    className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 py-2.5 px-3 rounded-xl mb-3 border border-red-100 dark:border-red-800 animate-pulse hover:bg-red-100 dark:hover:bg-red-900/40 transition-all flex items-center justify-center group active:scale-[0.98]"
                >
                    <span className="text-[9.2px] font-black uppercase tracking-[0.08em] whitespace-nowrap overflow-hidden text-ellipsis">
                        {texts.insufficientBalanceTap}
                    </span>
                </button>
            )}

            <div className={`flex ${styles.footer}`}>
              <button
                onClick={onClose}
                className={`flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold ${styles.btn} hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs active:scale-95`}
                disabled={status === 'processing' || status === 'button-success'}
              >
                {texts.cancel}
              </button>
              <button
                onClick={startConfirmFlow}
                disabled={isConfirmDisabled}
                className={`flex-1 bg-gradient-to-r ${config.btn} text-white font-bold ${styles.btn} flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg ${config.shadow} text-xs active:scale-95
                    ${status === 'button-success' ? '!bg-green-500 shadow-green-500/30' : ''}
                `}
              >
                {status === 'processing' ? (
                    <Spinner />
                ) : status === 'button-success' ? (
                    <CheckIcon className="w-5 h-5 animate-smart-pop-in" />
                ) : (
                    "Confirm"
                )}
              </button>
            </div>
          </div>
        ) : status === 'pin-required' ? (
            <div className="w-full text-center animate-smart-pop-in py-4">
                <div className={`w-16 h-16 ${config.accent} bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <ShieldLockIcon className={`w-8 h-8 ${config.accent}`} />
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 uppercase tracking-wide">{texts.pinTitle}</h3>
                <p className="text-[11px] text-gray-500 mb-6 font-medium px-4">{texts.enterPinToSecure}</p>
                
                <div className="px-6 mb-4">
                    <input 
                        type="password" inputMode="numeric" maxLength={4}
                        value={enteredPin} onChange={(e) => handleEnteredPinChange(e.target.value)}
                        className={`w-full text-center tracking-[1.5em] text-3xl font-black p-4 bg-gray-50 dark:bg-gray-900 border rounded-3xl outline-none transition-all
                            ${pinError ? 'border-red-500 ring-2 ring-red-500/20 animate-shake' : `border-gray-200 dark:border-gray-700 ${config.border} focus:ring-2 ${config.ring}`}
                        `}
                        autoFocus
                        placeholder=""
                    />
                    {pinError && <p className="text-red-500 text-[10px] font-bold mt-2 animate-pulse">{pinError}</p>}
                </div>

                <div className="flex gap-3 px-2 mt-8">
                     <button 
                        onClick={() => setStatus('idle')}
                        className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 font-black rounded-2xl active:scale-95 transition-all text-[10px] uppercase tracking-widest"
                    >
                        {texts.back}
                    </button>
                    <button 
                        onClick={handlePinSubmit}
                        disabled={enteredPin.length !== 4 || status === 'processing'}
                        className={`flex-1 py-4 bg-gradient-to-r ${config.btn} text-white font-black rounded-2xl shadow-xl ${config.shadow} active:scale-95 disabled:opacity-50 transition-all text-[10px] uppercase tracking-widest`}
                    >
                        {status === 'processing' ? <Spinner /> : "Confirm"}
                    </button>
                </div>
            </div>
        ) : (
            <div className={`keep-animating flex flex-col items-center justify-center text-center p-4 overflow-hidden ${styles.successContainer}`}>
                <div className={`relative ${styles.successIcon} mb-4 flex items-center justify-center keep-animating`}>
                    <div className={`absolute inset-0 ${config.accent} bg-opacity-20 rounded-full animate-ping keep-animating`}></div>
                    <div className={`absolute inset-2 ${config.accent} bg-opacity-30 rounded-full animate-ping keep-animating`} style={{animationDelay: '0.2s'}}></div>
                    <div className={`animate-burst relative z-10 ${config.accent} keep-animating`}>
                        {getOfferIcon()}
                    </div>
                </div>
                <h3 className={`text-xl font-black text-transparent bg-clip-text bg-gradient-to-r ${config.btn} mb-1 opacity-0 animate-fade-in-up keep-animating`} style={{animationDelay: '0.4s'}}>
                    {texts.orderSuccessful}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 opacity-0 animate-fade-in-up text-xs max-w-[200px] keep-animating" style={{animationDelay: '0.6s'}}>
                    {texts.orderPendingGeneric.replace('{packageName}', String(offer.name))}
                </p>
            </div>
        )}

        {/* --- CUSTOM SEARCHABLE COUNTRY PICKER --- */}
        {isCountryPickerOpen && (
            <div className="absolute inset-0 z-[110] bg-white dark:bg-dark-card animate-smart-slide-up flex flex-col">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 bg-gray-50 dark:bg-dark-bg/30">
                    <button 
                        onClick={() => { setIsCountryPickerOpen(false); setCountrySearch(''); }}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                    </button>
                    <div className="flex-1 relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text"
                            placeholder="Search"
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-[#00A2FF] focus:ring-2 focus:ring-[#00A2FF]/20 transition-all"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
                    {filteredCountries.length > 0 ? (
                        filteredCountries.map((c, i) => (
                            <button
                                key={i}
                                onClick={() => { setSelectedCountry(c); setIsCountryPickerOpen(false); setCountrySearch(''); setInputError(''); }}
                                className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all active:scale-[0.98] ${selectedCountry.short === c.short ? 'bg-[#00A2FF]/10 text-[#00A2FF]' : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{c.flag}</span>
                                    <div className="flex flex-col items-start">
                                        <span className="text-sm font-black uppercase tracking-tighter">{c.short}</span>
                                    </div>
                                </div>
                                <span className="text-sm font-black font-mono">{c.code}</span>
                            </button>
                        ))
                    ) : (
                        <div className="text-center py-10 opacity-30">
                            <p className="text-xs font-black uppercase tracking-widest">No country found</p>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseModal;
