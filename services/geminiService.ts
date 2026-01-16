
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    // Check if process and process.env exist before accessing to prevent "ReferenceError"
    const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : null;
    
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    } else {
      console.warn("API_KEY not found in environment. AI features will be disabled.");
    }
  }

  async getCaddieAdvice(course: string, date: string) {
    if (!this.ai) return "Caddie is taking a break. (API Key not configured)";
    
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `I am booking a tee time at ${course} Golf Course for ${date}. 
        Provide a short "Caddie's Note" including:
        1. A brief strategic tip for ${course}.
        2. Expected typical weather patterns for that time of year in Johannesburg.
        3. A motivational golf quote.
        Keep it concise and professional.`,
        config: {
          temperature: 0.7,
        }
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Caddie is currently unavailable, but focus on your short game!";
    }
  }

  async generateEmailContent(status: string, details: string) {
    if (!this.ai) return `Booking status: ${status}. ${details}`;
    
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a short notification email for a golf booking automation status.
        Status: ${status}
        Details: ${details}
        Recipient: Richard (richard@syndev.co.za)
        Style: Brief, professional, yet sporty.`,
      });
      return response.text;
    } catch (error) {
      return `Booking status: ${status}. ${details}`;
    }
  }
}

export const geminiService = new GeminiService();
