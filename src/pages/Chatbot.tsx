import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Bot, User, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Message type definition
interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

// Chat session type definition
interface ChatSession {
  id: string;
  topic: string;
  messages: Message[];
  created_at: Date;
}

// Generate local responses when backend is unavailable
const generateLocalResponse = (message: string): string => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
    return "Hello! How can I assist you with smart contract security today?";
  } 
  else if (lowerMessage.includes("reentrancy")) {
    return "Reentrancy attacks occur when a function makes an external call to another untrusted contract before it resolves its state. To prevent this:\n\n1. Use the Checks-Effects-Interactions pattern\n2. Implement reentrancy guards\n3. Consider using OpenZeppelin's ReentrancyGuard\n\nWould you like to see a code example of a secure implementation?";
  }
  else if (lowerMessage.includes("audit")) {
    return "AuditX provides comprehensive smart contract audits that check for common vulnerabilities including:\n\n- Reentrancy attacks\n- Integer overflow/underflow\n- Access control issues\n- Gas optimization problems\n- Logic errors\n\nYou can submit your contract for audit through the Audit page. Would you like me to explain any specific vulnerability in more detail?";
  }
  else if (lowerMessage.includes("solidity")) {
    return "Solidity is the primary programming language for Ethereum smart contracts. When writing secure Solidity code, remember to:\n\n- Use the latest stable compiler version\n- Implement proper access controls\n- Be careful with external calls\n- Use SafeMath for arithmetic operations in versions before 0.8.0\n- Follow established patterns and use audited libraries like OpenZeppelin\n\nDo you have a specific Solidity question I can help with?";
  }
  else if (lowerMessage.includes("web3") || lowerMessage.includes("blockchain")) {
    return "Web3 refers to the decentralized web built on blockchain technology. Key components include:\n\n- Smart contracts for trustless execution of agreements\n- Decentralized applications (dApps) that run on blockchain networks\n- Tokens and cryptocurrencies as digital assets\n- Decentralized finance (DeFi) protocols\n\nAuditX helps ensure the security of these Web3 applications through comprehensive auditing.";
  }
  else {
    return "Thank you for your message. I'm an AI assistant specialized in blockchain security and smart contract development. I can help with:\n\n- Smart contract security best practices\n- Code vulnerability analysis\n- Solidity programming questions\n- Blockchain concepts and standards\n\nPlease feel free to ask specific questions about your smart contract needs!";
  }
};

