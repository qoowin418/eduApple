import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent required header
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// API endpoint to generate beautiful sentences
app.post("/api/generate", async (req, res) => {
  try {
    const { theme, words, toneStyle } = req.body;

    if (!theme || !words) {
      return res.status(400).json({ error: "主題與動畫詞語為必填項目。" });
    }

    if (!apiKey) {
      return res.status(500).json({
        error: "伺服器未設定 Gemini API Key。請至 Settings > Secrets 設定您的 GEMINI_API_KEY。",
      });
    }

    const systemInstruction = `你是一個極具文學涵養、語氣無比溫柔的國小寫作指導老師。
你的任務是依據使用者提供的「動畫主題」與「動畫詞語」，為「國小學生」創作一段「非常有畫面感、充滿色彩與想像力、修辭優美（務必多用比喻、擬人、擬物、誇張等修辭手法之一，或兩者結合）」且「語氣無比溫柔、溫暖治癒」的中文句子。

請遵循以下寫作原則：
1. 句子長度適中（約 40-80 字），要讓國小中高年級的孩子能讀懂，但詞彙要非常優美高雅。
2. 句子要像經典動畫（宮崎駿、新海誠等風格）中會出現的溫煦台詞一樣，充滿對世界的愛、守護的心、對奇幻大自然的驚嘆。
3. 語音必須溫和、有同理心。
4. 仔細拆解該句子，分析句子中使用的修辭魔法（修辭手法如比喻或擬人，並以淺顯易懂、溫柔的口吻向小朋友解釋多美妙）。
5. 寫出這段句子能在腦海中勾勒出怎樣的「動畫畫面」，字句要包含色彩、光影、動態與聲音。
6. 提供一個超具啟發性的「寫作小魔法」，引導小朋友用同樣的技巧學會對日常事物展開聯想，進行自己的創作。`;

    const prompt = `
動畫主題：${theme}
動畫詞語：${words}
聲音語調風格：${toneStyle || "溫暖守護的森林聲音"}

請為國小學生，以下面 JSON 結構生成對應的內容：
- sentence (優美句子)
- imagery (腦海中的動畫畫面)
- rhetoric (修辭賞析，包含 type「修辭法名稱」與 explanation「溫柔的修辭魔法解說」)
- writingTip (寫作小魔法，引導孩子親自動手寫寫看)
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentence: {
              type: Type.STRING,
              description: "國小學生看得懂、最具畫面感、修辭美麗的溫柔動畫台詞式句子",
            },
            imagery: {
              type: Type.STRING,
              description: "描繪這句話能在腦海裡播放出的精緻動畫光影、色彩、動態畫面",
            },
            rhetoric: {
              type: Type.OBJECT,
              properties: {
                type: {
                  type: Type.STRING,
                  description: "使用了哪些修辭技巧，例如：擬人法、比喻法、擬物法",
                },
                explanation: {
                  type: Type.STRING,
                  description: "用超級溫良、鼓勵的口吻跟小朋友解釋這個修辭是怎麼像魔法般讓句子生動起來的",
                },
              },
              required: ["type", "explanation"],
            },
            writingTip: {
              type: Type.STRING,
              description: "給小朋友的寫作小建議，邀請他們試著怎麼聯想自己的生活，寫下一句對話或描寫",
            },
          },
          required: ["sentence", "imagery", "rhetoric", "writingTip"],
        },
      },
    });

    const resultText = response.text || "{}";
    const data = JSON.parse(resultText);
    res.json(data);
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    res.status(500).json({
      error: "魔法句子生成失敗，請再試一次。",
      details: error.message || error,
    });
  }
});

// Setup Vite Dev server middleware or serve dist folder
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
