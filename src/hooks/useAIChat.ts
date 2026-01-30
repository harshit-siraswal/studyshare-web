/**
 * useAIChat - Custom hook for AI chat functionality
 * Handles SSE streaming, message history, and question generation
 */

import { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    sourceType?: 'pdf' | 'general';
    sourceName?: string;
    timestamp: Date;
}

interface Question {
    question: string;
    options?: string[];
    answer: string;
    explanation: string;
}

interface UseAIChatReturn {
    messages: ChatMessage[];
    isLoading: boolean;
    error: string | null;
    sendMessage: (message: string) => Promise<void>;
    generateQuestions: (topic: string, count?: number, type?: 'mcq' | 'short' | 'long') => Promise<Question[]>;
    searchNotices: (query: string) => Promise<{ found: boolean; answer?: string }>;
    clearMessages: () => void;
}

export function useAIChat(): UseAIChatReturn {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const { user } = useAuth();
    const { toast } = useToast();

    /**
     * Get Firebase ID token from current user
     */
    const getIdToken = async (): Promise<string> => {
        if (!user) throw new Error('No user logged in');
        return await user.getIdToken();
    };

    /**
     * Send a message and receive streaming response
     */
    const sendMessage = useCallback(async (message: string) => {
        if (!user) {
            toast({ title: 'Error', description: 'Please login to use AI assistant', variant: 'destructive' });
            return;
        }

        setIsLoading(true);
        setError(null);

        // Add user message
        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: message,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);

        // Create assistant message placeholder
        const assistantId = `assistant-${Date.now()}`;
        const assistantMessage: ChatMessage = {
            id: assistantId,
            role: 'assistant',
            content: '',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);

        try {
            const token = await getIdToken();

            // Build history for context
            const history = messages.slice(-6).map(m => ({
                role: m.role,
                content: m.content
            }));

            // Create SSE request with fetch
            const params = new URLSearchParams({
                message,
                history: JSON.stringify(history)
            });

            abortControllerRef.current = new AbortController();

            const response = await fetch(
                `${API_BASE}/api/ai/chat/stream?${params.toString()}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'text/event-stream'
                    },
                    signal: abortControllerRef.current.signal
                }
            );

            if (!response.ok) {
                throw new Error('Failed to connect to AI service');
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error('No response body');
            }

            let fullContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            break;
                        }
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.text) {
                                fullContent += parsed.text;
                                // Update message in real-time
                                setMessages(prev => prev.map(m =>
                                    m.id === assistantId
                                        ? { ...m, content: fullContent }
                                        : m
                                ));
                            } else if (parsed.error) {
                                throw new Error(parsed.error);
                            }
                        } catch {
                            // Ignore parse errors for incomplete chunks
                        }
                    }
                }
            }

            // Determine source type from content
            const sourceType = fullContent.includes('Source: General Knowledge') ? 'general' : 'pdf';
            setMessages(prev => prev.map(m =>
                m.id === assistantId
                    ? { ...m, content: fullContent, sourceType }
                    : m
            ));

        } catch (err: any) {
            if (err.name === 'AbortError') return;

            const errorMessage = err.message || 'Failed to get AI response';
            setError(errorMessage);

            // Update assistant message with error
            setMessages(prev => prev.map(m =>
                m.id === assistantId
                    ? { ...m, content: `Error: ${errorMessage}` }
                    : m
            ));

            toast({ title: 'AI Error', description: errorMessage, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [user, messages, toast]);

    /**
     * Generate practice questions
     */
    const generateQuestions = useCallback(async (
        topic: string,
        count: number = 5,
        type: 'mcq' | 'short' | 'long' = 'mcq'
    ): Promise<Question[]> => {
        if (!user) {
            toast({ title: 'Error', description: 'Please login first', variant: 'destructive' });
            return [];
        }

        setIsLoading(true);
        setError(null);

        try {
            const token = await getIdToken();

            const response = await fetch(`${API_BASE}/api/ai/questions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ topic, count, type })
            });

            if (!response.ok) {
                throw new Error('Failed to generate questions');
            }

            const data = await response.json();
            return data.questions || [];
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to generate questions';
            setError(errorMessage);
            toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);

    /**
     * Search notices with AI
     */
    const searchNotices = useCallback(async (query: string) => {
        if (!user) {
            toast({ title: 'Error', description: 'Please login first', variant: 'destructive' });
            return { found: false };
        }

        setIsLoading(true);
        setError(null);

        try {
            const token = await getIdToken();

            const response = await fetch(`${API_BASE}/api/ai/notice-search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ query })
            });

            if (!response.ok) {
                throw new Error('Failed to search notices');
            }

            return await response.json();
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to search notices';
            setError(errorMessage);
            toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
            return { found: false };
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);

    /**
     * Clear message history
     */
    const clearMessages = useCallback(() => {
        setMessages([]);
        setError(null);
    }, []);

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        generateQuestions,
        searchNotices,
        clearMessages
    };
}
