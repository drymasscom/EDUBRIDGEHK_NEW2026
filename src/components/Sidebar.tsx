import React, { useState } from "react";
import {
  Sparkles,
  LayoutGrid,
  Camera,
  Users,
  Brain,
  Shield,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  CreditCard,
  Globe,
  Smartphone,
  Monitor,
  TrendingUp,
  Flame
} from "lucide-react";
import { Language, translations } from "../utils/i18n";
import { StudentProfile } from "../types";

export type TabType = "welcome" | "home" | "snap" | "discussion" | "knowledge" | "investor" | "admin";

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean | ((prev: boolean) => boolean)) => void;
  isMobileMode?: boolean;
  setIsMobileMode?: (val: boolean) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  studentProfile?: StudentProfile | null;
  onOpenProfileModal?: () => void;
  onOpenPromoModal?: () => void;
  onOpenSubscriptionModal?: () => void;
  investorMode?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  isMobileMode = false,
  setIsMobileMode,
  lang,
  setLang,
  studentProfile,
  onOpenProfileModal,
  onOpenPromoModal,
  onOpenSubscriptionModal,
  investorMode = true,
}) => {
  const t = translations[lang];

  const navItems = [
    {
      id: "welcome" as TabType,
      label: lang === "en" ? "Showcase" : lang === "zh-CN" ? "产品展示" : "產品展示",
      icon: Sparkles,
      badge: "NEW",
      color: "text-amber-400",
    },
    {
      id: "home" as TabType,
      label: lang === "en" ? "App Hub" : lang === "zh-CN" ? "功能总览" : "功能總覽",
      icon: LayoutGrid,
      color: "text-[#00FF88]",
    },
    {
      id: "snap" as TabType,
      label: t.tabSnap,
      icon: Camera,
      badge: "OCR",
      color: "text-cyan-400",
    },
    {
      id: "discussion" as TabType,
      label: t.tabDiscussion,
      icon: Users,
      badge: "AI Oral",
      color: "text-purple-400",
    },
    {
      id: "knowledge" as TabType,
      label: t.tabKnowledge,
      icon: Brain,
      badge: "DSE",
      color: "text-emerald-400",
    },
    ...(investorMode
      ? [
          {
            id: "investor" as TabType,
            label: lang === "en" ? "Investor Pitch" : lang === "zh-CN" ? "投资者专区" : "投資者專區",
            icon: TrendingUp,
            badge: "VC",
            color: "text-yellow-400",
          },
        ]
      : []),
    {
      id: "admin" as TabType,
      label: lang === "en" ? "AI Admin" : lang === "zh-CN" ? "架构后台" : "架構後台",
      icon: Shield,
      color: "text-blue-400",
    },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col h-screen sticky top-0 bg-[#08080a] border-r border-white/10 text-white z-40 transition-all duration-300 ease-in-out select-none ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2 shrink-0 h-16">
        <div
          onClick={() => setActiveTab("welcome")}
          className="flex items-center gap-3 cursor-pointer group truncate"
          title="EduBridge HK AI"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00FF88] to-blue-500 border border-white/20 p-0.5 shadow-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-black rounded-[9px] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-[#00FF88]" />
            </div>
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-tight uppercase text-white group-hover:text-[#00FF88] transition-colors">
                  EduBridge<span className="text-[#00FF88]">HK</span>
                </span>
              </div>
              <p className="text-[9px] text-white/40 uppercase tracking-widest truncate">
                AI HKDSE Platform
              </p>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/10 transition-colors shrink-0"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all relative group ${
                isActive
                  ? "bg-gradient-to-r from-[#00FF88]/20 to-emerald-950/40 text-[#00FF88] border border-[#00FF88]/40 shadow-[0_0_20px_rgba(0,255,136,0.15)] font-black"
                  : "text-white/70 hover:text-white hover:bg-white/5 border border-transparent"
              } ${isCollapsed ? "justify-center px-0" : ""}`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${isActive ? "text-[#00FF88]" : item.color}`} />

              {!isCollapsed && (
                <span className="truncate tracking-wide flex-1 text-left">{item.label}</span>
              )}

              {item.badge && !isCollapsed && (
                <span
                  className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase shrink-0 ${
                    isActive ? "bg-[#00FF88] text-black" : "bg-white/10 text-white/80 border border-white/15"
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {/* Active Indicator Line on left edge */}
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#00FF88] rounded-r-full shadow-[0_0_10px_#00FF88]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Controls Section */}
      <div className="p-3 border-t border-white/10 space-y-2 shrink-0 bg-[#050505]/60">
        {/* Mode Switcher Toggle */}
        {setIsMobileMode && (
          <button
            onClick={() => setIsMobileMode(!isMobileMode)}
            className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold transition-all border ${
              isMobileMode
                ? "bg-purple-600/30 text-purple-200 border-purple-500/50"
                : "bg-white/5 hover:bg-white/10 text-white/80 border-white/10"
            } ${isCollapsed ? "justify-center" : ""}`}
            title={isMobileMode ? "Switch to Desktop View" : "Switch to Mobile View"}
          >
            {isMobileMode ? (
              <Smartphone className="w-4 h-4 text-yellow-300 shrink-0" />
            ) : (
              <Monitor className="w-4 h-4 text-blue-300 shrink-0" />
            )}
            {!isCollapsed && (
              <span className="truncate">
                {isMobileMode ? "📱 手機模擬版" : "🖥️ 桌面寬屏版"}
              </span>
            )}
          </button>
        )}

        {/* Student Profile Quick Action */}
        {onOpenProfileModal && (
          <button
            onClick={onOpenProfileModal}
            className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold bg-blue-950/40 hover:bg-blue-900/50 text-blue-200 border border-blue-500/30 transition-all ${
              isCollapsed ? "justify-center" : ""
            }`}
            title="Student Profile"
          >
            <UserCheck className="w-4 h-4 text-yellow-300 shrink-0" />
            {!isCollapsed && (
              <span className="truncate">
                {studentProfile
                  ? `${studentProfile.name} (${studentProfile.grade})`
                  : lang === "en"
                  ? "Profile"
                  : "學生檔案"}
              </span>
            )}
          </button>
        )}

        {/* Subscription Quick Action */}
        {onOpenSubscriptionModal && (
          <button
            onClick={onOpenSubscriptionModal}
            className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-200 border border-emerald-500/30 transition-all ${
              isCollapsed ? "justify-center" : ""
            }`}
            title="Subscription Plans"
          >
            <CreditCard className="w-4 h-4 text-yellow-300 shrink-0" />
            {!isCollapsed && (
              <span className="truncate">
                {lang === "en" ? "Subscription" : lang === "zh-CN" ? "VIP 订阅" : "VIP 訂閱"}
              </span>
            )}
          </button>
        )}

        {/* Language Selector */}
        <div className={`flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 text-xs font-bold ${isCollapsed ? "justify-center" : "justify-between"}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-1 text-white/60 pl-1 text-[11px]">
              <Globe className="w-3.5 h-3.5 text-[#00FF88]" />
            </div>
          )}
          <div className="flex items-center gap-1 w-full justify-around">
            <button
              onClick={() => setLang("zh-CN")}
              className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase transition-all ${
                lang === "zh-CN" ? "bg-[#00FF88] text-black" : "text-white/60 hover:text-white"
              }`}
            >
              简
            </button>
            <button
              onClick={() => setLang("zh-HK")}
              className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase transition-all ${
                lang === "zh-HK" ? "bg-[#00FF88] text-black" : "text-white/60 hover:text-white"
              }`}
            >
              繁
            </button>
            <button
              onClick={() => setLang("en")}
              className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase transition-all ${
                lang === "en" ? "bg-[#00FF88] text-black" : "text-white/60 hover:text-white"
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
