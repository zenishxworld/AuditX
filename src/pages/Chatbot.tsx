import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ProtectedRoute from '@/components/ProtectedRoute';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatSession {
  id: string;
  topic: string;
  messages: Message[];
  created_at: Date;
}

const Chatbot = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [selectedChatId, setSelectedChatId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat sessions on component mount
  useEffect(() => {
    if (user) {
      loadChatSessions();
    }
  }, [user]);

  const loadChatSessions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const sessions = data.map(session => ({
          id: session.id,
          topic: session.topic,
          messages: [], // Messages will be loaded separately
          created_at: new Date(session.created_at)
        }));
        setChatSessions(sessions);
        
        // Auto-select the first session if available
        if (sessions.length > 0 && !selectedChatId) {
          setSelectedChatId(sessions[0].id);
          setCurrentChatId(sessions[0].id);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    }
  };

  const createNewChat = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chats')
        .insert({
          user_id: user.id,
          topic: 'New Chat',
          message_count: 0,
          status: 'Active'
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newSession: ChatSession = {
          id: data.id,
          topic: data.topic,
          messages: [],
          created_at: new Date(data.created_at)
        };
        setChatSessions(prev => [newSession, ...prev]);
        setSelectedChatId(newSession.id);
        setCurrentChatId(newSession.id);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to create new chat session',
        variant: 'destructive',
      });
    }
  };

  const selectChat = (chatId: string) => {
    const session = chatSessions.find(s => s.id === chatId);
    if (session) {
      setSelectedChatId(chatId);
      setCurrentChatId(chatId);
      setMessages(session.messages);
    }
  };

  const deleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);

      if (error) throw error;

      setChatSessions(prev => prev.filter(s => s.id !== chatId));
      
      if (selectedChatId === chatId) {
        const remaining = chatSessions.filter(s => s.id !== chatId);
        if (remaining.length > 0) {
          setSelectedChatId(remaining[0].id);
          setCurrentChatId(remaining[0].id);
          setMessages(remaining[0].messages);
        } else {
          setSelectedChatId('');
          setCurrentChatId('');
          setMessages([]);
        }
      }

      toast({
        title: 'Success',
        description: 'Chat deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete chat',
        variant: 'destructive',
      });
    }
  };

  const generateResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return 'Hello! How can I assist you with smart contract security today?';
    } else if (lowerMessage.includes('audit')) {
      return 'I can help you with smart contract auditing. What specific security concerns do you have?';
    } else if (lowerMessage.includes('vulnerability')) {
      return 'Common vulnerabilities include reentrancy attacks, overflow/underflow, and access control issues. Which would you like to learn about?';
    } else {
      return 'Thank you for your message. I\'m here to help with smart contract security questions. What would you like to know?';
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      role: 'user',
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setMessage('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateResponse(userMessage.content),
        role: 'assistant',
        timestamp: new Date()
      };

      const finalMessages = [...updatedMessages, aiResponse];
      setMessages(finalMessages);
      
      // Update the session in state
      setChatSessions(prev => prev.map(session =>
        session.id === currentChatId
          ? { ...session, messages: finalMessages }
          : session
      ));

      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent mb-4">
                AI Security Advisor
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Get expert advice on smart contract security, audit best practices, and vulnerability assessment.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
              {/* Chat Sessions Sidebar */}
              <div className="lg:col-span-1">
                <Card className="h-full flex flex-col">
                  <div className="p-4 border-b border-border/50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-foreground">Conversations</h3>
                      <Button size="sm" onClick={createNewChat} className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/80 hover:to-purple-600/80">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <ScrollArea className="flex-1 p-4">
                    {chatSessions.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No conversations yet</p>
                        <p className="text-sm mt-2">Start a new chat to begin</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {chatSessions.map((session) => (
                          <div
                            key={session.id}
                            className={`p-3 rounded-lg cursor-pointer transition-all group relative ${
                              selectedChatId === session.id
                                ? 'bg-primary/10 border border-primary/20'
                                : 'hover:bg-muted/50 border border-transparent'
                            }`}
                            onClick={() => selectChat(session.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{session.topic}</p>
                                <p className="text-xs text-muted-foreground">
                                  {session.created_at.toLocaleDateString()}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                onClick={(e) => deleteChat(session.id, e)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </Card>
              </div>

              {/* Chat Area */}
              <div className="lg:col-span-3">
                <Card className="h-full flex flex-col">
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-6">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                          <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
                          <p className="text-muted-foreground">
                            Ask me about smart contract security, auditing, or any blockchain development questions.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex gap-4 ${
                              msg.role === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            {msg.role === 'assistant' && (
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-primary to-purple-600 flex items-center justify-center">
                                <MessageCircle className="h-4 w-4 text-white" />
                              </div>
                            )}
                            
                            <div
                              className={`max-w-[70%] p-4 rounded-lg ${
                                msg.role === 'user'
                                  ? 'bg-gradient-to-r from-primary to-purple-600 text-white'
                                  : 'bg-muted/50 border border-border/50'
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                              <p className={`text-xs mt-2 ${
                                msg.role === 'user' ? 'text-white/70' : 'text-muted-foreground'
                              }`}>
                                {msg.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                            
                            {msg.role === 'user' && (
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                                <span className="text-sm font-medium">
                                  {user?.email?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {isLoading && (
                          <div className="flex gap-4 justify-start">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-primary to-purple-600 flex items-center justify-center">
                              <MessageCircle className="h-4 w-4 text-white" />
                            </div>
                            <div className="bg-muted/50 border border-border/50 p-4 rounded-lg">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>

                  {/* Input Area */}
                  <div className="p-6 border-t border-border/50">
                    <div className="flex gap-4">
                      <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message here..."
                        className="flex-1 bg-background/50 border-border/50"
                        disabled={isLoading}
                      />
                      <Button 
                        onClick={sendMessage}
                        disabled={!message.trim() || isLoading}
                        className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/80 hover:to-purple-600/80"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Chatbot;