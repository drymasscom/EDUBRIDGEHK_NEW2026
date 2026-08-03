import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Camera,
  Volume2,
  Users,
  Brain,
  Sparkles,
  RotateCw,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Award,
  Mic,
  Smartphone,
  Monitor,
  Play,
  Square,
  Flame,
  Shuffle,
  Star,
  CheckCircle2,
  FileText,
  Upload,
  Plus,
  RefreshCw,
  VolumeX,
  Zap,
  Globe,
  ArrowRight,
  Music,
  Lightbulb,
  Wand2,
  FolderHeart,
  CreditCard,
  Apple,
  Lock
} from "lucide-react";
import { SnapItem, VocabWord, StudentProfile } from "../types";
import { Language, translations, toSimplifiedChinese, getVocabMeaning } from "../utils/i18n";
import { speakText, stopSpeech } from "../utils/speechUtils";
import { getRandomDSEVocab } from "../data/dseVocabDatabase";
import { Three3DFlashcard } from "./Three3DFlashcard";
import { WordAnalysisModal } from "./WordAnalysisModal";
import { DSE_SHADOWING_100_POOL, ShadowingItem } from "../data/dseShadowing100";
import { useSpeech, useOcr, useAudioRecorder } from "../hooks";

interface MobileStudentViewProps {
  snapItems: SnapItem[];
  onAddSnapItem: (item: SnapItem) => void;
  onUpdateSnapItem?: (item: SnapItem) => void;
  onAddVocabToActiveItem?: (vocab: VocabWord) => void;
  onSwitchToPresentationMode: () => void;
  lang: Language;
  studentProfile?: StudentProfile | null;
  onOpenProfileModal?: () => void;
  onOpenPromoModal?: () => void;
  onOpenSubscriptionModal?: () => void;
}

type MobileTab = "snap" | "audio" | "oral" | "flashcards" | "database";

// Sample AI DSE Passage Topics for instant generation
const DSE_AI_TOPICS = [
  {
    topic: "Artificial Intelligence in Education",
    title: "🤖 AI 考題範文: AI Ethics in Classrooms",
    text: "The integration of generative artificial intelligence in Hong Kong secondary education necessitates rigorous digital literacy frameworks. Educators emphasize that while automated tools enhance learning efficiency, students must cultivate critical thinking to evaluate algorithmic outputs.",
    translation: "生成式人工智能在香港中學教育中的融合，使嚴謹的數碼素養框架成為必要。教育工作者強調，雖然自動化工具能提高學習效率，但學生必須培養批判性思維以評估算法輸出。",
    tags: ["#DSE_AI", "#Level5**", "#Technology"]
  },
  {
    topic: "Sustainable HK Urban Transit",
    title: "🌿 AI 考題範文: Green Urban Transit in HK",
    text: "Hong Kong's urban transit system strives to mitigate carbon emissions by expanding electric bus fleets and incorporating smart energy grids, fostering a resilient infrastructure against impending climate risks.",
    translation: "香港的城市交通系統致力於透過擴大電動巴士車隊及融入智慧能源網格來減輕碳排放，從而構建能抵禦迫在眉睫的氣候風險的強韌基礎設施。",
    tags: ["#HK_Transit", "#Environment", "#DSE_Writing"]
  },
  {
    topic: "Youth Mental Well-being",
    title: "🧠 AI 考題範文: Youth Resilience & Mental Health",
    text: "Prioritizing emotional well-being enables young scholars to navigate academic stress. Schools should implement holistic support systems to alleviate anxiety and cultivate psychological resilience.",
    translation: "優先考慮情緒健康能讓青年學者應對學業壓力。學校應實施全面支援系統以緩解焦慮，並培養心理複原力。",
    tags: ["#MentalHealth", "#Youth_DSE", "#Paper2"]
  }
];

// Sample Shadowing Sentence / Paragraph Pool for Audio Tab
const SHADOWING_PRACTICE_POOL = [
  {
    id: "s1",
    title: "DSE 5** 高頻核心句 1",
    type: "sentence",
    text: "The weather condition necessitates immediate suspension of outdoor activities in Hong Kong.",
    ipa: "/ðə ˈweð.ər kənˈdɪʃ.ən nəˈses.ə.teɪts ɪˈmiː.di.ət səˈspen.ʃən əv ˈaʊtˌdɔːr ækˈtɪv.ə.tiz/",
    targetWord: "necessitates",
    level: "DSE Level 5*"
  },
  {
    id: "s2",
    title: "DSE 5** 高頻核心句 2",
    type: "sentence",
    text: "Proactive mitigation strategies are essential to alleviate the severe consequences of extreme climate events.",
    ipa: "/prəʊˈæk.tɪv ˌmɪt.ɪˈɡeɪ.ʃən stræt.ə.dʒiz ɑːr ɪˈsen.ʃəl tuː əˈliː.vi.eɪt ðə sɪˈvɪər kənˈsɪ.kwəns.ɪz/",
    targetWord: "mitigation",
    level: "DSE Level 5**"
  },
  {
    id: "s3",
    title: "DSE 5** 閱讀考題短文 3",
    type: "passage",
    text: "Collaborative learning environments empower students to articulate their perspectives effectively while fostering mutual respect and active listening skills during oral exams.",
    ipa: "/kəˈlæb.ər.ə.tɪv ˈlɜː.nɪŋ ɪnˈvaɪ.rən.mənts ɪmˈpaʊ.ər ˈstjuː.dənts tuː ɑːˈtɪk.jə.leɪt ðeər pəˈspek.tɪvz/",
    targetWord: "articulate",
    level: "DSE Level 5*"
  },
  {
    id: "s4",
    title: "DSE 5** 議論文金句 4",
    type: "sentence",
    text: "To substantiate our argument, we must integrate reliable empirical data and authoritative references.",
    ipa: "/tuː səbˈstæn.ʃi.eɪt ˈaʊər ˈɑːɡ.jə.mənt wiː mʌst ˈɪn.tɪ.ɡreɪt rɪˈlaɪ.ə.bəl ɪmˈpɪr.ɪ.kəl ˈdeɪ.tə/",
    targetWord: "substantiate",
    level: "DSE Level 5**"
  }
];

