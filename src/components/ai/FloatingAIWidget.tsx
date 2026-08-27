import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bot, Send, X, Maximize2, Loader2, Sparkles
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
  if (pathname.startsWith('/sales') || pathname.startsWith('/finance')) return 'finance';
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

  const sendMessage = useCallback(async (customText?: string) => {
    const content = (customText || input).trim();
    if (!content || stream.isStreaming) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
      agentType: agent,
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customText) setInput('');

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
        content: 'I am ready to assist with your CRM deals, inventory stock, and automated order tracking queries.',
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

  // Do not show on the AI full page itself
  if (location.pathname === '/ai') return null;

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2 group"
          >
            <div className="hidden group-hover:flex items-center bg-slate-900/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md transition-all">
              <Sparkles className="h-3.5 w-3.5 text-purple-400 mr-1.5" /> Ask AI Multi-Agent Copilot
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-500 shadow-xl shadow-purple-600/35 text-white hover:scale-105 transition-all cursor-pointer border-2 border-white/20"
              aria-label="Open AI Assistant"
            >
              <Bot className="h-7 w-7" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] sm:w-[400px] h-[520px] max-h-[85vh] flex flex-col bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 bg-gradient-to-r from-purple-50/70 to-indigo-50/70">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-sm text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-black text-slate-900">DOS AI Copilot</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <Select value={agent} onValueChange={(val) => setAgent(val as AgentType)}>
                    <SelectTrigger className="h-5 px-1 text-[10px] font-bold border-0 bg-transparent text-purple-700 p-0 shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inventory">📦 Inventory Agent</SelectItem>
                      <SelectItem value="sales">💼 Sales & CRM Agent</SelectItem>
                      <SelectItem value="procurement">🚚 Procurement Agent</SelectItem>
                      <SelectItem value="finance">💰 Finance & Tax Agent</SelectItem>
                      <SelectItem value="excel">📊 Excel & Data Agent</SelectItem>
                      <SelectItem value="general">⚡ General Assistant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-slate-500 hover:text-purple-700"
                  onClick={handleExpand}
                  title="Expand to Full Agent Studio"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-900"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Quick Prompt Chips */}
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[10px] font-bold text-slate-600">
              <button
                type="button"
                onClick={() => sendMessage('Check low stock items across all warehouses')}
                className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-purple-300 hover:text-purple-700 shrink-0 cursor-pointer"
              >
                🔥 Low Stock
              </button>
              <button
                type="button"
                onClick={() => sendMessage('What is the total pipeline value of active CRM deals?')}
                className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-purple-300 hover:text-purple-700 shrink-0 cursor-pointer"
              >
                💼 Deals
              </button>
              <button
                type="button"
                onClick={() => sendMessage('Summarize WhatsApp cart recovery notifications status')}
                className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-purple-300 hover:text-purple-700 shrink-0 cursor-pointer"
              >
                💬 Cart AI
              </button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3.5">
                {messages.length === 0 && !stream.isStreaming && (
                  <div className="text-center py-10 space-y-2">
                    <div className="h-12 w-12 rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center mx-auto">
                      <Bot className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">How can I assist your operations today?</p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      Ask about inventory SKUs, customer quotations, automated cart reminders, or financial margins.
                    </p>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700 mt-0.5">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'max-w-[82%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed',
                        msg.role === 'user'
                          ? 'bg-purple-600 text-white rounded-br-none shadow-xs'
                          : 'bg-slate-100/90 text-slate-800 rounded-bl-none border border-slate-200/80 shadow-xs'
                      )}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-xs max-w-none prose-p:my-0.5 text-slate-800">
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

                {/* Streaming Indicator */}
                {stream.isStreaming && (
                  <div className="flex gap-2 justify-start">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                    <div className="max-w-[82%] rounded-2xl px-3.5 py-2 text-xs bg-slate-100 border border-slate-200">
                      {stream.streamedContent ? (
                        <div className="prose prose-xs max-w-none prose-p:my-0.5 text-slate-800">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {stream.streamedContent}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-purple-600">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span className="text-[11px] font-semibold">Analyzing database...</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t border-slate-200 bg-white">
              <div className="flex items-center gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask copilot or type query..."
                  className="h-10 text-xs rounded-xl bg-slate-50 border-slate-200 focus:bg-white"
                />
                <Button
                  size="icon"
                  className="h-10 w-10 rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || stream.isStreaming}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
