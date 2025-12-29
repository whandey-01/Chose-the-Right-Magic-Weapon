import { GoogleGenAI, Type, Modality } from "@google/genai";
import { LevelData, ValidationResponse } from "../types";
import { decodeBase64, decodeAudioData } from "./audioUtils";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Audio Context Singleton
let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 24000,
    });
  }
  return audioContext;
}

export const stopAudio = () => {
  if (currentSource) {
    try {
      currentSource.stop();
      currentSource.disconnect();
    } catch (e) {
      console.warn("Error stopping audio:", e);
    }
    currentSource = null;
  }
};

/**
 * Generates a difficult Journey to the West scenario (Chinese).
 */
export const generateLevel = async (currentLevel: number, history: string[]): Promise<LevelData> => {
  const model = "gemini-3-flash-preview";
  
  const historyContext = history.length > 0 ? `请避免出现以下已击败的妖怪: ${history.join(", ")}.` : "";

  const prompt = `
    你是一个《西游记》文字冒险游戏的主持人。
    目标受众：原著专家。
    任务：创建一个高难度的关卡（第 ${currentLevel} 难），涉及原著中的一个特定劫难或妖怪。
    ${historyContext}
    
    要求：
    1. 选择一个特定的妖怪或危机（例如：红孩儿、独角兕大王、琵琶精、铁扇公主、黄眉老祖等）。
    2. 'story'（故事背景）应该生动地描述危机（例如：悟空被困，或师父被抓）。必须使用简体中文。
    3. 'artifacts'（道具）：提供4个道具。 
       - 恰好有一个是原著中正确的解法（例如：针对火焰山使用'芭蕉扇'）。
       - 其他3个必须是西游宇宙中看似合理但在此情境下错误的道具（例如：对着不说话的妖怪使用'紫金红葫芦'，或者用'定风丹'去对付火）。
    4. 难度：困难。允许使用冷门法宝或细节。
    5. 所有输出必须为简体中文。

    请仅以JSON格式输出，不要包含Markdown代码块标记。
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          chapter: { type: Type.INTEGER, description: "原著大概章节数" },
          title: { type: Type.STRING, description: "关卡标题" },
          story: { type: Type.STRING, description: "故事描述" },
          enemyName: { type: Type.STRING, description: "妖怪名字" },
          enemyDescription: { type: Type.STRING, description: "妖怪外貌描述（用于生成图片）" },
          difficulty: { type: Type.STRING, enum: ["Hard", "Extreme"] },
          artifacts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING, description: "简短描述" },
                icon: { type: Type.STRING, description: "代表道具的Emoji" },
                isCorrect: { type: Type.BOOLEAN },
              },
              required: ["name", "description", "icon", "isCorrect"]
            }
          }
        },
        required: ["chapter", "title", "story", "enemyName", "enemyDescription", "artifacts", "difficulty"]
      }
    }
  });

  if (!response.text) throw new Error("Failed to generate level");
  const levelData = JSON.parse(response.text) as LevelData;

  // Generate Realistic Monster Image
  try {
    const imagePrompt = `Chinese mythology monster, ${levelData.enemyName}, ${levelData.enemyDescription}. Digital art, realistic, hyper-detailed, dark fantasy style, cinematic lighting.`;
    
    const imageResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: imagePrompt }] },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });

    for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        levelData.monsterImageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
  } catch (e) {
    console.error("Failed to generate monster image:", e);
    // Continue without image (UI will handle fallback)
  }

  return levelData;
};

/**
 * Validates the user's choice and generates the narrative outcome.
 */
export const validateChoice = async (level: LevelData, chosenItemName: string): Promise<ValidationResponse> => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    语境：西游记游戏。
    场景：${level.story}
    妖怪：${level.enemyName}
    用户选择：${chosenItemName}
    正确答案：${level.artifacts.find(a => a.isCorrect)?.name}

    任务：叙述结果。
    1. 如果选择匹配正确答案（或在原著逻辑中合理），则为成功（SUCCESS）。
    2. 如果不匹配，则为失败（FAILURE）。请根据原著设定解释原因（例如：“紫金红葫芦需要叫名字才行”，“定风丹不能灭火”）。
    3. 语言：简体中文。语气：史诗感，像说书人。
    
    以JSON格式输出。
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          success: { type: Type.BOOLEAN },
          narrative: { type: Type.STRING, description: "结果的戏剧性叙述（最多3句话）。" }
        },
        required: ["success", "narrative"]
      }
    }
  });

   if (!response.text) throw new Error("Failed to validate choice");
   return JSON.parse(response.text) as ValidationResponse;
};

/**
 * Generates speech for the narration.
 */
export const playNarration = async (text: string): Promise<void> => {
  // Stop previous audio if playing
  stopAudio();

  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // Use a deep voice for storytelling
    const voiceName = 'Fenrir'; 

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return;

    const audioBuffer = await decodeAudioData(
      decodeBase64(base64Audio),
      ctx,
      24000,
      1
    );

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    
    currentSource = source;
    
    source.onended = () => {
      if (currentSource === source) {
        currentSource = null;
      }
    };

    source.start();

  } catch (error) {
    console.error("TTS Error:", error);
  }
};