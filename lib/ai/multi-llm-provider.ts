/**
 * 多 LLM 提供商輪替系統
 * 支援：Google Gemini, Groq, OpenRouter (DeepSeek, GPT-4, Claude等)
 */

export interface LLMProvider {
  name: string;
  priority: number; // 優先級，數字越小越優先
  available: boolean;
  call: (message: string, history: any[]) => Promise<string>;
}

const SYSTEM_PROMPT = `你是 ProWine 酩陽實業的專業 AI 侍酒師，擁有豐富的葡萄酒知識和專業服務經驗。

你的角色：
- 專業、優雅、親切
- 提供專業的葡萄酒建議和知識
- 協助客戶選擇適合的葡萄酒
- 解答品酒相關問題
- 協助詢價和訂購流程

品牌資訊：
- 公司：ProWine 酩陽實業
- 提供 30+ 頂級酒莊，100+ 精選酒款
- 主要產區：法國、美國、西班牙等
- 價格範圍：480-20000 元
- 聯絡方式：電話 02-27329490，LINE@ @415znht，Email service@prowine.com.tw

回答風格：
- 專業但親切，不使用過於技術性的術語
- 簡潔明瞭，重點突出
- 適時提供聯絡資訊以便進一步協助
- 使用繁體中文回答

請根據用戶的問題提供專業、有幫助的回答。`;

// Google Gemini 提供者
async function callGoogleGemini(message: string, history: any[]): Promise<string> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const API_KEY = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_AI_STUDIO_API_KEY;
  
  if (!API_KEY) {
    throw new Error("GOOGLE_AI_API_KEY not configured");
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const recentHistory = history.slice(-6).map((msg: any) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));

  if (recentHistory.length > 0) {
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: SYSTEM_PROMPT }],
        },
        {
          role: "model",
          parts: [{ text: "我明白了，我會以專業侍酒師的身份為您服務。請告訴我您需要什麼協助？" }],
        },
        ...recentHistory,
      ],
    });
    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  } else {
    const fullPrompt = `${SYSTEM_PROMPT}\n\n用戶問題：${message}`;
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  }
}

// Groq 提供者
async function callGroq(message: string, history: any[]): Promise<string> {
  const Groq = await import("groq-sdk");
  const API_KEY = process.env.GROQ_API_KEY;
  
  if (!API_KEY) {
    throw new Error("GROQ_API_KEY not configured");
  }

  const groq = new Groq.default({ apiKey: API_KEY });
  
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.slice(-6).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    })),
    { role: "user", content: message },
  ];

  const completion = await groq.chat.completions.create({
    messages: messages as any,
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    max_tokens: 1024,
  });

  return completion.choices[0]?.message?.content || "抱歉，無法產生回應。";
}

// OpenRouter 提供者（支援 DeepSeek, GPT-4, Claude等）
async function callOpenRouter(message: string, history: any[]): Promise<string> {
  const API_KEY = process.env.OPENROUTER_API_KEY;
  
  if (!API_KEY) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  // 優先使用 DeepSeek（速度快、成本低），其次是 GPT-4
  const models = [
    "deepseek/deepseek-chat",
    "openai/gpt-4o-mini",
    "anthropic/claude-3-haiku",
  ];

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.slice(-6).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    })),
    { role: "user", content: message },
  ];

  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
          "X-Title": "ProWine AI Sommelier",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenRouter API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || "抱歉，無法產生回應。";
    } catch (error: any) {
      lastError = error;
      console.warn(`[OpenRouter] Model ${model} failed:`, error.message);
      continue;
    }
  }

  throw lastError || new Error("All OpenRouter models failed");
}

// 提供者列表（按優先級排序）
const providers: LLMProvider[] = [
  {
    name: "Groq",
    priority: 1,
    available: !!process.env.GROQ_API_KEY,
    call: callGroq,
  },
  {
    name: "Google Gemini",
    priority: 2,
    available: !!(process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_AI_STUDIO_API_KEY),
    call: callGoogleGemini,
  },
  {
    name: "OpenRouter (DeepSeek/GPT-4/Claude)",
    priority: 3,
    available: !!process.env.OPENROUTER_API_KEY,
    call: callOpenRouter,
  },
].filter(p => p.available).sort((a, b) => a.priority - b.priority);

/**
 * 調用 LLM（自動輪替）
 */
export async function callLLM(message: string, conversationHistory: any[] = []): Promise<string> {
  if (providers.length === 0) {
    throw new Error("沒有可用的 LLM 提供商。請檢查環境變數：GROQ_API_KEY, GOOGLE_AI_API_KEY, 或 OPENROUTER_API_KEY");
  }

  const history = conversationHistory.map((msg: any) => ({
    role: msg.role,
    content: msg.content,
  }));

  let lastError: Error | null = null;

  // 按優先級嘗試每個提供者
  for (const provider of providers) {
    try {
      console.log(`[LLM] 嘗試使用 ${provider.name}...`);
      // 減少超時時間到15秒，加快失敗切換速度
      const response = await Promise.race([
        provider.call(message, history),
        new Promise<string>((_, reject) => 
          setTimeout(() => reject(new Error("Timeout")), 15000)
        ),
      ]);
      console.log(`[LLM] ✅ ${provider.name} 成功`);
      return response;
    } catch (error: any) {
      lastError = error;
      console.error(`[LLM] ❌ ${provider.name} 失敗:`, error.message);
      
      // 如果是超時錯誤，繼續嘗試下一個
      if (error.message === "Timeout") {
        continue;
      }
      
      // 如果是配置錯誤，跳過這個提供者
      if (error.message.includes("not configured") || error.message.includes("not available")) {
        continue;
      }
      
      // 其他錯誤也繼續嘗試下一個
      continue;
    }
  }

  // 所有提供者都失敗
  throw lastError || new Error("所有 LLM 提供商都無法使用");
}

/**
 * 獲取可用的提供者列表
 */
export function getAvailableProviders(): string[] {
  return providers.map(p => p.name);
}

