import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User,
  Copy,
  Trash2,
  Sparkles
} from 'lucide-react';
import { getFreePlanUsage, FREE_LIMITS } from '@/lib/planLimits';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

const Chatbot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: "Hello! I'm your Smart Contract Assistant. I can help you with Solidity development, security best practices, gas optimization, and more. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [limitModalOpen, setLimitModalOpen] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const usage = await getFreePlanUsage(user.id);
      if (usage.chatMessages >= FREE_LIMITS.chatMessages) {
        setLimitModalOpen(true);
        setIsTyping(false);
        return;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    try {
      // Call our Supabase edge function
      const response = await fetch('https://dzjotrzhwubdatmpjdmc.supabase.co/functions/v1/chatbot-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: currentMessage }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: data.response || 'Sorry, I could not generate a response.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Error calling AI:', error);
      
      // Show error message instead of fallback
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: `❌ Error: Unable to connect to AI service. ${error instanceof Error ? error.message : 'Please try again later.'}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('reentrancy')) {
      return "Reentrancy is a vulnerability where a function can be called again before its previous execution is complete. To prevent it:\n\n1. Use the checks-effects-interactions pattern\n2. Implement reentrancy guards (like OpenZeppelin's ReentrancyGuard)\n3. Update state variables before external calls\n4. Use `call` instead of `transfer` for ETH transfers\n\nExample with ReentrancyGuard:\n```solidity\ncontract MyContract is ReentrancyGuard {\n    function withdraw() external nonReentrant {\n        // Safe withdrawal logic\n    }\n}\n```";
    }
    
    if (input.includes('gas') && input.includes('optimization')) {
      return "Here are key gas optimization techniques:\n\n1. **Use smaller data types** when possible (uint8 instead of uint256)\n2. **Pack struct variables** to fit in 32-byte slots\n3. **Use mappings** instead of arrays for large datasets\n4. **Avoid loops** or limit their size\n5. **Use events** for data that doesn't need to be stored\n6. **Cache storage variables** in memory\n7. **Use ++i instead of i++** in loops\n\nExample of struct packing:\n```solidity\nstruct OptimizedStruct {\n    uint128 amount;  // 16 bytes\n    uint64 timestamp; // 8 bytes\n    uint32 id;       // 4 bytes\n    bool active;     // 1 byte\n    // Total: 29 bytes (fits in one 32-byte slot)\n}\n```";
    }
    
    if (input.includes('security') || input.includes('audit')) {
      return "Smart contract security best practices:\n\n1. **Input validation** - Always validate user inputs\n2. **Access controls** - Use proper permission checks\n3. **Integer overflow/underflow** - Use SafeMath or Solidity ^0.8.0\n4. **External calls** - Be cautious with external contract calls\n5. **Randomness** - Don't rely on block variables for randomness\n6. **Front-running** - Consider MEV protection\n7. **Testing** - Comprehensive unit and integration tests\n8. **Formal verification** - Use tools like Certora or Mythril\n\nCommon vulnerabilities to watch for:\n• Reentrancy attacks\n• Integer overflow/underflow\n• Timestamp dependence\n• Authorization flaws\n• Logic errors";
    }
    
    if (input.includes('erc20') || input.includes('token')) {
      return "ERC20 token implementation tips:\n\n1. **Use OpenZeppelin** - Don't reinvent the wheel\n2. **Implement all required functions** - transfer, approve, balanceOf, etc.\n3. **Handle edge cases** - Zero transfers, self-transfers\n4. **Emit events** - Transfer and Approval events\n5. **Consider extensions** - Mintable, Burnable, Pausable\n\nBasic ERC20 structure:\n```solidity\nimport \"@openzeppelin/contracts/token/ERC20/ERC20.sol\";\n\ncontract MyToken is ERC20 {\n    constructor() ERC20(\"MyToken\", \"MTK\") {\n        _mint(msg.sender, 1000000 * 10**decimals());\n    }\n}\n```";
    }
    
    return "I can help you with various smart contract topics including:\n\n• Solidity syntax and best practices\n• Security vulnerabilities and prevention\n• Gas optimization techniques\n• ERC standards (ERC20, ERC721, etc.)\n• DeFi protocols and patterns\n• Testing and debugging\n• Deployment strategies\n\nFeel free to ask me any specific questions about smart contract development!";
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard",
    });
  };

  const clearChat = () => {
    setMessages([{
      id: '1',
      type: 'bot',
      content: "Hello! I'm your Smart Contract Assistant. I can help you with Solidity development, security best practices, gas optimization, and more. What would you like to know?",
      timestamp: new Date()
    }]);
  };

  const suggestedQuestions = [
    "What is reentrancy and how to prevent it?",
    "How to optimize gas usage in smart contracts?",
    "What are common security vulnerabilities?",
    "How to implement ERC20 tokens?",
    "What are smart contract design patterns?"
  ];

  return (
    <div className="min-h-screen bg-gradient-space py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Smart Contract Chatbot
            </span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Get instant answers to your blockchain development questions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Suggested Questions */}
          <div className="lg:col-span-1">
            <Card className="bg-gradient-card border-border h-full max-h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-purple-primary" />
                  <span>Suggested Questions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center space-y-2 overflow-y-auto max-h-[420px] custom-scrollbar pr-1">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full max-w-full text-left text-xs h-auto p-2 justify-center overflow-hidden truncate"
                    onClick={() => setInputMessage(question)}
                    title={question}
                  >
                    <span className="block truncate overflow-hidden text-ellipsis w-full">{question}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="bg-gradient-card border-border h-[600px] flex flex-col">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5 text-purple-primary" />
                  <span>Chat Assistant</span>
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearChat}
                  className="hover:bg-destructive/20"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary/50 text-foreground'
                        }`}
                      >
                        <div className="flex items-start space-x-2">
                          {message.type === 'bot' ? (
                            <Bot className="h-4 w-4 mt-0.5 text-purple-primary" />
                          ) : (
                            <User className="h-4 w-4 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <pre className="whitespace-pre-wrap text-sm font-sans">
                              {message.content}
                            </pre>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs opacity-70">
                                {message.timestamp.toLocaleTimeString()}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyMessage(message.content)}
                                className="h-6 w-6 p-0 hover:bg-transparent"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-secondary/50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Bot className="h-4 w-4 text-purple-primary" />
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-purple-primary rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-purple-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-purple-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-border">
                  <div className="flex space-x-2">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Ask me anything about smart contracts..."
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isTyping}
                      className="bg-gradient-primary hover:opacity-90"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Dialog open={limitModalOpen} onOpenChange={setLimitModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>⚠️ You’ve reached the Free Plan limit</DialogTitle>
            <DialogDescription>
              Upgrade your plan to continue using this feature.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => {/* navigate to pricing */}}>Upgrade Now</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Chatbot;