import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  BookOpen,
  Volume2,
  VolumeX,
  Bookmark,
  Copy,
  RotateCcw,
  Heart,
  Compass,
  Trash2,
  Play,
  Pause,
  PenTool,
  Trees,
  Check,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { THEME_PRESETS, VOCAB_TAGS, TONE_PRESETS, ThemePreset, TonePreset } from "./presets";

interface SentenceResult {
  sentence: string;
  imagery: string;
  rhetoric: {
    type: string;
    explanation: string;
  };
  writingTip: string;
}

interface SavedItem {
  id: string;
  theme: string;
  words: string;
  sentence: string;
  imagery: string;
  rhetoricType: string;
  rhetoricExplanation: string;
  writingTip: string;
  timestamp: string;
}

export default function App() {
  // Input states
  const [themeInput, setThemeInput] = useState("");
  const [wordsInput, setWordsInput] = useState("");
  const [selectedTone, setSelectedTone] = useState<TonePreset>(TONE_PRESETS[0]);

  // Loading & Generation states
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<SentenceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // SpeechSynthesis states
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.9); // Normal/Gentle rate for kids
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Bookmark states
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [activeTab, setActiveTab] = useState<"analysis" | "imagery" | "practice">("analysis");

  // User practice input state
  const [practiceText, setPracticeText] = useState("");
  const [practiceSuccess, setPracticeSuccess] = useState(false);

  // Copied indicator state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load SpeechSynthesis voices & Saved bookmarks
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
      const loadVoices = () => {
        setVoices(window.speechSynthesis.getVoices());
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Load LocalStorage bookmarks
    try {
      const stored = localStorage.getItem("animation_beautiful_sentences");
      if (stored) {
        setSavedItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load saved items", e);
    }
  }, []);

  // Sync bookmark ribbon when results change
  useEffect(() => {
    if (result) {
      const exists = savedItems.some(
        (item) => item.sentence.trim() === result.sentence.trim()
      );
      setIsBookmarked(exists);
      setPracticeText("");
      setPracticeSuccess(false);
    } else {
      setIsBookmarked(false);
    }
  }, [result, savedItems]);

  // Loading animation message rotating
  useEffect(() => {
    let interval: any = null;
    if (isLoading) {
      const steps = [
        "正在前往動畫大森林蒐集靈感...",
        "正在請小風送來新鮮的詞語...",
        "正在用擬人化魔法編織句子...",
        "正在為句子抹上月光的顏色...",
        "正在修剪枝葉，讓句子讀起來無比溫柔..."
      ];
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % steps.length);
      }, 3500);
    } else {
      setLoadingStep(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  // Clean voice speak on unmount
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Speak beautiful sentence
  const handleSpeak = (text: string) => {
    if (!synthRef.current) return;

    if (isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Find Taiwan high quality Mandarin voice if available
    const zhVoice = voices.find(
      (v) =>
        v.lang === "zh-TW" ||
        v.lang.toLowerCase().includes("zh-tw") ||
        v.name.includes("Taiwan") ||
        v.name.includes("Mandarin") ||
        v.lang.includes("zh-")
    );
    if (zhVoice) {
      utterance.voice = zhVoice;
    }

    utterance.pitch = selectedTone.speechPitch;
    utterance.rate = speechRate;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  // Generate sentence handler
  const handleGenerate = async () => {
    if (!themeInput.trim() || !wordsInput.trim()) {
      setError("請先填寫「動畫主題」與「動畫詞語」喔！");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: themeInput,
          words: wordsInput,
          toneStyle: selectedTone.promptStyle,
        }),
      });

      if (!response.ok) {
        throw new Error("伺服器發送了不尋常的訊號，好比雲朵迷路了。");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
      setActiveTab("analysis");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "魔法句子召喚失敗，風兒在路上耽擱了，請再試一次。");
    } finally {
      setIsLoading(false);
    }
  };

  // Preset click helper
  const handlePresetClick = (preset: ThemePreset) => {
    setThemeInput(preset.value);
  };

  // Badge click helper (Append to tags)
  const handleBadgeClick = (word: string) => {
    const current = wordsInput.trim();
    if (!current) {
      setWordsInput(word);
    } else if (current.includes(word)) {
      // If already has, remove it to toggle
      const newWords = current
        .split(/[、,，\s]+/)
        .filter((w) => w !== word)
        .join("、");
      setWordsInput(newWords);
    } else {
      setWordsInput(`${current}、${word}`);
    }
  };

  // Clear all fields
  const handleReset = () => {
    setThemeInput("");
    setWordsInput("");
    setError(null);
    setResult(null);
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsSpeaking(false);
  };

  // Toggle saving to bookmark
  const toggleBookmark = () => {
    if (!result) return;

    const isCurrentlySaved = savedItems.some(
      (item) => item.sentence.trim() === result.sentence.trim()
    );

    let updatedList: SavedItem[] = [];

    if (isCurrentlySaved) {
      updatedList = savedItems.filter(
        (item) => item.sentence.trim() !== result.sentence.trim()
      );
      setIsBookmarked(false);
    } else {
      const uniqueId = "sentence-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 9);
      const newItem: SavedItem = {
        id: uniqueId,
        theme: themeInput,
        words: wordsInput,
        sentence: result.sentence,
        imagery: result.imagery,
        rhetoricType: result.rhetoric.type,
        rhetoricExplanation: result.rhetoric.explanation,
        writingTip: result.writingTip,
        timestamp: new Date().toLocaleDateString("zh-TW", {
          month: "2-digit",
          day: "2-digit",
          hour: "numeric",
          minute: "2-digit",
        }),
      };
      updatedList = [newItem, ...savedItems];
      setIsBookmarked(true);
    }

    setSavedItems(updatedList);
    localStorage.setItem(
      "animation_beautiful_sentences",
      JSON.stringify(updatedList)
    );
  };

  // Copy with animation and fallback support for iframe/HTTP
  const handleCopyText = (text: string, id: string) => {
    if (navigator && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      navigator.clipboard.writeText(text)
        .then(() => {
          setCopiedId(id);
          setTimeout(() => setCopiedId(null), 2000);
        })
        .catch(() => {
          fallbackCopyText(text, id);
        });
    } else {
      fallbackCopyText(text, id);
    }
  };

  const fallbackCopyText = (text: string, id: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      if (successful) {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch (err) {
      console.error("Fallback copy failed", err);
    }
  };

  // Delete saved bookmark item
  const handleDeleteSaved = (id: string) => {
    const updated = savedItems.filter((item) => item.id !== id);
    setSavedItems(updated);
    localStorage.setItem(
      "animation_beautiful_sentences",
      JSON.stringify(updated)
    );
  };

  // Retrieve saved sentence back to result area
  const handleLoadSaved = (item: SavedItem) => {
    setThemeInput(item.theme);
    setWordsInput(item.words);
    setResult({
      sentence: item.sentence,
      imagery: item.imagery,
      rhetoric: {
        type: item.rhetoricType,
        explanation: item.rhetoricExplanation,
      },
      writingTip: item.writingTip,
    });
    // Scroll smoothly to top / middle result area
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  const loadingMessages = [
    "正在前往動畫大森林蒐集靈感...",
    "正在請小風送來新鮮的詞語...",
    "正在用擬人化魔法編織句子...",
    "正在為句子抹上月光的顏色...",
    "正在修剪枝葉，讓句子讀起來無比溫柔..."
  ];

  return (
    <div className="min-h-screen sky-bg text-slate-800 font-sans pb-16">
      {/* Floating clouds/airplane background illustration */}
      <div className="relative overflow-hidden w-full h-8 pt-4">
        <div className="absolute top-0 animate-pulse text-xs text-sky-500/20 whitespace-nowrap pl-[15%]">
          ☁️　　　　　　🎈　　　　　　　　☁️
        </div>
      </div>

      {/* Hero Header Area */}
      <header className="max-w-4xl mx-auto px-4 text-center mt-6 mb-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-white/60 backdrop-blur-md rounded-full text-sm text-cyan-700/80 border border-cyan-100/50 mb-4"
        >
          <Trees className="w-4 h-4 text-emerald-600 animate-bounce" />
          <span>國小修辭與寫作靈感小鋪</span>
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-4xl sm:text-5xl font-bold font-serif tracking-tight text-cyan-900 drop-shadow-sm mb-4 leading-normal"
        >
          動畫語文優美造句器
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-slate-600 max-w-xl mx-auto leading-relaxed text-base sm:text-lg"
        >
          點擊下方的主題與詞語，讓我們用修辭魔法，將內心溫煦的動畫意境編織成動人無比的優美語文句子吧！
        </motion.p>
      </header>

      {/* Main Workspace Frame */}
      <main className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Inputs and settings (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white/85 backdrop-blur-md border border-sky-100/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-sky-950/5">
            <h2 className="text-xl font-bold font-serif text-cyan-900 border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
              <Compass className="w-5 h-5 text-sky-500" />
              1. 靈感設定
            </h2>

            {/* Theme Presets Row */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                🌟 動畫主題推薦範本（直接點選填入）
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetClick(preset)}
                    className={`text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 group hover:bg-sky-50/50 hover:border-sky-200 ${
                      themeInput === preset.value
                        ? "bg-sky-50 border-sky-300 ring-2 ring-sky-300/20"
                        : "bg-white/50 border-slate-200/60"
                    }`}
                  >
                    <span className="text-xl group-hover:scale-110 transition-transform">
                      {preset.emoji}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">
                        {preset.name}
                      </p>
                      <p className="text-[10px] text-slate-400 line-clamp-1">
                        {preset.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Core Inputs */}
            <div className="space-y-4">
              {/* Field 1: Theme Input */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 flex items-center justify-between">
                  <span>🎬 動畫主題</span>
                  <span className="text-xs text-slate-400 font-normal">
                    你想寫哪一種風格的動畫世界？
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={themeInput}
                    onChange={(e) => {
                      setThemeInput(e.target.value);
                      setError(null);
                    }}
                    placeholder="例如：神隱少女的夏夜澡堂、在空中翱翔的木偶飛艇、奇幻森林"
                    className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-2xl text-slate-700 placeholder-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
                  />
                  {themeInput && (
                    <button
                      onClick={() => setThemeInput("")}
                      className="absolute right-3 top-3.5 text-xs text-slate-400 hover:text-slate-600 border border-slate-100 rounded px-1"
                    >
                      清除
                    </button>
                  )}
                </div>
              </div>

              {/* Field 2: Words Input with selection cloud */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 flex items-center justify-between">
                  <span>🍃 動畫詞語</span>
                  <span className="text-xs text-slate-400 font-normal">
                    置入哪些具有畫面感的神祕鑰匙？
                  </span>
                </label>
                <input
                  type="text"
                  value={wordsInput}
                  onChange={(e) => {
                    setWordsInput(e.target.value);
                    setError(null);
                  }}
                  placeholder="例如：勇氣、守護、微風、抱抱（多個詞用、分開）"
                  className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-2xl text-slate-700 placeholder-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
                />

                {/* Vocabulary badge cloud */}
                <div className="pt-2">
                  <p className="text-[11px] font-semibold text-slate-500 mb-1.5">
                    🍀 詞語能量包（點擊加入或清除）：
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {VOCAB_TAGS.map((tag) => {
                      const isSelected = wordsInput.includes(tag.text);
                      return (
                        <button
                          key={tag.text}
                          onClick={() => handleBadgeClick(tag.text)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer select-none flex items-center gap-1 ${
                            isSelected
                              ? "bg-cyan-600 text-white border-cyan-600 hover:bg-cyan-700"
                              : `${tag.color} hover:shadow-sm`
                          }`}
                        >
                          {tag.text}
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Selector 3: Voice Artist */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                  <span>🔊 句子朗讀守護神</span>
                  <HelpCircle
                    className="w-3.5 h-3.5 text-slate-400 cursor-help"
                    title="在產生句子後，這個角色將使用特定生動的調性朗讀句子給您聽！"
                  />
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TONE_PRESETS.map((tone) => (
                    <button
                      key={tone.id}
                      onClick={() => setSelectedTone(tone)}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        selectedTone.id === tone.id
                          ? "bg-amber-50 border-amber-300 ring-2 ring-amber-300/10 text-amber-900"
                          : "bg-white/40 border-slate-200/50 hover:bg-white text-slate-600"
                      }`}
                    >
                      <div className="text-lg">{tone.emoji}</div>
                      <div className="text-[11px] font-semibold mt-1 truncate">
                        {tone.name.split("「")[1]?.replace("」", "") || tone.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error messaging inside dialog box */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Form actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex gap-3">
              <button
                onClick={handleReset}
                disabled={isLoading}
                className="px-4 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl text-sm transition-colors cursor-pointer flex items-center justify-center gap-1 bg-white"
              >
                <RotateCcw className="w-4 h-4" />
                <span>重填</span>
              </button>

              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white font-bold rounded-2xl text-sm shadow-md shadow-sky-500/10 cursor-pointer transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 animate-spin-slow" />
                {isLoading ? "編織文字中..." : "生成優美句子"}
              </button>
            </div>
          </div>

          {/* Quick instructions widget for kids */}
          <div className="bg-gradient-to-br from-amber-50/80 to-yellow-50/50 border border-amber-100/50 rounded-3xl p-5 text-slate-700 text-xs sm:text-sm space-y-2.5">
            <h3 className="font-bold font-serif text-amber-900 flex items-center gap-1.5">
              <span>💡 國小寫作課堂小提醒：</span>
            </h3>
            <ul className="list-disc pl-4 space-y-1 text-slate-600">
              <li>
                <strong>比喻法：</strong> 把一個東西，說成是另一個東西。（例如：太陽像金黃的盤子）。
              </li>
              <li>
                <strong>擬人法：</strong> 讓沒有生命的微風、石頭會說話、在跳舞。
              </li>
              <li>
                善用色彩與光效（如碎金、螢光、薄霧），創造動畫般的畫面。
              </li>
            </ul>
          </div>
        </div>

        {/* Right Side: Showcase results and Bookmark collections (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          <AnimatePresence mode="wait">
            
            {/* 1. Empty / Idle State */}
            {!isLoading && !result && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white/60 backdrop-blur-md border border-sky-100/40 rounded-3xl p-10 text-center text-slate-500 shadow-sm flex flex-col items-center justify-center min-h-[360px]"
              >
                {/* Floating illustrations */}
                <div className="relative mb-6">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="text-6xl select-none filter drop-shadow-md"
                  >
                    ☁️
                  </motion.div>
                  <motion.div
                    animate={{ y: [0, 8, 0], x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 0.5 }}
                    className="text-4xl absolute -right-4 top-2 text-cyan-400 select-none"
                  >
                    🎈
                  </motion.div>
                </div>
                <h3 className="text-lg font-bold font-serif text-slate-700 mb-2">
                  進入您的動畫文學畫布
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed mb-6">
                  請在左方輸入您腦袋裡的幻想主題、點選一組美麗的詞語，然後點擊「生成優美句子」，您的魔幻文章賞析就會在這裡誕生。
                </p>
                <div className="flex gap-2 text-[11px] text-slate-400 bg-white/70 px-3.5 py-1.5 rounded-full border border-sky-100/30">
                  <span>宮崎駿</span>
                  <span>•</span>
                  <span>溫暖擬人化</span>
                  <span>•</span>
                  <span>畫面感十足</span>
                </div>
              </motion.div>
            )}

            {/* 2. Loading Spell State */}
            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-gradient-to-b from-sky-500/10 to-indigo-500/5 backdrop-blur-md border border-sky-200/50 rounded-3xl p-10 text-center shadow-lg min-h-[360px] flex flex-col items-center justify-center"
              >
                {/* Visual wizard or spell container */}
                <div className="relative w-24 h-24 mb-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-4 border-dashed border-cyan-400"
                  />
                  <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center shadow-inner">
                    <Sparkles className="w-8 h-8 text-cyan-500 animate-pulse" />
                  </div>
                  {/* Floating sparkles */}
                  <div className="absolute top-0 right-0 text-yellow-400 animate-bounce">⭐</div>
                  <div className="absolute bottom-1.5 left-0 text-indigo-400 animate-pulse">✨</div>
                </div>

                <h3 className="text-lg font-bold font-serif text-cyan-900 mb-3">
                  魔法編織中...
                </h3>
                
                {/* Rotating messaging */}
                <span className="text-sm text-slate-600 font-medium px-4 py-1 bg-white/80 rounded-full shadow-sm border border-cyan-100/30">
                  {loadingMessages[loadingStep]}
                </span>

                <p className="text-[10px] text-slate-400 mt-5 uppercase tracking-widest leading-relaxed max-w-xs">
                  我們絕不使用僵硬的公式，Gemini 正在為您逐字鋪陳最柔美的意境
                </p>
              </motion.div>
            )}

            {/* 3. Result Display Card */}
            {!isLoading && result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-cyan-950/5 border border-sky-200/40 relative overflow-hidden"
              >
                {/* Bookmark ribbon container */}
                <div className="absolute top-0 right-6 z-10">
                  <button
                    onClick={toggleBookmark}
                    className={`p-3 pt-4 rounded-b-2xl transition-all cursor-pointer flex flex-col items-center ${
                      isBookmarked
                        ? "bg-rose-500 text-white shadow-md"
                        : "bg-slate-100/80 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isBookmarked ? "fill-white" : ""}`} />
                    <span className="text-[9px] font-bold mt-1">
                      {isBookmarked ? "已收集" : "收集"}
                    </span>
                  </button>
                </div>

                {/* Subtitle with Theme Source */}
                <div className="flex flex-wrap items-center gap-2 mb-4 text-xs pr-14">
                  <span className="bg-sky-50 text-sky-700 font-bold px-2 py-0.5 rounded">
                    主題：{themeInput || "自訂主題"}
                  </span>
                  <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded">
                    詞語：{wordsInput || "自訂詞語"}
                  </span>
                </div>

                {/* Main Beautiful Sentence Showcase */}
                <div className="bg-slate-50/80 rounded-2xl p-6 mb-6 border border-slate-100 outline-none select-text">
                  <blockquote className="text-xl sm:text-2xl font-serif font-semibold text-slate-900 leading-relaxed text-center mb-4 text-pretty quotes bg-transparent">
                    「{result.sentence}」
                  </blockquote>

                  {/* Audio read panel */}
                  <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                    
                    {/* Voice speed selector and voice actor description */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white px-2.5 py-1.5 rounded-full border border-slate-100 shadow-sm font-medium">
                        <span>{selectedTone.emoji}</span>
                        <span>{selectedTone.name} 朗讀中</span>
                      </div>

                      {/* Speed control buttons */}
                      <div className="flex items-center rounded-lg border border-slate-100 bg-white overflow-hidden text-[10px] font-bold">
                        <button
                          onClick={() => setSpeechRate(0.7)}
                          className={`px-2 py-1 ${
                            speechRate === 0.7
                              ? "bg-cyan-600 text-white"
                              : "text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          慢速 (0.7x)
                        </button>
                        <button
                          onClick={() => setSpeechRate(0.9)}
                          className={`px-2 py-1 ${
                            speechRate === 0.9
                              ? "bg-cyan-600 text-white"
                              : "text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          原速 (0.9x)
                        </button>
                      </div>
                    </div>

                    {/* Audio action buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyText(result.sentence, "current")}
                        className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1 text-xs"
                        title="複製這句話"
                      >
                        {copiedId === "current" ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-500" />
                            <span className="text-emerald-500 font-semibold">已複製！</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>複製</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleSpeak(result.sentence)}
                        className={`px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold cursor-pointer transition-colors ${
                          isSpeaking
                            ? "bg-rose-500 hover:bg-rose-600 text-white animate-pulse"
                            : "bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm shadow-cyan-600/10"
                        }`}
                      >
                        {isSpeaking ? (
                          <>
                            <VolumeX className="w-4 h-4" />
                            <span>停止朗讀</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-4 h-4" />
                            <span>溫柔朗讀</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Waveform graphic while reading */}
                  {isSpeaking && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 20 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex justify-center items-center gap-1.5 mt-3 text-cyan-400"
                    >
                      {[1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4].map((index) => (
                        <motion.span
                          key={index}
                          animate={{ scaleY: [0.3, 1, 0.3] }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.6 + index * 0.1,
                            ease: "easeInOut",
                          }}
                          className="w-1 h-3.5 bg-cyan-400 rounded-full origin-center"
                        />
                      ))}
                    </motion.div>
                  )}
                </div>

                {/* Educational Learning Tabs Section */}
                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <div className="flex border-b border-slate-100 bg-slate-50/50 text-sm font-semibold select-none">
                    <button
                      onClick={() => setActiveTab("analysis")}
                      className={`flex-1 py-3 text-center transition-all border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeTab === "analysis"
                          ? "border-cyan-600 text-cyan-900 bg-white font-bold"
                          : "border-transparent text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                      修辭學堂
                    </button>
                    <button
                      onClick={() => setActiveTab("imagery")}
                      className={`flex-1 py-3 text-center transition-all border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeTab === "imagery"
                          ? "border-cyan-600 text-cyan-900 bg-white font-bold"
                          : "border-transparent text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Compass className="w-4 h-4" />
                      描寫畫面
                    </button>
                    <button
                      onClick={() => setActiveTab("practice")}
                      className={`flex-1 py-3 text-center transition-all border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeTab === "practice"
                          ? "border-cyan-600 text-cyan-900 bg-white font-bold"
                          : "border-transparent text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <PenTool className="w-4 h-4" />
                      寫作小魔法
                    </button>
                  </div>

                  <div className="p-5 text-slate-700 leading-relaxed text-sm">
                    {activeTab === "analysis" && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-100/50 w-fit font-bold">
                          <span>🔮 修辭秘笈：</span>
                          <span>{result.rhetoric.type}</span>
                        </div>
                        <p className="text-slate-600 text-sm pl-0.5 whitespace-pre-wrap leading-relaxed">
                          {result.rhetoric.explanation}
                        </p>
                      </div>
                    )}

                    {activeTab === "imagery" && (
                      <div className="space-y-2">
                        <h4 className="font-bold text-slate-800 font-serif">腦海裡的動畫底片 🎞️：</h4>
                        <p className="text-slate-600 text-sm whitespace-pre-wrap">
                          {result.imagery}
                        </p>
                      </div>
                    )}

                    {activeTab === "practice" && (
                      <div className="space-y-4">
                        <p className="text-amber-800 text-xs sm:text-sm bg-amber-50/50 p-3 rounded-xl border border-amber-100/30 whitespace-pre-wrap leading-relaxed font-medium">
                          {result.writingTip}
                        </p>
                        
                        {/* Kid creative training field */}
                        <div className="pt-3 border-t border-slate-100 space-y-2">
                          <label className="block text-xs font-bold text-slate-500">
                            ✍️ 換你在這寫寫看（模仿上方的技巧創作）：
                          </label>
                          <textarea
                            rows={2}
                            value={practiceText}
                            onChange={(e) => {
                              setPracticeText(e.target.value);
                              setPracticeSuccess(false);
                            }}
                            placeholder="試著運用剛剛學到的比喻或擬人法，模仿著寫下一句話看看吧！"
                            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:bg-white"
                          />
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-400">
                              寫好了嗎？按右方寫作徽章給自己一個大讚賞！
                            </span>
                            <button
                              onClick={() => {
                                if (practiceText.trim()) setPracticeSuccess(true);
                              }}
                              className="px-3 py-1 bg-yellow-100 text-yellow-800 font-bold text-xs rounded-lg border border-yellow-200 transition-colors hover:bg-yellow-200 cursor-pointer"
                            >
                              送出創作蓋章
                            </button>
                          </div>

                          {practiceSuccess && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs flex items-center justify-between"
                            >
                              <span>🎖️ 太棒了！你獲得了「小小文學動畫家」蓋章！</span>
                              <button
                                onClick={toggleBookmark}
                                className="text-emerald-700 font-bold hover:underline"
                              >
                                快把這組底稿收集起來吧！
                              </button>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bookmarked lists area (My collection book) */}
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-xl shadow-cyan-950/5 border border-sky-100/60">
            <h2 className="text-lg font-bold font-serif text-cyan-950 border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" />
                📒 我的美句收集本
              </span>
              <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                已收集 {savedItems.length} 有畫面感的句子
              </span>
            </h2>

            {savedItems.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                目前收集本還是空的。點擊句子卡右上角的「收集」愛心，這本小手冊就能幫你把文學靈感精巧保存起來喔！
              </div>
            ) : (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {savedItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-sky-100 transition-colors group relative"
                  >
                    <p className="text-sm font-serif font-semibold text-slate-900 leading-relaxed mb-2 select-text">
                      「{item.sentence}」
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
                      {/* Presets labels & date */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                        <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                          {item.theme.substring(0, 10)}...
                        </span>
                        <span>•</span>
                        <span className="bg-white px-2 py-0.5 rounded border border-slate-200 dark:border-none">
                          {item.rhetoricType}
                        </span>
                        <span>•</span>
                        <span className="text-slate-400">{item.timestamp}</span>
                      </div>

                      {/* Bookmark row operations */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopyText(item.sentence, item.id)}
                          className="p-1 px-2 border border-slate-200 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-700 transition-colors text-[10px] cursor-pointer flex items-center gap-0.5"
                          title="複製句子"
                        >
                          {copiedId === item.id ? "已複製" : "複製"}
                        </button>

                        <button
                          onClick={() => handleLoadSaved(item)}
                          className="p-1 px-2 bg-sky-50 text-sky-700 border border-sky-100 hover:bg-sky-100 rounded transition-colors text-[10px] cursor-pointer"
                        >
                          回看解析
                        </button>

                        <button
                          onClick={() => handleDeleteSaved(item.id)}
                          className="p-1 px-2 bg-rose-50 text-rose-700 border border-slate-100 hover:bg-rose-100 rounded hover:border-rose-200 transition-colors text-[10px] cursor-pointer"
                          title="移出收集本"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      </main>
    </div>
  );
}
