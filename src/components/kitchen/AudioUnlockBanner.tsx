import React from 'react';
import { Volume2, Bell, Sparkles, CheckCircle2 } from 'lucide-react';
import { playKitchenBell } from '../../lib/audioAlert';

interface AudioUnlockBannerProps {
  unlocked: boolean;
  onUnlock: () => void;
  lang: 'km' | 'en';
}

export const AudioUnlockBanner: React.FC<AudioUnlockBannerProps> = ({
  unlocked,
  onUnlock,
  lang,
}) => {
  if (unlocked) return null;

  const handleEnable = async () => {
    await playKitchenBell();
    onUnlock();
  };

  return (
    <div className="bg-amber-500 text-stone-950 px-4 py-3 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-top-4">
      <div className="flex items-center gap-3 text-left">
        <div className="w-9 h-9 rounded-xl bg-stone-950 text-amber-400 flex items-center justify-center shrink-0">
          <Volume2 className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h4 className="font-extrabold text-xs sm:text-sm font-khmer flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-stone-950 inline" />
            <span>
              {lang === 'km' 
                ? 'ចុចទីនេះដើម្បីបើកសំឡេងរោទិ៍ & សំឡេងខ្មែរ Gemini TTS' 
                : 'Click to Enable Kitchen Bell & Gemini Khmer TTS Voice'}
            </span>
          </h4>
          <p className="text-[11px] text-amber-950 font-medium">
            {lang === 'km' 
              ? 'កម្មវិធីរុករកទាមទារការចុចម្តងដើម្បីអនុញ្ញាតឱ្យចាក់សំឡេងពេលមានការកម្មង់ថ្មី' 
              : 'Browsers require a user click to allow background audio alerts when new orders arrive'}
          </p>
        </div>
      </div>

      <button
        id="enable-kitchen-audio-btn"
        onClick={handleEnable}
        className="shrink-0 bg-stone-950 hover:bg-black text-amber-400 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>{lang === 'km' ? 'បើកសំឡេងឥឡូវនេះ (Enable)' : 'Enable Kitchen Audio'}</span>
      </button>
    </div>
  );
};
