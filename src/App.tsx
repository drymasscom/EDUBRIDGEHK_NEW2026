import React, { useState, useEffect } from "react";
import { Sidebar, TabType } from "./components/Sidebar";
import { TopHeader } from "./components/TopHeader";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { ProductLaunchShowcase } from "./components/ProductLaunchShowcase";
import { HomeHub } from "./components/HomeHub";
import { SnapAndLearn } from "./components/SnapAndLearn";
import { GroupDiscussion } from "./components/GroupDiscussion";
import { KnowledgeBase } from "./components/KnowledgeBase";
import { InvestorHub } from "./components/InvestorHub";
import { AdminConsole } from "./components/AdminConsole";
import { MobileStudentView } from "./components/MobileStudentView";
import { HighlightReaderPopover } from "./components/HighlightReaderPopover";
import { StudentProfileModal } from "./components/StudentProfileModal";
import { PromoShowcaseModal } from "./components/PromoShowcaseModal";
import { SubscriptionModal } from "./components/SubscriptionModal";
import { SnapItem, VocabWord, StudentProfile } from "./types";
import { SAMPLE_SNAP_ITEMS } from "./data/presetData";
import { GraduationCap, LayoutGrid, CreditCard, Shield } from "lucide-react";
import { Language, translations } from "./utils/i18n";

