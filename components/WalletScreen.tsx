
import React, { useState, FC, useEffect, useRef } from 'react';
import type { User, PaymentMethod, Screen, AppSettings } from '../types';
import { db } from '../firebase';
import { ref, push } from 'firebase/database';
import { APP_LOGO_URL } from '../constants';

// Icons
const CheckIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12" /></svg>);
const CopyIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>);
const StatementIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.5 5.25H4.5C4.08579 5.25 3.75 5.58579 3.75 6V18C3.75 18.4142 4.08579 18.75 4.5 18.75H19.5C19.9142 18.75 20.25 18.4142 20.25 18V6C20.25 5.58579 19.9142 5.25 19.5 5.25Z" stroke="#FBBF24" strokeWidth="2"/>
    <path d="M7.5 10.5H16.5" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round"/>
    <path d="M7.5 13.5H13.5" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const ArrowRightIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>);
const ArrowLeftIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
    </svg>
);
const XIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);

const WavyPath = () => (
  <svg className="absolute w-full h-full top-0 left-0 opacity-30 animate-pulse keep-animating" preserveAspectRatio="none" viewBox="0 0 350 210">
    <path d="M0 70 C50 30, 100 110, 150 70 S250 30, 300 70 S400 110, 450 70" stroke="rgba(255, 255, 255, 0.6)" fill="none" strokeWidth="2" />
    <path d="M0 140 C50 100, 100 180, 150 140 S250 100, 300 140 S400 180, 450 140" stroke="rgba(255, 255, 255, 0.4)" fill="none" strokeWidth="2" />
  </svg>
);

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

interface WalletScreenProps {
  user: User;
  texts: any;
  onNavigate: (screen: Screen) => void;
  paymentMethods: PaymentMethod[];
  videoActive?: boolean;
  videoUrl?: string;
  spacingActive?: boolean;
  adCode?: string;
  adActive?: boolean;
  initialAmount?: number | null;
  onPrefillConsumed?: () => void;
  appSettings?: AppSettings;
}