const Chatbot = () => {
  // State management
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  
  // References
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Hooks
  const { toast } = useToast();
  const { user } = useAuth();

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load chat sessions on component mount
  useEffect(() => {
    if (user) {
      loadChatSessions();
    }
  }, [user]);

  // Only scroll to bottom on initial load or when user sends a message
  // This prevents automatic scrolling when receiving messages
  const [shouldScroll, setShouldScroll] = useState(true);
  
  useEffect(() => {
    if (shouldScroll) {
      scrollToBottom();
      setShouldScroll(false);
    }
  }, [messages, shouldScroll]);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Load chat sessions from database
  const loadChatSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        const formattedSessions = data.map(session => ({
          id: session.id,
          topic: session.topic || 'New Conversation',
          messages: session.messages || [],
          created_at: new Date(session.created_at)
        }));
        
        setSessions(formattedSessions);
        
        // If there are sessions and no active session, set the most recent one as active
        if (formattedSessions.length > 0 && !activeSession) {
          setActiveSession(formattedSessions[0].id);
          setSessionId(formattedSessions[0].id);
          setMessages(formattedSessions[0].messages);
        }
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat history. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Create a new chat session
  const createNewSession = async () => {
    try {
      // For demo purposes, create a local session if backend is not available
      const localSessionId = `local-${Date.now()}`;
      
      try {
        const { data, error } = await supabase
          .from('chat_sessions')
          .insert([
            { 
              user_id: user?.id,
              topic: 'New Conversation',
              messages: []
            }
          ])
          .select();
        
        if (error) {
          console.warn('Using local session due to backend error:', error);
          // Use local session as fallback
          const newSession = {
            id: localSessionId,
            topic: 'New Conversation',
            messages: [],
            created_at: new Date()
          };
          
          setSessions([newSession, ...sessions]);
          setActiveSession(localSessionId);
          setSessionId(localSessionId);
          setMessages([]);
          
          toast({
            title: 'Success',
            description: 'New conversation started (local mode).',
          });
        } else if (data && data[0]) {
          const newSession = {
            id: data[0].id,
            topic: data[0].topic,
            messages: [],
            created_at: new Date(data[0].created_at)
          };
          
          setSessions([newSession, ...sessions]);
          setActiveSession(newSession.id);
          setSessionId(newSession.id);
          setMessages([]);
          
          toast({
            title: 'Success',
            description: 'New conversation started.',
          });
        }
      } catch (error) {
        console.error('Error creating session:', error);
        // Create local fallback session
        const newSession = {
          id: localSessionId,
          topic: 'New Conversation',
          messages: [],
          created_at: new Date()
        };
        
        setSessions([newSession, ...sessions]);
        setActiveSession(localSessionId);
        setSessionId(localSessionId);
        setMessages([]);
        
        toast({
          title: 'Success',
          description: 'New conversation started (local mode).',
        });
      }
    } catch (error) {
      console.error('Error creating new session:', error);
      toast({
        title: 'Error',
        description: 'Failed to create new conversation. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Switch to a different chat session
  const switchSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setActiveSession(id);
      setSessionId(id);
      setMessages(session.messages);
    }
  };

  // Update session topic
  const updateSessionTopic = async (id: string, topic: string) => {
    try {
      if (id.startsWith('local-')) {
        // Update local session
        setSessions(sessions.map(session => 
          session.id === id ? { ...session, topic } : session
        ));
        
        toast({
          title: 'Success',
          description: 'Conversation topic updated (local mode).',
        });
        return;
      }
      
      const { error } = await supabase
        .from('chat_sessions')
        .update({ topic })
        .eq('id', id);
      
      if (error) throw error;
      
      setSessions(sessions.map(session => 
        session.id === id ? { ...session, topic } : session
      ));
      
      toast({
        title: 'Success',
        description: 'Conversation topic updated.',
      });
    } catch (error) {
      console.error('Error updating session topic:', error);
      toast({
        title: 'Error',
        description: 'Failed to update conversation topic. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Enable scrolling only when user sends a message
    setShouldScroll(true);
    
    // Create a new session if none exists
    if (!sessionId) {
      try {
        // For demo purposes, create a local session if backend is not available
        const localSessionId = `local-${Date.now()}`;
        
        // Try to create a session in Supabase
        const { data, error } = await supabase
          .from('chat_sessions')
          .insert([
            { 
              user_id: user?.id,
              topic: input.length > 30 ? `${input.substring(0, 30)}...` : input,
              messages: []
            }
          ])
          .select();
        
        if (error) {
          console.warn('Using local session due to backend error:', error);
          // Use local session as fallback
          setSessionId(localSessionId);
          setActiveSession(localSessionId);
          
          const newSession = {
            id: localSessionId,
            topic: input.length > 30 ? `${input.substring(0, 30)}...` : input,
            messages: [],
            created_at: new Date()
          };
          
          setSessions([newSession, ...sessions]);
        } else if (data && data[0]) {
          setSessionId(data[0].id);
          setActiveSession(data[0].id);
          
          const newSession = {
            id: data[0].id,
            topic: data[0].topic,
            messages: [],
            created_at: new Date(data[0].created_at)
          };
          
          setSessions([newSession, ...sessions]);
        }
      } catch (error) {
        console.error('Error creating session:', error);
        // Create local fallback session
        const localSessionId = `local-${Date.now()}`;
        setSessionId(localSessionId);
        setActiveSession(localSessionId);
        
        const newSession = {
          id: localSessionId,
          topic: input.length > 30 ? `${input.substring(0, 30)}...` : input,
          messages: [],
          created_at: new Date()
        };
        
        setSessions([newSession, ...sessions]);
      }
    }
    
    // Add user message to state
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setError(null);
    setIsTyping(true);
    
    try {
      // Generate a local AI response if the session is local or if backend fails
      let aiResponse = "";
      
      if (sessionId?.startsWith('local-')) {
        // Local fallback responses based on keywords
        aiResponse = generateLocalResponse(input);
      } else {
        // Try to call the Supabase Edge Function for AI response
        try {
          const { data, error } = await supabase.functions.invoke('chatbot-ai', {
            body: { 
              message: input,
              history: messages,
              session_id: sessionId
            }
          });
          
          if (error) {
            console.warn('Using local AI response due to backend error:', error);
            aiResponse = generateLocalResponse(input);
          } else {
            aiResponse = data.message || "I'm sorry, I couldn't process your request.";
          }
        } catch (edgeFunctionError) {
          console.error('Edge function error:', edgeFunctionError);
          aiResponse = generateLocalResponse(input);
        }
      }
      
      // Add AI response to state
      const aiMessage: Message = {
        id: Date.now().toString() + '-ai',
        content: aiResponse,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Update the messages in the database if using a real session
      const updatedMessages = [...messages, userMessage, aiMessage];
      
      if (!sessionId?.startsWith('local-')) {
        try {
          await supabase
            .from('chat_sessions')
            .update({ 
              messages: updatedMessages,
              // Update topic if this is the first message
              ...(messages.length === 0 && { 
                topic: input.length > 30 ? `${input.substring(0, 30)}...` : input 
              })
            })
            .eq('id', sessionId);
        } catch (dbError) {
          console.warn('Failed to update database, continuing with local state:', dbError);
        }
      }
      
      // Always update the local state
      setSessions(sessions.map(session => 
        session.id === sessionId 
          ? { 
              ...session, 
              topic: messages.length === 0 ? (input.length > 30 ? `${input.substring(0, 30)}...` : input) : session.topic,
              messages: updatedMessages
            } 
          : session
      ));
    } catch (error) {
      console.error('Error getting AI response:', error);
      setError('Failed to get response. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  // Format timestamp
  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar with chat history */}
        <div className="md:col-span-1">
          <Card className="h-[calc(100vh-10rem)]">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Conversations</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={createNewSession}
                >
                  New Chat
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-16rem)]">
                <div className="space-y-2">
                  {sessions.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No conversations yet
                    </div>
                  ) : (
                    sessions.map(session => (
                      <div 
                        key={session.id}
                        className={`p-3 rounded-md cursor-pointer transition-colors ${
                          activeSession === session.id 
                            ? 'bg-primary/10 border border-primary/20' 
                            : 'hover:bg-secondary'
                        }`}
                        onClick={() => switchSession(session.id)}
                      >
                        <div className="font-medium truncate">{session.topic}</div>
                        <div className="text-xs text-muted-foreground">
                          {session.created_at.toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        
        {/* Main chat area */}
        <div className="md:col-span-3">
          <Card className="h-[calc(100vh-10rem)] flex flex-col">
            <CardHeader>
              <CardTitle>AuditX AI Assistant</CardTitle>
              <CardDescription>
                Ask questions about smart contracts, security, and blockchain development
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex-grow overflow-hidden">
              <ScrollArea className="h-[calc(100vh-22rem)]">
                <div className="space-y-4 pb-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">
                      <Bot className="h-12 w-12 mx-auto mb-4 text-primary/60" />
                      <p>Start a conversation with the AuditX AI Assistant</p>
                      <p className="text-sm mt-2">
                        Ask about smart contract security, development best practices, or code analysis
                      </p>
                    </div>
                  ) : (
                    messages.map(message => (
                      <div 
                        key={message.id} 
                        className={`flex ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div 
                          className={`flex gap-3 max-w-[80%] ${
                            message.role === 'user' ? 'flex-row-reverse' : ''
                          }`}
                        >
                          <Avatar className={`h-8 w-8 ${
                            message.role === 'assistant' ? 'bg-primary/20' : 'bg-secondary'
                          }`}>
                            {message.role === 'assistant' ? (
                              <Bot className="h-4 w-4" />
                            ) : (
                              <User className="h-4 w-4" />
                            )}
                          </Avatar>
                          <div>
                            <div 
                              className={`rounded-lg p-3 ${
                                message.role === 'assistant' 
                                  ? 'bg-secondary border border-border' 
                                  : 'bg-primary text-primary-foreground'
                              }`}
                            >
                              <div className="whitespace-pre-wrap">{message.content}</div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 px-1">
                              {formatTimestamp(message.timestamp)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  
                  {/* Typing indicator */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="flex gap-3 max-w-[80%]">
                        <Avatar className="h-8 w-8 bg-primary/20">
                          <Bot className="h-4 w-4" />
                        </Avatar>
                        <div>
                          <div className="rounded-lg p-3 bg-secondary border border-border">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Error message */}
                  {error && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="ml-auto" 
                        onClick={() => setError(null)}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    </Alert>
                  )}
                  
                  {/* Invisible element to scroll to */}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
            
            <CardFooter>
              <form 
                className="flex w-full items-center space-x-2" 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
              >
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 min-h-[2.5rem] max-h-[10rem]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isTyping}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!input.trim() || isTyping}
                >
                  {isTyping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;