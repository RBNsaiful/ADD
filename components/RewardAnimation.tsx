
import React, { FC, useEffect, useState, useRef } from 'react';

interface RewardAnimationProps {
    amount: number;
    texts: any;
    onAnimationEnd: () => void;
}

const REWARD_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3";

const RewardAnimation: FC<RewardAnimationProps> = ({ amount, texts, onAnimationEnd }) => {
    const [step, setStep] = useState<'idle' | 'shaking' | 'opening' | 'finished'>('idle');
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // 1. Initialize Audio Object
        audioRef.current = new Audio(REWARD_SOUND_URL);
        audioRef.current.volume = 0.6; // Solid volume but not deafening

        // 2. Load Confetti Script dynamically if not present
        if (!(window as any).confetti) {
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js";
            script.async = true;
            document.body.appendChild(script);
        }

        // 3. Start Animation Sequence
        const sequence = async () => {
            // Initial short delay
            await new Promise(r => setTimeout(r, 200));
            
            // --- STEP 1: SHAKE (Rapid & Strong) ---
            setStep('shaking');

            // Shake duration (1.5 seconds)
            await new Promise(r => setTimeout(r, 1500));

            // --- STEP 2: OPEN LID ---
            setStep('opening');
            
            // Delay before money pops (0.4s) - allow lid to start moving
            await new Promise(r => setTimeout(r, 400));
            
            // --- STEP 3: MONEY POP, SOUND, VIBRATION & CONFETTI ---
            
            // A. Play Victory Sound
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(e => {
                    console.log("Audio playback blocked by browser/gesture requirement", e);
                });
            }

            // B. Trigger Vibration (250ms)
            if (navigator.vibrate) {
                try {
                    navigator.vibrate([100, 50, 100]); // Dual pulse
                } catch (e) {
                    // Ignore
                }
            }

            // C. Fire Confetti
            if ((window as any).confetti) {
                 (window as any).confetti({
                    particleCount: 200,
                    spread: 120,
                    origin: { y: 0.6 },
                    zIndex: 10001,
                    scalar: 1.3,
                    colors: ['#FFD700', '#FFA500', '#ffffff', '#7C3AED', '#EC4899'] 
                 });
            }

            // Visible duration (Money stays for 3.5 seconds)
            await new Promise(r => setTimeout(r, 3500));
            
            // --- STEP 4: FINISH ---
            setStep('finished');
            onAnimationEnd();
        };

        sequence();

        // Cleanup
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };

    }, [onAnimationEnd]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md">
            <style>{`
                /* 1. SHAKE ANIMATION */
                @keyframes violent-shake {
                    0% { transform: translate(0, 0) rotate(0deg); }
                    10% { transform: translate(-3px, -3px) rotate(-3deg); }
                    20% { transform: translate(3px, 3px) rotate(3deg); }
                    30% { transform: translate(-3px, 3px) rotate(-3deg); }
                    40% { transform: translate(3px, -3px) rotate(3deg); }
                    50% { transform: translate(-2px, -2px) rotate(-2deg); }
                    60% { transform: translate(2px, 2px) rotate(2deg); }
                    70% { transform: translate(-2px, 2px) rotate(-2deg); }
                    80% { transform: translate(2px, -2px) rotate(2deg); }
                    90% { transform: translate(-1px, 1px) rotate(-1deg); }
                    100% { transform: translate(0, 0) rotate(0deg); }
                }

                /* 2. LID FLY OFF ANIMATION */
                @keyframes lid-open-and-fly {
                    0% { transform: translateY(0) rotate(0deg); }
                    40% { transform: translateY(-70px) rotate(-25deg); }
                    100% { transform: translateY(-500px) translateX(120px) rotate(-140deg) scale(0.7); opacity: 0; }
                }

                /* 3. MONEY POP UP ANIMATION */
                @keyframes pop-up-money {
                    0% { transform: translate(-50%, 50px) scale(0.5); opacity: 0; }
                    40% { transform: translate(-50%, -150px) scale(1.1); opacity: 1; }
                    70% { transform: translate(-50%, -200px) scale(1.2); opacity: 1; }
                    100% { transform: translate(-50%, -210px) scale(1.0); opacity: 1; }
                }

                /* --- CONTAINER --- */
                .gift-container {
                    position: relative;
                    width: 160px;
                    height: 128px;
                    display: flex;
                    justify-content: center;
                    align-items: flex-end;
                    perspective: 1000px;
                    margin-top: 100px;
                }

                .gift-container.shaking {
                    animation: violent-shake 0.08s infinite;
                }

                /* --- LID (Premium Purple Gradient) --- */
                .gift-lid {
                    position: absolute;
                    top: -12px;
                    left: -8px;
                    width: 176px;
                    height: 44px;
                    background: linear-gradient(135deg, #7C3AED, #5B21B6, #4C1D95);
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.3);
                    z-index: 30;
                    transform-origin: bottom center;
                    border: 1px solid #4C1D95;
                }
                
                .gift-container.opening .gift-lid {
                    animation: lid-open-and-fly 1s ease-in forwards;
                }

                /* Ribbon on Lid */
                .gift-lid::before {
                    content: '';
                    position: absolute;
                    left: 50%;
                    top: 0;
                    bottom: 0;
                    width: 28px;
                    background: linear-gradient(to right, #FCD34D, #F59E0B);
                    transform: translateX(-50%);
                }
                .gift-lid::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 0;
                    right: 0;
                    height: 28px;
                    background: linear-gradient(to bottom, #FCD34D, #F59E0B);
                    transform: translateY(-50%);
                }

                /* Bow */
                .gift-bow {
                    position: absolute;
                    top: -28px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 56px;
                    height: 28px;
                    z-index: 35;
                }
                .gift-bow::before, .gift-bow::after {
                    content: '';
                    position: absolute;
                    width: 36px;
                    height: 36px;
                    border: 8px solid #FCD34D;
                    border-radius: 50%;
                    top: 0;
                }
                .gift-bow::before { left: -18px; transform: rotate(-30deg); border-bottom-color: transparent; border-right-color: transparent; }
                .gift-bow::after { right: -18px; transform: rotate(30deg); border-bottom-color: transparent; border-left-color: transparent; }

                /* --- BODY (Front) --- */
                .gift-body {
                    position: relative;
                    width: 160px;
                    height: 112px;
                    background: linear-gradient(135deg, #FFD700 0%, #F59E0B 40%, #D97706 100%);
                    border-radius: 0 0 12px 12px;
                    z-index: 20;
                    box-shadow: 0 25px 60px rgba(0,0,0,0.8), inset 0 -5px 15px rgba(0,0,0,0.2);
                    border: 1px solid #B45309;
                }
                .gift-body::before {
                    content: '';
                    position: absolute;
                    left: 50%;
                    top: 0;
                    bottom: 0;
                    width: 28px;
                    background: linear-gradient(to right, #7C3AED, #5B21B6);
                    transform: translateX(-50%);
                }

                /* --- BACK (Inside) --- */
                .gift-back {
                    position: absolute;
                    width: 152px;
                    height: 104px;
                    background: #92400E;
                    border-radius: 0 0 12px 12px;
                    z-index: 1;
                    bottom: 4px;
                    left: 4px;
                    box-shadow: inset 0 0 30px rgba(0,0,0,0.6);
                }

                /* --- MONEY WRAPPER --- */
                .money-wrapper {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, 50px);
                    opacity: 0;
                    z-index: 10;
                    pointer-events: none;
                    width: 300px;
                    text-align: center;
                }

                .gift-container.opening .money-wrapper {
                    animation: pop-up-money 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                    animation-delay: 0.3s; 
                }

                .money-text {
                    display: inline-block;
                    font-size: 5rem;
                    font-weight: 900;
                    color: #fff;
                    background: linear-gradient(to bottom, #FFD700, #FBBF24, #FFF);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    text-shadow: 0px 4px 20px rgba(0,0,0,0.7);
                    filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.9));
                    font-family: 'Poppins', sans-serif;
                    white-space: nowrap;
                    line-height: 1;
                }
                
                .money-label {
                    display: block;
                    font-size: 1.4rem;
                    color: #fff;
                    margin-top: 8px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 5px;
                    text-shadow: 0 3px 6px rgba(0,0,0,0.9);
                }
            `}</style>

            <div className={`gift-container keep-animating ${step === 'shaking' ? 'shaking' : ''} ${step === 'opening' || step === 'finished' ? 'opening' : ''}`}>
                
                {/* 1. Back Face (Z-index: 1) */}
                <div className="gift-back"></div>

                {/* 2. Money (Z-index: 10) */}
                <div className="money-wrapper">
                    <div className="money-text">
                        {texts.currency}{amount}
                    </div>
                    <span className="money-label">Reward</span>
                </div>

                {/* 3. Front Face (Z-index: 20) */}
                <div className="gift-body"></div>

                {/* 4. Lid (Z-index: 30) */}
                <div className="gift-lid">
                    <div className="gift-bow"></div>
                </div>
            </div>
        </div>
    );
};

export default RewardAnimation;
