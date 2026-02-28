
import React, { useState, FC, FormEvent, useRef, useEffect } from 'react';
import type { User, Screen } from '../types';
import { DEFAULT_AVATAR_URL } from '../constants';
import { db, auth } from '../firebase';
import { ref, update } from 'firebase/database';
import { updateProfile } from 'firebase/auth';
import AdRenderer from './AdRenderer';
import ImageCropper from './ImageCropper';

// Icons
const UserIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const MailIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>);
const GamepadIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="6" y1="11" x2="10" y2="11"/><line x1="8" y1="9" x2="8" y2="13"/><line x1="15" y1="12" x2="15.01" y2="12"/><line x1="18" y1="10" x2="18.01" y2="10"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.01.152v3.516a4 4 0 0 0 3.998 3.998c.044.001.087.002.13.002h10.384a4 4 0 0 0 3.998-3.998c.001-.044.002-.087.002-.13V8.742c0-.05-.004-.1-.01-.152A4 4 0 0 0 17.32 5z"/></svg>);
const PencilIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>);
const CheckIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12" /></svg>);
const CalendarIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);
const ClockIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14" /></svg>);

const Spinner: FC = () => (<div className="keep-animating animate-spin rounded-full h-5 w-5 border-b-2 border-white/30 border-t-white"></div>);

const AppAlert: FC<{ title?: string, message: string, onClose: () => void, showConfirm?: boolean, onConfirm?: () => void, cancelText?: string, confirmText?: string }> = ({ title, message, onClose, showConfirm, onConfirm, cancelText = "Cancel", confirmText = "OK" }) => (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-smart-fade-in">
        <div className="w-full max-w-xs bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 shadow-2xl animate-smart-pop-in border border-gray-100 dark:border-gray-700 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            {title && <h4 className="font-black text-gray-900 dark:text-white mb-3 uppercase tracking-tight text-[15px]">{title}</h4>}
            <p className="text-[13px] font-bold text-gray-600 dark:text-gray-300 leading-relaxed mb-8 whitespace-pre-wrap px-5 text-center">{message}</p>
            <div className="flex gap-3 px-2">
                {showConfirm ? (
                    <>
                        <button onClick={onClose} className="flex-1 py-3.5 bg-gray-100 dark:bg-gray-700 text-gray-500 font-black rounded-2xl text-[11px] uppercase tracking-widest active:scale-95">{cancelText}</button>
                        <button onClick={onConfirm} className="flex-1 py-3.5 bg-gradient-to-r from-primary to-secondary text-white font-black rounded-2xl shadow-lg active:scale-95 text-[11px] uppercase tracking-widest">{confirmText}</button>
                    </>
                ) : (
                    <button onClick={onClose} className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white font-black rounded-2xl shadow-lg active:scale-95 transition-all text-xs uppercase tracking-widest">{confirmText}</button>
                )}
            </div>
        </div>
    </div>
);

interface EditProfileScreenProps {
  user: User;
  texts: any;
  onNavigate: (screen: Screen) => void;
  adCode?: string;
  adActive?: boolean;
}

