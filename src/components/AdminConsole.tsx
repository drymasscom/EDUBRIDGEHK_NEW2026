import React, { useState, useEffect } from "react";
import {
  Cpu,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Activity,
  Shield,
  Layers,
  Sparkles,
  Server,
  ArrowRight,
  Terminal,
  Clock,
  Key
} from "lucide-react";
import { Language } from "../utils/i18n";

interface AdminConsoleProps {
  lang: Language;
}

type ProviderOption = "lmzh" | "gemini" | "openrouter";

interface ProviderStatusData {
  providers: {
    text_generation: ProviderOption;
    article_generation: ProviderOption;
    tutor_chat: ProviderOption;
    group_discussion: ProviderOption;
    translation: ProviderOption;
    ocr_provider: "groq" | "gemini";
  };
  stats: {
    todayDate: string;
    openrouterCount: number;
    openrouterLimit: number; // 50
    geminiCount: number;
    lmzhCount?: number;
    groqCount?: number;
    openrouterErrors: number;
    lmzhErrors?: number;
    groqErrors?: number;
    lastUsedProvider: { [key: string]: string };
  };
  openrouterKeyConfigured: boolean;
  geminiKeyConfigured: boolean;
  groqKeyConfigured?: boolean;
  lmzhKeyConfigured?: boolean;
  lmzhBaseUrl?: string;
  lmzhModel?: string;
  openrouterModel: string;
  groqModel?: string;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({ lang }) => {
  const [data, setData] = useState<ProviderStatusData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // LMZH Config States
  const [lmzhKeyInput, setLmzhKeyInput] = useState<string>("");
  const [lmzhBaseUrlInput, setLmzhBaseUrlInput] = useState<string>("https://lmzh.top/v1");
  const [lmzhModelInput, setLmzhModelInput] = useState<string>("gpt-5-2025-08-07");
  const [isSavingLmzh, setIsSavingLmzh] = useState<boolean>(false);
  const [lmzhSaveMessage, setLmzhSaveMessage] = useState<string | null>(null);

  // Testing states
  const [testingLmzh, setTestingLmzh] = useState<boolean>(false);
  const [lmzhTestResult, setLmzhTestResult] = useState<{
    success: boolean;
    message: string;
    responseTimeMs?: number;
    sampleOutput?: string;
    modelUsed?: string;
  } | null>(null);

  const [testingOpenRouter, setTestingOpenRouter] = useState<boolean>(false);
  const [openRouterTestResult, setOpenRouterTestResult] = useState<{
    success: boolean;
    message: string;
    responseTimeMs?: number;
    sampleOutput?: string;
    reasoningEnabled?: boolean;
  } | null>(null);

  const [testingGemini, setTestingGemini] = useState<boolean>(false);
  const [geminiTestResult, setGeminiTestResult] = useState<{
    success: boolean;
    message: string;
    responseTimeMs?: number;
    sampleOutput?: string;
  } | null>(null);

  const [testingGroq, setTestingGroq] = useState<boolean>(false);
  const [groqTestResult, setGroqTestResult] = useState<{
    success: boolean;
    message: string;
    responseTimeMs?: number;
    sampleOutput?: string;
    modelUsed?: string;
  } | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch("/api/admin/provider-status", { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load provider status`);
      const json = await res.json();
      setData(json);
      if (json.lmzhBaseUrl) setLmzhBaseUrlInput(json.lmzhBaseUrl);
      if (json.lmzhModel) setLmzhModelInput(json.lmzhModel);
      setError(null);
    } catch (err: any) {
      console.warn("fetchStatus error:", err);
      const errMsg = err.name === "AbortError" ? "Status request timed out (5s). Using local configuration mode." : (err.message || "Network error fetching provider status");
      setError(errMsg);
      // Ensure AdminConsole loads with fallback state even if network fails
      setData((prev) => prev || {
        providers: {
          text_generation: "gemini",
          article_generation: "gemini",
          tutor_chat: "gemini",
          group_discussion: "gemini",
          translation: "gemini",
          ocr_provider: "gemini",
        },
        stats: {
          todayDate: new Date().toISOString().slice(0, 10),
          openrouterCount: 0,
          openrouterLimit: 50,
          geminiCount: 0,
          openrouterErrors: 0,
          lastUsedProvider: {},
        },
        openrouterKeyConfigured: true,
        geminiKeyConfigured: true,
        lmzhKeyConfigured: true,
        lmzhBaseUrl: "https://lmzh.top/v1",
        lmzhModel: "gpt-5-2025-08-07",
        openrouterModel: "openrouter/free",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSaveLmzhConfig = async () => {
    setIsSavingLmzh(true);
    setLmzhSaveMessage(null);
    try {
      const res = await fetch("/api/admin/set-lmzh-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: lmzhKeyInput,
          baseUrl: lmzhBaseUrlInput,
          model: lmzhModelInput,
        }),
      });
      if (!res.ok) throw new Error("Failed to save LMZH configuration");
      const result = await res.json();
      setLmzhSaveMessage("⚡ LMZH Node API Key & Configuration saved successfully!");
      fetchStatus();
    } catch (err: any) {
      alert("Error saving LMZH config: " + err.message);
    } finally {
      setIsSavingLmzh(false);
    }
  };

  const handleSetProvider = async (feature: string, provider: ProviderOption | "groq") => {
    try {
      const res = await fetch("/api/admin/set-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature, provider }),
      });
      if (!res.ok) throw new Error("Failed to update provider");
      const updated = await res.json();
      setData((prev) => (prev ? { ...prev, providers: updated.providers } : prev));
    } catch (err: any) {
      alert("Error updating provider: " + err.message);
    }
  };

  const handleTestProvider = async (provider: "lmzh" | "openrouter" | "gemini" | "groq") => {
    if (provider === "lmzh") {
      setTestingLmzh(true);
      setLmzhTestResult(null);
    } else if (provider === "openrouter") {
      setTestingOpenRouter(true);
      setOpenRouterTestResult(null);
    } else if (provider === "gemini") {
      setTestingGemini(true);
      setGeminiTestResult(null);
    } else {
      setTestingGroq(true);
      setGroqTestResult(null);
    }

    try {
      const res = await fetch("/api/admin/test-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          lmzhKey: lmzhKeyInput || undefined,
          lmzhBaseUrl: lmzhBaseUrlInput || undefined,
          lmzhModel: lmzhModelInput || undefined,
        }),
      });
      const json = await res.json();

      if (provider === "lmzh") setLmzhTestResult(json);
      else if (provider === "openrouter") setOpenRouterTestResult(json);
      else if (provider === "gemini") setGeminiTestResult(json);
      else setGroqTestResult(json);

      fetchStatus();
    } catch (err: any) {
      const failObj = { success: false, message: err.message || "Test call failed" };
      if (provider === "lmzh") setLmzhTestResult(failObj);
      else if (provider === "openrouter") setOpenRouterTestResult(failObj);
      else if (provider === "gemini") setGeminiTestResult(failObj);
      else setGroqTestResult(failObj);
    } finally {
      if (provider === "lmzh") setTestingLmzh(false);
      else if (provider === "openrouter") setTestingOpenRouter(false);
      else if (provider === "gemini") setTestingGemini(false);
      else setTestingGroq(false);
    }
  };

  const handleResetCounter = async () => {
    if (!window.confirm("Reset today's OpenRouter request counter?")) return;
    try {
      const res = await fetch("/api/admin/reset-counter", { method: "POST" });
      if (res.ok) fetchStatus();
    } catch (err: any) {
      alert("Failed to reset counter: " + err.message);
    }
  };

  const openrouterUsagePercent = data
    ? Math.min(100, Math.round((data.stats.openrouterCount / data.stats.openrouterLimit) * 100))
    : 0;

  const isNearLimit = data && data.stats.openrouterCount >= 45;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="relative bg-gradient-to-r from-neutral-900 via-black to-emerald-950 border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#00FF88]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00FF88]/15 border border-[#00FF88]/40 text-[#00FF88] text-xs font-black uppercase tracking-wider">
              <Shield className="w-4 h-4 text-[#00FF88]" />
              <span>EduBridge AI Provider Abstraction Engine</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">
              ⚙️ System Admin Console
            </h1>
            <p className="text-xs sm:text-sm text-white/70 max-w-2xl font-sans">
              Manage AI Model Providers, OpenRouter Free Tier Routing (<code className="text-[#00FF88]">nvidia/nemotron-3-ultra-550b-a55b:free</code>), Gemini Multi-Model Fallbacks, and Rate Limit Metrics.
            </p>
          </div>

          <button
            onClick={fetchStatus}
            disabled={loading}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shrink-0 active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 text-[#00FF88] ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Status</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      {loading && !data ? (
        <div className="bg-neutral-900/80 border border-white/10 rounded-3xl p-12 text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-[#00FF88] animate-spin mx-auto" />
          <p className="text-sm font-bold text-white/70">Connecting to AI Abstraction Layer...</p>
        </div>
      ) : error ? (
        <div className="bg-red-950/40 border border-red-500/50 rounded-3xl p-6 text-red-200 flex items-center gap-4">
          <AlertTriangle className="w-8 h-8 text-red-400 shrink-0" />
          <div>
            <h3 className="font-bold text-base">Error Loading Admin Console</h3>
            <p className="text-xs opacity-80">{error}</p>
          </div>
        </div>
      ) : data ? (
        <>
          {/* Rate Limit Alert Banner if near 50 req/day */}
          {isNearLimit && (
            <div className="bg-amber-950/60 border-2 border-amber-500/80 rounded-3xl p-5 text-amber-200 flex items-start sm:items-center gap-4 shadow-xl animate-pulse">
              <AlertTriangle className="w-7 h-7 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
              <div className="flex-1 space-y-1">
                <h4 className="font-black text-sm uppercase tracking-wider text-amber-300">
                  ⚠️ OpenRouter Free Tier Limit Warning ({data.stats.openrouterCount} / {data.stats.openrouterLimit} Requests Today)
                </h4>
                <p className="text-xs text-amber-200/90 leading-relaxed font-sans">
                  You are approaching the 50 request/day limit for OpenRouter free model (<code className="text-amber-100 font-mono">nvidia/nemotron-3-ultra-550b-a55b:free</code>). Requests will automatically fall back to Gemini without interrupting student learning.
                </p>
              </div>
            </div>
          )}

          {/* Top Row: Provider Usage & Key Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: LMZH High-Speed Node */}
            <div className="bg-gradient-to-br from-neutral-900 via-black to-emerald-950/60 border-2 border-emerald-500/60 rounded-3xl p-6 space-y-4 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500 text-black font-black flex items-center justify-center">
                    <Zap className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-white">LMZH Fast Node</h3>
                    <p className="text-[10px] text-emerald-400 font-mono font-bold">OpenAI Gateway API</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                  data.lmzhKeyConfigured ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-300" : "bg-neutral-800 text-white/50 border border-white/10"
                }`}>
                  {data.lmzhKeyConfigured ? "CONFIGURED" : "SETUP NEEDED"}
                </span>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/10 text-xs font-bold">
                <div className="flex justify-between">
                  <span className="text-white/70">Endpoint:</span>
                  <span className="text-emerald-300 font-mono text-[11px] truncate max-w-[170px]">
                    {data.lmzhBaseUrl || "https://lmzh.top/v1"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Model:</span>
                  <span className="text-white font-mono text-[11px]">
                    {data.lmzhModel || "gpt-5-2025-08-07"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">API Key:</span>
                  <span className={data.lmzhKeyConfigured ? "text-emerald-400 flex items-center gap-1" : "text-amber-400"}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {data.lmzhKeyConfigured ? "Active Key Set" : "Not Set"}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-between items-center text-xs font-black">
                <span className="text-white/80">LMZH Calls Today:</span>
                <span className="text-emerald-400 font-bold text-sm">{data.stats.lmzhCount || 0}</span>
              </div>
            </div>

            {/* Card 2: OpenRouter Status */}
            <div className="bg-gradient-to-br from-neutral-900 via-black to-neutral-900 border-2 border-[#00FF88]/40 rounded-3xl p-6 space-y-4 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#00FF88] text-black font-black flex items-center justify-center">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-white">OpenRouter AI</h3>
                    <p className="text-[10px] text-[#00FF88] font-mono font-bold">Free Models Gateway</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#00FF88]/20 border border-[#00FF88]/50 text-[#00FF88] text-[10px] font-black uppercase">
                  FREE TIER
                </span>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-white/70">Model:</span>
                  <span className="text-white font-mono text-[11px] truncate max-w-[160px]">
                    openrouter/free
                  </span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-white/70">API Key Status:</span>
                  <span className="text-[#00FF88] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Configured
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-black">
                  <span className="text-white/80">Daily Used:</span>
                  <span className={isNearLimit ? "text-amber-400 font-bold" : "text-[#00FF88]"}>
                    {data.stats.openrouterCount} / {data.stats.openrouterLimit}
                  </span>
                </div>
                <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden border border-white/10">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isNearLimit ? "bg-amber-400" : "bg-[#00FF88]"
                    }`}
                    style={{ width: `${openrouterUsagePercent}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-white/50 pt-1">
                <span>Errors: {data.stats.openrouterErrors}</span>
                <button
                  onClick={handleResetCounter}
                  className="text-[#00FF88] hover:underline font-bold text-[10px]"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Card 3: Gemini Fallback Status */}
            <div className="bg-gradient-to-br from-neutral-900 via-black to-neutral-900 border-2 border-blue-500/40 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-500 text-white font-black flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-white">Google Gemini</h3>
                    <p className="text-[10px] text-blue-300 font-mono font-bold">Fast Ultra Engine</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-300 text-[10px] font-black uppercase">
                  READY
                </span>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-white/70">Model:</span>
                  <span className="text-white font-mono text-[11px]">gemini-3.6-flash</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-white/70">API Key:</span>
                  <span className="text-blue-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Configured
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-between items-center text-xs font-black">
                <span className="text-white/80">Gemini Calls Today:</span>
                <span className="text-blue-400 font-bold text-sm">{data.stats.geminiCount}</span>
              </div>
            </div>

            {/* Card 4: Groq Vision OCR Status */}
            <div className="bg-gradient-to-br from-neutral-900 via-black to-neutral-900 border-2 border-amber-500/50 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-black font-black flex items-center justify-center">
                    <Zap className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-white">Groq Vision</h3>
                    <p className="text-[10px] text-amber-300 font-mono font-bold">OCR Acceleration</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[10px] font-black uppercase">
                  DEFAULT OCR
                </span>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-white/70">Model:</span>
                  <span className="text-amber-300 font-mono text-[11px]">qwen3.6-27b</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-white/70">API Key:</span>
                  <span className={data.groqKeyConfigured ? "text-amber-300 flex items-center gap-1" : "text-amber-500/70"}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {data.groqKeyConfigured ? "Configured" : "Missing Key"}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-between items-center text-xs font-black">
                <span className="text-white/80">OCR Today:</span>
                <span className="text-amber-400 font-bold text-sm">{data.stats.groqCount || 0}</span>
              </div>
            </div>
          </div>

          {/* LMZH Key & Base URL Settings Box */}
          <div className="bg-neutral-900/90 border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <Zap className="w-6 h-6 text-emerald-400" />
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">
                    ⚡ LMZH Custom API Node Configuration
                  </h2>
                  <p className="text-xs text-white/60 font-sans">
                    Connect your custom OpenAI-compatible high-speed gateway endpoint (<code className="text-emerald-400">https://lmzh.top/v1</code>).
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/80">LMZH API Key:</label>
                <input
                  type="password"
                  placeholder="Paste LMZH API Key (e.g. sk-...)"
                  value={lmzhKeyInput}
                  onChange={(e) => setLmzhKeyInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/80 border border-white/20 focus:border-emerald-400 rounded-xl text-xs font-mono text-white focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-white/80">Base Gateway URL:</label>
                <input
                  type="text"
                  placeholder="https://lmzh.top/v1"
                  value={lmzhBaseUrlInput}
                  onChange={(e) => setLmzhBaseUrlInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/80 border border-white/20 focus:border-emerald-400 rounded-xl text-xs font-mono text-white focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-white/80">Target Model Name:</label>
                <input
                  type="text"
                  placeholder="gpt-5-2025-08-07"
                  value={lmzhModelInput}
                  onChange={(e) => setLmzhModelInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/80 border border-white/20 focus:border-emerald-400 rounded-xl text-xs font-mono text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-white/10">
              {lmzhSaveMessage ? (
                <span className="text-xs font-bold text-emerald-400 animate-fadeIn">{lmzhSaveMessage}</span>
              ) : (
                <span className="text-xs text-white/50">Saving updates the active in-memory AI dispatcher node instantly.</span>
              )}

              <button
                onClick={handleSaveLmzhConfig}
                disabled={isSavingLmzh}
                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
              >
                {isSavingLmzh ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                <span>Save LMZH Gateway Config</span>
              </button>
            </div>
          </div>

          {/* Section: Feature Provider Routing Switcher */}
          <div className="bg-neutral-900/90 border border-white/15 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <Layers className="w-6 h-6 text-[#00FF88]" />
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">
                    Feature Provider Routing Switcher
                  </h2>
                  <p className="text-xs text-white/60 font-sans">
                    Configure preferred AI provider for each core app module.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Feature 1: Text Generation */}
              <div className="bg-black/80 border border-white/10 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#00FF88] font-bold uppercase">
                      text_generation
                    </span>
                    <span className="text-[10px] text-white/40 font-bold">Snap OCR / Vocab</span>
                  </div>
                  <h4 className="font-black text-sm text-white mt-1">📸 Text & Vocab Analysis</h4>
                  <p className="text-[11px] text-white/60 font-sans mt-1 leading-normal">
                    OCR text breakdown, vocabulary levels & grammar rules.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="text-[10px] text-white/50 font-bold">Active Route:</div>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => handleSetProvider("text_generation", "lmzh")}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                        data.providers.text_generation === "lmzh"
                          ? "bg-emerald-400 text-black shadow-md"
                          : "bg-white/5 text-white/60 border border-white/10 hover:text-white"
                      }`}
                    >
                      LMZH
                    </button>
                    <button
                      onClick={() => handleSetProvider("text_generation", "gemini")}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                        data.providers.text_generation === "gemini"
                          ? "bg-blue-500 text-white shadow-md"
                          : "bg-white/5 text-white/60 border border-white/10 hover:text-white"
                      }`}
                    >
                      Gemini
                    </button>
                    <button
                      onClick={() => handleSetProvider("text_generation", "openrouter")}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                        data.providers.text_generation === "openrouter"
                          ? "bg-[#00FF88] text-black shadow-md"
                          : "bg-white/5 text-white/60 border border-white/10 hover:text-white"
                      }`}
                    >
                      OpenRouter
                    </button>
                  </div>
                </div>
              </div>

              {/* Feature 2: Article Generation */}
              <div className="bg-black/80 border border-white/10 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#00FF88] font-bold uppercase">
                      article_generation
                    </span>
                    <span className="text-[10px] text-white/40 font-bold">DSE Passages</span>
                  </div>
                  <h4 className="font-black text-sm text-white mt-1">📚 Reading Passage Generator</h4>
                  <p className="text-[11px] text-white/60 font-sans mt-1 leading-normal">
                    Generates 80-word DSE Paper 1 reading articles & topics.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="text-[10px] text-white/50 font-bold">Active Route:</div>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => handleSetProvider("article_generation", "lmzh")}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                        data.providers.article_generation === "lmzh"
                          ? "bg-emerald-400 text-black shadow-md"
                          : "bg-white/5 text-white/60 border border-white/10 hover:text-white"
                      }`}
                    >
                      LMZH
                    </button>
                    <button
                      onClick={() => handleSetProvider("article_generation", "gemini")}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                        data.providers.article_generation === "gemini"
                          ? "bg-blue-500 text-white shadow-md"
                          : "bg-white/5 text-white/60 border border-white/10 hover:text-white"
                      }`}
                    >
                      Gemini
                    </button>
                    <button
                      onClick={() => handleSetProvider("article_generation", "openrouter")}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                        data.providers.article_generation === "openrouter"
                          ? "bg-[#00FF88] text-black shadow-md"
                          : "bg-white/5 text-white/60 border border-white/10 hover:text-white"
                      }`}
                    >
                      OpenRouter
                    </button>
                  </div>
                </div>
              </div>

              {/* Feature 3: Tutor Chat */}
              <div className="bg-black/80 border border-white/10 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#00FF88] font-bold uppercase">
                      tutor_chat
                    </span>
                    <span className="text-[10px] text-white/40 font-bold">British Voice</span>
                  </div>
                  <h4 className="font-black text-sm text-white mt-1">🎧 AI Audio Tutor Chat</h4>
                  <p className="text-[11px] text-white/60 font-sans mt-1 leading-normal">
                    Concise British English tutor explanations & Q&A.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="text-[10px] text-white/50 font-bold">Active Route:</div>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => handleSetProvider("tutor_chat", "lmzh")}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                        data.providers.tutor_chat === "lmzh"
                          ? "bg-emerald-400 text-black shadow-md"
                          : "bg-white/5 text-white/60 border border-white/10 hover:text-white"
                      }`}
                    >
                      LMZH
                    </button>
                    <button
                      onClick={() => handleSetProvider("tutor_chat", "gemini")}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                        data.providers.tutor_chat === "gemini"
                          ? "bg-blue-500 text-white shadow-md"
                          : "bg-white/5 text-white/60 border border-white/10 hover:text-white"
                      }`}
                    >
                      Gemini
                    </button>
                    <button
                      onClick={() => handleSetProvider("tutor_chat", "openrouter")}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                        data.providers.tutor_chat === "openrouter"
                          ? "bg-[#00FF88] text-black shadow-md"
                          : "bg-white/5 text-white/60 border border-white/10 hover:text-white"
                      }`}
                    >
                      OpenRouter
                    </button>
                  </div>
                </div>
              </div>

              {/* Feature 4: Group Discussion */}
              <div className="bg-black/80 border border-white/10 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#00FF88] font-bold uppercase">
                      group_discussion
                    </span>
                    <span className="text-[10px] text-white/40 font-bold">Paper 4 Oral</span>
                  </div>
                  <h4 className="font-black text-sm text-white mt-1">💬 DSE 4-Player AI Oral</h4>
                  <p className="text-[11px] text-white/60 font-sans mt-1 leading-normal">
                    Multi-agent student persona candidates (Alex, Brenda, Chris).
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="text-[10px] text-white/50 font-bold">Active Route:</div>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => handleSetProvider("group_discussion", "lmzh")}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                        data.providers.group_discussion === "lmzh"
                          ? "bg-emerald-400 text-black shadow-md"
                          : "bg-white/5 text-white/60 border border-white/10 hover:text-white"
                      }`}
                    >
                      LMZH
                    </button>
                    <button
                      onClick={() => handleSetProvider("group_discussion", "gemini")}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                        data.providers.group_discussion === "gemini"
                          ? "bg-blue-500 text-white shadow-md"
                          : "bg-white/5 text-white/60 border border-white/10 hover:text-white"
                      }`}
                    >
                      Gemini
                    </button>
                    <button
                      onClick={() => handleSetProvider("group_discussion", "openrouter")}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                        data.providers.group_discussion === "openrouter"
                          ? "bg-[#00FF88] text-black shadow-md"
                          : "bg-white/5 text-white/60 border border-white/10 hover:text-white"
                      }`}
                    >
                      OpenRouter
                    </button>
                  </div>
                </div>
              </div>

              {/* Feature 5: Instant Translation */}
              <div className="bg-black/80 border border-white/10 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#00FF88] font-bold uppercase">
                      translation
                    </span>
                    <span className="text-[10px] text-white/40 font-bold">Highlight Popover</span>
                  </div>
                  <h4 className="font-black text-sm text-white mt-1">🔤 Instant Selection Translate</h4>
                  <p className="text-[11px] text-white/60 font-sans mt-1 leading-normal">
                    Highlight text reader popover translation & IPA analysis.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="text-[10px] text-white/50 font-bold">Active Route:</div>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => handleSetProvider("translation", "lmzh")}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                        data.providers.translation === "lmzh"
                          ? "bg-emerald-400 text-black shadow-md"
                          : "bg-white/5 text-white/60 border border-white/10 hover:text-white"
                      }`}
                    >
                      LMZH
                    </button>
                    <button
                      onClick={() => handleSetProvider("translation", "gemini")}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                        data.providers.translation === "gemini"
                          ? "bg-blue-500 text-white shadow-md"
                          : "bg-white/5 text-white/60 border border-white/10 hover:text-white"
                      }`}
                    >
                      Gemini
                    </button>
                    <button
                      onClick={() => handleSetProvider("translation", "openrouter")}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                        data.providers.translation === "openrouter"
                          ? "bg-[#00FF88] text-black shadow-md"
                          : "bg-white/5 text-white/60 border border-white/10 hover:text-white"
                      }`}
                    >
                      OpenRouter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Live Provider Connection Testers */}
          <div className="bg-neutral-900/90 border border-white/15 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <Activity className="w-6 h-6 text-[#00FF88]" />
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">
                    Live Provider Diagnostics & Speed Benchmark
                  </h2>
                  <p className="text-xs text-white/60 font-sans">
                    Test response latency (in ms) and connectivity across LMZH, Gemini, OpenRouter, and Groq.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Test Box 1: LMZH Speed Test */}
              <div className="bg-black/90 border-2 border-emerald-500/40 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-black text-sm text-white">Test LMZH Node Speed</h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-300 truncate max-w-[110px]">
                    {data.lmzhModel || "gpt-5-2025-08-07"}
                  </span>
                </div>

                <p className="text-xs text-white/60 font-sans">
                  Sends live prompt to <code className="text-emerald-400 font-mono">https://lmzh.top/v1</code> and measures millisecond speed response.
                </p>

                <button
                  onClick={() => handleTestProvider("lmzh")}
                  disabled={testingLmzh}
                  className="w-full py-3 bg-emerald-400 hover:bg-emerald-300 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${testingLmzh ? "animate-spin" : ""}`} />
                  <span>{testingLmzh ? "Benchmarking LMZH..." : "⚡ Run LMZH Speed Test"}</span>
                </button>

                {lmzhTestResult && (
                  <div
                    className={`rounded-xl p-4 border space-y-2 text-xs font-mono ${
                      lmzhTestResult.success
                        ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-200"
                        : "bg-red-950/40 border-red-500/50 text-red-200"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        {lmzhTestResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        )}
                        {lmzhTestResult.success ? "Node Operational" : "Test Failed"}
                      </span>
                      {lmzhTestResult.responseTimeMs !== undefined && (
                        <span className="text-emerald-300 text-[11px] font-black flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                          <Clock className="w-3 h-3 text-emerald-400" />
                          {lmzhTestResult.responseTimeMs} ms
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] opacity-90 leading-relaxed font-sans">
                      {lmzhTestResult.message}
                    </p>
                    {lmzhTestResult.sampleOutput && (
                      <div className="bg-black/70 p-2.5 rounded-lg border border-white/10 text-[10px] text-white/80 overflow-x-auto max-h-32 leading-relaxed">
                        {lmzhTestResult.sampleOutput}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Test Box 1: OpenRouter Test */}
              <div className="bg-black/90 border border-white/15 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-[#00FF88]" />
                    <h3 className="font-black text-sm text-white">Test OpenRouter API</h3>
                  </div>
                  <span className="text-[10px] font-mono text-[#00FF88]">
                    nvidia/nemotron-3-ultra-550b-a55b:free
                  </span>
                </div>

                <p className="text-xs text-white/60 font-sans">
                  Sends a test prompt with <code className="text-[#00FF88] font-mono">reasoning: &#123;enabled: true&#125;</code> to verify OpenRouter free tier connectivity.
                </p>

                <button
                  onClick={() => handleTestProvider("openrouter")}
                  disabled={testingOpenRouter}
                  className="w-full py-3 bg-[#00FF88] hover:bg-[#00e67a] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${testingOpenRouter ? "animate-spin" : ""}`} />
                  <span>{testingOpenRouter ? "Testing OpenRouter..." : "Run OpenRouter Test"}</span>
                </button>

                {openRouterTestResult && (
                  <div
                    className={`rounded-xl p-4 border space-y-2 text-xs font-mono ${
                      openRouterTestResult.success
                        ? "bg-emerald-950/40 border-[#00FF88]/50 text-emerald-200"
                        : "bg-red-950/40 border-red-500/50 text-red-200"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        {openRouterTestResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-[#00FF88]" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        )}
                        {openRouterTestResult.success ? "Connection Success" : "Test Failed"}
                      </span>
                      {openRouterTestResult.responseTimeMs && (
                        <span className="text-white/60 text-[10px] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#00FF88]" />
                          {openRouterTestResult.responseTimeMs} ms
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] opacity-90 leading-relaxed font-sans">
                      {openRouterTestResult.message}
                    </p>
                    {openRouterTestResult.sampleOutput && (
                      <div className="bg-black/70 p-2.5 rounded-lg border border-white/10 text-[10px] text-white/80 overflow-x-auto max-h-32 leading-relaxed">
                        {openRouterTestResult.sampleOutput}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Test Box 2: Gemini Test */}
              <div className="bg-black/90 border border-white/15 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                    <h3 className="font-black text-sm text-white">Test Google Gemini API</h3>
                  </div>
                  <span className="text-[10px] font-mono text-blue-300">
                    gemini-3.6-flash
                  </span>
                </div>

                <p className="text-xs text-white/60 font-sans">
                  Sends a test prompt directly to Gemini SDK to verify fallback resilience.
                </p>

                <button
                  onClick={() => handleTestProvider("gemini")}
                  disabled={testingGemini}
                  className="w-full py-3 bg-blue-500 hover:bg-blue-400 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${testingGemini ? "animate-spin" : ""}`} />
                  <span>{testingGemini ? "Testing Gemini..." : "Run Gemini Test"}</span>
                </button>

                {geminiTestResult && (
                  <div
                    className={`rounded-xl p-4 border space-y-2 text-xs font-mono ${
                      geminiTestResult.success
                        ? "bg-blue-950/40 border-blue-500/50 text-blue-200"
                        : "bg-red-950/40 border-red-500/50 text-red-200"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        {geminiTestResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-blue-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        )}
                        {geminiTestResult.success ? "Connection Success" : "Test Failed"}
                      </span>
                      {geminiTestResult.responseTimeMs && (
                        <span className="text-white/60 text-[10px] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-400" />
                          {geminiTestResult.responseTimeMs} ms
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] opacity-90 leading-relaxed font-sans">
                      {geminiTestResult.message}
                    </p>
                    {geminiTestResult.sampleOutput && (
                      <div className="bg-black/70 p-2.5 rounded-lg border border-white/10 text-[10px] text-white/80 overflow-x-auto max-h-32 leading-relaxed">
                        {geminiTestResult.sampleOutput}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Test Box 3: Groq Test */}
              <div className="bg-black/90 border border-amber-500/30 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <h3 className="font-black text-sm text-white">Test Groq Vision OCR</h3>
                  </div>
                  <span className="text-[10px] font-mono text-amber-300">
                    qwen/qwen3.6-27b
                  </span>
                </div>

                <p className="text-xs text-white/60 font-sans">
                  Tests Groq multimodal vision API connectivity for ultra-fast OCR text analysis.
                </p>

                <button
                  onClick={() => handleTestProvider("groq")}
                  disabled={testingGroq}
                  className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${testingGroq ? "animate-spin" : ""}`} />
                  <span>{testingGroq ? "Testing Groq..." : "Run Groq OCR Test"}</span>
                </button>

                {groqTestResult && (
                  <div
                    className={`rounded-xl p-4 border space-y-2 text-xs font-mono ${
                      groqTestResult.success
                        ? "bg-amber-950/40 border-amber-500/50 text-amber-200"
                        : "bg-red-950/40 border-red-500/50 text-red-200"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        {groqTestResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-amber-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        )}
                        {groqTestResult.success ? "Connection Success" : "Test Failed"}
                      </span>
                      {groqTestResult.responseTimeMs && (
                        <span className="text-white/60 text-[10px] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          {groqTestResult.responseTimeMs} ms
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] opacity-90 leading-relaxed font-sans">
                      {groqTestResult.message}
                    </p>
                    {groqTestResult.sampleOutput && (
                      <div className="bg-black/70 p-2.5 rounded-lg border border-white/10 text-[10px] text-white/80 overflow-x-auto max-h-32 leading-relaxed">
                        {groqTestResult.sampleOutput}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