export default function App() {
  const [activeTab, setActiveTabState] = useState<TabType>(() => {
    if (typeof window !== "undefined" && (window.location.pathname === "/admin" || window.location.hash === "#admin")) {
      return "admin";
    }
    return "welcome";
  });
  const [investorMode, setInvestorMode] = useState<boolean>(true);
  const [isMobileMode, setIsMobileMode] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [lang, setLang] = useState<Language>("zh-CN"); // Default to Simplified Chinese per requirement

  // Student Profile State & Onboarding Modal Visibility
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(() => {
    try {
      const saved = localStorage.getItem("edubridge_student_profile");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to parse student profile:", e);
    }
    return null;
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("edubridge_student_profile");
      return !saved; // If no saved profile, open modal on first launch!
    } catch (_) {
      return true;
    }
  });

  const [isPromoModalOpen, setIsPromoModalOpen] = useState<boolean>(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState<boolean>(false);

  const handleSaveStudentProfile = (profile: StudentProfile) => {
    setStudentProfile(profile);
    try {
      localStorage.setItem("edubridge_student_profile", JSON.stringify(profile));
    } catch (e) {
      console.error("Failed to save student profile:", e);
    }
  };


  const setActiveTab = (tab: TabType) => {
    setActiveTabState(tab);
    if (typeof window !== "undefined") {
      if (tab === "admin") {
        window.history.pushState({}, "", "/admin");
      } else if (window.location.pathname === "/admin") {
        window.history.pushState({}, "", "/");
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === "/admin" || window.location.hash === "#admin") {
        setActiveTabState("admin");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Load persisted snap items or fallback to sample items
  const [snapItems, setSnapItems] = useState<SnapItem[]>(() => {
    try {
      const local = localStorage.getItem("edubridge_snap_items");
      if (local !== null) {
        return JSON.parse(local);
      }
    } catch (e) {
      console.error(e);
    }
    return SAMPLE_SNAP_ITEMS;
  });

  // Save snap items to localStorage whenever updated, stripping heavy base64 strings
  useEffect(() => {
    try {
      const sanitizedItems = snapItems.map((item) => {
        if (item.imageUrl && item.imageUrl.length > 5000) {
          const { imageUrl, ...rest } = item;
          return rest;
        }
        return item;
      });
      localStorage.setItem("edubridge_snap_items", JSON.stringify(sanitizedItems));
    } catch (e) {
      console.warn("localStorage quota exceeded or blocked:", e);
      try {
        const minimalItems = snapItems.slice(0, 3).map(({ imageUrl, chatHistory, ...rest }) => rest);
        localStorage.setItem("edubridge_snap_items", JSON.stringify(minimalItems));
      } catch (_) {}
    }
  }, [snapItems]);

  const handleAddSnapItem = (newItem: SnapItem) => {
    setSnapItems((prev) => [newItem, ...prev]);
  };

  const handleUpdateSnapItem = (updatedItem: SnapItem) => {
    setSnapItems((prev) => {
      const idx = prev.findIndex((i) => i.id === updatedItem.id);
      if (idx !== -1) {
        const newArr = [...prev];
        newArr[idx] = updatedItem;
        return newArr;
      }
      return [updatedItem, ...prev];
    });
  };

  const handleDeleteSnapItem = (id: string) => {
    setSnapItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem("edubridge_snap_items", JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  };

  const handleDeleteAllSnapItems = () => {
    setSnapItems([]);
    try {
      localStorage.setItem("edubridge_snap_items", JSON.stringify([]));
    } catch (_) {}
  };

  const handleResetSampleSnapItems = () => {
    setSnapItems(SAMPLE_SNAP_ITEMS);
    try {
      localStorage.setItem("edubridge_snap_items", JSON.stringify(SAMPLE_SNAP_ITEMS));
    } catch (_) {}
  };

  const handleSaveHighlightVocab = (vocab: VocabWord) => {
    setSnapItems((prev) => {
      const targetWord = vocab.word.trim().toLowerCase();

      // If snapItems is completely empty, create a dedicated notebook item
      if (prev.length === 0) {
        const notebookItem: SnapItem = {
          id: `notebook-${Date.now()}`,
          timestamp: Date.now(),
          title: "📓 個人生詞本 (Personal Vocab Bank)",
          subjectCategory: "Personal Vocabulary",
          ocrText: vocab.word,
          hkdseContext: "個人閱讀及對標 DSE 考評局高頻生詞本",
          translation: "個人生詞本",
          vocabulary: [vocab],
          grammarNotes: ["個人閱讀隨手收藏高頻生詞"],
          speechScript: vocab.word,
          knowledgeTags: ["#Saved_Vocab", "#Personal_Bank"],
          suggestedQuestions: [`How to use "${vocab.word}" in DSE Writing?`],
          chatHistory: [],
        };
        return [notebookItem];
      }

      // Check if word already exists in ANY item's vocabulary
      const existsInAny = prev.some((item) =>
        item.vocabulary.some((v) => v.word.trim().toLowerCase() === targetWord)
      );
      if (existsInAny) return prev;

      // Append to the first item's vocabulary list
      const first = prev[0];
      const updatedFirst = {
        ...first,
        vocabulary: [vocab, ...first.vocabulary],
      };
      return [updatedFirst, ...prev.slice(1)];
    });
  };

  const t = translations[lang];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#00FF88] selection:text-black flex flex-row">
      {/* Responsive Collapsible Left Sidebar (Desktop) */}
      {!isMobileMode && (
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          isMobileMode={isMobileMode}
          setIsMobileMode={setIsMobileMode}
          lang={lang}
          setLang={setLang}
          studentProfile={studentProfile}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          onOpenPromoModal={() => setIsPromoModalOpen(true)}
          onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
          investorMode={investorMode}
        />
      )}

      {/* Main Right Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen justify-between relative">
        {/* Top Header Bar */}
        <TopHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobileMode={isMobileMode}
          setIsMobileMode={setIsMobileMode}
          lang={lang}
          setLang={setLang}
          studentProfile={studentProfile}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          onOpenPromoModal={() => setIsPromoModalOpen(true)}
          onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
        />

        {/* Main View Area */}
        <main className="flex-1 pb-20 md:pb-6">
          {isMobileMode ? (
            <MobileStudentView
              snapItems={snapItems}
              onAddSnapItem={handleAddSnapItem}
              onUpdateSnapItem={handleUpdateSnapItem}
              onAddVocabToActiveItem={handleSaveHighlightVocab}
              onSwitchToPresentationMode={() => setIsMobileMode(false)}
              lang={lang}
              studentProfile={studentProfile}
              onOpenProfileModal={() => setIsProfileModalOpen(true)}
              onOpenPromoModal={() => setIsPromoModalOpen(true)}
              onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
            />
          ) : (
            <>
              {activeTab === "welcome" && (
                <ProductLaunchShowcase
                  lang={lang}
                  onEnterApp={(feature) => setActiveTab(feature ? (feature as TabType) : "home")}
                  onOpenPromoModal={() => setIsPromoModalOpen(true)}
                />
              )}

              {activeTab === "home" && (
                <HomeHub
                  lang={lang}
                  onSelectFeature={(feat) => setActiveTab(feat as TabType)}
                  investorMode={investorMode}
                  onOpenPromoModal={() => setIsPromoModalOpen(true)}
                />
              )}

              {activeTab === "snap" && (
                <SnapAndLearn
                  snapItems={snapItems}
                  onAddSnapItem={handleAddSnapItem}
                  onUpdateSnapItem={handleUpdateSnapItem}
                  onDeleteSnapItem={handleDeleteSnapItem}
                  onAddVocabToActiveItem={handleSaveHighlightVocab}
                  investorMode={investorMode}
                  lang={lang}
                />
              )}

              {activeTab === "discussion" && (
                <GroupDiscussion investorMode={investorMode} lang={lang} />
              )}

              {activeTab === "knowledge" && (
                <KnowledgeBase
                  snapItems={snapItems}
                  onAddSnapItem={handleAddSnapItem}
                  onDeleteSnapItem={handleDeleteSnapItem}
                  onDeleteAllSnapItems={handleDeleteAllSnapItems}
                  onResetSampleSnapItems={handleResetSampleSnapItems}
                  onAddVocabToActiveItem={handleSaveHighlightVocab}
                  investorMode={investorMode}
                  lang={lang}
                />
              )}

              {activeTab === "investor" && (
                <InvestorHub investorMode={investorMode} lang={lang} />
              )}

              {activeTab === "admin" && (
                <AdminConsole lang={lang} />
              )}
            </>
          )}
        </main>

        {/* Mobile Bottom Navigation Bar (Shown on small screens) */}
        {!isMobileMode && (
          <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} lang={lang} />
        )}

      {/* Footer / Status Bar */}
      <footer className="border-t border-white/10 bg-[#080808] py-8 px-4 sm:px-6 lg:px-8 text-xs text-white/50 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#00FF88] text-black flex items-center justify-center font-black shadow-[0_0_15px_rgba(0,255,136,0.2)]">
                <GraduationCap className="w-5 h-5 text-black" />
              </div>
              <div>
                <p className="font-black tracking-tight text-white uppercase text-sm">
                  EduBridge <span className="text-[#00FF88]">HK</span>
                </p>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">
                  {lang === "zh-CN"
                    ? "专为香港新移民学生适应 HKDSE 课程打造的多模态与多智能体 AI 平台"
                    : lang === "zh-HK"
                    ? "專為香港新移民學生適應 HKDSE 課程打造的多模態與多智能體 AI 平台"
                    : "Multimodal & Multi-agent AI Platform for HK New Immigrant Students Adaptability"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-widest text-white/40">
              <button
                onClick={() => setIsSubscriptionModalOpen(true)}
                className="hover:text-[#00FF88] text-[#00FF88] transition-colors font-black flex items-center gap-1.5 bg-[#00FF88]/10 border border-[#00FF88]/30 px-2.5 py-1 rounded-lg"
              >
                <CreditCard className="w-3.5 h-3.5 text-yellow-300" />
                <span>{lang === "en" ? "Subscription Plans" : lang === "zh-CN" ? "订阅计划" : "訂閱計劃"}</span>
              </button>
              <span className="text-white/20">•</span>
              <button onClick={() => setActiveTab("investor")} className="hover:text-[#00FF88] transition-colors font-bold">
                {lang === "zh-CN" ? "商业模式与投资人专区" : lang === "zh-HK" ? "商業模式與投資人專區" : "Business Model & Investor Hub"}
              </button>
              <span className="text-white/20">•</span>
              <button onClick={() => setActiveTab("admin")} className="hover:text-[#00FF88] text-[#00FF88]/90 transition-colors font-bold flex items-center gap-1">
                <Shield className="w-3 h-3 text-[#00FF88]" />
                <span>{lang === "zh-CN" ? "AI 架构与后台" : lang === "zh-HK" ? "AI 架構與後台" : "Admin Console"}</span>
              </button>
              <span className="text-white/20">•</span>
              <span className="text-white/30">© 2026 EduBridge HK Tech Ltd. All Rights Reserved.</span>
            </div>
          </div>

          {/* iOS & Android Support Coming Soon Badges */}
          <div className="pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/assets/IMG/ICON/iOS_Android.png"
                alt="iOS & Android Support Coming Soon"
                className="h-9 sm:h-11 object-contain rounded-xl hover:scale-105 transition-transform"
              />
            </div>

            <div className="flex items-center gap-3">
              <img
                src="/assets/IMG/ICON/App_Store_badge.png"
                alt="App Store (Coming Soon)"
                className="h-9 sm:h-11 object-contain rounded-xl hover:scale-105 transition-transform"
              />
              <img
                src="/assets/IMG/ICON/Google_Play_badge.png"
                alt="Google Play (Coming Soon)"
                className="h-9 sm:h-11 object-contain rounded-xl hover:scale-105 transition-transform"
              />
            </div>
          </div>
        </div>
      </footer>
      </div>

      {/* Global AI Selection Highlight Reader & Instant Translator */}
      <HighlightReaderPopover
        lang={lang}
        onAddVocabToActiveItem={handleSaveHighlightVocab}
      />

      {/* Student Onboarding Profile Modal */}
      <StudentProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSaveProfile={handleSaveStudentProfile}
        currentProfile={studentProfile}
        lang={lang}
      />

      {/* DSE Promo Poster Showcase Modal */}
      <PromoShowcaseModal
        isOpen={isPromoModalOpen}
        onClose={() => setIsPromoModalOpen(false)}
        lang={lang}
        onNavigateToFeature={(feature) => {
          if (feature === "snap") setActiveTab("snap");
          else if (feature === "oral") setActiveTab("discussion");
          else if (feature === "knowledge") setActiveTab("knowledge");
          else if (feature === "discussion") setActiveTab("discussion");
        }}
      />

      {/* Subscription Plans & Payment Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        lang={lang}
      />
    </div>
  );
}