const EditProfileScreen: FC<EditProfileScreenProps> = ({ user, texts, onNavigate, adCode, adActive }) => {
  const [name, setName] = useState(user.name);
  const [playerUid, setPlayerUid] = useState(user.playerUid || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || DEFAULT_AVATAR_URL);
  
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [appAlert, setAppAlert] = useState<{ title?: string, msg: string, showConfirm?: boolean } | null>(null);
  
  const [nameError, setNameError] = useState('');
  const [error, setError] = useState('');
  
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let timer: number;
    if (showSuccess) {
        timer = window.setTimeout(() => {
            onNavigate('profile');
        }, 1500);
    }
    return () => { if (timer) clearTimeout(timer); };
  }, [showSuccess, onNavigate]);

  const validateNameRule = (val: string) => {
      const trimmed = val.trim();
      if (trimmed.length < 4 || trimmed.length > 20) return false;
      if (/(.)\1\1/.test(trimmed)) return false; 
      return /^[a-zA-Z\u0980-\u09FF]+(?:\s[a-zA-Z\u0980-\u09FF]+)*$/.test(trimmed);
  };

  const handleNameChange = (val: string) => {
      const cleanVal = val.replace(/[^a-zA-Z\u0980-\u09FF\s]/g, '');
      setName(cleanVal);
      setNameError(''); 
  };

  const handleNameBlur = () => {
      if (!validateNameRule(name)) {
          setNameError("Invalid Name");
      }
  };

  const handleUidChange = (val: string) => {
      if (val && !/^\d*$/.test(val)) return;
      setPlayerUid(val);
  };

  const isNameDirty = name.trim() !== user.name;
  const isUidDirty = playerUid !== (user.playerUid || '');
  const isAvatarDirty = avatarUrl !== (user.avatarUrl || DEFAULT_AVATAR_URL);
  
  const isDirty = isNameDirty || isUidDirty || isAvatarDirty;
  const isNameValid = validateNameRule(name);
  const canSave = isDirty && isNameValid;

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (isSaving || !user.uid || !canSave) return;
    setError('');
    setIsSaving(true);
    try {
        const updates: any = { 
            name: name.trim(), 
            playerUid: playerUid, 
            avatarUrl: avatarUrl 
        };

        if (isAvatarDirty) {
            updates.avatarUpdateCount = (user.avatarUpdateCount || 0) + 1;
        }

        await update(ref(db, 'users/' + user.uid), updates);
        
        if (auth.currentUser) {
            try {
                 const profileUpdates: any = { displayName: name.trim() };
                 if (avatarUrl && !avatarUrl.startsWith('data:')) {
                     profileUpdates.photoURL = avatarUrl;
                 }
                 await updateProfile(auth.currentUser, profileUpdates);
            } catch (authErr) {}
        }
        setIsSaving(false);
        setShowSuccess(true); 
    } catch (error) {
        setError("Failed to update profile");
        setIsSaving(false);
    }
  };

  const handlePencilClick = () => {
      // 30 Minutes Cooldown Logic - USER SPECIFIC
      const storageKey = `avatar_policy_agreed_at_${user.uid}`;
      const lastAgreed = localStorage.getItem(storageKey);
      const now = Date.now();
      const thirtyMinutes = 30 * 60 * 1000;

      if (lastAgreed && (now - parseInt(lastAgreed)) < thirtyMinutes) {
          // Direct gallery access
          fileInputRef.current?.click();
      } else {
          // Show warning modal
          setAppAlert({
              title: texts.uploadWarningTitle,
              msg: texts.uploadWarningMsg,
              showConfirm: true
          });
      }
  };

  const handleConfirmWarning = () => {
      // Save consent timestamp - USER SPECIFIC
      const storageKey = `avatar_policy_agreed_at_${user.uid}`;
      localStorage.setItem(storageKey, Date.now().toString());
      setAppAlert(null);
      fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
          setAppAlert({ msg: texts.imgSizeError });
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setTempImageSrc(event.target?.result as string);
        setShowCropper(true);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImage: string) => {
      setAvatarUrl(croppedImage);
      setShowCropper(false);
      setTempImageSrc(null);
  };

  const formatDate = (timestamp?: number) => {
      if (!timestamp) return "N/A";
      const date = new Date(timestamp);
      const d = date.getDate().toString().padStart(2, '0');
      const m = date.toLocaleString('en-GB', { month: 'short' });
      const y = date.getFullYear();
      const time = date.toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
      return `${d} ${m} ${y}, ${time}`;
  };

  const canChangeAvatar = (user.avatarUpdateCount || 0) < 2;

  return (
    <div className="p-4 pt-12 pb-24 animate-smart-fade-in">
      {appAlert && (
          <AppAlert 
            title={appAlert.title} 
            message={appAlert.msg} 
            onClose={() => setAppAlert(null)} 
            showConfirm={appAlert.showConfirm}
            onConfirm={handleConfirmWarning}
            cancelText={texts.cancel}
            confirmText={appAlert.showConfirm ? texts.agreeBtn : texts.result || "OK"}
          />
      )}
      
      {showCropper && tempImageSrc && (
          <ImageCropper 
            imageSrc={tempImageSrc} 
            onCancel={() => { setShowCropper(false); setTempImageSrc(null); }}
            onCropComplete={handleCropComplete}
          />
      )}
      <div className="max-w-md mx-auto bg-white dark:bg-dark-card rounded-2xl shadow-lg p-6">
         <form onSubmit={handleSave} className="space-y-6">
            <div className="flex flex-col items-center">
                <div className="relative group">
                    <div 
                        className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-pointer"
                        onClick={() => canChangeAvatar && handlePencilClick()}
                    >
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR_URL; }} />
                    </div>
                    {canChangeAvatar && (
                        <button type="button" onClick={handlePencilClick} className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full border-2 border-white dark:border-dark-card shadow-sm hover:scale-105 transition-transform">
                            <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5 ml-1">{texts.name}</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <UserIcon className="h-5 w-5 text-primary" />
                        </div>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            onBlur={handleNameBlur}
                            placeholder="Name"
                            className={`w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border rounded-xl outline-none transition-all text-gray-700 dark:text-gray-200
                                ${nameError ? 'border-red-500 focus:border-red-500' : 'border-gray-200 dark:border-gray-700 focus:border-primary'}
                            `}
                        />
                    </div>
                    {nameError && <p className="text-red-500 text-xs mt-1 ml-1 font-bold animate-fade-in">{nameError}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5 ml-1">{texts.saveUid}</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <GamepadIcon className="h-5 w-5 text-primary" />
                        </div>
                        <input type="text" inputMode="numeric" value={playerUid} onChange={(e) => handleUidChange(e.target.value)} placeholder={texts.saveUid} className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none transition-all focus:border-primary text-gray-700 dark:text-gray-200" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5 ml-1">{texts.email}</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MailIcon className="h-5 w-5 text-primary" />
                        </div>
                        <input type="email" value={user.email} disabled className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 cursor-not-allowed font-medium" />
                    </div>
                </div>

                {(user as any).loginProvider !== 'google' && (
                    <div className="grid grid-cols-2 gap-3 pt-2 animate-fade-in">
                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 text-center">{texts.registrationDate}</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                    <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                                </div>
                                <input 
                                    type="text" 
                                    value={formatDate(user.registrationDate)} 
                                    readOnly 
                                    className="w-full pl-8 pr-1 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-xl text-[9px] text-gray-600 dark:text-gray-300 font-bold cursor-default focus:outline-none text-center" 
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 text-center">{texts.lastLogin}</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                    <ClockIcon className="h-3.5 w-3.5 text-primary" />
                                </div>
                                <input 
                                    type="text" 
                                    value={formatDate(user.lastLogin)} 
                                    readOnly 
                                    className="w-full pl-8 pr-1 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-xl text-[9px] text-gray-600 dark:text-gray-300 font-bold cursor-default focus:outline-none text-center" 
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="pt-2">
                <button 
                    type="submit" 
                    disabled={isSaving || showSuccess || !canSave}
                    className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all bg-gradient-to-r from-primary to-secondary flex items-center justify-center
                        ${showSuccess ? 'bg-green-500 shadow-green-500/30' : (isSaving || !canSave) ? 'opacity-50 cursor-not-allowed shadow-none' : 'opacity-100 hover:opacity-95 shadow-primary/30 active:scale-95'}`}
                >
                    {isSaving ? <Spinner /> : showSuccess ? <CheckIcon className="w-6 h-6 animate-smart-pop-in" /> : texts.saveChanges}
                </button>
            </div>
            {error && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg text-center border border-red-100 dark:border-red-800 animate-fade-in font-bold">
                    {error}
                </div>
            )}
         </form>
      </div>
      {adCode && (
            <div className="mt-12 w-full flex justify-center min-h-[250px]">
                <AdRenderer code={adCode} active={adActive} />
            </div>
      )}
    </div>
  );
};

export default EditProfileScreen;
