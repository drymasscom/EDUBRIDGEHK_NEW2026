import React, { useState, useRef } from "react";
import {
  Camera,
  Volume2,
  Users,
  Brain,
  Sparkles,
  ArrowRight,
  Zap,
  Play,
  Pause,
  Award,
  Film,
  CheckCircle2
} from "lucide-react";
import { Language, translations } from "../utils/i18n";
import { RandomPromoCard } from "./RandomPromoCard";
import { speakText, stopSpeech } from "../utils/speechUtils";

interface InteractiveLandingProps {
  lang: Language;
  onQuickStart: () => void;
  onGenerateNewArticle: () => void;
  isGeneratingArticle: boolean;
  onOpenPromoModal?: () => void;
}

export const InteractiveLanding: React.FC<InteractiveLandingProps> = ({
  lang,
  onQuickStart,
  onGenerateNewArticle,
  isGeneratingArticle,
  onOpenPromoModal,
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<"snap" | "speech" | "oral" | "vocab">("snap");
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [demoAudioPlaying, setDemoAudioPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      } else {
        videoRef.current.play();
        setIsVideoPlaying(true);
      }
    } else {
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const playDemoAudio = (text: string) => {
    if (demoAudioPlaying) {
      stopSpeech();
      setDemoAudioPlaying(false);
    } else {
      setDemoAudioPlaying(true);
      speakText(text, "en-GB", 0.85, () => setDemoAudioPlaying(false));
    }
  };

  // Multilingual Video demos config with compelling selling points
  const videoDemos = {
    snap: {
      title: t.card1Title,
      subtitle: t.card1Desc,
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      posterUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80",
      speechText: "Take a photo of any textbook page. The OCR engine directly extracts English text into the editor for instant DSE analysis.",
      badge: t.card1Badge,
      badgeBg: "from-[#00FF88] to-emerald-400 text-black",
      highlights: [
        lang === "en" ? "Direct OCR Text Extraction" : "拍照即时 OCR 文本提取",
        lang === "en" ? "DSE Level 5* Vocab Marking" : "自动标注 DSE Level 5* 考题生词",
        lang === "en" ? "Instant 0.8x British Audio Sync" : "一键同步 0.8x 慢速英音朗读"
      ],
    },
    speech: {
      title: t.card2Title,
      subtitle: t.card2Desc,
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      posterUrl: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&auto=format&fit=crop&q=80",
      speechText: "Listen to 0.8x slow speed British pronunciation. Adapt quickly to Hong Kong secondary school EMI environments.",
      badge: t.card2Badge,
      badgeBg: "from-blue-500 to-indigo-500 text-white",
      highlights: [
        lang === "en" ? "0.8x Slow Speed Mode" : "0.8x 慢速听力缓冲模式",
        lang === "en" ? "UK Native Pronunciation" : "纯正英式与美式双发音",
        lang === "en" ? "EMI School Adaptation" : "克服全英文授课听力恐惧"
      ],
    },
    oral: {
      title: t.card3Title,
      subtitle: t.card3Desc,
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      posterUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=80",
      speechText: "Candidate A and B discuss HKDSE topics in real time. Practice turn taking, consensus building, and exam strategies.",
      badge: t.card3Badge,
      badgeBg: "from-purple-500 to-pink-500 text-white",
      highlights: [
        lang === "en" ? "4-Candidate Agent Roles" : "Candidate A/B/C 角色化 AI 陪练",
        lang === "en" ? "Real-time Voice Interactions" : "真实模拟 DSE Paper 4 小组讨论",
        lang === "en" ? "Instant 5** Level Feedback" : "AI 考官 5** Rubric 评分报告"
      ],
    },
    vocab: {
      title: t.card4Title,
      subtitle: t.card4Desc,
      videoUrl: "/assets/VIDEO/imagine-17e6da4a-5be3-4a06-a860-61e8382d290c.mp4",
      posterUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80",
      speechText: "All captured passages and vocabulary are stored in your personal Knowledge Base for effortless mobile review.",
      badge: t.card4Badge,
      badgeBg: "from-amber-500 to-orange-500 text-black",
      highlights: [
        lang === "en" ? "Auto-saved Mistake Book" : "错题与生词自动归档",
        lang === "en" ? "DSE Level 3 to 5** Word Bank" : "香港考评局 DSE 分级词库",
        lang === "en" ? "Spaced Repetition Review" : "手机端智能闪卡快速复习"
      ],
    },
  };

  const currentVideo = videoDemos[activeTab];

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const videoEl = e.currentTarget;
    const fallback = "/assets/VIDEO/imagine-17e6da4a-5be3-4a06-a860-61e8382d290c.mp4";
    if (videoEl.src !== window.location.origin + fallback) {
      videoEl.src = fallback;
      videoEl.play().catch(() => setIsVideoPlaying(false));
    }
  };

  return (
    <div className="bg-gradient-to-b from-[#0a0a0c] to-[#050505] border border-white/10 rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#00FF88]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00FF88]/10 border border-[#00FF88]/30 text-[#00FF88] text-[11px] font-black uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-[#00FF88] animate-pulse" />
          <span>{t.landingBadge}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase tracking-tight leading-snug">
          {t.landingMainTitle} <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FF88] via-emerald-300 to-blue-400">
            {t.landingMainSubtitle}
          </span>
        </h1>

        <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-sans max-w-xl mx-auto">
          {t.landingDesc}
        </p>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
          <button
            onClick={onQuickStart}
            className="w-full sm:w-auto px-5 py-3 bg-[#00FF88] hover:bg-[#00e67a] text-black font-black uppercase tracking-wider text-xs rounded-xl shadow-[0_0_20px_rgba(0,255,136,0.3)] transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Camera className="w-4 h-4" />
            <span>{t.snapLearnBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onGenerateNewArticle}
            disabled={isGeneratingArticle}
            className="w-full sm:w-auto px-4 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-black uppercase tracking-wider text-xs rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-[#00FF88]" />
            <span>{isGeneratingArticle ? t.generatingArticle : t.generateDseBtn}</span>
          </button>
        </div>
      </div>

      {/* Core Feature Selection Grid - Rich Value Propositions */}
      <div className="space-y-3 relative z-10">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#00FF88]" />
            {t.videoDemoTitle}
          </h2>
          <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
            {t.tapToWatch}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Card 1: Snap & Learn */}
          <div
            onClick={() => setActiveTab("snap")}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer relative space-y-2 ${
              activeTab === "snap"
                ? "bg-gradient-to-b from-[#00FF88]/20 to-black border-[#00FF88] shadow-[0_0_20px_rgba(0,255,136,0.25)] scale-[1.01]"
                : "bg-black/60 border-white/10 hover:border-white/20 hover:bg-white/5"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black px-2 py-0.5 rounded bg-[#00FF88] text-black uppercase tracking-wider">
                {t.card1Badge}
              </span>
              <Film className="w-3.5 h-3.5 text-[#00FF88]" />
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#00FF88] text-black font-black flex items-center justify-center shrink-0">
                <Camera className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-xs text-white truncate">{t.card1Title}</h3>
                <p className="text-[10px] text-[#00FF88] font-bold truncate">{t.card1Sub}</p>
              </div>
            </div>
            <p className="text-[11px] text-white/60 leading-normal line-clamp-2">
              {t.card1Desc}
            </p>
          </div>

          {/* Card 2: 0.8x Native Speech */}
          <div
            onClick={() => setActiveTab("speech")}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer relative space-y-2 ${
              activeTab === "speech"
                ? "bg-white/10 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.25)] scale-[1.01]"
                : "bg-black/60 border-white/10 hover:border-white/20 hover:bg-white/5"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black px-2 py-0.5 rounded bg-blue-500 text-white uppercase tracking-wider">
                {t.card2Badge}
              </span>
              <Film className="w-3.5 h-3.5 text-blue-400" />
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 font-black flex items-center justify-center shrink-0">
                <Volume2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-xs text-white truncate">{t.card2Title}</h3>
                <p className="text-[10px] text-blue-400 font-bold truncate">{t.card2Sub}</p>
              </div>
            </div>
            <p className="text-[11px] text-white/60 leading-normal line-clamp-2">
              {t.card2Desc}
            </p>
          </div>

          {/* Card 3: DSE AI Oral */}
          <div
            onClick={() => setActiveTab("oral")}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer relative space-y-2 ${
              activeTab === "oral"
                ? "bg-white/10 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.25)] scale-[1.01]"
                : "bg-black/60 border-white/10 hover:border-white/20 hover:bg-white/5"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black px-2 py-0.5 rounded bg-purple-500 text-white uppercase tracking-wider">
                {t.card3Badge}
              </span>
              <Film className="w-3.5 h-3.5 text-purple-400" />
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 font-black flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-xs text-white truncate">{t.card3Title}</h3>
                <p className="text-[10px] text-purple-400 font-bold truncate">{t.card3Sub}</p>
              </div>
            </div>
            <p className="text-[11px] text-white/60 leading-normal line-clamp-2">
              {t.card3Desc}
            </p>
          </div>

          {/* Card 4: Knowledge Base */}
          <div
            onClick={() => setActiveTab("vocab")}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer relative space-y-2 ${
              activeTab === "vocab"
                ? "bg-white/10 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)] scale-[1.01]"
                : "bg-black/60 border-white/10 hover:border-white/20 hover:bg-white/5"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black px-2 py-0.5 rounded bg-amber-500 text-black uppercase tracking-wider">
                {t.card4Badge}
              </span>
              <Film className="w-3.5 h-3.5 text-amber-400" />
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 font-black flex items-center justify-center shrink-0">
                <Brain className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-xs text-white truncate">{t.card4Title}</h3>
                <p className="text-[10px] text-amber-400 font-bold truncate">{t.card4Sub}</p>
              </div>
            </div>
            <p className="text-[11px] text-white/60 leading-normal line-clamp-2">
              {t.card4Desc}
            </p>
          </div>
        </div>
      </div>

      {/* Feature Video Demo Player Container - Compact Max-W-2XL Size */}
      <div className="max-w-2xl mx-auto bg-black border border-white/15 rounded-2xl overflow-hidden shadow-2xl relative z-10">
        {/* Video Frame Header */}
        <div className="bg-white/5 border-b border-white/10 px-3.5 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            </div>
            <span className="text-xs font-black text-white uppercase tracking-wider ml-1 truncate">
              {currentVideo.title}
            </span>
          </div>

          <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 bg-gradient-to-r ${currentVideo.badgeBg}`}>
            {currentVideo.badge}
          </span>
        </div>

        {/* Video Player */}
        <div className="relative aspect-[16/9] bg-neutral-900 overflow-hidden group">
          <video
            ref={videoRef}
            src={currentVideo.videoUrl}
            poster={currentVideo.posterUrl}
            autoPlay
            loop
            muted
            playsInline
            onError={handleVideoError}
            className="w-full h-full object-cover"
          />

          {/* Video Control Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3 sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={toggleVideoPlay}
                className="w-8 h-8 rounded-full bg-[#00FF88] text-black flex items-center justify-center font-bold shadow-lg hover:scale-105 transition-all shrink-0"
              >
                {isVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              <div className="flex-1 bg-white/20 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#00FF88] h-full w-2/3 rounded-full animate-pulse" />
              </div>

              <button
                onClick={() => playDemoAudio(currentVideo.speechText)}
                className="px-2.5 py-1 bg-black/80 hover:bg-black text-white border border-white/20 rounded-lg text-[10px] sm:text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#00FF88]" />
                <span>{demoAudioPlaying ? t.stopNarration : t.listenNarration}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Video Description & Highlights */}
        <div className="p-3.5 sm:p-4 space-y-2.5 bg-neutral-950">
          <p className="text-xs text-white/80 leading-relaxed font-sans">
            {currentVideo.subtitle}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1 border-t border-white/10">
            {currentVideo.highlights.map((h, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-[11px] text-white/70">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF88] shrink-0" />
                <span className="truncate">{h}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DSE Promo Posters Showcase Banner with Random Poster Widget */}
      {onOpenPromoModal && (
        <div className="mt-6 bg-gradient-to-r from-purple-900/40 via-pink-900/30 to-blue-900/40 border border-purple-500/40 rounded-3xl p-5 sm:p-6 text-white relative overflow-hidden shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 text-center md:text-left">
              <span className="inline-block px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                🔥 小紅書 & 學生熱推宣傳海報
              </span>
              <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
                「從不適應，到 DSE 奪星」7大核心海報 Showcase
              </h3>
              <p className="text-xs text-white/70 max-w-xl leading-relaxed">
                專為新來港中學生打造的 7 個 AI 英語學習海報：Snap & Learn 隨手拍、AI 口語診斷、30 年經驗 DSE Oral 小組試、個人知識庫與間隔重複記憶卡。
              </p>

              <button
                onClick={onOpenPromoModal}
                className="mt-2 px-5 py-3 bg-gradient-to-r from-[#00FF88] to-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-black" />
                <span>{lang === "en" ? "View All 7 Posters Gallery" : "查看全部 7 張海報畫廊 🌟"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="shrink-0 w-full md:w-auto">
              <RandomPromoCard
                lang={lang}
                onOpenFullShowcase={onOpenPromoModal}
                compactMode={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
