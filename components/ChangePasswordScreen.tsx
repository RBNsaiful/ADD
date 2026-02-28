
import React, { useState, FC, FormEvent, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { ref, update, get } from 'firebase/database';
import { Screen } from '../types';
import AdRenderer from './AdRenderer';

const EyeIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
);

const EyeOffIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="1" y1="2" x2="22" y2="22"/></svg>
);

const LockIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>);
const UnlockIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1" /></svg>);

const KeyIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
);

const ShieldCheckIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
);

const CheckCircleIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01" /></svg>
);

const HeadphonesIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
);

const EditIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>);

interface ChangePasswordScreenProps {
  texts: any;
  onPasswordChanged: () => void;
  onNavigate: (screen: Screen) => void;
  adCode?: string;
  adActive?: boolean;
}

type PinFlow = 'none' | 'setup-intro' | 'setup-entry' | 'setup-confirm' | 'verify-off' | 'change-verify' | 'success';

const ChangePasswordScreen: FC<ChangePasswordScreenProps> = ({ texts, onPasswordChanged, onNavigate, adCode, adActive }) => {
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Refs for Smart Focus
  const currentPasswordRef = useRef<HTMLInputElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);
  const confirmNewPasswordRef = useRef<HTMLInputElement>(null);

  // PIN state
  const [userPin, setUserPin] = useState<string | null>(null);
  const [isPinEnabled, setIsPinEnabled] = useState(false);
  const [flow, setFlow] = useState<PinFlow>('none');
  const [tempPin, setTempPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [verifyPin, setVerifyPin] = useState('');
  const [pinError, setPinError] = useState('');

  useEffect(() => {
      const user = auth.currentUser;
      if (user) {
          get(ref(db, `users/${user.uid}/pin`)).then(snapshot => {
              if (snapshot.exists()) {
                  setUserPin(snapshot.val());
                  setIsPinEnabled(true);
              }
          });
      }
  }, []);

  const resetFlow = () => {
      setFlow('none');
      setTempPin('');
      setConfirmPin('');
      setVerifyPin('');
      setPinError('');
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // SMART FOCUS LOGIC: Check empty fields first
    if (!currentPassword.trim()) {
        currentPasswordRef.current?.focus();
        return;
    }
    if (!newPassword.trim()) {
        newPasswordRef.current?.focus();
        return;
    }
    if (!confirmNewPassword.trim()) {
        confirmNewPasswordRef.current?.focus();
        return;
    }

    // Logic Validation
    if (newPassword.length < 6) {
        setError("Password must be at least 6 characters.");
        newPasswordRef.current?.focus();
        return;
    }
    if (newPassword !== confirmNewPassword) {
        setError(texts.passwordsDoNotMatch);
        confirmNewPasswordRef.current?.focus();
        return;
    }
    if (currentPassword === newPassword) {
        setError(texts.passwordSameAsOld);
        newPasswordRef.current?.focus();
        return;
    }

    setError('');
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error("User not authenticated");
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setSuccess(true);
      setTimeout(() => { onPasswordChanged(); }, 2000);
    } catch (err: any) {
        if (err.code === 'auth/wrong-password') setError(texts.incorrectCurrentPassword);
        else if (err.code === 'auth/too-many-requests') setError("Too many attempts. Try again later.");
        else setError("Failed to update password. Please try again.");
    } finally { setLoading(false); }
  };

  const handlePinToggle = () => {
      if (isPinEnabled) {
          setFlow('verify-off');
      } else {
          setFlow('setup-intro');
      }
  };

  const handleVerifyOff = (val: string) => {
      if (/^\d*$/.test(val) && val.length <= 4) {
          setVerifyPin(val);
          setPinError('');
          if (val.length === 4) {
              setTimeout(async () => {
                  if (val === userPin) {
                      const user = auth.currentUser;
                      if (user) {
                          await update(ref(db, `users/${user.uid}`), { pin: null });
                          setUserPin(null);
                          setIsPinEnabled(false);
                          resetFlow();
                      }
                  } else {
                      setPinError(texts.incorrectPin);
                      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
                  }
              }, 300);
          }
      }
  };

  const handleVerifyChange = (val: string) => {
      if (/^\d*$/.test(val) && val.length <= 4) {
          setVerifyPin(val);
          setPinError('');
          if (val.length === 4) {
              setTimeout(() => {
                  if (val === userPin) {
                      setFlow('setup-entry');
                      setTempPin('');
                  } else {
                      setPinError(texts.incorrectPin);
                      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
                  }
              }, 300);
          }
      }
  };

  const handleSavePin = async () => {
      if (tempPin !== confirmPin) { setPinError(texts.pinMismatch); return; }
      const user = auth.currentUser;
      if (user) {
          setLoading(true);
          await update(ref(db, `users/${user.uid}`), { pin: tempPin });
          setUserPin(tempPin);
          setIsPinEnabled(true);
          setLoading(false);
          setFlow('success');
      }
  };

  return (
    <div className="p-4 pt-1 pb-48 animate-smart-fade-in space-y-4 relative">
      <div className="max-w-md mx-auto space-y-4">
         
         {/* PIN Section - Main Interface */}
         <div className="bg-light-card dark:bg-dark-card rounded-3xl shadow-lg p-5 border border-gray-100 dark:border-gray-800 transition-all opacity-0 animate-smart-slide-up">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-all duration-500 ${isPinEnabled ? 'bg-gradient-to-br from-primary to-secondary shadow-md' : 'bg-red-50 dark:bg-red-900/10'}`}>
                        <ShieldCheckIcon className={`w-4 h-4 ${isPinEnabled ? 'text-white' : 'text-red-500'}`} />
                    </div>
                    <div>
                        <h3 className="font-black text-[15px] text-gray-800 dark:text-white tracking-widest uppercase">{texts.securityPin}</h3>
                    </div>
                </div>
                
                <div className="flex items-center gap-2.5">
                    {isPinEnabled && (
                        <button 
                            onClick={() => setFlow('change-verify')}
                            className="p-1.5 bg-gray-100 dark:bg-gray-800 text-primary rounded-lg active:scale-90 transition-all shadow-sm border border-gray-200/50 dark:border-gray-700/50 flex items-center justify-center"
                            aria-label={texts.changePin}
                        >
                            <EditIcon className="w-3.5 h-3.5" />
                        </button>
                    )}

                    <div 
                        onClick={handlePinToggle}
                        className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors relative ${isPinEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isPinEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                </div>
            </div>
         </div>

         {/* Password Section */}
         <div className="bg-light-card dark:bg-dark-card rounded-3xl shadow-lg p-6 space-y-6 border border-gray-100 dark:border-gray-800 transition-all opacity-0 animate-smart-slide-up" style={{ animationDelay: '50ms' }}>
            <div className="text-center mb-2">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <KeyIcon className="w-7 h-7 text-primary" />
                </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <div>
                    <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-2 block ml-1">{texts.currentPassword}</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            {showCurrentPassword ? <UnlockIcon className="h-5 w-5 text-primary" /> : <LockIcon className="h-5 w-5 text-primary" />}
                        </div>
                        <input 
                            ref={currentPasswordRef}
                            type={showCurrentPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full p-3.5 pl-10 pr-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary outline-none text-light-text dark:text-dark-text transition-all font-medium"
                        />
                         <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-primary transition-colors"
                        >
                            {showCurrentPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-2 block ml-1">{texts.newPassword}</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            {showNewPassword ? <UnlockIcon className="h-5 w-5 text-primary" /> : <LockIcon className="h-5 w-5 text-primary" />}
                        </div>
                        <input 
                            ref={newPasswordRef}
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full p-3.5 pl-10 pr-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary outline-none text-light-text dark:text-dark-text transition-all font-medium"
                        />
                         <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-primary transition-colors"
                        >
                            {showNewPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-2 block ml-1">{texts.confirmNewPassword}</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            {showConfirmPassword ? <UnlockIcon className="h-5 w-5 text-primary" /> : <LockIcon className="h-5 w-5 text-primary" />}
                        </div>
                        <input 
                            ref={confirmNewPasswordRef}
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            className={`w-full p-3.5 pl-10 pr-12 bg-gray-50 dark:bg-gray-800 border rounded-2xl focus:ring-2 outline-none text-light-text dark:text-dark-text transition-all font-medium
                                ${confirmNewPassword && newPassword !== confirmNewPassword 
                                    ? 'border-red-500 focus:ring-red-500/50' 
                                    : 'border-gray-200 dark:border-gray-700 focus:ring-primary'
                                }
                            `}
                        />
                         <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-primary transition-colors"
                        >
                            {showConfirmPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                    </div>
                     {confirmNewPassword && newPassword !== confirmNewPassword && (
                        <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold animate-fade-in">{texts.passwordsDoNotMatch}</p>
                    )}
                </div>

                {error && (
                    <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-lg font-bold text-center animate-pulse border border-red-200 dark:border-red-800">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-lg font-bold text-center animate-bounce flex items-center justify-center gap-2 border border-green-200 dark:border-green-800">
                        <CheckCircleIcon className="w-4 h-4" /> {texts.passwordChangedSuccess}
                    </div>
                )}

                <div className="pt-1">
                    <button 
                        type="submit" 
                        disabled={loading || success}
                        className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg flex items-center justify-center transition-all duration-300 tracking-wide
                            ${loading
                                ? 'bg-gradient-to-r from-primary to-secondary cursor-wait opacity-80'
                                : success
                                    ? 'bg-green-500 cursor-default shadow-green-500/30'
                                    : 'bg-gradient-to-r from-primary to-secondary hover:brightness-110 active:scale-95 shadow-primary/30 cursor-pointer'
                            }
                        `}
                    >
                        {loading ? <div className="keep-animating animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : texts.updatePassword}
                    </button>
                </div>
            </form>
         </div>

         {/* Help Button */}
         <div className="mt-8 mb-10 px-2 opacity-0 animate-smart-slide-up" style={{ animationDelay: '200ms' }}>
            <button 
                type="button"
                onClick={() => onNavigate('contactUs')}
                className="w-full flex items-center justify-center gap-3 p-4 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-800 text-primary rounded-2xl shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
            >
                <div className="p-1.5 bg-primary/10 rounded-full">
                    <HeadphonesIcon className="w-5 h-5 text-primary" />
                </div>
                
                <span className="text-sm font-extrabold uppercase tracking-tight">
                    {texts.passwordIssue}
                </span>
            </button>
         </div>
      </div>

      {/* --- PIN POPUP SYSTEM --- */}
      {flow !== 'none' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-smart-fade-in">
              <div className="w-full max-w-xs bg-white dark:bg-dark-card rounded-[2.5rem] p-6 shadow-2xl animate-smart-pop-in relative border border-white/10">
                  
                  {/* SETUP INTRO */}
                  {flow === 'setup-intro' && (
                      <div className="text-center space-y-4 py-4">
                          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                              <ShieldCheckIcon className="w-8 h-8 text-primary" />
                          </div>
                          <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{texts.securityPin}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed px-2 font-medium">{texts.pinSetupDesc}</p>
                          <div className="pt-4 flex gap-2">
                              <button onClick={resetFlow} className="flex-1 py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-500 font-bold rounded-2xl text-xs">{texts.cancel}</button>
                              <button onClick={() => setFlow('setup-entry')} className="flex-1 py-3.5 bg-primary text-white font-black rounded-2xl text-xs shadow-lg shadow-primary/30 uppercase tracking-widest">{texts.next}</button>
                          </div>
                      </div>
                  )}

                  {/* SETUP ENTRY */}
                  {flow === 'setup-entry' && (
                      <div className="space-y-6 py-4">
                          <div className="text-center">
                            <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-4">{texts.setupPin}</h3>
                            <input 
                                type="password" inputMode="numeric" maxLength={4}
                                value={tempPin} onChange={(e) => { setTempPin(e.target.value.replace(/\D/g,'')); setPinError(''); }}
                                className="w-full text-center tracking-[1em] text-3xl font-black p-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl focus:ring-2 focus:ring-primary outline-none"
                                placeholder="0000"
                                autoFocus
                            />
                            {pinError && <p className="text-red-500 text-[10px] font-bold mt-2 animate-pulse">{pinError}</p>}
                          </div>
                          <button 
                            onClick={() => { 
                                if(tempPin.length !== 4) {
                                    setPinError(texts.pinLength); 
                                } else if (userPin && tempPin === userPin) {
                                    // VALIDATION: Prevent same PIN
                                    setPinError(texts.pinSameAsOld);
                                } else {
                                    setFlow('setup-confirm'); 
                                }
                            }}
                            className="w-full py-4 bg-primary text-white font-black rounded-2xl text-xs shadow-xl shadow-primary/30 uppercase tracking-widest"
                          >
                              {texts.next}
                          </button>
                          <button onClick={resetFlow} className="w-full text-[10px] font-bold text-gray-400 uppercase tracking-widest">{texts.cancel}</button>
                      </div>
                  )}

                  {/* SETUP CONFIRM */}
                  {flow === 'setup-confirm' && (
                      <div className="space-y-6 py-4">
                          <div className="text-center">
                            <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-4">{texts.confirmPin}</h3>
                            <input 
                                type="password" inputMode="numeric" maxLength={4}
                                value={confirmPin} onChange={(e) => { setConfirmPin(e.target.value.replace(/\D/g,'')); setPinError(''); }}
                                className={`w-full text-center tracking-[1em] text-3xl font-black p-4 bg-gray-50 dark:bg-gray-900 border rounded-3xl focus:ring-2 outline-none ${pinError ? 'border-red-500' : 'border-gray-100 dark:border-gray-800 focus:ring-primary'}`}
                                placeholder="0000"
                                autoFocus
                            />
                            {pinError && <p className="text-red-500 text-[10px] font-bold mt-2">{pinError}</p>}
                          </div>
                          <button 
                            onClick={handleSavePin}
                            className="w-full py-4 bg-primary text-white font-black rounded-2xl text-xs shadow-xl shadow-primary/30 uppercase tracking-widest"
                          >
                              {texts.saveChanges}
                          </button>
                          <button onClick={() => setFlow('setup-entry')} className="w-full text-[10px] font-bold text-gray-400 uppercase tracking-widest">{texts.back}</button>
                      </div>
                  )}

                  {/* VERIFY OFF */}
                  {flow === 'verify-off' && (
                      <div className="space-y-6 py-4 text-center">
                          <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest">{texts.confirmPin}</h3>
                          <p className="text-[10px] text-gray-400 font-bold px-2 uppercase">{texts.enterPin}</p>
                          <input 
                            type="password" inputMode="numeric" maxLength={4}
                            value={verifyPin} onChange={(e) => handleVerifyOff(e.target.value.replace(/\D/g,''))}
                            className={`w-full text-center tracking-[1em] text-3xl font-black p-4 bg-gray-50 dark:bg-gray-900 border rounded-3xl focus:ring-2 outline-none ${pinError ? 'border-red-500' : 'border-gray-100 dark:border-gray-800 focus:ring-primary'}`}
                            placeholder="0000"
                            autoFocus
                          />
                          {pinError && <p className="text-red-500 text-[10px] font-bold">{pinError}</p>}
                          <button onClick={resetFlow} className="w-full text-[10px] font-bold text-gray-400 uppercase tracking-widest">{texts.cancel}</button>
                      </div>
                  )}

                  {/* CHANGE VERIFY */}
                  {flow === 'change-verify' && (
                      <div className="space-y-6 py-4 text-center">
                          <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest">{texts.changePin}</h3>
                          <p className="text-[10px] text-gray-400 font-bold px-2 uppercase">{texts.enterPin}</p>
                          <input 
                            type="password" inputMode="numeric" maxLength={4}
                            value={verifyPin} onChange={(e) => handleVerifyChange(e.target.value.replace(/\D/g,''))}
                            className={`w-full text-center tracking-[1em] text-3xl font-black p-4 bg-gray-50 dark:bg-gray-900 border rounded-3xl focus:ring-2 outline-none ${pinError ? 'border-red-500' : 'border-gray-100 dark:border-gray-800 focus:ring-primary'}`}
                            placeholder="0000"
                            autoFocus
                          />
                          {pinError && <p className="text-red-500 text-[10px] font-bold">{pinError}</p>}
                          <button onClick={resetFlow} className="w-full text-[10px] font-bold text-gray-400 uppercase tracking-widest">{texts.cancel}</button>
                      </div>
                  )}

                  {/* SUCCESS */}
                  {flow === 'success' && (
                      <div className="text-center space-y-6 py-4 animate-smart-pop-in">
                          <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                              <CheckCircleIcon className="w-10 h-10 text-green-500" />
                          </div>
                          <div>
                              <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase">{texts.changesSaved}</h3>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 font-medium">{texts.yourPinIs} <span className="text-primary font-black text-lg tracking-widest ml-1">{userPin}</span></p>
                          </div>
                          <button onClick={resetFlow} className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white font-black rounded-2xl text-xs shadow-lg uppercase tracking-widest">Done</button>
                      </div>
                  )}

              </div>
          </div>
      )}

      {/* Footer Ad */}
      {adCode && (
          <div className="mt-8 animate-fade-in w-full flex justify-center min-h-[250px]">
              <AdRenderer code={adCode} active={adActive} />
          </div>
      )}
    </div>
  );
};

export default ChangePasswordScreen;
