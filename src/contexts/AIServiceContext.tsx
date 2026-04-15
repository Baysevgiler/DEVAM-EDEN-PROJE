import React, { createContext, useState, useContext, ReactNode } from 'react';
import { AIProvider } from '@/types';
import { ClaudeService } from '@services/ai/ClaudeService';
import { OpenAIService } from '@services/ai/OpenAIService';

type AIProviderType = 'claude' | 'openai';

interface AIServiceContextType {
  currentProvider: AIProviderType;
  aiService: AIProvider;
  setProvider: (provider: AIProviderType) => void;
  isConfigured: boolean;
}

const AIServiceContext = createContext<AIServiceContextType | undefined>(undefined);

export const AIServiceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentProvider, setCurrentProvider] = useState<AIProviderType>('claude');
  const [claudeService] = useState(() => new ClaudeService());
  const [openAIService] = useState(() => new OpenAIService());

  const aiService = currentProvider === 'claude' ? claudeService : openAIService;
  const isConfigured = aiService.isConfigured();

  const setProvider = (provider: AIProviderType) => {
    setCurrentProvider(provider);
  };

  return (
    <AIServiceContext.Provider value={{ currentProvider, aiService, setProvider, isConfigured }}>
      {children}
    </AIServiceContext.Provider>
  );
};

export const useAIService = (): AIServiceContextType => {
  const context = useContext(AIServiceContext);
  if (!context) {
    throw new Error('useAIService must be used within an AIServiceProvider');
  }
  return context;
};
