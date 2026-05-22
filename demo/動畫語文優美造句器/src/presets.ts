export interface ThemePreset {
  id: string;
  name: string;
  emoji: string;
  description: string;
  value: string;
}

export interface TonePreset {
  id: string;
  name: string;
  emoji: string;
  promptStyle: string;
  speechPitch: number; // For SpeechSynthesis
  speechRate: number;  // For SpeechSynthesis
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "forest",
    name: "龍貓的溫馨森林",
    emoji: "🌳",
    description: "風吹過綠色原野、會說話的大樹與溫暖的擁抱",
    value: "微煦陽光灑落的吉卜力溫暖大森林",
  },
  {
    id: "space",
    name: "銀河鐵道魔法星空",
    emoji: "🌌",
    description: "流星輕輕劃過夜空，月光在雲朵上跳舞",
    value: "璀璨夏夜的夜空星河與奇幻魔法學院",
  },
  {
    id: "ocean",
    name: "海底世界冒險歌謠",
    emoji: "🐳",
    description: "鯨魚的溫柔歌聲、波光粼粼的珊瑚礁城堡",
    value: "波光粼粼、充滿未知與友誼的海底大冒險",
  },
  {
    id: "sky-castle",
    name: "天空之城發光巨石",
    emoji: "🏰",
    description: "漂浮在雲霧間的古老機械與長滿綠色青苔的鋼鐵守護者",
    value: "雲霧繚繞、充滿神祕歷史痕跡的天空之城與微風",
  },
  {
    id: "season",
    name: "櫻花飄落的鐵道口",
    emoji: "🌸",
    description: "粉紅雨點般的櫻花與在鐵道旁輕輕招手的小燕子",
    value: "新海誠風格、寫實而唯美的新春櫻花與微雨時節",
  },
];

export const VOCAB_TAGS = [
  { text: "勇氣", category: "情感", color: "bg-red-50 text-red-700 border-red-200" },
  { text: "守護", category: "情感", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { text: "微風", category: "自然", color: "bg-teal-50 text-teal-700 border-teal-200" },
  { text: "朝露", category: "自然", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { text: "蒲公英", category: "事物", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  { text: "擁抱", category: "情感", color: "bg-rose-50 text-rose-700 border-rose-200" },
  { text: "淚水", category: "情感", color: "bg-violet-50 text-violet-700 border-violet-200" },
  { text: "光芒", category: "事物", color: "bg-sky-50 text-sky-700 border-sky-200" },
  { text: "齒輪", category: "事物", color: "bg-slate-50 text-slate-700 border-slate-200" },
  { text: "螢火蟲", category: "自然", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { text: "精靈", category: "奇幻", color: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200" },
  { text: "承諾", category: "情感", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { text: "流星", category: "自然", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { text: "音樂盒", category: "事物", color: "bg-pink-50 text-pink-700 border-pink-200" },
];

export const TONE_PRESETS: TonePreset[] = [
  {
    id: "gargoyle",
    name: "溫暖守護的「大龍貓」",
    emoji: "🐨",
    promptStyle: "溫暖守護、低沉飽滿、充滿森林樹木溫度的厚實聲音",
    speechPitch: 0.8,
    speechRate: 0.85,
  },
  {
    id: "elf",
    name: "活潑輕盈的「小精靈」",
    emoji: "🧚",
    promptStyle: "活潑靈巧、輕盈透亮、帶有微風拂過草原般的聲音",
    speechPitch: 1.25,
    speechRate: 0.95,
  },
  {
    id: "magician",
    name: "智慧沉穩的「白髮魔法師」",
    emoji: "🧙‍♂️",
    promptStyle: "睿智沉穩、悠遠悠揚、如同翻開古老羊皮書卷的聲音",
    speechPitch: 0.9,
    speechRate: 0.8,
  },
];
