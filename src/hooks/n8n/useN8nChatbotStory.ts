import { useState, useRef, useCallback } from 'react';
import type { Child } from '@/types/child';
import type { 
  ChatbotMessage, 
  ChatbotResponse, 
  ChatbotInitPayload, 
  ChatbotMessagePayload,
  ChatbotChildInfo 
} from '@/types/chatbot';
import { calculateAge } from '@/utils/age';

const N8N_WEBHOOK_URL = 'https://n8n.srv856374.hstgr.cloud/webhook/ec1e6586-86dc-4755-b73e-80a19762ddd2';

const generateId = () => crypto.randomUUID();

const mapChildToInfo = (child: Child): ChatbotChildInfo => ({
  id: child.id,
  name: child.name,
  gender: child.gender,
  birthDate: child.birthDate.toISOString(),
  age: calculateAge(child.birthDate),
  interests: child.interests,
  teddyName: child.teddyName,
  imaginaryWorld: child.imaginaryWorld,
});

export const useN8nChatbotStory = () => {
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storyId, setStoryId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const conversationIdRef = useRef(generateId());

  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const newMessage: ChatbotMessage = {
      id: generateId(),
      role,
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  const handleResponse = useCallback((response: ChatbotResponse) => {
    console.log('[useN8nChatbotStory] Réponse reçue:', response);

    if (response.type === 'error') {
      setError(response.content);
      addMessage('assistant', response.content);
      return;
    }

    if (response.type === 'story_complete' && response.storyId) {
      console.log('[useN8nChatbotStory] Histoire créée:', response.storyId);
      addMessage('assistant', response.content);
      setStoryId(response.storyId);
      return;
    }

    // Message normal
    addMessage('assistant', response.content);
  }, [addMessage]);

  const sendToWebhook = useCallback(async (payload: ChatbotInitPayload | ChatbotMessagePayload): Promise<ChatbotResponse> => {
    console.log('[useN8nChatbotStory] Envoi vers n8n:', payload);

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    console.log('[useN8nChatbotStory] Réponse brute n8n:', data);

    // n8n peut renvoyer "chatInput" au lieu de "content"
    const content = data.content || data.chatInput;

    // Si n8n renvoie directement le bon format
    if (data.type && content) {
      return {
        type: data.type,
        content,
        storyId: data.storyId,
      } as ChatbotResponse;
    }

    // Fallback si format différent
    return {
      type: 'message',
      content: typeof data === 'string' ? data : (content || JSON.stringify(data)),
    };
  }, []);

  const initConversation = useCallback(async (userId: string, children: Child[]) => {
    if (isInitialized) {
      console.log('[useN8nChatbotStory] Conversation déjà initialisée');
      return;
    }

    console.log('[useN8nChatbotStory] Initialisation conversation pour', children.length, 'enfants');
    setIsLoading(true);
    setError(null);

    try {
      const payload: ChatbotInitPayload = {
        chatInput: "Bonjour ! Je souhaite créer une histoire personnalisée pour mes enfants.",
        sessionId: conversationIdRef.current,
        userId,
        action: 'init',
        children: children.map(mapChildToInfo),
      };

      const response = await sendToWebhook(payload);
      handleResponse(response);
      setIsInitialized(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de connexion';
      console.error('[useN8nChatbotStory] Erreur init:', errorMessage);
      setError(errorMessage);
      addMessage('assistant', "Désolé, je n'arrive pas à me connecter. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, sendToWebhook, handleResponse, addMessage]);

  const sendMessage = useCallback(async (message: string, userId: string) => {
    if (!message.trim()) return;

    console.log('[useN8nChatbotStory] Envoi message:', message);
    
    // Ajouter le message utilisateur immédiatement
    addMessage('user', message);
    setIsLoading(true);
    setError(null);

    try {
      const payload: ChatbotMessagePayload = {
        chatInput: message,
        sessionId: conversationIdRef.current,
        userId,
        action: 'message',
      };

      const response = await sendToWebhook(payload);
      handleResponse(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de connexion';
      console.error('[useN8nChatbotStory] Erreur message:', errorMessage);
      setError(errorMessage);
      addMessage('assistant', "Désolé, je n'ai pas pu traiter votre message. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  }, [sendToWebhook, handleResponse, addMessage]);

  const resetConversation = useCallback(() => {
    console.log('[useN8nChatbotStory] Reset conversation');
    setMessages([]);
    setError(null);
    setStoryId(null);
    setIsInitialized(false);
    conversationIdRef.current = generateId();
  }, []);

  return {
    messages,
    isLoading,
    error,
    storyId,
    isInitialized,
    conversationId: conversationIdRef.current,
    initConversation,
    sendMessage,
    resetConversation,
  };
};

export default useN8nChatbotStory;
