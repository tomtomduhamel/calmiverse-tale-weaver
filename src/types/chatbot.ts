import type { Child } from "@/types/child";

export interface ChatbotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatbotChildInfo {
  id: string;
  name: string;
  gender: string;
  birthDate: string;
  age: number;
  interests?: string[];
  teddyName?: string;
  imaginaryWorld?: string;
}

export interface ChatbotInitPayload {
  userId: string;
  conversationId: string;
  action: 'init';
  children: ChatbotChildInfo[];
}

export interface ChatbotMessagePayload {
  conversationId: string;
  userId: string;
  action: 'message';
  message: string;
}

export type ChatbotPayload = ChatbotInitPayload | ChatbotMessagePayload;

export interface ChatbotResponse {
  type: 'message' | 'story_complete' | 'error';
  content: string;
  storyId?: string; // Présent quand type === 'story_complete'
}

export type CreationMode = 'guided' | 'chat';
