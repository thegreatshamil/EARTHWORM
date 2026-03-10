import type { ChatRequest, ChatResponse, ChatSession } from "@/types";
import type { Language } from "@/context/LanguageContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

class ChatService {
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return "earthworm_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
  }

  getSessionId(): string {
    return this.sessionId;
  }

  resetSession(): void {
    this.sessionId = this.generateSessionId();
  }

  async sendMessage(
    text: string,
    language: Language,
    imageBase64?: string,
    audioFile?: string,
  ): Promise<string> {
    const request: ChatRequest = {
      text,
      image_base64: imageBase64,
      audio_file: audioFile,
      session_id: this.sessionId,
      language,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`,
        );
      }

      const data: ChatResponse = await response.json();
      return data.response;
    } catch (error) {
      console.error("Chat API error:", error);
      throw error;
    }
  }

  // Save chat history to localStorage
  saveChatHistory(session: ChatSession): void {
    try {
      // 1. Prepare a cleaned version of the session
      // Limit to 20 messages and remove large data (images/audio) to save space
      const cleanMessages = session.messages.slice(-20).map((msg) => ({
        ...msg,
        imageUrl: undefined, // remove large image data
        audioUrl: undefined, // remove large audio data
      }));

      const cleanSession: ChatSession = {
        ...session,
        messages: cleanMessages,
      };

      // 2. Load existing history
      const history = this.getChatHistory();
      const existingIndex = history.findIndex((s) => s.id === cleanSession.id);

      // 3. Update or add session
      if (existingIndex >= 0) {
        history[existingIndex] = cleanSession;
      } else {
        history.push(cleanSession);
      }

      // 4. Keep only last 50 sessions
      if (history.length > 50) {
        history.shift();
      }

      // 5. Try to save to localStorage
      localStorage.setItem("earthworm-chat-history", JSON.stringify(history));
    } catch (e) {
      console.warn("Storage quota exceeded or error saving history, clearing to prevent crash...");
      // As requested, if saving fails, we clear the history to stay within quota
      localStorage.removeItem("earthworm-chat-history");
    }
  }

  getChatHistory(): ChatSession[] {
    try {
      const saved = localStorage.getItem("earthworm-chat-history");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
          messages: s.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
        }));
      }
    } catch (e) {
      console.error("Error loading chat history:", e);
    }
    return [];
  }

  deleteChatSession(sessionId: string): void {
    const history = this.getChatHistory().filter((s) => s.id !== sessionId);
    localStorage.setItem("earthworm-chat-history", JSON.stringify(history));
  }

  clearAllHistory(): void {
    localStorage.removeItem("earthworm-chat-history");
  }
}

export const chatService = new ChatService();
export default chatService;
