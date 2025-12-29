import { useState, useCallback, useRef } from 'react';
import type { Child } from '@/types/child';
import type { 
  ChatbotMessage, 
  ChatbotResponse, 
  ChatbotInitPayload, 
  ChatbotMessagePayload,
  ChatbotChildInfo,
  ChatbotChoice
} from '@/types/chatbot';
import { calculateAge } from '@/utils/age';
import { usePersistedChatbotState } from './usePersistedChatbotState';
import { usePageVisibility } from '@/hooks/usePageVisibility';

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
  // État persisté
  const {
    conversationId,
    messages,
    isInitialized,
    storyId,
    pendingMessageId,
    setMessages,
    addMessage: addPersistedMessage,
    updateMessage,
    setInitialized,
    setStoryId: setPersistedStoryId,
    setChildrenIds,
    setPendingMessage,
    clearPendingMessage,
    hasPendingMessage,
    resetSession,
    forceSave,
    hasValidSession
  } = usePersistedChatbotState();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Verrou synchrone pour empêcher les appels multiples à initConversation
  const isInitializingRef = useRef(false);
  // Ref pour stocker userId pour le retry
  const userIdRef = useRef<string | null>(null);

  // Fonction de retry du dernier message
  const retryLastMessage = useCallback(async () => {
    if (!hasPendingMessage() || !userIdRef.current) return;
    
    // Trouver le dernier message user
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMessage) {
      clearPendingMessage();
      return;
    }

    console.log('[useN8nChatbotStory] Retry automatique message:', lastUserMessage.content.substring(0, 50));
    setIsRetrying(true);
    setIsLoading(true);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

      const payload: ChatbotMessagePayload = {
        chatInput: lastUserMessage.content,
        sessionId: conversationId,
        userId: userIdRef.current,
        action: 'message',
      };

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      // Effacer le pending AVANT d'ajouter la réponse
      clearPendingMessage();

      // Traiter la réponse (inclut les choix)
      handleResponseData(data);

      console.log('[useN8nChatbotStory] Retry réussi');
    } catch (err) {
      console.error('[useN8nChatbotStory] Erreur retry:', err);
      // Ne pas effacer le pending en cas d'erreur, l'utilisateur peut réessayer manuellement
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  }, [hasPendingMessage, messages, conversationId, clearPendingMessage]);

  // Sauvegarder quand la page devient invisible + retry au retour
  usePageVisibility({
    onHide: forceSave,
    onShow: () => {
      console.log('[useN8nChatbotStory] Page visible - session valide:', hasValidSession(), 'pending:', hasPendingMessage());
      // Retry automatique si message en attente
      if (hasPendingMessage() && !isLoading) {
        retryLastMessage();
      }
    }
  });

  // Ajouter un message (avec support des choix)
  const addMessage = useCallback((
    role: 'user' | 'assistant', 
    content: string,
    options?: { 
      choices?: ChatbotChoice[]; 
      choiceType?: 'single' | 'multiple';
    }
  ) => {
    const newMessage: ChatbotMessage = {
      id: generateId(),
      role,
      content,
      timestamp: new Date(),
      choices: options?.choices,
      choiceType: options?.choiceType,
      selectedChoices: [],
      choicesConfirmed: false,
    };
    addPersistedMessage(newMessage);
    return newMessage;
  }, [addPersistedMessage]);

  // Traiter les données de réponse n8n
  const handleResponseData = useCallback((data: any) => {
    console.log('[useN8nChatbotStory] Réponse brute n8n:', data);
    
    const content = data.content || data.chatInput;
    
    if (data.type === 'error') {
      setError(content);
      addMessage('assistant', content);
      return;
    }

    if (data.type === 'story_complete' && data.storyId) {
      console.log('[useN8nChatbotStory] Histoire créée:', data.storyId);
      addMessage('assistant', content);
      setPersistedStoryId(data.storyId);
      return;
    }

    // Message avec choix
    if (data.type === 'message_with_choices' && data.choices && Array.isArray(data.choices)) {
      console.log('[useN8nChatbotStory] Message avec choix:', data.choices.length);
      addMessage('assistant', content, {
        choices: data.choices,
        choiceType: data.choiceType || 'single'
      });
      return;
    }

    // Message normal
    addMessage('assistant', content || JSON.stringify(data));
  }, [addMessage, setPersistedStoryId]);

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
      setPersistedStoryId(response.storyId);
      return;
    }

    // Message avec choix
    if (response.type === 'message_with_choices' && response.choices) {
      addMessage('assistant', response.content, {
        choices: response.choices,
        choiceType: response.choiceType || 'single'
      });
      return;
    }

    // Message normal
    addMessage('assistant', response.content);
  }, [addMessage, setPersistedStoryId]);

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

    // Si n8n renvoie directement le bon format avec choix
    if (data.type && content) {
      return {
        type: data.type,
        content,
        choices: data.choices,
        choiceType: data.choiceType,
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
    // VERROU SYNCHRONE - empêche les appels multiples simultanés
    if (isInitializingRef.current) {
      console.log('[useN8nChatbotStory] Initialisation déjà en cours, skip');
      return;
    }
    
    // Si session déjà valide, ne pas réinitialiser
    if (isInitialized && hasValidSession()) {
      console.log('[useN8nChatbotStory] Session valide existante, skip init');
      return;
    }

    // Poser le verrou AVANT toute opération async
    isInitializingRef.current = true;
    console.log('[useN8nChatbotStory] Initialisation conversation pour', children.length, 'enfants');
    setIsLoading(true);
    setError(null);
    
    // Sauvegarder les IDs des enfants pour la session
    setChildrenIds(children.map(c => c.id));

    try {
      const payload: ChatbotInitPayload = {
        chatInput: "Bonjour ! Je souhaite créer une histoire personnalisée pour mes enfants.",
        sessionId: conversationId,
        userId,
        action: 'init',
        children: children.map(mapChildToInfo),
      };

      const response = await sendToWebhook(payload);
      handleResponse(response);
      setInitialized(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de connexion';
      console.error('[useN8nChatbotStory] Erreur init:', errorMessage);
      setError(errorMessage);
      addMessage('assistant', "Désolé, je n'arrive pas à me connecter. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
      isInitializingRef.current = false;
    }
  }, [isInitialized, hasValidSession, conversationId, sendToWebhook, handleResponse, addMessage, setInitialized, setChildrenIds]);

  const sendMessage = useCallback(async (message: string, userId: string) => {
    if (!message.trim()) return;

    console.log('[useN8nChatbotStory] Envoi message:', message);
    
    // Sauvegarder userId pour le retry
    userIdRef.current = userId;
    
    // Ajouter le message utilisateur immédiatement
    const userMessage = addMessage('user', message);
    
    // Marquer comme en attente de réponse
    setPendingMessage(userMessage.id);
    
    setIsLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

      const payload: ChatbotMessagePayload = {
        chatInput: message,
        sessionId: conversationId,
        userId,
        action: 'message',
      };

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      // Effacer le pending AVANT d'ajouter la réponse
      clearPendingMessage();

      // Traiter la réponse (inclut les choix)
      handleResponseData(data);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de connexion';
      console.error('[useN8nChatbotStory] Erreur message:', errorMessage);
      setError(errorMessage);
      // NE PAS effacer le pending en cas d'erreur - permet le retry
      addMessage('assistant', "Désolé, je n'ai pas pu traiter votre message. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, addMessage, setPendingMessage, clearPendingMessage, handleResponseData]);

  // Sélectionner un choix dans un message
  const selectChoice = useCallback((messageId: string, choiceId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || message.choicesConfirmed) return;

    let newSelected: string[];
    
    if (message.choiceType === 'multiple') {
      // Toggle pour choix multiples
      const currentSelected = message.selectedChoices || [];
      newSelected = currentSelected.includes(choiceId)
        ? currentSelected.filter(id => id !== choiceId)
        : [...currentSelected, choiceId];
    } else {
      // Remplacement pour choix unique
      newSelected = [choiceId];
    }

    updateMessage(messageId, { selectedChoices: newSelected });
  }, [messages, updateMessage]);

  // Confirmer les choix et envoyer comme message utilisateur
  const confirmChoices = useCallback(async (messageId: string, userId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message?.choices || !message.selectedChoices?.length) return;

    // Marquer comme confirmé
    updateMessage(messageId, { choicesConfirmed: true });

    // Construire le texte à envoyer (les labels des choix sélectionnés)
    const selectedLabels = message.choices
      .filter(c => message.selectedChoices?.includes(c.id))
      .map(c => c.label)
      .join(', ');

    // Envoyer comme message utilisateur
    await sendMessage(selectedLabels, userId);
  }, [messages, updateMessage, sendMessage]);

  const resetConversation = useCallback(() => {
    console.log('[useN8nChatbotStory] Reset conversation');
    resetSession();
    setError(null);
  }, [resetSession]);

  return {
    messages,
    isLoading,
    isRetrying,
    error,
    storyId,
    isInitialized,
    conversationId,
    hasValidSession,
    hasPendingMessage,
    initConversation,
    sendMessage,
    resetConversation,
    retryLastMessage,
    selectChoice,
    confirmChoices,
  };
};

export default useN8nChatbotStory;
