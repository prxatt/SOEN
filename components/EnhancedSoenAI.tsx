// Enhanced SoenAI component using new Supabase features
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '../src/lib/supabase';
import { UserIcon, PaperAirplaneIcon, PaperClipIcon, XMarkIcon, EllipsisVerticalIcon, TrashIcon, PencilIcon, DocumentPlusIcon, Bars3Icon, DocumentTextIcon, ArrowUpOnSquareIcon, BabyPenguinIcon, ArrowPathIcon, ChatBubbleOvalLeftEllipsisIcon } from './Icons';

interface MiraConversation {
  id: string;
  user_id: string;
  title: string;
  context_summary?: string;
  topics?: string[];
  user_emotional_state?: string;
  mira_adaptation_mode?: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
}

interface MiraMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'mira';
  content_plaintext: string;
  content_encrypted?: string;
  attachment?: any;
  model_used?: string;
  tokens_used?: number;
  processing_time_ms?: number;
  confidence_score?: number;
  cost_cents?: number;
  sources?: any[];
  created_at: string;
}

interface EnhancedSoenAIProps {
  showToast: (message: string) => void;
  previousScreen: string;
  goals: any;
  soenFlow: number;
}

export const EnhancedSoenAI: React.FC<EnhancedSoenAIProps> = ({
  showToast,
  previousScreen,
  goals,
  soenFlow
}) => {
  const [conversations, setConversations] = useState<MiraConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MiraMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiReplying, setIsAiReplying] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [user, setUser] = useState<any>(null);

  // Load user and conversations on mount
  useEffect(() => {
    const loadUserAndConversations = async () => {
      try {
        const currentUser = await auth.getCurrentUser();
        if (!currentUser) {
          showToast('Please sign in to use Mira AI');
          return;
        }
        
        setUser(currentUser);
        
        // Load conversations
        const { data: conversationsData, error: conversationsError } = await db.getMiraConversations(currentUser.id);
        
        if (conversationsError) {
          console.error('Failed to load conversations:', conversationsError);
          showToast('Failed to load conversations');
          return;
        }
        
        setConversations(conversationsData || []);
        
        // Set active conversation to the most recent one
        if (conversationsData && conversationsData.length > 0) {
          setActiveConversationId(conversationsData[0].id);
        }
        
      } catch (error) {
        console.error('Error loading user data:', error);
        showToast('Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserAndConversations();
  }, [showToast]);

  // Load messages when active conversation changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!activeConversationId) {
        setMessages([]);
        return;
      }

      try {
        const { data: messagesData, error: messagesError } = await db.getMiraMessages(activeConversationId);
        
        if (messagesError) {
          console.error('Failed to load messages:', messagesError);
          showToast('Failed to load messages');
          return;
        }
        
        setMessages(messagesData || []);
      } catch (error) {
        console.error('Error loading messages:', error);
        showToast('Failed to load messages');
      }
    };

    loadMessages();
  }, [activeConversationId, showToast]);

  // Create new conversation
  const createNewConversation = async () => {
    if (!user) return;

    try {
      const { data: conversation, error } = await db.createMiraConversation(
        user.id,
        `New Chat - ${new Date().toLocaleTimeString()}`
      );

      if (error) {
        console.error('Failed to create conversation:', error);
        showToast('Failed to create new conversation');
        return;
      }

      setConversations(prev => [conversation[0], ...prev]);
      setActiveConversationId(conversation[0].id);
      showToast('New conversation created');
    } catch (error) {
      console.error('Error creating conversation:', error);
      showToast('Failed to create conversation');
    }
  };

  // Send message
  const sendMessage = async (messageText: string) => {
    if (!user || !activeConversationId || !messageText.trim()) return;

    const message = messageText.trim();
    setInputMessage('');
    setIsAiReplying(true);

    try {
      // Create user message
      const { data: userMessage, error: userError } = await db.createMiraMessage(
        activeConversationId,
        'user',
        message,
        {
          model_used: 'gpt-4o-mini',
          tokens_input: message.length / 4, // Rough estimate
          cost_cents: 1
        }
      );

      if (userError) {
        console.error('Failed to create user message:', userError);
        showToast('Failed to send message');
        return;
      }

      // Add user message to local state
      setMessages(prev => [...prev, userMessage[0]]);

      // Log AI usage
      await db.logAIUsage(user.id, {
        model_used: 'gpt-4o-mini',
        operation_type: 'chat',
        feature_used: 'mira_chat',
        tokens_input: Math.floor(message.length / 4),
        cost_cents: 1
      });

      // Simulate AI response (replace with actual AI service call)
      setTimeout(async () => {
        try {
          const aiResponse = `I understand you said: "${message}". This is a simulated response from Mira AI. In a real implementation, this would call your AI service to generate an actual response.`;

          const { data: miraMessage, error: miraError } = await db.createMiraMessage(
            activeConversationId,
            'mira',
            aiResponse,
            {
              model_used: 'gpt-4o-mini',
              tokens_input: 20,
              tokens_output: aiResponse.length / 4,
              cost_cents: 2,
              confidence_score: 0.95,
              processing_time_ms: 1200
            }
          );

          if (miraError) {
            console.error('Failed to create Mira message:', miraError);
            showToast('Failed to get AI response');
            return;
          }

          // Add Mira message to local state
          setMessages(prev => [...prev, miraMessage[0]]);

          // Log AI usage for response
          await db.logAIUsage(user.id, {
            model_used: 'gpt-4o-mini',
            operation_type: 'chat',
            feature_used: 'mira_chat',
            tokens_input: 20,
            tokens_output: Math.floor(aiResponse.length / 4),
            cost_cents: 2,
            latency_ms: 1200
          });

        } catch (error) {
          console.error('Error generating AI response:', error);
          showToast('Failed to get AI response');
        } finally {
          setIsAiReplying(false);
        }
      }, 1000);

    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Failed to send message');
      setIsAiReplying(false);
    }
  };

  // Delete conversation
  const deleteConversation = async (conversationId: string) => {
    try {
      // Note: You'll need to add a delete function to your Supabase client
      // For now, just remove from local state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
        setMessages([]);
      }
      
      showToast('Conversation deleted');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      showToast('Failed to delete conversation');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <BabyPenguinIcon className="w-8 h-8 text-blue-400" />
          <h1 className="text-xl font-bold text-white">Mira AI</h1>
        </div>
        <button
          onClick={createNewConversation}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <DocumentPlusIcon className="w-4 h-4 inline mr-2" />
          New Chat
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-slate-300 mb-3">Conversations</h2>
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    activeConversationId === conversation.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                  }`}
                  onClick={() => setActiveConversationId(conversation.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{conversation.title}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(conversation.last_message_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conversation.id);
                      }}
                      className="text-slate-400 hover:text-red-400"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeConversationId ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-200'
                      }`}
                    >
                      <p className="text-sm">{message.content_plaintext}</p>
                      {message.model_used && (
                        <p className="text-xs opacity-70 mt-1">
                          {message.model_used} • {message.cost_cents}¢
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                
                {isAiReplying && (
                  <div className="flex justify-start">
                    <div className="bg-slate-700 text-slate-200 px-4 py-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="animate-pulse">Mira is typing...</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-slate-700">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputMessage)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500"
                    disabled={isAiReplying}
                  />
                  <button
                    onClick={() => sendMessage(inputMessage)}
                    disabled={!inputMessage.trim() || isAiReplying}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    <PaperAirplaneIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <BabyPenguinIcon className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">Welcome to Mira AI</h2>
                <p className="text-slate-400 mb-4">Start a new conversation to begin chatting with your AI assistant</p>
                <button
                  onClick={createNewConversation}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Start New Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedSoenAI;
