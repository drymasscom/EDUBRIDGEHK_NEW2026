import { useState, useCallback, useRef } from "react";
import { speakText, stopSpeech } from "../utils/speechUtils";

export type SpeechLang = "en-US" | "en-GB" | "zh-HK" | "zh-CN";

export interface UseSpeechReturn {
  isPlaying: boolean;
  speechSpeed: number;
  setSpeechSpeed: (speed: number) => void;
  speechLang: SpeechLang;
  setSpeechLang: (lang: SpeechLang) => void;
  speakingCharIndex: number | null;
  speakingCharLength: number | null;
  speak: (text: string, customLang?: SpeechLang, customSpeed?: number) => void;
  stop: () => void;
  toggleSpeak: (text: string, customLang?: SpeechLang) => void;
}

export function useSpeech(defaultLang: SpeechLang = "en-US", defaultSpeed: number = 1.0): UseSpeechReturn {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speechSpeed, setSpeechSpeed] = useState<number>(defaultSpeed);
  const [speechLang, setSpeechLang] = useState<SpeechLang>(defaultLang);
  const [speakingCharIndex, setSpeakingCharIndex] = useState<number | null>(null);
  const [speakingCharLength, setSpeakingCharLength] = useState<number | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    stopSpeech();
    setIsPlaying(false);
    setSpeakingCharIndex(null);
    setSpeakingCharLength(null);
  }, []);

  const speak = useCallback(
    (text: string, customLang?: SpeechLang, customSpeed?: number) => {
      stop();
      if (!text || !text.trim()) return;

      const langToUse = customLang || speechLang;
      const speedToUse = customSpeed !== undefined ? customSpeed : speechSpeed;

      setIsPlaying(true);

      utteranceRef.current = speakText(
        text,
        langToUse,
        speedToUse,
        () => {
          setIsPlaying(false);
          setSpeakingCharIndex(null);
          setSpeakingCharLength(null);
        },
        (charIndex, charLength) => {
          setSpeakingCharIndex(charIndex);
          if (charLength !== undefined) {
            setSpeakingCharLength(charLength);
          }
        }
      );
    },
    [speechLang, speechSpeed, stop]
  );

  const toggleSpeak = useCallback(
    (text: string, customLang?: SpeechLang) => {
      if (isPlaying) {
        stop();
      } else {
        speak(text, customLang);
      }
    },
    [isPlaying, speak, stop]
  );

  return {
    isPlaying,
    speechSpeed,
    setSpeechSpeed,
    speechLang,
    setSpeechLang,
    speakingCharIndex,
    speakingCharLength,
    speak,
    stop,
    toggleSpeak,
  };
}
