export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
  audioUrl?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  condition: string;
  location: string;
}

export interface FarmerProfile {
  name: string;
  location: string;
  fieldSize: string;
  crops: string;
}

export type Language = 'en' | 'hi' | 'ta' | 'te' | 'kn' | 'ml' | 'bn' | 'mr' | 'gu' | 'pa';

export interface ChatRequest {
  text?: string;
  image_base64?: string;
  audio_file?: string;
  session_id: string;
  language: Language;
}

export interface ChatResponse {
  response: string;
  session_id: string;
  timestamp: string;
}

export interface ForYouRequest {
  message: string;
  profile: FarmerProfile;
  language: Language;
  image_base64?: string;
  audio_file?: string;
}

export interface ForYouResponse {
  response: string;
}

export interface NavItem {
  label: string;
  path: string;
  icon: string;
}

export type Page = 'home' | 'chat' | 'forYou' | 'sitara' | 'account' | 'login' | 'register';
