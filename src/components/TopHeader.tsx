import React from "react";
import {
  Sparkles,
  Globe,
  Smartphone,
  Monitor,
  UserCheck,
  CreditCard,
  LayoutGrid,
  ArrowLeft,
  GraduationCap
} from "lucide-react";
import { Language, translations } from "../utils/i18n";
import { StudentProfile } from "../types";
import { TabType } from "./Sidebar";

interface TopHeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isMobileMode?: boolean;
  setIsMobileMode?: (val: boolean) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  studentProfile?: StudentProfile | null;
  onOpenProfileModal?: () => void;
  onOpenPromoModal?: () => void;
  onOpenSubscriptionModal?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  setActiveTab,
  isMobileMode = false,
  setIsMobileMode,
  lang,
  setLang,
  studentProfile,
  onOpenProfileModal,
  onOpenPromoModal,
  onOpenSubscriptionModal,
}) => {
  const t = translations[lang];

  return (
    <header className="sticky top-0 z-30 bg-[#050505]/90 backdrop-blur-md border-b border-white/10 px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 shadow-md">
      {/* Left Area: Mobile Brand or Desktop Breadcrumb */}
      <div className="flex items-center gap-3 shrink-0">
        <div
          onClick={() => setActiveTab("welcome")}
          className="md:hidden flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
        >
          <div className="w-8 h-8 rounded-lg bg-[#00FF88] text-black flex items-center justify-center font-black">
            <GraduationCap className="w-5 h-5 text-black" />
          </div>
          <span className="font-black text-base text-white tracking-tight">
            EduBridge<span className="text-[#00FF88]">HK</span>
          </span>
        </div>

        {/* Desktop Breadcrumb Navigation */}
        <div className="hidden md:flex items-center gap-2 text-xs font-bold text-white/80">
          {activeTab !== "welcome" && activeTab !== "home" && (
            <button
              onClick={() => setActiveTab("home")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-[#00FF88] hover:text-black text-white text-xs font-bold border border-white/15 transition-all shadow-sm active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#00FF88] group-hover:text-black" />
              <span>{t.backToHome}</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 text-xs font-bold bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
            <LayoutGrid className="w-3.5 h-3.5 text-[#00FF88]" />
            <span className="text-white/50">{lang === "en" ? "Module:" : "當前模組:"}</span>
            <span className="text-[#00FF88] font-black">
              {activeTab === "welcome" && (lang === "en" ? "Product Showcase" : "產品展示")}
              {activeTab === "home" && (lang === "en" ? "App Hub" : "功能總覽")}
              {activeTab === "snap" && t.tabSnap}
              {activeTab === "discussion" && t.tabDiscussion}
              {activeTab === "knowledge" && t.tabKnowledge}
              {activeTab === "investor" && (lang === "en" ? "Investor Pitch" : "投資者專區")}
              {activeTab === "admin" && (lang === "en" ? "AI Admin Console" : "AI 架構後台")}
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 ml-auto shrink-0 overflow-x-auto no-scrollbar">
        {/* Mode Switcher Toggle */}
        {setIsMobileMode && (
          <button
            onClick={() => setIsMobileMode(!isMobileMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all border shadow-sm ${
              isMobileMode
                ? "bg-purple-600 text-white border-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.5)] active:scale-95"
                : "bg-white/10 text-white/90 border-white/20 hover:bg-white/20"
            }`}
          >
            {isMobileMode ? (
              <>
                <Smartphone className="w-3.5 h-3.5 text-yellow-300" />
                <span className="hidden sm:inline">📱 手機版</span>
              </>
            ) : (
              <>
                <Monitor className="w-3.5 h-3.5 text-blue-300" />
                <span className="hidden sm:inline">🖥️ 桌面版</span>
              </>
            )}
          </button>
        )}

        {/* Language Switcher */}
        <div className="flex items-center gap-1 bg-white/10 border border-white/20 rounded-xl p-0.5 text-xs font-bold">
          <Globe className="w-3.5 h-3.5 text-[#00FF88] ml-1 shrink-0 hidden sm:inline" />
          <button
            onClick={() => setLang("zh-CN")}
            className={`px-1.5 py-0.5 rounded-lg uppercase text-[11px] transition-all ${
              lang === "zh-CN"
                ? "bg-[#00FF88] text-black font-black shadow-sm"
                : "text-white/70 hover:text-white"
            }`}
          >
            简
          </button>
          <button
            onClick={() => setLang("zh-HK")}
            className={`px-1.5 py-0.5 rounded-lg uppercase text-[11px] transition-all ${
              lang === "zh-HK"
                ? "bg-[#00FF88] text-black font-black shadow-sm"
                : "text-white/70 hover:text-white"
            }`}
          >
            繁
          </button>
          <button
            onClick={() => setLang("en")}
            className={`px-1.5 py-0.5 rounded-lg uppercase text-[11px] transition-all ${
              lang === "en"
                ? "bg-[#00FF88] text-black font-black shadow-sm"
                : "text-white/70 hover:text-white"
            }`}
          >
            EN
          </button>
        </div>

        {/* Subscription Button */}
        {onOpenSubscriptionModal && (
          <button
            onClick={onOpenSubscriptionModal}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all bg-gradient-to-r from-emerald-600 to-teal-600 text-white border border-emerald-400 shadow-sm hover:scale-105 active:scale-95 shrink-0"
          >
            <CreditCard className="w-3.5 h-3.5 text-yellow-300" />
            <span className="hidden sm:inline">{lang === "en" ? "Subscription" : lang === "zh-CN" ? "订阅" : "訂閱"}</span>
          </button>
        )}

        {/* Student Profile Button */}
        {onOpenProfileModal && (
          <button
            onClick={onOpenProfileModal}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all bg-gradient-to-r from-blue-600 to-indigo-600 text-white border border-blue-400 shadow-sm hover:scale-105 active:scale-95 shrink-0"
          >
            <UserCheck className="w-3.5 h-3.5 text-yellow-300" />
            <span className="max-w-[100px] truncate">
              {studentProfile ? studentProfile.name : lang === "en" ? "Profile" : "檔案"}
            </span>
          </button>
        )}

        {/* Promo Showcase Trigger */}
        {onOpenPromoModal && !isMobileMode && (
          <button
            onClick={onOpenPromoModal}
            className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all bg-gradient-to-r from-purple-600 to-pink-600 text-white border border-purple-400 shadow-sm hover:scale-105 active:scale-95 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>DSE Cards</span>
          </button>
        )}
      </div>
    </header>
  );
};
