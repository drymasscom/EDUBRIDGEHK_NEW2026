import React from "react";
import { LayoutGrid, Camera, Users, Brain, Shield, Sparkles } from "lucide-react";
import { Language, translations } from "../utils/i18n";
import { TabType } from "./Sidebar";

interface MobileBottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  lang: Language;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  lang,
}) => {
  const t = translations[lang];

  const tabs = [
    {
      id: "home" as TabType,
      label: lang === "en" ? "Hub" : lang === "zh-CN" ? "总览" : "總覽",
      icon: LayoutGrid,
    },
    {
      id: "snap" as TabType,
      label: lang === "en" ? "Snap" : lang === "zh-CN" ? "即影即学" : "即影即學",
      icon: Camera,
    },
    {
      id: "discussion" as TabType,
      label: lang === "en" ? "Oral" : lang === "zh-CN" ? "AI 口试" : "AI 口試",
      icon: Users,
    },
    {
      id: "knowledge" as TabType,
      label: lang === "en" ? "Cards" : lang === "zh-CN" ? "知识库" : "知識庫",
      icon: Brain,
    },
    {
      id: "admin" as TabType,
      label: lang === "en" ? "Admin" : lang === "zh-CN" ? "后台" : "後台",
      icon: Shield,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#08080c]/95 border-t border-white/15 backdrop-blur-xl px-2 py-1.5 flex items-center justify-around shadow-[0_-5px_25px_rgba(0,0,0,0.8)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all active:scale-95 ${
              isActive
                ? "bg-[#00FF88] text-black shadow-[0_0_15px_rgba(0,255,136,0.4)]"
                : "text-white/70 hover:text-white"
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] truncate max-w-[64px]">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
