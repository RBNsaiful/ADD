
import React, { FC, useState, useEffect } from 'react';
import type { SupportContact, AppSettings, FaqItem } from '../types';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import AdRenderer from './AdRenderer';

const HeadphonesIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>);
const ArrowUpRightIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></svg>);
const ChevronDownIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="6 9 12 15 18 9" /></svg>);

interface ContactUsScreenProps {
  texts: any;
  contacts?: SupportContact[];
  adCode?: string;
  adActive?: boolean;
  appSettings?: AppSettings;
}

const FaqAccordion: FC<{ faq: FaqItem, isBn: boolean, index: number }> = ({ faq, isBn, index }) => {
    const [isOpen, setIsOpen] = useState(false);
    const question = isBn ? (faq.question_bn || faq.question) : faq.question;
    const answer = isBn ? (faq.answer_bn || faq.answer) : faq.answer;

    return (
        <div 
            className="mb-3 overflow-hidden border border-gray-100 dark:border-gray-800 rounded-2xl bg-white dark:bg-dark-card shadow-sm transition-all duration-300 opacity-0 animate-smart-slide-up"
            style={{ animationDelay: `${(index + 2) * 100}ms` }}
        >
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between p-4 text-left transition-colors ${isOpen ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}
            >
                <span className={`text-sm font-bold pr-4 transition-colors ${isOpen ? 'text-primary' : 'text-light-text dark:text-dark-text'}`}>
                    {question}
                </span>
                <ChevronDownIcon className={`w-4 h-4 shrink-0 transition-transform duration-300 text-gray-400 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
            </button>
            <div 
                className={`transition-all duration-300 ease-in-out px-4 ${isOpen ? 'max-h-64 pb-4 opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400 whitespace-pre-wrap pt-2 border-t border-gray-100 dark:border-gray-800">
                    {answer}
                </p>
            </div>
        </div>
    );
};

const ContactCard: FC<{ contact: SupportContact, texts: any, index: number }> = ({ contact, texts, index }) => {
    const isFullWidth = contact.type === 'video' || contact.title?.toLowerCase().includes('tutorial');
    const displayName = contact.title || texts[contact.labelKey] || contact.labelKey;

    return (
        <a
            href={contact.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`group flex items-center p-4 bg-light-card dark:bg-dark-card rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-800 opacity-0 animate-smart-slide-up ${isFullWidth ? 'col-span-1 sm:col-span-2' : 'col-span-1'}`}
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 mr-4 flex-shrink-0 flex items-center justify-center">
                {contact.iconUrl ? (
                    <img 
                        src={contact.iconUrl} 
                        alt={displayName} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<div class="text-primary font-black text-xl">' + displayName.charAt(0) + '</div>'; }}
                    />
                ) : (
                    <div className="text-primary font-black text-xl uppercase">{displayName.charAt(0)}</div>
                )}
            </div>
            
            <div className="flex-grow min-w-0">
                <h3 className="font-bold text-light-text dark:text-dark-text text-base group-hover:text-primary transition-colors truncate">
                    {displayName}
                </h3>
            </div>

            <div className="text-gray-300 group-hover:text-primary transition-colors ml-2">
                <ArrowUpRightIcon className="w-5 h-5" />
            </div>
        </a>
    );
};

const ContactUsScreen: FC<ContactUsScreenProps> = ({ texts, contacts, adCode, adActive, appSettings }) => {
    const [faqs, setFaqs] = useState<FaqItem[]>([]);
    const displayContacts = contacts && contacts.length > 0 ? contacts : [];
    const supportMessage = appSettings?.contactMessage || "";
    const operatingHours = appSettings?.operatingHours || "Operating Hours: 10:00 AM - 10:00 PM";
    const isBn = texts.cancel !== 'Cancel';

    useEffect(() => {
        const faqsRef = ref(db, 'config/faqs');
        const unsub = onValue(faqsRef, (snap) => {
            // Truly empty if not exists or data is empty
            if (snap.exists()) {
                const data = snap.val();
                setFaqs(data ? Object.values(data) : []);
            } else {
                setFaqs([]);
            }
        });
        return () => unsub();
    }, []);

    return (
        <div className="p-4 animate-smart-fade-in pb-32">
            <div className="max-w-xl mx-auto">
                <div className="text-center mb-8 animate-smart-pop-in">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full flex items-center justify-center mb-4">
                        <HeadphonesIcon className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-light-text dark:text-dark-text mb-2">
                        {texts.getInTouch}
                    </h2>
                    {supportMessage && (
                        <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto text-sm leading-relaxed whitespace-pre-wrap">
                            {supportMessage}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
                    {displayContacts.map((contact, index) => (
                        <ContactCard key={index} contact={contact} texts={texts} index={index} />
                    ))}
                </div>

                {/* FAQ Section - Only renders if there are FAQs */}
                {faqs.length > 0 && (
                    <div className="mt-12 space-y-1">
                        {faqs.map((faq, index) => (
                            <FaqAccordion key={faq.id || index} faq={faq} isBn={isBn} index={index} />
                        ))}
                    </div>
                )}

                 <div className="mt-12 text-center opacity-0 animate-smart-slide-up" style={{ animationDelay: '1000ms' }}>
                    <p className="text-xs text-gray-400 font-medium">
                        {operatingHours}
                    </p>
                </div>
            </div>

            {adCode && (
                <div className="mt-8 animate-fade-in w-full flex justify-center min-h-[250px]">
                    <AdRenderer code={adCode} active={adActive} />
                </div>
            )}
        </div>
    );
};

export default ContactUsScreen;