const WalletScreen: FC<WalletScreenProps> = ({ user, texts, onNavigate, paymentMethods, videoActive, videoUrl, spacingActive, initialAmount, onPrefillConsumed, appSettings }) => {
  const [step, setStep] = useState(1); 
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [step1Error, setStep1Error] = useState<string>('');
  const [step2Error, setStep2Error] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [appAlert, setAppAlert] = useState<string | null>(null);
  const trxInputRef = useRef<HTMLInputElement>(null);
  
  const MIN_AMOUNT = 20;
  const MAX_AMOUNT = 10000;

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
        const videoId = match[2];
        const origin = window.location.origin;
        const params = new URLSearchParams({
            'rel': '0',
            'modestbranding': '1',
            'playsinline': '1',
            'enablejsapi': '1',
            'origin': origin,
            'widget_referrer': origin
        });
        return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
    }
    return url;
  };

  const embedUrl = getYouTubeEmbedUrl(videoUrl || '');

  useEffect(() => {
      if (initialAmount) {
          setAmount(String(initialAmount));
          onPrefillConsumed?.();
      }
  }, [initialAmount, onPrefillConsumed]);

  useEffect(() => {
      window.scrollTo(0, 0);
  }, [step]);

  const handleInputFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      event.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  const presetAmounts = [100, 300, 500, 1000];
  const numericAmount = Number(amount);
  const isAmountInRange = amount !== '' && !isNaN(numericAmount) && numericAmount >= MIN_AMOUNT && numericAmount <= MAX_AMOUNT;
  
  let amountError = '';
  if (amount && !isNaN(numericAmount)) {
      if (numericAmount < MIN_AMOUNT) {
          amountError = texts.minDepositError;
      } else if (numericAmount > MAX_AMOUNT) {
          amountError = texts.maxDepositError.replace('{amount}', MAX_AMOUNT.toLocaleString());
      }
  }

  const isStep1Valid = isAmountInRange && !!selectedMethod;

  const handleNextStep = () => {
    if (step === 1) {
      if (!isAmountInRange || !selectedMethod) {
          setStep1Error(texts.addFundsError);
          return;
      }
      setStep1Error('');
      setStep2Error('');
      setStep(2);
    }
  };

  const handleMethodSelect = (method: PaymentMethod) => {
    if (method.isActive === false) {
        setAppAlert(texts.paymentMethodUnavailable);
        return;
    }
    setSelectedMethod(method);
    setStep1Error('');
  };

  const handleAmountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (['e', 'E', '+', '-', '.'].includes(e.key)) {
          e.preventDefault();
      }
  };

  const handleTrxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const cleanValue = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      setTransactionId(cleanValue);
      if (step2Error) setStep2Error('');
  };
  
  const validateTrxID = (id: string) => {
      const trimmed = id.trim();
      if (trimmed.length < 8 || trimmed.length > 10) return false;
      const isAlphanumeric = /^[A-Z0-9]{8,10}$/.test(trimmed);
      if (!isAlphanumeric) return false;
      const hasJunkRepetition = /([A-Z0-9])\1{3,}/.test(trimmed);
      if (hasJunkRepetition) return false;
      return true;
  };

  const isTrxValid = validateTrxID(transactionId);

  const handleSubmit = async () => {
    if (!transactionId.trim()) {
        setStep2Error('অনুগ্রহ করে আপনার ট্রানজেকশন আইডিটি এখানে লিখুন।');
        trxInputRef.current?.focus();
        return;
    }
    if (!isTrxValid) {
        setStep2Error('আপনার দেওয়া ট্রানজেকশন আইডিটি সঠিক নয়, আবার চেষ্টা করুন।');
        trxInputRef.current?.focus();
        return;
    }
    if (user.uid) {
        const finalTrxId = transactionId.trim().toUpperCase();
        const txnData = {
            amount: Number(amount),
            method: selectedMethod?.name,
            transactionId: finalTrxId,
            date: new Date().toISOString(),
            status: 'Pending',
            id: finalTrxId, 
            userId: user.uid
        };
        const txnRef = ref(db, 'transactions/' + user.uid);
        await push(txnRef, txnData);
    }
    onNavigate('myTransaction');
  };
  
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const rawBalance = Number(user.balance || 0);
  const formattedBalance = rawBalance.toFixed(2).replace(/\.00$/, "");
  const spacerHeight = spacingActive !== false ? '50px' : '0px';

  if (step === 2 && selectedMethod) {
      const getMethodColor = (methodName: string) => {
          const name = methodName.toLowerCase();
          if (name.includes('bkash')) return '#E2136E';
          if (name.includes('nagad')) return '#ED1C24';
          if (name.includes('rocket')) return '#8C3494';
          if (name.includes('upay')) return '#0066B3';
          return '#7C3AED';
      };
      const getUssdCode = (methodName: string) => {
          const name = methodName.toLowerCase();
          if (name.includes('bkash')) return '*247#';
          if (name.includes('nagad')) return '*167#';
          if (name.includes('rocket')) return '*322#';
          if (name.includes('upay')) return '*268#';
          return '';
      };
      const themeColor = getMethodColor(selectedMethod.name);
      const ussdCode = getUssdCode(selectedMethod.name);

      return (
          <div className="fixed inset-0 z-[100] bg-[#F4F7FB] dark:bg-gray-900 flex flex-col overflow-y-auto animate-slide-in-from-top">
              {/* Header */}
              <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
                  <button onClick={() => { setStep(1); setStep2Error(''); }} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                      <ArrowLeftIcon className="w-6 h-6" />
                  </button>
                  <div className="flex-1 flex justify-center items-center">
                      <div className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary tracking-widest uppercase">ADD MONEY</div>
                  </div>
                  <div className="w-10"></div>
              </div>

              <div className="flex-1 px-4 pt-0 pb-20 max-w-md mx-auto w-full">
                  {/* Gateway Branding */}
                  <div className="bg-gradient-to-r from-primary to-secondary pt-[3px] rounded-2xl mb-2 mt-1 shadow-sm">
                      <div className="bg-white dark:bg-gray-800 rounded-b-2xl rounded-t-[13px] p-4 relative overflow-hidden h-full w-full">
                          <div className="flex justify-between items-center gap-3 w-full relative z-10">
                              {/* Payment Method */}
                              <div className="flex items-center gap-3 flex-1">
                                  <div className="h-10 w-10 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center p-1.5 border border-gray-100 dark:border-gray-700 shadow-sm">
                                      <img src={selectedMethod.logo} alt={selectedMethod.name} className="h-full w-full object-contain" />
                                  </div>
                                  <span className="text-lg font-bold text-gray-800 dark:text-white">{selectedMethod.name}</span>
                              </div>
                              
                              {/* Divider Icon */}
                              <div className="flex-shrink-0 text-gray-300 dark:text-gray-600">
                                  <ArrowRightIcon className="w-5 h-5" />
                              </div>

                              {/* App Branding */}
                              <div className="flex items-center gap-3 flex-1 justify-end">
                                  <span className="text-lg font-bold text-gray-800 dark:text-white">{appSettings?.appName || 'FF SHOP'}</span>
                                  <div className="h-10 w-10 bg-gradient-to-br from-primary to-secondary rounded-full p-[2px] shadow-sm">
                                      <div className="w-full h-full bg-white dark:bg-gray-800 rounded-full flex items-center justify-center overflow-hidden">
                                          <img src={appSettings?.logoUrl || APP_LOGO_URL} alt="App Logo" className="w-full h-full object-cover" />
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Amount */}
                  <div className="bg-gradient-to-r from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10 rounded-2xl border border-primary/20 dark:border-primary/30 p-4 mb-2 flex items-center justify-center">
                      <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">৳ {amount}</span>
                  </div>

                  {/* Payment Box */}
                  <div className="rounded-2xl shadow-md overflow-hidden mb-6" style={{ backgroundColor: themeColor }}>
                      <div className="p-6 text-white">
                          <div className="mb-6">
                              <label className="block text-white text-sm font-bold mb-2 text-center drop-shadow-sm">ট্রান্সজেকশন আইডি দিন</label>
                              <input 
                                  ref={trxInputRef}
                                  type="text"
                                  value={transactionId}
                                  onChange={handleTrxChange}
                                  placeholder=""
                                  className={`w-full p-3.5 rounded-xl text-gray-800 font-mono text-center text-lg focus:outline-none focus:ring-2 focus:ring-white/50 bg-white shadow-inner ${step2Error ? 'ring-4 ring-red-500/50' : ''}`}
                              />
                              {step2Error && (
                                  <div className="mt-3 bg-red-500/90 backdrop-blur-sm text-white p-2.5 rounded-lg text-sm font-bold text-center shadow-lg border border-red-400/50 animate-pulse">
                                      {step2Error}
                                  </div>
                              )}
                          </div>

                          <div className="flex flex-col text-[13px] font-normal text-white/95">
                              <div className="flex gap-3 items-start py-2.5 relative">
                                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white shrink-0 shadow-sm"></div>
                                  <p className="leading-snug">{ussdCode ? `${ussdCode} ডায়াল করে আপনার ` : 'আপনার '}{selectedMethod.name} মোবাইল মেনুতে যান অথবা {selectedMethod.name} অ্যাপে যান।</p>
                                  <div className="absolute bottom-0 left-0 w-full h-[1px] bg-black/10 rounded-full opacity-90"></div>
                              </div>
                              
                              <div className="flex gap-3 items-start py-2.5 relative">
                                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white shrink-0 shadow-sm"></div>
                                  <p className="leading-snug"><span className="text-[#FDE047] font-semibold">"{selectedMethod.instructions || 'Send Money'}"</span> -এ ক্লিক করুন।</p>
                                  <div className="absolute bottom-0 left-0 w-full h-[1px] bg-black/10 rounded-full opacity-90"></div>
                              </div>

                              <div className="flex gap-3 items-start py-2.5 relative">
                                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white shrink-0 shadow-sm"></div>
                                  <div className="flex-1">
                                      <p className="mb-1.5 leading-snug">প্রাপক নম্বর হিসেবে এই নম্বরটি লিখুনঃ</p>
                                      <div className="flex items-center gap-3">
                                          <span className="text-lg font-bold text-[#FDE047] tracking-wide">{selectedMethod.accountNumber}</span>
                                          <button 
                                              onClick={() => handleCopyToClipboard(selectedMethod.accountNumber)}
                                              className="flex items-center justify-center bg-black/20 hover:bg-black/30 w-8 h-8 rounded-full transition-all shadow-sm active:scale-95"
                                          >
                                              {isCopied ? <CheckIcon className="w-4 h-4 text-[#FDE047]"/> : <CopyIcon className="w-3.5 h-3.5 text-white"/>}
                                          </button>
                                      </div>
                                  </div>
                                  <div className="absolute bottom-0 left-0 w-full h-[1px] bg-black/10 rounded-full opacity-90"></div>
                              </div>

                              <div className="flex gap-3 items-start py-2.5 relative">
                                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white shrink-0 shadow-sm"></div>
                                  <p className="leading-snug">টাকার পরিমাণঃ <span className="text-lg font-bold text-[#FDE047] tracking-wide ml-1">৳ {amount}</span></p>
                                  <div className="absolute bottom-0 left-0 w-full h-[1px] bg-black/10 rounded-full opacity-90"></div>
                              </div>

                              <div className="flex gap-3 items-start py-2.5 relative">
                                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white shrink-0 shadow-sm"></div>
                                  <p className="leading-snug">নিশ্চিত করতে এখন আপনার {selectedMethod.name} মোবাইল মেনু পিন লিখুন।</p>
                                  <div className="absolute bottom-0 left-0 w-full h-[1px] bg-black/10 rounded-full opacity-90"></div>
                              </div>

                              <div className="flex gap-3 items-start py-2.5 relative">
                                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white shrink-0 shadow-sm"></div>
                                  <p className="leading-snug">সবকিছু ঠিক থাকলে, আপনি {selectedMethod.name} থেকে একটি নিশ্চিতকরণ বার্তা পাবেন।</p>
                                  <div className="absolute bottom-0 left-0 w-full h-[1px] bg-black/10 rounded-full opacity-90"></div>
                              </div>

                              <div className="flex gap-3 items-start pt-2.5 relative">
                                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white shrink-0 shadow-sm"></div>
                                  <p className="leading-snug">এখন উপরের বক্সে আপনার <span className="text-[#FDE047] font-semibold">Transaction ID</span> দিন এবং নিচের <span className="text-[#FDE047] font-semibold">VERIFY</span> বাটনে ক্লিক করুন।</p>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Verify Button */}
                  <button 
                      onClick={handleSubmit}
                      style={{ backgroundColor: themeColor }}
                      className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all hover:opacity-90 active:scale-95`}
                  >
                      VERIFY
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="p-4 animate-smart-fade-in pb-24 relative">
        {appAlert && <AppAlert message={appAlert} onClose={() => setAppAlert(null)} />}
        <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 p-5 rounded-2xl text-white shadow-2xl shadow-primary/30 mb-4 overflow-hidden animate-smart-pop-in">
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            <WavyPath />
             <div className="relative z-10 flex flex-col justify-center py-4">
                <p className="text-[17px] font-bold text-white tracking-widest mb-1 uppercase opacity-90">{texts.balanceTitle}</p>
                <p className="text-4xl font-extrabold text-white tracking-tight mb-2 drop-shadow-lg">
                    {texts.currency}{formattedBalance}
                </p>
                <div className="self-start bg-white/20 backdrop-blur-md px-3 py-0.5 rounded-full border border-white/10 shadow-sm">
                     <p className="text-[10px] font-bold text-white tracking-wide">{user.name}</p>
                </div>
            </div>
             <div className="absolute top-4 right-4 p-2 bg-white/10 rounded-full animate-pulse keep-animating">
                <StatementIcon className="w-4 h-4 text-white/80" />
            </div>
        </div>

        <div 
            style={{ height: spacerHeight }} 
            className="transition-all duration-700 ease-in-out pointer-events-none"
        ></div>

        <div className={`mt-4 bg-light-card dark:bg-dark-card rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden animate-smart-slide-up transition-all duration-500 ease-in-out`} style={{ animationDuration: '0.8s' }}>
            
            {step === 1 && (
                <div className="p-4">
                    <div className="mb-4">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">{texts.amount}</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400">{texts.currency}</span>
                            <input 
                                type="number"
                                placeholder="0"
                                value={amount}
                                onChange={(e) => { setAmount(e.target.value); setStep1Error(''); }}
                                onFocus={handleInputFocus}
                                onKeyDown={handleAmountKeyDown}
                                className={`w-full pl-8 pr-4 py-2.5 bg-gray-50 dark:bg-dark-bg border ${amount && !isAmountInRange ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-700 focus:ring-primary'} rounded-xl focus:outline-none focus:ring-2 text-lg font-bold transition-all`}
                            />
                        </div>
                        
                        {amountError && (
                            <p className="text-red-500 text-[10px] mt-1 font-bold animate-pulse">
                                {amountError}
                            </p>
                        )}
                        
                        <div className="grid grid-cols-4 gap-2 mt-2">
                            {presetAmounts.map((val) => (
                                <button
                                    key={val}
                                    onClick={() => { setAmount(String(val)); setStep1Error(''); }}
                                    className={`w-full py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                        Number(amount) === val
                                        ? 'bg-primary text-white border-primary'
                                        : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 hover:border-primary/50'
                                    }`}
                                >
                                    {texts.currency}{val}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-5">
                         <label className="text-[9px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-[0.15em] mb-2 block ml-1">{texts.selectPayment}</label>
                         <div className="grid grid-cols-3 gap-2">
                            {paymentMethods.map((method) => {
                                const isSelected = selectedMethod?.name === method.name;
                                const isInactive = method.isActive === false;
                                return (
                                    <button 
                                        key={method.name} 
                                        onClick={() => handleMethodSelect(method)}
                                        className={`relative flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all duration-200 ${
                                            isSelected 
                                            ? 'border-primary bg-primary/5 shadow-md scale-105' 
                                            : isInactive 
                                                ? 'border-gray-100 dark:border-gray-800 bg-gray-100/50 dark:bg-gray-900/50 opacity-60 grayscale-[0.5]'
                                                : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-dark-bg hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="h-6 w-6 mb-1 flex items-center justify-center">
                                            <img src={method.logo} alt={method.name} className="h-full w-full object-contain" />
                                        </div>
                                        <span className={`text-[9px] font-bold ${isSelected ? 'text-primary' : 'text-gray-500'}`}>{method.name}</span>
                                        {isSelected && (
                                            <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary rounded-full flex items-center justify-center">
                                                <CheckIcon className="w-1.5 h-1.5 text-white" />
                                            </div>
                                        )}
                                        {isInactive && (
                                            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[6px] font-black px-1 py-0.5 rounded shadow-sm">OFF</div>
                                        )}
                                    </button>
                                )
                            })}
                         </div>
                    </div>

                    {step1Error && !amountError && <div className="mb-3 p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-lg font-medium text-center">{step1Error}</div>}

                    <div className="w-full">
                        <button 
                            onClick={handleNextStep}
                            disabled={!isStep1Valid}
                            className={`w-full font-bold text-base py-2.5 rounded-xl transition-all duration-300 flex items-center justify-center bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30
                                ${isStep1Valid 
                                    ? 'hover:opacity-90 active:scale-95' 
                                    : 'opacity-50 cursor-not-allowed'
                                }`}
                        >
                            {texts.nextStep} <ArrowRightIcon className="ml-2 w-4 h-4"/>
                        </button>
                    </div>
                </div>
            )}
        </div>

        {videoActive && videoUrl && (
            <div className="mt-4 animate-smart-fade-in w-full overflow-hidden rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 bg-black keep-animating">
                <div className="relative pb-[56.25%] h-0">
                    <iframe
                        src={embedUrl}
                        title="Wallet Tutorial"
                        className="absolute top-0 left-0 w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-forms"
                        allowFullScreen
                    ></iframe>
                </div>
            </div>
        )}
    </div>
  );
};

export default WalletScreen;
