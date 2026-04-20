
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getGeminiModel = () => {
  return ai.models.get('gemini-3-flash-preview');
};
