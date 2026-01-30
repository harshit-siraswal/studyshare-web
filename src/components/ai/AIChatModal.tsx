/**
 * AIChatModal - Full chat interface for AI assistant
 * Features: Message history, streaming responses, source indicators
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    Bot,
    X,
    Send,
    Loader2,
    FileText,
    Globe,
    Trash2,
    Sparkles,
    BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAIChat } from '@/hooks/useAIChat';

interface AIChatModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AIChatModal({ isOpen, onClose }: AIChatModalProps) {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { messages, isLoading, sendMessage, clearMessages } = useAIChat();

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const message = input.trim();
        setInput('');
        await sendMessage(message);
    };

    const handleQuickAction = (prompt: string) => {
        setInput(prompt);
        inputRef.current?.focus();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl h-[80vh] max-h-[700px] bg-background rounded-xl shadow-2xl flex flex-col overflow-hidden border">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-600/10 to-indigo-600/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600">
                            <Bot className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-semibold">AI Study Assistant</h2>
                            <p className="text-xs text-muted-foreground">General knowledge helper for your studies</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={clearMessages}
                            title="Clear chat"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6">
                            <div className="p-4 rounded-full bg-gradient-to-r from-purple-600/20 to-indigo-600/20 mb-4">
                                <Sparkles className="h-10 w-10 text-purple-600" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">How can I help you today?</h3>
                            <p className="text-sm text-muted-foreground mb-6 max-w-md">
                                I can help explain concepts, answer questions, and generate practice problems using my general knowledge.
                            </p>

                            {/* Quick actions */}
                            <div className="flex flex-wrap gap-2 justify-center">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleQuickAction("Explain the concept of pointers in C")}
                                    className="text-xs"
                                >
                                    <BookOpen className="h-3 w-3 mr-1" />
                                    Explain a concept
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleQuickAction("What are my upcoming exams?")}
                                    className="text-xs"
                                >
                                    <FileText className="h-3 w-3 mr-1" />
                                    Check notices
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleQuickAction("Generate 5 MCQ questions about Data Structures")}
                                    className="text-xs"
                                >
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    Practice questions
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={cn(
                                        "flex gap-3",
                                        message.role === 'user' ? "justify-end" : "justify-start"
                                    )}
                                >
                                    {message.role === 'assistant' && (
                                        <div className="p-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 h-fit">
                                            <Bot className="h-4 w-4 text-white" />
                                        </div>
                                    )}

                                    <div
                                        className={cn(
                                            "max-w-[80%] rounded-lg p-3",
                                            message.role === 'user'
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted"
                                        )}
                                    >
                                        <div className="text-sm whitespace-pre-wrap">{message.content}</div>

                                        {message.role === 'assistant' && message.content && !message.content.startsWith('Error:') && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "text-xs",
                                                        message.content.includes('📄 *Sources:') || message.content.includes('Sources:')
                                                            ? "border-green-500 text-green-600"
                                                            : "border-blue-500 text-blue-600"
                                                    )}
                                                >
                                                    {message.content.includes('📄 *Sources:') || message.content.includes('Sources:') ? (
                                                        <>
                                                            <FileText className="h-3 w-3 mr-1" />
                                                            From PDF
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles className="h-3 w-3 mr-1" />
                                                            AI Generated
                                                        </>
                                                    )}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {isLoading && messages[messages.length - 1]?.role === 'assistant' &&
                                messages[messages.length - 1]?.content === '' && (
                                    <div className="flex gap-3">
                                        <div className="p-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600">
                                            <Bot className="h-4 w-4 text-white" />
                                        </div>
                                        <div className="bg-muted rounded-lg p-3">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        </div>
                                    </div>
                                )}

                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </ScrollArea>

                {/* Input */}
                <form onSubmit={handleSubmit} className="p-4 border-t bg-background">
                    <div className="flex gap-2">
                        <Input
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about your course materials..."
                            disabled={isLoading}
                            className="flex-1"
                        />
                        <Button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                        AI may make mistakes. Verify important information.
                    </p>
                </form>
            </div>
        </div>
    );
}
