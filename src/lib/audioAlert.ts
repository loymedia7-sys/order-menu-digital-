/**
 * Kitchen Audio Alert Engine
 * - Crisp dual-chime kitchen bell synthesizer (no external assets needed)
 * - Gemini 24kHz PCM Audio player
 * - Pre-cached Khmer TTS table speech generator
 * - Web Speech Khmer fallback synthesizer
 */

import { getKhmerNumberWord, getKhmerOrderAnnouncement } from './khmerNumerals';

let sharedAudioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    sharedAudioCtx = new AudioContextClass();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
}

/**
 * Plays a bright, authentic 2-tone kitchen bell (Ding-Dong!)
 */
export function playKitchenBell(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // Tone 1: High crisp chime (1320 Hz - E6)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1320, now);
      osc1.frequency.exponentialRampToValueAtTime(1318, now + 0.6);

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.8, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Tone 2: Warm bell resonance (880 Hz - A5) + harmonic (1760 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      osc2.frequency.exponentialRampToValueAtTime(876, now + 0.9);

      gain2.gain.setValueAtTime(0.001, now + 0.12);
      gain2.gain.linearRampToValueAtTime(0.9, now + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.9);

      // Overtone shimmer
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(2640, now + 0.12);
      gain3.gain.setValueAtTime(0.001, now + 0.12);
      gain3.gain.linearRampToValueAtTime(0.3, now + 0.14);
      gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.12);
      osc3.stop(now + 0.5);

      setTimeout(resolve, 900);
    } catch (err) {
      console.warn('AudioContext bell error:', err);
      resolve();
    }
  });
}

/**
 * Plays base64 PCM audio data from Gemini TTS API (24000 Hz, 1-channel 16-bit PCM)
 */
export async function playPcmAudio(base64Data: string, sampleRate = 24000): Promise<void> {
  return new Promise((resolve) => {
    try {
      const ctx = getAudioContext();
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // 16-bit PCM to Float32
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const audioBuffer = ctx.createBuffer(1, float32Array.length, sampleRate);
      audioBuffer.copyToChannel(float32Array, 0);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      source.onended = () => {
        resolve();
      };

      source.start(0);
    } catch (err) {
      console.warn('Error playing PCM audio:', err);
      resolve();
    }
  });
}

/**
 * Converts any numeric sequences in a string to Khmer phonetic words for seamless TTS pronunciation
 */
export function formatKhmerSpeechText(text: string): string {
  return text.replace(/\b(\d+)\b/g, (_match, numStr) => {
    const num = parseInt(numStr, 10);
    return !isNaN(num) ? getKhmerNumberWord(num) : numStr;
  });
}

/**
 * Plays standard audio blob/URL or Web Speech as fallback
 */
export function playKhmerWebSpeech(text: string, tableNumber?: number): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      
      // Ensure all table numbers and numbers are pronounced in natural spoken Khmer words
      const cleanedText = tableNumber !== undefined && (!text || text.includes(String(tableNumber)))
        ? getKhmerOrderAnnouncement(tableNumber).naturalSentence
        : formatKhmerSpeechText(text);

      const utterance = new SpeechSynthesisUtterance(cleanedText);
      utterance.lang = 'km-KH'; // Khmer (Cambodia)
      utterance.rate = 0.95;
      utterance.pitch = 1.05;

      // Find Khmer voice if installed on system, or fallback to default
      const voices = window.speechSynthesis.getVoices();
      const khmerVoice = voices.find(v => v.lang.includes('km') || v.lang.includes('kh') || v.lang.toLowerCase().includes('cambodia'));
      if (khmerVoice) {
        utterance.voice = khmerVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      resolve();
    }
  });
}

/**
 * Execute the full Kitchen Alert sequence:
 * 1. Play kitchen bell sound
 * 2. Short pause (250ms)
 * 3. Play Gemini Khmer TTS audio ("ទទួលបានការកម្មង់ថ្មីពីតុលេខ {tableNumber}")
 */
export async function executeKitchenAlertSequence(
  tableNumber: number,
  geminiBase64Audio?: string,
  khmerText?: string
): Promise<void> {
  // Step 1: Bell sound
  await playKitchenBell();

  await new Promise(r => setTimeout(r, 250));

  // Step 2: Voice alert in authentic Khmer for ALL table numbers (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20...)
  if (geminiBase64Audio) {
    await playPcmAudio(geminiBase64Audio);
  } else {
    const textToSpeak = khmerText || getKhmerOrderAnnouncement(tableNumber).naturalSentence;
    await playKhmerWebSpeech(textToSpeak, tableNumber);
  }
}