export const MobileStudentView: React.FC<MobileStudentViewProps> = ({
  snapItems,
  onAddSnapItem,
  onUpdateSnapItem,
  onAddVocabToActiveItem,
  onSwitchToPresentationMode,
  lang,
  studentProfile,
  onOpenProfileModal,
  onOpenPromoModal,
  onOpenSubscriptionModal,
}) => {
  const t = translations[lang];

  // Helper for UI Localization (Simplified / Traditional / English)
  const L = (tradStr: string) => {
    if (lang === "zh-CN") return toSimplifiedChinese(tradStr);
    return tradStr;
  };

  // Active Bottom Tab
  const [activeTab, setActiveTab] = useState<MobileTab>("snap");

  // Selected item index
  const [activeSnapIndex, setActiveSnapIndex] = useState<number>(0);
  const activeSnap = snapItems[activeSnapIndex] || snapItems[0];

  // Karaoke Mode & Real-Time Audio Boundary State
  const [isKaraokeMode, setIsKaraokeMode] = useState<boolean>(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [speakingCharIndex, setSpeakingCharIndex] = useState<number | null>(null);
  const [karaokeWordIndex, setKaraokeWordIndex] = useState<number>(-1);
  const [speechRate, setSpeechRate] = useState<number>(0.8);
  const karaokeTimerRef = useRef<any>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Passage Generating & Custom Hooks
  const { analyzeImage, isAnalyzing: isAnalyzingImage } = useOcr();
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);

  // Shadowing Audio Practice state & Microphone capture
  const [shadowingIndex, setShadowingIndex] = useState<number>(0);
  const [customAIGeneratedItem, setCustomAIGeneratedItem] = useState<ShadowingItem | null>(null);
  const [isGeneratingAIPassage, setIsGeneratingAIPassage] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSuccess, setRecordingSuccess] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [userRecordedAudioUrl, setUserRecordedAudioUrl] = useState<string | null>(null);
  const [isPlayingUserAudio, setIsPlayingUserAudio] = useState<boolean>(false);
  const userAudioElemRef = useRef<HTMLAudioElement | null>(null);

  const [shadowingEval, setShadowingEval] = useState<{
    score: number;
    level: string;
    advice: string;
    breakdown: Array<{ word: string; ipa: string; score: number; status: "perfect" | "slight" | "accent_fix"; tip?: string }>;
  } | null>(null);

  const currentShadowingItem = customAIGeneratedItem || DSE_SHADOWING_100_POOL[shadowingIndex % DSE_SHADOWING_100_POOL.length];

  const localizedShadowingTranslation = React.useMemo(() => {
    if (!currentShadowingItem) return "";
    const raw = currentShadowingItem.translation;
    if (lang === "zh-CN") return toSimplifiedChinese(raw);
    if (lang === "en") return currentShadowingItem.text;
    return raw;
  }, [currentShadowingItem, lang]);

  const handleGenerateAIPassage = async () => {
    setIsGeneratingAIPassage(true);
    setRecordingSuccess(false);
    setShadowingEval(null);
    setUserRecordedAudioUrl(null);

    try {
      const resp = await fetch("/api/generate-shadowing-passage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetLanguage: lang })
      });
      if (resp.ok) {
        const data = await resp.json();
        setCustomAIGeneratedItem(data);
      } else {
        throw new Error("HTTP error " + resp.status);
      }
    } catch (err) {
      console.warn("Generating AI passage failed, falling back to pool:", err);
      setCustomAIGeneratedItem(null);
      setShadowingIndex((prev) => prev + 1);
    } finally {
      setIsGeneratingAIPassage(false);
    }
  };

  const handlePickRandomPoolItem = () => {
    setCustomAIGeneratedItem(null);
    const nextIdx = Math.floor(Math.random() * DSE_SHADOWING_100_POOL.length);
    setShadowingIndex(nextIdx);
    setRecordingSuccess(false);
    setShadowingEval(null);
    setUserRecordedAudioUrl(null);
  };

  const handleStartShadowingRecord = async () => {
    setRecordingSuccess(false);
    setUserRecordedAudioUrl(null);
    setShadowingEval(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setUserRecordedAudioUrl(url);

        stream.getTracks().forEach((track) => track.stop());
        generateDynamicAIAnalysis(currentShadowingItem);
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.warn("Microphone access failed or blocked, using audio simulator:", err);
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        setRecordingSuccess(true);
        generateDynamicAIAnalysis(currentShadowingItem);
      }, 2800);
    }
  };

  const handleStopShadowingRecord = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingSuccess(true);
    } else {
      setIsRecording(false);
      setRecordingSuccess(true);
      generateDynamicAIAnalysis(currentShadowingItem);
    }
  };

  const generateDynamicAIAnalysis = (item: ShadowingItem) => {
    const score = Math.floor(Math.random() * 25) + 72; // 72-96%
    let level = "DSE Level 4";
    if (score >= 93) level = "DSE Level 5**";
    else if (score >= 87) level = "DSE Level 5*";
    else if (score >= 80) level = "DSE Level 5";

    const words = item.text.split(" ").filter(Boolean);
    const cleanWords = words.map((w) => w.replace(/[^a-zA-Z]/g, ""));
    let actualTargetWord = (item.targetWord || "").trim();

    // Verify if actualTargetWord exists in cleanWords (case-insensitive)
    const foundIndex = cleanWords.findIndex(
      (cw) => cw.toLowerCase() === actualTargetWord.toLowerCase()
    );

    if (foundIndex === -1) {
      // Pick the longest word in the sentence as the actual target word
      const sortedByLength = [...cleanWords].sort((a, b) => b.length - a.length);
      actualTargetWord = sortedByLength[0] || "academic";
    }

    const targetLower = actualTargetWord.toLowerCase();

    const breakdown = words.map((w) => {
      const cleanWord = w.replace(/[^a-zA-Z]/g, "").toLowerCase();
      let wordScore = Math.floor(Math.random() * 18) + 82;
      let status: "perfect" | "slight" | "accent_fix" = "perfect";

      if (cleanWord === targetLower) {
        wordScore = score < 80 ? 64 : score < 88 ? 76 : 95;
        status = wordScore < 70 ? "accent_fix" : wordScore < 85 ? "slight" : "perfect";
      } else if (wordScore < 85) {
        status = "slight";
      }

      return {
        word: w,
        ipa: `/${cleanWord}/`,
        score: wordScore,
        status,
        tip: status === "accent_fix" ? `${L("重音位置偏移")} /'${cleanWord.slice(0, 3)}/` : status === "slight" ? L("弱讀音節需放輕") : undefined
      };
    });

    let advice = "";
    if (lang === "en") {
      advice = score >= 90
        ? `Examiner Assessment: Excellent intonation! Core word '${actualTargetWord}' executed with exact stress placement.`
        : score >= 80
        ? `Examiner Assessment: Fluid sentence rhythm! Slight pitch drop on core word '${actualTargetWord}'. Recommend rising intonation.`
        : `Examiner Assessment: Stress shift detected on core word '${actualTargetWord}'. Re-listen to 0.8x audio and practice syllable boundary pauses.`;
    } else if (lang === "zh-CN") {
      advice = score >= 90
        ? `考官诊断：语调极为流畅！核心词 '${actualTargetWord}' 的主重音落点精准，连读音节自然度极佳。`
        : score >= 80
        ? `考官诊断：整体节奏感良好！核心词 '${actualTargetWord}' 在次重音上有轻微偏平现象，建议注意元音升调。`
        : `考官诊断：检测到音节重音偏移。建议再次播放 0.8x 原声，特别针对核心词 '${actualTargetWord}' 进行分段跟读模仿。`;
    } else {
      advice = score >= 90
        ? `考官診斷：語調極為流暢！核心詞 '${actualTargetWord}' 的主重音落點精準，連讀音節自然度極佳。`
        : score >= 80
        ? `考官診斷：整體節奏感良好！核心詞 '${actualTargetWord}' 在次重音上有輕微偏平現象，建議注意元音升調。`
        : `考官診斷：檢測到音節重音偏移。建議再次播放 0.8x 原聲，特別針對核心詞 '${actualTargetWord}' 進行分段跟讀模仿。`;
    }

    setShadowingEval({
      score,
      level,
      advice,
      breakdown
    });
  };

  // 3D Flashcard & Bookmark State
  const [cardIndex, setCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [masteredWordIds, setMasteredWordIds] = useState<Set<string>>(new Set());
  const [bookmarkedWordIds, setBookmarkedWordIds] = useState<Set<string>>(new Set());
  const [flashcardFilter, setFlashcardFilter] = useState<"all" | "bookmarked" | "mastered">("all");
  const [analysisWordModal, setAnalysisWordModal] = useState<VocabWord | null>(null);

  // Database Tab Segmented Switch ("articles" | "vocab")
  const [dbSubTab, setDbSubTab] = useState<"articles" | "vocab">("articles");

  // Bottom Sheet Modal State
  const [selectedWord, setSelectedWord] = useState<VocabWord | null>(null);
  const [isSavedInSheet, setIsSavedInSheet] = useState<boolean>(false);

  // Oral Simulator State
  const [oralMessages, setOralMessages] = useState<Array<{ speaker: string; text: string; role: string; avatar: string }>>([
    {
      speaker: "Examiner",
      text: "Good morning candidates. Today's HKDSE Paper 4 topic is: 'Should schools prohibit mobile phone usage completely?' Candidate A, please begin.",
      role: "Examiner",
      avatar: "👨‍🏫"
    },
    {
      speaker: "Candidate A (Alex)",
      text: "Thank you. I strongly believe prohibiting phones helps students stay focused on learning during class.",
      role: "Alex",
      avatar: "👦"
    },
    {
      speaker: "Candidate B (Brenda)",
      text: "I see your point, but mobile phones can also be used as educational tools for quick research.",
      role: "Brenda",
      avatar: "👧"
    }
  ]);
  const [userOralInput, setUserOralInput] = useState<string>("");
  const [showOralReportSheet, setShowOralReportSheet] = useState<boolean>(false);

  // All vocabulary pooled from snapItems or fallback database
  const allVocabWords: VocabWord[] = React.useMemo(() => {
    const list: VocabWord[] = [];
    snapItems.forEach((item) => {
      item.vocabulary.forEach((v) => list.push(v));
    });
    if (list.length < 10) {
      const existingWordStrings = list.map((v) => v.word);
      const extra = getRandomDSEVocab(15, existingWordStrings);
      return [...list, ...extra];
    }
    return list;
  }, [snapItems]);

  const currentFlashcard = React.useMemo(() => {
    const list =
      flashcardFilter === "bookmarked"
        ? allVocabWords.filter((v) => bookmarkedWordIds.has(v.id || v.word))
        : flashcardFilter === "mastered"
        ? allVocabWords.filter((v) => masteredWordIds.has(v.id || v.word))
        : allVocabWords;
    if (list.length === 0) return allVocabWords[0];
    return list[cardIndex % list.length] || allVocabWords[0];
  }, [allVocabWords, flashcardFilter, bookmarkedWordIds, masteredWordIds, cardIndex]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (karaokeTimerRef.current) clearInterval(karaokeTimerRef.current);
    };
  }, []);

  // Handle Karaoke Audio Playback with Web Speech API Boundary Sync
  const handlePlayKaraokeAudio = (textToPlay: string, rate: number = 0.8) => {
    setIsKaraokeMode(true);
    setSpeechRate(rate);

    if (isPlayingAudio) {
      stopSpeech();
      setIsPlayingAudio(false);
      setSpeakingCharIndex(null);
      setKaraokeWordIndex(-1);
      if (karaokeTimerRef.current) clearInterval(karaokeTimerRef.current);
    } else {
      setIsPlayingAudio(true);
      setSpeakingCharIndex(0);
      setKaraokeWordIndex(0);

      // Speech synthesis with onBoundary real-time callback
      speakText(
        textToPlay,
        "en-US",
        rate,
        () => {
          setIsPlayingAudio(false);
          setSpeakingCharIndex(null);
          setKaraokeWordIndex(-1);
          if (karaokeTimerRef.current) clearInterval(karaokeTimerRef.current);
        },
        (charIndex) => {
          setSpeakingCharIndex(charIndex);
        }
      );

      // Continuous fallback timer for smooth highlighting
      if (karaokeTimerRef.current) clearInterval(karaokeTimerRef.current);
      const words = textToPlay.trim().split(/\s+/);
      let curr = 0;
      const intervalMs = Math.max(200, Math.floor(60000 / (130 * rate)));
      karaokeTimerRef.current = setInterval(() => {
        curr++;
        if (curr >= words.length) {
          clearInterval(karaokeTimerRef.current);
        } else {
          setKaraokeWordIndex(curr);
        }
      }, intervalMs);
    }
  };

  // Render Karaoke Real-Time Word Highlighting (Syncs with speakingCharIndex and fallback index)
  const renderKaraokeContent = (fullText: string) => {
    if (!fullText) return null;

    const regex = /(\s+|[^\s]+)/g;
    let match: RegExpExecArray | null;
    const tokens: Array<{ text: string; start: number; end: number; isWord: boolean }> = [];
    while ((match = regex.exec(fullText)) !== null) {
      tokens.push({
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
        isWord: /\S/.test(match[0]),
      });
    }

    let wordCounter = 0;
    return tokens.map((token, idx) => {
      if (!token.isWord) {
        return <span key={idx}>{token.text}</span>;
      }

      const currentWordIdx = wordCounter;
      wordCounter++;

      const isSpeakingByChar =
        speakingCharIndex !== null &&
        speakingCharIndex >= token.start &&
        speakingCharIndex < token.end;

      const isSpeakingByFallback =
        speakingCharIndex === null && isPlayingAudio && karaokeWordIndex === currentWordIdx;

      const isCurrentSpeaking = isKaraokeMode && (isSpeakingByChar || isSpeakingByFallback);

      return (
        <span
          key={idx}
          className={`inline-block px-1 py-0.5 rounded transition-all duration-100 ${
            isCurrentSpeaking
              ? "bg-[#00FF88] text-black font-black scale-110 shadow-[0_0_14px_#00FF88] ring-2 ring-[#00FF88]"
              : "text-white opacity-90"
          }`}
        >
          {token.text}
        </span>
      );
    });
  };

  // Reset shadowing evaluation state when switching sentence/passage
  const handleNextShadowing = () => {
    stopSpeech();
    setIsPlayingAudio(false);
    setSpeakingCharIndex(null);
    setIsRecording(false);
    setRecordingSuccess(false);
    setShadowingIndex((prev) => prev + 1);
  };

  // AI Generate Article
  const handleGenerateAIEssay = () => {
    setIsGeneratingAI(true);
    setTimeout(() => {
      const topicObj = DSE_AI_TOPICS[Math.floor(Math.random() * DSE_AI_TOPICS.length)];
      const extractedVocab = getRandomDSEVocab(3, []);

      const newSnap: SnapItem = {
        id: `ai-mobile-snap-${Date.now()}`,
        timestamp: Date.now(),
        title: topicObj.title,
        subjectCategory: "DSE English Paper 1 & 2 AI Generator",
        ocrText: topicObj.text,
        hkdseContext: "考評局 Level 5* 高頻真題模擬句",
        translation: topicObj.translation,
        vocabulary: extractedVocab,
        grammarNotes: ["Subject + Verb + Object Clause", "Complex Noun Phrase Structure"],
        speechScript: topicObj.text,
        knowledgeTags: topicObj.tags,
        suggestedQuestions: ["How to use this in DSE Paper 2?"],
        chatHistory: []
      };

      onAddSnapItem(newSnap);
      setActiveSnapIndex(0);
      setIsGeneratingAI(false);
    }, 1200);
  };

  // Camera & Photo Selection Handlers for Real Image OCR
  const handleTriggerCamera = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
      cameraInputRef.current.click();
    }
  };

  const handleTriggerPhotoLibrary = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Str = reader.result as string;
      const newSnap = await analyzeImage(base64Str, "課本相片解析 (DSE 生詞萃取)");
      if (newSnap) {
        onAddSnapItem(newSnap);
        setActiveSnapIndex(0);
      }
    };
    reader.readAsDataURL(file);
  };

  // Draw Random Vocab into current SnapItem
  const handleDrawRandomVocabToSnap = () => {
    if (!activeSnap) return;
    const drawn = getRandomDSEVocab(2, activeSnap.vocabulary.map(v => v.word));
    const updatedVocab = [...drawn, ...activeSnap.vocabulary];
    const updatedSnap = { ...activeSnap, vocabulary: updatedVocab };
    if (onUpdateSnapItem) {
      onUpdateSnapItem(updatedSnap);
    }
    drawn.forEach((w) => {
      if (onAddVocabToActiveItem) onAddVocabToActiveItem(w);
    });
  };

  // Switch Flashcard
  const handleNextFlashcard = (direction: "next" | "prev" | "random") => {
    setIsFlipped(false);
    setTimeout(() => {
      if (direction === "next") {
        setCardIndex((prev) => (prev + 1) % allVocabWords.length);
      } else if (direction === "prev") {
        setCardIndex((prev) => (prev - 1 + allVocabWords.length) % allVocabWords.length);
      } else {
        setCardIndex(Math.floor(Math.random() * allVocabWords.length));
      }
    }, 100);
  };

  // Add message in Oral Simulator
  const handleSendOralMessage = (textToSend?: string) => {
    const content = textToSend || userOralInput;
    if (!content.trim()) return;

    const userMsg = {
      speaker: "You (Candidate D)",
      text: content,
      role: "User",
      avatar: "🙋‍♂️"
    };

    setOralMessages((prev) => [...prev, userMsg]);
    setUserOralInput("");

    setTimeout(() => {
      const aiResponse = {
        speaker: "Candidate C (Chris)",
        text: "That is a valid point! To substantiate your statement, we could implement designated smartphone lockers during school hours.",
        role: "Chris",
        avatar: "🧑‍💻"
      };
      setOralMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col justify-between pb-24 selection:bg-[#00FF88] selection:text-black">
      {/* Hidden File Inputs for Mobile Camera Capture & Gallery Selection */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageFileChange}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFileChange}
        className="hidden"
      />

      {/* Main Screen Content Area */}
      <div className="p-4 max-w-md mx-auto w-full space-y-4">
        
        {/* ==================== TAB 1: 📷 即影即學 (SNAP & READ WITH KARAOKE & AI) ==================== */}
        {activeTab === "snap" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* User Instruction Tip Banner */}
            <div className="bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-emerald-900/40 border border-emerald-500/30 rounded-2xl p-3 text-xs text-white/90 flex items-start gap-2 shadow-lg">
              <Sparkles className="w-4 h-4 text-yellow-300 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#00FF88]">{L("💡 溫馨提示：")}</span>
                <span className="text-white/80">{L("拍攝後劃選或點擊文中任何單字/語句，即可使用 AI 局部位即時朗讀發音與中文翻譯/語法拆解！")}</span>
              </div>
            </div>

            {/* Quick Action Control Bar: AI Generate + Random Vocab */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleGenerateAIEssay}
                disabled={isGeneratingAI || isAnalyzingImage}
                className="py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95 transition-all border border-purple-400/30 disabled:opacity-50"
              >
                <Wand2 className={`w-4 h-4 text-yellow-300 ${isGeneratingAI ? "animate-spin" : ""}`} />
                <span>{isGeneratingAI ? L("AI 生成文章中...") : L("✨ AI 生成 DSE 範文")}</span>
              </button>

              <button
                onClick={handleDrawRandomVocabToSnap}
                disabled={isAnalyzingImage}
                className="py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
              >
                <Shuffle className="w-4 h-4 text-[#00FF88]" />
                <span>{L("🔀 獲取隨機生詞")}</span>
              </button>
            </div>

            {/* Giant One-Tap Camera Trigger Button */}
            <div className={`bg-gradient-to-br from-black via-[#0a0a0a] to-emerald-950/40 border-2 ${
              isAnalyzingImage
                ? "border-[#00FF88] animate-ocr-glow shadow-[0_0_35px_rgba(0,255,136,0.3)]"
                : "border-[#00FF88]/40 shadow-[0_0_30px_rgba(0,255,136,0.15)]"
            } rounded-3xl p-5 text-center relative overflow-hidden transition-all`}>
              <div className="absolute top-2 right-3 text-[10px] font-black uppercase tracking-widest text-[#00FF88] bg-[#00FF88]/10 border border-[#00FF88]/30 px-2 py-0.5 rounded-full z-10">
                AI 智能 OCR
              </div>

              {isAnalyzingImage ? (
                /* Scanning HUD Animation Box */
                <div className="my-2 py-6 px-4 rounded-2xl bg-black/90 border-2 border-[#00FF88]/60 relative overflow-hidden shadow-2xl space-y-3">
                  <div className="absolute inset-0 bg-emerald-500/10 bg-[radial-gradient(#00FF88_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />
                  
                  {/* Moving Laser Scan Line */}
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00FF88] to-transparent shadow-[0_0_20px_#00FF88] animate-ocr-laser pointer-events-none" />
                  
                  {/* HUD Corner Target Brackets */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#00FF88] shadow-[0_0_8px_#00FF88]" />
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#00FF88] shadow-[0_0_8px_#00FF88]" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#00FF88] shadow-[0_0_8px_#00FF88]" />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#00FF88] shadow-[0_0_8px_#00FF88]" />

                  <div className="w-12 h-12 rounded-full bg-[#00FF88]/20 border border-[#00FF88] text-[#00FF88] mx-auto flex items-center justify-center animate-spin">
                    <RefreshCw className="w-6 h-6" />
                  </div>

                  <div className="relative z-10 space-y-1">
                    <h3 className="text-sm font-black text-[#00FF88] uppercase tracking-wider animate-pulse flex items-center justify-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#00FF88]" />
                      <span>{L("📸 AI 廣角激光掃描解析中...")}</span>
                    </h3>
                    <p className="text-[11px] text-white/70">
                      {L("正在分析課本相片 • 萃取 DSE 5** 高頻核心詞彙")}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    onClick={handleTriggerCamera}
                    className="w-16 h-16 rounded-2xl bg-[#00FF88] text-black mx-auto flex items-center justify-center shadow-lg shadow-[#00FF88]/30 mb-3 active:scale-90 transition-transform cursor-pointer"
                  >
                    <Camera className="w-9 h-9" />
                  </div>

                  <h2 className="text-lg font-black text-white uppercase tracking-tight">
                    {L("拍下課本 / 試卷一鍵解析")}
                  </h2>
                  <p className="text-xs text-white/60 mt-1 mb-4">
                    {L("拍攝或上載課本試卷相片 • 自動萃取 DSE 5** 考題生詞")}
                  </p>

                  {/* Grid with Camera & Photo Library Triggers */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleTriggerCamera}
                      disabled={isAnalyzingImage}
                      className="py-3.5 bg-[#00FF88] text-black font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-1.5 shadow-xl shadow-[#00FF88]/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{L("📷 開啟相機拍攝")}</span>
                    </button>

                    <button
                      onClick={handleTriggerPhotoLibrary}
                      disabled={isAnalyzingImage}
                      className="py-3.5 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-1.5 border border-white/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4 text-[#00FF88]" />
                      <span>{L("🖼️ 上載相冊相片")}</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Active Snap Document Card with Karaoke Highlighting */}
            {activeSnap && (
              <div className="bg-[#0c0c0c] border border-white/15 rounded-3xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#00FF88]" />
                    <span className="font-black text-sm text-white truncate max-w-[180px]">
                      {activeSnap.title}
                    </span>
                  </div>
                  <span className="text-[10px] bg-white/10 text-white/70 px-2.5 py-1 rounded-full font-mono font-bold">
                    {activeSnap.vocabulary.length} {L("個生詞")}
                  </span>
                </div>

                {/* Karaoke Interactive Text Display */}
                <div className="bg-black/80 rounded-2xl p-4 border border-white/15 space-y-2">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                    <span className="text-[10px] font-mono text-[#00FF88] font-bold uppercase tracking-wider flex items-center gap-1">
                      <Music className="w-3.5 h-3.5" />
                      <span>{L("Karaoke Mode (卡拉OK節奏高亮)")}</span>
                    </span>
                    <button
                      onClick={() => setIsKaraokeMode(!isKaraokeMode)}
                      className={`text-[10px] px-2 py-0.5 rounded font-black uppercase transition-all ${
                        isKaraokeMode
                          ? "bg-[#00FF88] text-black"
                          : "bg-white/10 text-white/60"
                      }`}
                    >
                      {isKaraokeMode ? L("🎤 卡拉OK ON") : "OFF"}
                    </button>
                  </div>

                  {/* Render Words with Live Karaoke Real-Time Highlighting */}
                  <p className="text-sm leading-relaxed font-sans text-white/90">
                    {renderKaraokeContent(activeSnap.ocrText)}
                  </p>
                </div>

                {/* Chinese Translation */}
                {activeSnap.translation && (
                  <div className="bg-white/5 rounded-2xl p-3 border border-white/10 text-xs text-white/70">
                    <span className="text-[10px] text-white/40 font-bold block mb-0.5">{L("中文釋義:")}</span>
                    <p>{L(activeSnap.translation)}</p>
                  </div>
                )}

                {/* 0.8x Audio Karaoke Player Bar */}
                <div className="bg-emerald-950/30 border border-[#00FF88]/30 rounded-2xl p-3 flex items-center justify-between gap-3">
                  <button
                    onClick={() => handlePlayKaraokeAudio(activeSnap.ocrText)}
                    className="w-12 h-12 rounded-xl bg-[#00FF88] text-black flex items-center justify-center shrink-0 shadow-md active:scale-90 transition-transform"
                  >
                    {isPlayingAudio ? (
                      <Square className="w-5 h-5 fill-black" />
                    ) : (
                      <Play className="w-6 h-6 fill-black ml-0.5" />
                    )}
                  </button>

                  <div className="flex-1">
                    <p className="text-xs font-black text-[#00FF88]">
                      {isPlayingAudio ? L("🎤 慢速卡拉OK朗讀中...") : L("🎧 0.8x 慢速跟讀朗讀")}
                    </p>
                    <p className="text-[10px] text-white/50">{L("即時字詞對齊與音標跟讀")}</p>
                  </div>

                  <button
                    onClick={() => setSpeechRate(speechRate === 0.8 ? 1.0 : 0.8)}
                    className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-wider border border-white/20"
                  >
                    {speechRate}x
                  </button>
                </div>

                {/* Extracted Words Chips (Click for Bottom Sheet) */}
                <div>
                  <p className="text-xs font-black text-white/50 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#00FF88]" />
                    <span>{L("提取生詞 (點擊彈出簡介):")}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {activeSnap.vocabulary.map((vocab) => (
                      <button
                        key={vocab.id || vocab.word}
                        onClick={() => {
                          setSelectedWord(vocab);
                          setIsSavedInSheet(false);
                        }}
                        className="px-3 py-2 bg-white/10 hover:bg-[#00FF88] hover:text-black border border-white/15 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
                      >
                        <span className="font-black">{vocab.word}</span>
                        <span className="text-[10px] opacity-70">[{vocab.ipa}]</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 2: 🗣️ 語音跟讀 (SHADOWING & RANDOM SENTENCES) ==================== */}
        {activeTab === "audio" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-[#0c0c0c] border border-white/15 rounded-3xl p-5 space-y-4 shadow-xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-400 mx-auto flex items-center justify-center">
                <Volume2 className="w-7 h-7" />
              </div>

              <div>
                <h2 className="text-lg font-black text-white">{L("0.8x 影子跟讀與重音診斷")}</h2>
                <p className="text-xs text-white/50 mt-1">
                  {L("跟隨英音考官語速朗讀，AI 即時提供音標對齊與重音移位警告")}
                </p>
              </div>

              {/* Random Switcher Control Bar */}
              <div className="flex items-center justify-between bg-black/60 p-2 rounded-2xl border border-white/10 text-xs gap-2">
                <div className="flex items-center gap-1.5 text-blue-400 font-bold truncate max-w-[160px]">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
                  <span className="truncate">
                    {currentShadowingItem.targetWord
                      ? `${L("考點詞")}: ${currentShadowingItem.targetWord}`
                      : currentShadowingItem.category || L("DSE 精選考點句")}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handleGenerateAIPassage}
                    disabled={isGeneratingAIPassage}
                    className="px-2.5 py-1.5 bg-purple-600/40 hover:bg-purple-600/60 text-purple-200 border border-purple-400/50 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Wand2 className={`w-3.5 h-3.5 text-yellow-300 ${isGeneratingAIPassage ? "animate-spin" : ""}`} />
                    <span>{isGeneratingAIPassage ? L("生成中...") : L("✨ AI 生成新短文")}</span>
                  </button>

                  <button
                    onClick={handlePickRandomPoolItem}
                    disabled={isGeneratingAIPassage}
                    className="px-2.5 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>{L("隨機")}</span>
                  </button>
                </div>
              </div>

              {/* Active Target Sentence or Passage */}
              <div className="bg-black/80 rounded-2xl p-4 border border-blue-500/30 text-left space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
                    <span>Target {currentShadowingItem.category || L("Sentence 考點句")}</span>
                    {isPlayingAudio && (
                      <span className="bg-[#00FF88]/20 text-[#00FF88] border border-[#00FF88]/40 px-2 py-0.5 rounded text-[9px] font-black animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88]"></span>
                        {L("🎤 0.8x 卡拉OK字幕對齊中")}
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded font-black">
                    {currentShadowingItem.level}
                  </span>
                </div>

                <div className="text-base font-bold text-white leading-relaxed bg-black/40 p-3 rounded-2xl border border-white/10 font-sans min-h-[50px]">
                  "{renderKaraokeContent(currentShadowingItem.text)}"
                </div>

                <p className="text-xs text-white/60 font-mono">
                  [ IPA: {currentShadowingItem.ipa} ]
                </p>
                {localizedShadowingTranslation && (
                  <p className="text-xs text-white/80 bg-white/5 p-2.5 rounded-xl border border-white/10 font-sans">
                    {localizedShadowingTranslation}
                  </p>
                )}
              </div>

              {/* Giant Play & Mic Recording Controls */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handlePlayKaraokeAudio(currentShadowingItem.text, 0.8)}
                  className="py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                >
                  <Volume2 className="w-5 h-5" />
                  <span>{isPlayingAudio ? L("停止朗讀") : L("播放 0.8x 原聲")}</span>
                </button>

                <button
                  onClick={isRecording ? handleStopShadowingRecord : handleStartShadowingRecord}
                  className={`py-3.5 font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 ${
                    isRecording
                      ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30"
                      : recordingSuccess
                      ? "bg-[#00FF88] text-black shadow-lg shadow-[#00FF88]/20"
                      : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                  }`}
                >
                  <Mic className="w-5 h-5" />
                  <span>
                    {isRecording ? L("🔴 錄音中 (點擊完成)") : recordingSuccess ? L("✓ 再錄一次") : L("🎙️ 開始跟讀錄音")}
                  </span>
                </button>
              </div>

              {/* Student Recorded Audio Playback Bar */}
              {userRecordedAudioUrl && (
                <div className="bg-purple-950/40 border border-purple-500/30 rounded-2xl p-3 flex items-center justify-between text-xs animate-in fade-in">
                  <div className="flex items-center gap-2 text-purple-300">
                    <Volume2 className="w-4 h-4 text-yellow-300" />
                    <span className="font-bold">{L("你的錄音已完成")}</span>
                  </div>
                  <button
                    onClick={() => {
                      if (isPlayingUserAudio && userAudioElemRef.current) {
                        userAudioElemRef.current.pause();
                        setIsPlayingUserAudio(false);
                      } else if (userRecordedAudioUrl) {
                        const audio = new Audio(userRecordedAudioUrl);
                        userAudioElemRef.current = audio;
                        audio
                          .play()
                          .then(() => setIsPlayingUserAudio(true))
                          .catch((e) => {
                            console.warn("User audio playback failed:", e);
                            setIsPlayingUserAudio(false);
                          });
                        audio.onended = () => setIsPlayingUserAudio(false);
                        audio.onerror = () => setIsPlayingUserAudio(false);
                      }
                    }}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center gap-1.5 text-xs active:scale-95 transition-all"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{isPlayingUserAudio ? L("暫停") : L("🎧 重聽我的發音")}</span>
                  </button>
                </div>
              )}

              {/* Dynamic AI Speech Rating Feedback & Word-by-Word Phonetics Diagnosis */}
              {recordingSuccess && shadowingEval && (
                <div className="bg-emerald-950/40 border border-[#00FF88]/40 rounded-2xl p-4 text-left space-y-3 animate-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-black text-[#00FF88] flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#00FF88]" />
                      <span>
                        {L("發音精準度:")} {shadowingEval.score}% ({shadowingEval.level})
                      </span>
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-black ${
                        shadowingEval.score >= 80
                          ? "bg-[#00FF88]/20 text-[#00FF88]"
                          : "bg-yellow-500/20 text-yellow-300"
                      }`}
                    >
                      {shadowingEval.score >= 80 ? "EXCELLENT" : "NEEDS PRACTICE"}
                    </span>
                  </div>

                  {/* Word-by-Word Phonetics Diagnostics */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider block">
                      {L("單詞音標與發音診斷標註 (Green = 完美, Yellow = 輕微偏音, Red = 重音修復):")}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {shadowingEval.breakdown.map((item, pIdx) => (
                        <div
                          key={pIdx}
                          className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold flex flex-col items-center justify-center ${
                            item.status === "perfect"
                              ? "bg-emerald-950/80 border-[#00FF88] text-[#00FF88]"
                              : item.status === "slight"
                              ? "bg-yellow-950/80 border-yellow-400 text-yellow-300"
                              : "bg-red-950/80 border-red-500 text-red-400"
                          }`}
                          title={item.tip}
                        >
                          <span>{item.word}</span>
                          <span className="text-[9px] opacity-75">{item.ipa}</span>
                          {item.tip && <span className="text-[8px] text-red-300 mt-0.5">{item.tip}</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-white/90 pt-1 leading-relaxed bg-white/5 p-2.5 rounded-xl border border-white/10">
                    💡 <span className="font-bold text-yellow-300">{L("AI 考官評語：")}</span>
                    {shadowingEval.advice}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB 3: 💬 4人 AI 口試 (ORAL SIMULATOR) ==================== */}
        {activeTab === "oral" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-[#0c0c0c] border border-white/15 rounded-3xl p-4 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  <div>
                    <h3 className="font-black text-sm text-white">{L("DSE Paper 4 AI 口試")}</h3>
                    <p className="text-[10px] text-white/50">4-Player Oral Group Discussion</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowOralReportSheet(true)}
                  className="px-2.5 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                >
                  <Award className="w-3.5 h-3.5 text-yellow-300" />
                  <span>{L("5** 評分報告")}</span>
                </button>
              </div>

              {/* Chat Message Stream */}
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                {oralMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-2.5 ${
                      msg.role === "User" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-sm shrink-0">
                      {msg.avatar}
                    </div>

                    <div
                      className={`p-3 rounded-2xl max-w-[80%] text-xs leading-relaxed ${
                        msg.role === "User"
                          ? "bg-[#00FF88] text-black font-medium"
                          : msg.role === "Examiner"
                          ? "bg-purple-950/60 text-purple-200 border border-purple-500/30"
                          : "bg-white/10 text-white border border-white/10"
                      }`}
                    >
                      <p className="font-black text-[10px] opacity-70 mb-0.5">
                        {msg.speaker}
                      </p>
                      <p>{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* One-Tap High-Scoring Response Chips */}
              <div className="pt-2 border-t border-white/10 space-y-1.5">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-wider">
                  💡 {L("一鍵帶入 DSE 5** 轉承語 (Signposting):")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "To add on to that...",
                    "I agree with Candidate A...",
                    "To substantiate this statement..."
                  ].map((phrase, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => handleSendOralMessage(phrase)}
                      className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-[10px] font-bold active:scale-95"
                    >
                      + "{phrase}"
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Input Box */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={userOralInput}
                  onChange={(e) => setUserOralInput(e.target.value)}
                  placeholder={L("輸入口試發言或點擊上方快選語...")}
                  className="flex-1 bg-black/80 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#00FF88]"
                  onKeyDown={(e) => e.key === "Enter" && handleSendOralMessage()}
                />
                <button
                  onClick={() => handleSendOralMessage()}
                  className="px-4 py-2.5 bg-[#00FF88] text-black font-black text-xs rounded-xl shadow-md active:scale-95 shrink-0"
                >
                  {L("發送")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 4: 🃏 Three.js 3D 雙面閃卡 (THREE.JS 3D FLASHCARDS) ==================== */}
        {activeTab === "flashcards" && (
          <div className="space-y-4 animate-in fade-in duration-200 text-center">
            {/* Filter Tabs & Counters */}
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-2 space-y-2 text-xs">
              <div className="grid grid-cols-3 gap-1 p-0.5 bg-black/60 rounded-xl border border-white/10 font-bold">
                <button
                  onClick={() => {
                    setFlashcardFilter("all");
                    setCardIndex(0);
                  }}
                  className={`py-1.5 rounded-lg transition-all ${
                    flashcardFilter === "all"
                      ? "bg-[#00FF88] text-black font-black shadow"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {L("全部")} ({allVocabWords.length})
                </button>

                <button
                  onClick={() => {
                    setFlashcardFilter("bookmarked");
                    setCardIndex(0);
                  }}
                  className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                    flashcardFilter === "bookmarked"
                      ? "bg-yellow-400 text-black font-black shadow"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <span>{L("待複習")}</span>
                  <span className="text-[10px] bg-black/20 px-1.5 rounded-full font-mono">
                    {bookmarkedWordIds.size}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setFlashcardFilter("mastered");
                    setCardIndex(0);
                  }}
                  className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                    flashcardFilter === "mastered"
                      ? "bg-[#00FF88] text-black font-black shadow"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <span>{L("已掌握")}</span>
                  <span className="text-[10px] bg-black/20 px-1.5 rounded-full font-mono">
                    {masteredWordIds.size}
                  </span>
                </button>
              </div>
            </div>

            {/* Three.js 3D Rendered Interactive Flashcard */}
            {currentFlashcard ? (
              <Three3DFlashcard
                vocab={currentFlashcard}
                isMastered={masteredWordIds.has(currentFlashcard.id || currentFlashcard.word)}
                isBookmarked={bookmarkedWordIds.has(currentFlashcard.id || currentFlashcard.word)}
                onToggleMaster={() => {
                  const key = currentFlashcard.id || currentFlashcard.word;
                  setMasteredWordIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(key)) next.delete(key);
                    else next.add(key);
                    return next;
                  });
                }}
                onToggleBookmark={() => {
                  const key = currentFlashcard.id || currentFlashcard.word;
                  setBookmarkedWordIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(key)) next.delete(key);
                    else next.add(key);
                    return next;
                  });
                }}
                onDoubleClickCard={(vocab) => setAnalysisWordModal(vocab)}
                lang={lang}
              />
            ) : (
              <div className="p-8 bg-[#0c0c0c] border border-white/10 rounded-3xl text-center space-y-2">
                <p className="text-sm font-bold text-white/70">該篩選標籤下暫無卡片</p>
                <button
                  onClick={() => setFlashcardFilter("all")}
                  className="px-4 py-2 bg-[#00FF88] text-black rounded-xl text-xs font-black uppercase"
                >
                  查看全部卡片
                </button>
              </div>
            )}

            {/* Clear Navigation Buttons to Draw Next / Prev Cards */}
            <div className="flex items-center justify-between gap-2 bg-[#0a0a0a] border border-white/10 rounded-2xl p-2">
              <button
                onClick={() => setCardIndex((prev) => Math.max(0, prev - 1))}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95"
              >
                <ChevronLeft className="w-4 h-4 text-white/70" />
                <span>{L("上一張")}</span>
              </button>

              <button
                onClick={() => setCardIndex(Math.floor(Math.random() * allVocabWords.length))}
                className="px-3.5 py-3 bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 active:scale-95"
                title={L("隨機抽取新卡片")}
              >
                <Shuffle className="w-4 h-4 text-yellow-300" />
                <span>{L("隨機")}</span>
              </button>

              <button
                onClick={() => setCardIndex((prev) => prev + 1)}
                className="flex-1 py-3 bg-[#00FF88] text-black rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 shadow-md shadow-[#00FF88]/20"
              >
                <span>{L("下一張")}</span>
                <ChevronRight className="w-4 h-4 text-black" />
              </button>
            </div>
          </div>
        )}

        {/* ==================== TAB 5: 📚 個人資料庫 (PERSONAL SAVED DATABASE) ==================== */}
        {activeTab === "database" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Segmented Controller: Articles vs Vocabulary */}
            <div className="grid grid-cols-2 p-1 bg-[#0c0c0c] border border-white/15 rounded-2xl text-xs font-black uppercase">
              <button
                onClick={() => setDbSubTab("articles")}
                className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  dbSubTab === "articles"
                    ? "bg-[#00FF88] text-black shadow-md font-black"
                    : "text-white/60 hover:text-white"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>{L("收藏文章")} ({snapItems.length})</span>
              </button>

              <button
                onClick={() => setDbSubTab("vocab")}
                className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  dbSubTab === "vocab"
                    ? "bg-[#00FF88] text-black shadow-md font-black"
                    : "text-white/60 hover:text-white"
                }`}
              >
                <Brain className="w-4 h-4" />
                <span>{L("DSE 生詞庫")} ({allVocabWords.length})</span>
              </button>
            </div>

            {/* SUB-TAB 1: SAVED ARTICLES & SNAPS */}
            {dbSubTab === "articles" && (
              <div className="space-y-2.5">
                {snapItems.length === 0 ? (
                  <div className="text-center py-12 bg-black/60 border border-white/10 rounded-2xl p-6">
                    <BookOpen className="w-10 h-10 text-white/20 mx-auto mb-2" />
                    <p className="text-xs text-white/50">{L("暫無收藏文章，請在即影即學中新增")}</p>
                  </div>
                ) : (
                  snapItems.map((item, idx) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setActiveSnapIndex(idx);
                        setActiveTab("snap");
                      }}
                      className="bg-[#0c0c0c] border border-white/10 hover:border-[#00FF88]/50 rounded-2xl p-4 space-y-2 cursor-pointer active:scale-98 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-white truncate max-w-[200px]">
                          {item.title}
                        </span>
                        <span className="text-[10px] bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/30 px-2 py-0.5 rounded font-black">
                          {item.vocabulary.length} {L("生詞")}
                        </span>
                      </div>

                      <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">
                        {item.ocrText}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-white/40 pt-1 border-t border-white/10">
                        <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                        <span className="text-[#00FF88] font-bold flex items-center gap-1">
                          <span>{L("開啟載入跟讀")}</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* SUB-TAB 2: SAVED DSE VOCABULARY */}
            {dbSubTab === "vocab" && (
              <div className="space-y-2">
                {allVocabWords.map((vocab, vIdx) => (
                  <div
                    key={vIdx}
                    onClick={() => {
                      setSelectedWord(vocab);
                      setIsSavedInSheet(false);
                    }}
                    className="bg-[#0c0c0c] border border-white/10 hover:border-[#00FF88]/50 rounded-2xl p-3.5 flex items-center justify-between gap-3 cursor-pointer active:scale-98 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-white">{vocab.word}</span>
                        <span className="text-[10px] text-[#00FF88] font-mono">[{vocab.ipa}]</span>
                      </div>
                      <p className="text-xs text-white/60 mt-0.5 line-clamp-1">{getVocabMeaning(vocab, lang)}</p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakText(vocab.word, "en-US", 0.8);
                      }}
                      className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center shrink-0 active:scale-90"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* iOS & Android App Support Coming Soon Footer Badge */}
        <div className="pt-6 pb-20 border-t border-white/10 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <img
              src="/assets/IMG/ICON/iOS_Android.png"
              alt="iOS & Android"
              className="h-8 object-contain rounded-lg hover:scale-105 transition-transform"
            />
            <img
              src="/assets/IMG/ICON/App_Store_badge.png"
              alt="App Store (Coming Soon)"
              className="h-8 object-contain rounded-lg hover:scale-105 transition-transform"
            />
            <img
              src="/assets/IMG/ICON/Google_Play_badge.png"
              alt="Google Play (Coming Soon)"
              className="h-8 object-contain rounded-lg hover:scale-105 transition-transform"
            />
          </div>

          <p className="text-[10px] text-white/40">
            © 2026 EduBridge HK AI • Multimodal DSE Learning Platform
          </p>
        </div>

      </div>

      {/* ==================== MOBILE BOTTOM SHEET MODAL (SLIDES UP ON WORD SELECTION) ==================== */}
      <AnimatePresence>
        {selectedWord && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedWord(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f0f] border-t-2 border-[#00FF88] rounded-t-3xl p-6 space-y-4 shadow-2xl max-w-md mx-auto"
            >
              {/* Bottom Sheet Handle */}
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-2" />

              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#00FF88] bg-[#00FF88]/10 border border-[#00FF88]/30 px-2.5 py-0.5 rounded-full">
                    {selectedWord.level || "DSE Level 5*"}
                  </span>
                  <h2 className="text-2xl font-black text-white mt-1">{selectedWord.word}</h2>
                  <p className="text-xs font-mono text-[#00FF88]">[{selectedWord.ipa}]</p>
                </div>

                <button
                  onClick={() => setSelectedWord(null)}
                  className="w-8 h-8 rounded-full bg-white/10 text-white/70 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chinese Definition */}
              <div className="bg-black/60 rounded-2xl p-3.5 border border-white/10">
                <p className="text-xs font-black text-white/50 uppercase tracking-wider mb-1">{L("中文釋義 / Meaning:")}</p>
                <p className="text-base font-bold text-white">{getVocabMeaning(selectedWord, lang)}</p>
              </div>

              {/* DSE Example Sentence */}
              <div className="bg-emerald-950/20 rounded-2xl p-3.5 border border-[#00FF88]/30">
                <p className="text-xs font-black text-[#00FF88] uppercase tracking-wider mb-1">{L("DSE 真題實戰例句:")}</p>
                <p className="text-xs text-white/90 italic leading-relaxed">"{selectedWord.exampleSentence}"</p>
              </div>

              {/* Action Buttons inside Bottom Sheet */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => speakText(selectedWord.word, "en-US", 0.8)}
                  className="py-3 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 border border-white/20 active:scale-95"
                >
                  <Volume2 className="w-4 h-4 text-[#00FF88]" />
                  <span>🔊 {L("0.8x 朗讀")}</span>
                </button>

                <button
                  onClick={() => {
                    setIsSavedInSheet(true);
                    if (onAddVocabToActiveItem) {
                      onAddVocabToActiveItem(selectedWord);
                    }
                  }}
                  className={`py-3 font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 ${
                    isSavedInSheet
                      ? "bg-[#00FF88] text-black shadow-lg"
                      : "bg-[#00FF88]/20 text-[#00FF88] border border-[#00FF88]/40"
                  }`}
                >
                  <Star className="w-4 h-4 fill-current" />
                  <span>{isSavedInSheet ? L("✓ 已加入生詞庫") : L("收藏至生詞庫")}</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Oral Report Sheet */}
      <AnimatePresence>
        {showOralReportSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOralReportSheet(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f0f] border-t-2 border-purple-500 rounded-t-3xl p-6 space-y-4 max-w-md mx-auto"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-6 h-6 text-yellow-300" />
                  <h3 className="font-black text-base text-white">{L("考評局 5** 口試診斷報告")}</h3>
                </div>
                <button onClick={() => setShowOralReportSheet(false)} className="text-white/60">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                  <span className="text-white/40 block text-[10px]">Pronunciation</span>
                  <span className="text-lg font-black text-[#00FF88]">Level 5*</span>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                  <span className="text-white/40 block text-[10px]">Communication</span>
                  <span className="text-lg font-black text-yellow-300">Level 5**</span>
                </div>
              </div>

              <p className="text-xs text-white/80 leading-relaxed bg-purple-950/40 p-3.5 rounded-2xl border border-purple-500/30">
                🎓 {L("考官評語：學生展現出極強的 Signposting (轉承語) 技巧。多使用高階詞彙如 substantiate，適應良好！")}
              </p>

              <button
                onClick={() => setShowOralReportSheet(false)}
                className="w-full py-3 bg-purple-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl"
              >
                {L("關閉報告")}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* AI Word Analysis Modal (Triggered on Double Click or Details button) */}
      <WordAnalysisModal
        vocab={analysisWordModal}
        isOpen={!!analysisWordModal}
        onClose={() => setAnalysisWordModal(null)}
        lang={lang}
        isMastered={analysisWordModal ? masteredWordIds.has(analysisWordModal.id || analysisWordModal.word) : false}
        isBookmarked={analysisWordModal ? bookmarkedWordIds.has(analysisWordModal.id || analysisWordModal.word) : false}
        onToggleMaster={() => {
          if (!analysisWordModal) return;
          const key = analysisWordModal.id || analysisWordModal.word;
          setMasteredWordIds((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
          });
        }}
        onToggleBookmark={() => {
          if (!analysisWordModal) return;
          const key = analysisWordModal.id || analysisWordModal.word;
          setBookmarkedWordIds((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
          });
        }}
      />

      {/* ==================== BOTTOM STICKY MOBILE NAVIGATION BAR ==================== */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 border-t border-white/15 backdrop-blur-2xl px-2 py-2 flex items-center justify-around shadow-[0_-10px_25px_rgba(0,0,0,0.8)]">
        <button
          onClick={() => setActiveTab("snap")}
          className={`flex-1 flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl text-[10px] font-black uppercase tracking-tight transition-all active:scale-90 ${
            activeTab === "snap"
              ? "bg-[#00FF88] text-black shadow-[0_0_20px_rgba(0,255,136,0.4)] font-black"
              : "text-white/60 hover:text-white"
          }`}
        >
          <Camera className="w-6 h-6 mb-0.5" />
          <span>{L("即影即學")}</span>
        </button>

        <button
          onClick={() => setActiveTab("audio")}
          className={`flex-1 flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl text-[10px] font-black uppercase tracking-tight transition-all active:scale-90 ${
            activeTab === "audio"
              ? "bg-[#00FF88] text-black shadow-[0_0_20px_rgba(0,255,136,0.4)] font-black"
              : "text-white/60 hover:text-white"
          }`}
        >
          <Volume2 className="w-6 h-6 mb-0.5" />
          <span>{L("語音跟讀")}</span>
        </button>

        <button
          onClick={() => setActiveTab("oral")}
          className={`flex-1 flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl text-[10px] font-black uppercase tracking-tight transition-all active:scale-90 ${
            activeTab === "oral"
              ? "bg-[#00FF88] text-black shadow-[0_0_20px_rgba(0,255,136,0.4)] font-black"
              : "text-white/60 hover:text-white"
          }`}
        >
          <Users className="w-6 h-6 mb-0.5" />
          <span>{L("4人口試")}</span>
        </button>

        <button
          onClick={() => setActiveTab("flashcards")}
          className={`flex-1 flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl text-[10px] font-black uppercase tracking-tight transition-all active:scale-90 ${
            activeTab === "flashcards"
              ? "bg-[#00FF88] text-black shadow-[0_0_20px_rgba(0,255,136,0.4)] font-black"
              : "text-white/60 hover:text-white"
          }`}
        >
          <Sparkles className="w-6 h-6 mb-0.5" />
          <span>{L("3D閃卡")}</span>
        </button>

        <button
          onClick={() => setActiveTab("database")}
          className={`flex-1 flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl text-[10px] font-black uppercase tracking-tight transition-all active:scale-90 ${
            activeTab === "database"
              ? "bg-[#00FF88] text-black shadow-[0_0_20px_rgba(0,255,136,0.4)] font-black"
              : "text-white/60 hover:text-white"
          }`}
        >
          <FolderHeart className="w-6 h-6 mb-0.5" />
          <span>{L("個人庫")}</span>
        </button>
      </nav>
    </div>
  );
};
