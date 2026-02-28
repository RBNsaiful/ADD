
import React, { useState, FC, FormEvent, useRef, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../firebase';
import { ref, set, get, update } from 'firebase/database';
import { AppSettings, Language } from '../types';
import { TEXTS } from '../constants';

interface AuthScreenProps {
  texts: any;
  appName: string;
  logoUrl: string;
  onLoginAttempt: () => void; 
  appSettings?: AppSettings;
}

// Icons
const MailIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>);
const LockIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>);
const UnlockIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1" /></svg>);
const UserIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>);
const EyeIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>);
const EyeOffIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>);
const CheckIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12" /></svg>);
const XIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>);
const HelpIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>);
const KeyIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>);
const ShieldIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>);

const Spinner: FC = () => (<div className="keep-animating w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>);

const AuthScreen: React.FC<AuthScreenProps> = ({ texts, appName, logoUrl, onLoginAttempt, appSettings }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [showPinHelp, setShowPinHelp] = useState(false);

  // Age Verification States
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [selectedAge, setSelectedAge] = useState(18);
  const [tempAuthData, setTempAuthData] = useState<{ type: 'password' | 'google' } | null>(null);

  // Touch Tracking States
  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [pinTouched, setPinTouched] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  const showAppNameOnLogin = appSettings?.loginAppNameActive ?? true;

  const validateEmail = (val: string) => {
      const trimmed = val.trim().toLowerCase();
      return /^[a-zA-Z0-9._-]+@(gmail|yahoo)\.com$/.test(trimmed);
  };

  const validateName = (val: string) => {
      const trimmed = val.trim();
      if (trimmed.length < 4 || trimmed.length > 10) return false;
      if (/(.)\1\1/.test(trimmed)) return false;
      return /^[a-zA-Z\u0980-\u09FF]+(?:\s[a-zA-Z\u0980-\u09FF]+)*$/.test(trimmed);
  };

  const getEmailError = () => {
    if (!emailTouched) return null;
    if (!email.trim()) return "Email is required";
    if (!validateEmail(email)) return "Invalid Email";
    return null;
  };

  const getNameError = () => {
    if (!nameTouched || isLogin) return null;
    if (!name.trim()) return "Name is required";
    if (!validateName(name)) return "Invalid Name";
    return null;
  };

  const getPasswordError = () => {
    if (!passwordTouched) return null;
    if (!password || password.length < 6) return "Invalid Password";
    return null;
  };

  const getConfirmPasswordError = () => {
    if (!confirmPasswordTouched || isLogin) return null;
    if (!confirmPassword) return "Confirm password is required";
    if (password !== confirmPassword) return "Passwords do not match";
    return null;
  };

  const getPinError = () => {
    if (!pinTouched || isLogin) return null;
    if (pin && !/^\d{4}$/.test(pin)) return "PIN must be exactly 4 digits";
    if (pin && /^(0000|1111|2222|3333|4444|5555|6666|7777|8888|9999|1234|4321)$/.test(pin)) return "This PIN is too simple. Please use a stronger combination for better security.";
    return null;
  };

  // Trigger Age Modal BEFORE Google popup
  const handleGoogleLoginRequest = () => {
    if (appSettings?.ageVerifyActive !== false) {
        setTempAuthData({ type: 'google' });
        setShowAgeModal(true);
    } else {
        performFirebaseGoogleAuth();
    }
  };

  const performFirebaseGoogleAuth = async () => {
    onLoginAttempt();
    const provider = new GoogleAuthProvider();
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userRef = ref(db, 'users/' + user.uid);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
          // Returning user
          await update(userRef, { lastLogin: Date.now() });
          setSuccess(true);
      } else {
          // New user: Direct Registration (since age verified already)
          await set(userRef, {
            name: user.displayName || 'User',
            email: user.email || '',
            balance: 0,
            role: 'user',
            uid: user.uid,
            totalEarned: 0,
            totalAdsWatched: 0,
            isBanned: false,
            loginProvider: 'google',
            registrationDate: Date.now(),
            lastLogin: Date.now()
          });
          setSuccess(true);
      }
    } catch (error: any) {
      console.error("Google Login failed", error);
      setError(error.code === 'auth/popup-closed-by-user' ? "Login canceled." : "Google Login Failed.");
      setLoading(false);
    }
  };

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    setNameTouched(true);
    setEmailTouched(true);
    setPasswordTouched(true);
    setConfirmPasswordTouched(true);
    setPinTouched(true);

    if (!isLogin && (!name.trim() || !validateName(name))) {
        nameRef.current?.focus();
        return;
    }
    if (!email.trim() || !validateEmail(email)) {
        emailRef.current?.focus();
        return;
    }
    
    if (password.length < 6) {
        setError("Invalid Password");
        passwordRef.current?.focus();
        return;
    }

    if (!isLogin && password !== confirmPassword) {
        confirmPasswordRef.current?.focus();
        return;
    }

    if (!isLogin && pin) {
        if (!/^\d{4}$/.test(pin)) {
            setError("PIN must be exactly 4 digits");
            return;
        }
        if (/^(0000|1111|2222|3333|4444|5555|6666|7777|8888|9999|1234|4321)$/.test(pin)) {
            setError("This PIN is too simple. Please use a stronger combination for better security.");
            return;
        }
    }

    if (!isLogin) {
        if (appSettings?.ageVerifyActive !== false) {
            setTempAuthData({ type: 'password' });
            setShowAgeModal(true);
            return;
        }
    }

    performFirebaseEmailAuth();
  };

  const performFirebaseEmailAuth = async () => {
    onLoginAttempt();
    setLoading(true);
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
        await update(ref(db, 'users/' + userCredential.user.uid), { lastLogin: Date.now() });
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: trimmedName });
        await set(ref(db, 'users/' + user.uid), {
            name: trimmedName,
            email: trimmedEmail,
            balance: 0,
            role: 'user',
            uid: user.uid,
            totalEarned: 0,
            totalAdsWatched: 0,
            isBanned: false,
            loginProvider: 'password',
            registrationDate: Date.now(),
            lastLogin: Date.now(),
            ...(pin ? { pin } : {})
        });
      }
      setSuccess(true);
    } catch (err: any) {
      setLoading(false);
      let msg = "Authentication failed.";
      switch (err.code) {
          case 'auth/invalid-email': msg = texts.emailInvalid; break;
          case 'auth/invalid-credential': msg = "Invalid email or password."; break;
          case 'auth/email-already-in-use': msg = "Email already in use."; break;
          default: msg = "Connection error.";
      }
      setError(msg);
    }
  };

  const handleAgeConfirm = async () => {
      if (selectedAge < 18) return; 
      setShowAgeModal(false);
      
      if (tempAuthData?.type === 'password') {
          performFirebaseEmailAuth();
      } else if (tempAuthData?.type === 'google') {
          performFirebaseGoogleAuth();
      }
  };

  const resetInputs = () => {
    setIsLogin(!isLogin);
    setError('');
    setPassword('');
    setConfirmPassword('');
    setPin('');
    setNameTouched(false);
    setEmailTouched(false);
    setPasswordTouched(false);
    setConfirmPasswordTouched(false);
    setPinTouched(false);
    setShowPinHelp(false);
    setSuccess(false);
  };

  const emailError = getEmailError();
  const nameError = getNameError();
  const passError = getPasswordError();
  const confirmError = getConfirmPasswordError();
  const pinError = getPinError();

  return (
    <div className="min-h-screen w-full flex flex-col justify-center px-6 bg-light-bg dark:bg-dark-bg transition-colors duration-300">
      
      {showAgeModal && (
          <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-smart-fade-in">
              <div className="w-full max-w-[320px] bg-white dark:bg-dark-card rounded-[2rem] border-[6px] border-primary shadow-[0_15px_40px_rgba(0,0,0,0.3)] relative overflow-hidden flex flex-col animate-smart-pop-in">
                  
                  {/* Close Button */}
                  <button 
                    onClick={() => { setShowAgeModal(false); setTempAuthData(null); }}
                    className="absolute top-2 right-4 z-50 p-2 text-white/50 hover:text-white transition-colors"
                  >
                    <XIcon className="w-6 h-6" />
                  </button>

                  <div className="w-full bg-gradient-to-r from-primary to-secondary py-3.5 px-4 flex justify-center items-center shadow-inner">
                      <h3 className="text-[1.1rem] font-black text-white text-center leading-tight tracking-[0.1em] drop-shadow-md">
                          AGE VERIFICATION
                      </h3>
                  </div>
                  <div className="p-5 flex flex-col items-center">
                      <div className="w-full h-24 bg-gray-50 dark:bg-gray-800 rounded-[1.2rem] border-[4px] border-gray-100 dark:border-gray-700 flex items-center justify-center mb-6 shadow-inner overflow-hidden">
                          <span className="text-7xl font-black text-primary dark:text-secondary drop-shadow-sm transition-all duration-200">
                              {selectedAge < 10 ? `0${selectedAge}` : selectedAge}
                          </span>
                      </div>
                      <div className="w-full flex items-center gap-2 mb-10">
                          <button onClick={() => setSelectedAge(p => Math.max(10, p - 1))} className="w-10 h-10 shrink-0 flex items-center justify-center bg-white dark:bg-gray-800 border-[3px] border-primary rounded-xl text-primary active:scale-90 shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg></button>
                          <div className="flex-1 relative flex items-center px-1">
                              <div className="absolute inset-0 top-1/2 -translate-y-1/2 h-[6px] bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                              <input type="range" min="10" max="60" step="1" value={selectedAge} onChange={(e) => setSelectedAge(parseInt(e.target.value))} className="w-full relative z-10 h-2 bg-transparent appearance-none cursor-pointer focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-[4px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-lg" />
                          </div>
                          <button onClick={() => setSelectedAge(p => Math.min(60, p + 1))} className="w-10 h-10 shrink-0 flex items-center justify-center bg-white dark:bg-gray-800 border-[3px] border-primary rounded-xl text-primary active:scale-90 shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg></button>
                      </div>
                      <div className="w-full px-2">
                          {selectedAge < 18 ? (
                              <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-2xl border-2 border-red-200 dark:border-red-800 text-center animate-shake"><p className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-tighter leading-tight">Sorry, you must be 18 or older to access this application.</p></div>
                          ) : (
                              <button onClick={handleAgeConfirm} className="w-full py-3.5 bg-gradient-to-r from-primary to-secondary text-white font-black text-lg rounded-[1.2rem] shadow-lg shadow-primary/20 active:scale-95 transition-all uppercase tracking-widest">Confirm Age</button>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {showPinHelp && (
          <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center p-6 bg-black/40 backdrop-blur-md animate-smart-fade-in">
              <div className="w-full max-w-[320px] bg-gradient-to-br from-primary to-secondary rounded-[2rem] shadow-[0_0_40px_rgba(124,58,237,0.4)] relative overflow-hidden flex flex-col animate-smart-pop-in p-6">
                  <div className="flex flex-col items-center text-center mt-2">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 shadow-inner backdrop-blur-md">
                          <ShieldIcon className="w-8 h-8 text-yellow-300 drop-shadow-md" />
                      </div>
                      <h3 className="text-xl font-black text-white mb-3 tracking-wide drop-shadow-md uppercase">
                          WHY SET A PIN?
                      </h3>
                      <p className="text-white/90 text-sm leading-relaxed mb-8 font-medium drop-shadow-sm">
                          To keep your account balance secure, PIN verification is required before every purchase. Without the correct PIN, no one can use your balance. This ensures your funds remain fully under your control.
                      </p>
                      <button 
                          onClick={() => setShowPinHelp(false)} 
                          className="w-full py-3.5 bg-white text-primary font-black text-lg rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all uppercase tracking-widest"
                      >
                          GOT IT
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className="w-full max-w-md mx-auto z-10">
          <div className="flex flex-col items-center mb-6 mt-20 text-center">
              {showAppNameOnLogin ? (
                  <>
                    <div className="relative mb-2 min-h-[5rem] flex items-center justify-center"> 
                        {logoUrl ? (<div className="w-20 h-20 rounded-full bg-white dark:bg-dark-card p-1 shadow-md ring-1 ring-gray-200 dark:ring-gray-700 animate-smart-pop-in"><img src={logoUrl} alt={appName} className="w-full h-full object-cover rounded-full" /></div>) : null}
                    </div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mt-2">{appName}</h1>
                  </>
              ) : (<div className="pt-8"></div>)}
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">{isLogin ? "Login to your account" : "Create a new account"}</p>
          </div>

          <form onSubmit={handleAuth} className="w-full space-y-4">
            {!isLogin && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">{texts.name}</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><UserIcon className="h-5 w-5 text-primary" /></div>
                        <input ref={nameRef} type="text" value={name} onChange={(e) => { setName(e.target.value.replace(/[^a-zA-Z\u0980-\u09FF\s]/g, '')); }} onBlur={() => setNameTouched(true)} placeholder="Name" className={`w-full pl-10 pr-4 py-3.5 bg-gray-50 dark:bg-dark-card border rounded-xl shadow-sm focus:outline-none focus:ring-2 transition-all font-medium text-gray-800 dark:text-white ${nameError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700 focus:ring-primary'}`} />
                    </div>
                    {nameError && <p className="text-red-500 text-xs mt-1 ml-1 font-bold animate-fade-in">{nameError}</p>}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">{texts.email}</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MailIcon className="h-5 w-5 text-primary" /></div>
                    <input ref={emailRef} type="email" value={email} onChange={(e) => { setEmail(e.target.value); }} onBlur={() => setEmailTouched(true)} placeholder="Email" className={`w-full pl-10 pr-4 py-3.5 bg-gray-50 dark:bg-dark-card border rounded-xl shadow-sm focus:outline-none focus:ring-2 transition-all font-medium text-gray-800 dark:text-white ${emailError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700 focus:ring-primary'}`} />
                </div>
                {emailError && <p className="text-red-500 text-xs mt-1 ml-1 font-bold animate-fade-in">{emailError}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">{texts.password}</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{showPassword ? <UnlockIcon className="h-5 w-5 text-primary" /> : <LockIcon className="h-5 w-5 text-primary" />}</div>
                    <input ref={passwordRef} type={showPassword ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); }} onBlur={() => setPasswordTouched(true)} placeholder="Password" className={`w-full pl-10 pr-10 py-3.5 bg-gray-50 dark:bg-dark-card border rounded-xl shadow-sm focus:outline-none focus:ring-2 transition-all font-medium text-gray-800 dark:text-white ${passError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700 focus:ring-primary'}`} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary transition-colors">{showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}</button>
                </div>
                {passError && <p className="text-red-500 text-xs mt-1 ml-1 font-bold animate-fade-in">{passError}</p>}
            </div>

            {!isLogin && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">{texts.confirmPassword}</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{showConfirmPassword ? <UnlockIcon className="h-5 w-5 text-primary" /> : <LockIcon className="h-5 w-5 text-primary" />}</div>
                        <input ref={confirmPasswordRef} type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); }} onBlur={() => setConfirmPasswordTouched(true)} placeholder="Confirm Password" className={`w-full pl-10 pr-10 py-3.5 bg-gray-50 dark:bg-dark-card border rounded-xl shadow-sm focus:outline-none focus:ring-2 transition-all font-medium text-gray-800 dark:text-white ${confirmError ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-300 dark:border-gray-700 focus:ring-primary'}`} />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary transition-colors">{showConfirmPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}</button>
                    </div>
                    {confirmError && <p className="text-red-500 text-xs mt-1 ml-1 font-bold animate-fade-in">{confirmError}</p>}
                </div>
            )}

            {!isLogin && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">PIN (Optional)</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><KeyIcon className="h-5 w-5 text-primary" /></div>
                        <input type="password" inputMode="numeric" pattern="\d*" maxLength={4} value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); }} onBlur={() => setPinTouched(true)} placeholder="PIN (Optional)" className={`w-full pl-10 pr-10 py-3.5 bg-gray-50 dark:bg-dark-card border rounded-xl shadow-sm focus:outline-none focus:ring-2 transition-all font-medium text-gray-800 dark:text-white tracking-widest ${pinError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700 focus:ring-primary'}`} />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <button type="button" onClick={() => setShowPinHelp(!showPinHelp)} className="text-gray-400 hover:text-primary transition-colors focus:outline-none">
                                <HelpIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    {pinError && <p className="text-red-500 text-xs mt-1 ml-1 font-bold animate-fade-in">{pinError}</p>}
                </div>
            )}

            <button type="submit" disabled={loading || success} className={`w-full h-14 font-bold rounded-xl flex justify-center items-center transition-all duration-200 bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30 ${loading || success ? 'opacity-50 cursor-not-allowed' : 'opacity-100 hover:opacity-90 active:scale-[0.98]'}`}>
                {loading ? <Spinner /> : success ? <CheckIcon className="w-8 h-8 text-white drop-shadow-md animate-smart-pop-in" /> : (isLogin ? "Login" : "Register")}
            </button>
            {error && (<div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg text-center border border-red-100 dark:border-red-800 animate-fade-in font-bold">{error}</div>)}
          </form>

          <div className="relative flex py-4 items-center w-full"> <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div><span className="flex-shrink-0 mx-4 text-gray-400 dark:text-gray-500 text-xs font-medium">Or</span><div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div></div>
          <div className="w-full space-y-3 mb-6"><button onClick={handleGoogleLoginRequest} disabled={loading} className="w-full py-3.5 bg-white dark:bg-dark-card text-gray-700 dark:text-gray-200 font-bold rounded-xl shadow-sm border border-gray-300 dark:border-gray-700 flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-[0.98] disabled:opacity-50"><img src="https://i.ibb.co.com/0pN1GfCc/google-logo-png-seeklogo-273191.png" className="w-5 h-5" alt="Google" /><span>Continue with Google</span></button></div>
          <div className="w-full pb-10"><button onClick={resetInputs} className="w-full py-3.5 border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all active:scale-95 text-xs shadow-sm">{isLogin ? "Sign up" : "Back to login"}</button></div>
      </div>
    </div>
  );
};
export default AuthScreen;
