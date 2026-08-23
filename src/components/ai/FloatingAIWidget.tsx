import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bot, Send, X, Maximize2, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useStreamMessage } from '@/hooks/useAIChat';
import type { AgentType, Message } from '@/services/ai/types';

function getDefaultAgent(pathname: string): AgentType {
  if (pathname.startsWith('/inventory')) return 'inventory';
  if (pathname.startsWith('/crm')) return 'sales';
  if (pathname.startsWith('/procurement')) return 'procurement';
  if (pathname.startsWith('/sales')) return 'finance';
  if (pathname.startsWith('/reports')) return 'excel';
  return 'general';
}

export function FloatingAIWidget() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [agent, setAgent] = useState<AgentType>(() => getDefaultAgent(location.pathname));
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const stream = useStreamMessage();

  useEffect(() => {
    setAgent(getDefaultAgent(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, stream.streamedContent]);

  const sendMessage = useCallback(async () => {
    const content = input.trim();
    if (!content || stream.isStreaming) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
      agentType: agent,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      const result = await stream.startStream(content, agent);

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.content,
        timestamp: new Date(),
        agentType: agent,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
        agentType: agent,
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  }, [input, agent, stream]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleExpand = () => {
    setIsOpen(false);
    navigate('/ai');
  };

  // Do not show on the AI page itself
  if (location.pathname === '/ai') return null;

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 animate-pulse hover:animate-none transition-all"
          >
            <Bot className="h-6 w-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Mini Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] h-[500px] flex flex-col glass rounded-[24px] border border-border shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <Select value={agent} onValueChange={(val) => setAgent(val as AgentType)}>
                  <SelectTrigger className="h-7 w-[130px] text-xs border-0 bg-transparent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inventory">Inventory</SelectItem>
                    <SelectItem value="sales">Sales & CRM</SelectItem>
                    <SelectItem value="procurement">Procurement</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="excel">Excel & Data</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleExpand}
                  title="Expand to full page"
                >
                  <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-3">
                {messages.length === 0 && !stream.isStreaming && (
                  <div className="text-center py-8">
                    <Bot className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">
                      Ask me anything about your data
                    </p>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                        <Bot className="h-3 w-3 text-emerald-400" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'max-w-[80%] rounded-[12px] px-3 py-2 text-xs',
                        msg.role === 'user'
                          ? 'bg-primary/20 text-foreground'
                          : 'bg-white/5 border border-border'
                      )}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-invert prose-xs max-w-none prose-p:my-0.5 prose-headings:text-foreground prose-strong:text-foreground">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Streaming */}
                {stream.isStreaming && (
                  <div className="flex gap-2 justify-start">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                      <Bot className="h-3 w-3 text-emerald-400" />
                    </div>
                    <div className="max-w-[80%] rounded-[12px] px-3 py-2 text-xs bg-white/5 border border-border">
                      {stream.streamedContent ? (
                        <div className="prose prose-invert prose-xs max-w-none prose-p:my-0.5">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {stream.streamedContent}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <Loader2 className="h-3 w-3 text-primary animate-spin" />
                      )}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t border-border">
              <div className="flex items-center gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="h-8 text-xs rounded-[12px] border-border"
                />
                <Button
                  size="icon"
                  className="h-8 w-8 rounded-[12px] flex-shrink-0"
                  onClick={sendMessage}
                  disabled={!input.trim() || stream.isStreaming}
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
