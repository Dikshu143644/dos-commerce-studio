import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Send, Mic, Paperclip, Package, Users, Truck,
  TrendingUp, FileSpreadsheet, HelpCircle, Bot, User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { chatWithFallback } from '@/services/ai/providers';
import type { AgentType, Message } from '@/services/ai/types';

const agents = [
  { type: 'inventory' as AgentType, name: 'Inventory Copilot', icon: Package, color: 'text-emerald-400', bg: 'bg-emerald-500/10', description: 'Stock levels, movements, reorders' },
  { type: 'sales' as AgentType, name: 'Sales & CRM', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', description: 'Customers, deals, pipeline' },
  { type: 'procurement' as AgentType, name: 'Procurement', icon: Truck, color: 'text-amber-400', bg: 'bg-amber-500/10', description: 'Suppliers, POs, deliveries' },
  { type: 'finance' as AgentType, name: 'Finance Analyst', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10', description: 'Revenue, margins, forecasts' },
  { type: 'excel' as AgentType, name: 'Excel & Data', icon: FileSpreadsheet, color: 'text-cyan-400', bg: 'bg-cyan-500/10', description: 'Reports, imports, exports' },
  { type: 'general' as AgentType, name: 'General Help', icon: HelpCircle, color: 'text-gray-400', bg: 'bg-gray-500/10', description: 'Navigation, features, help' },
];

const suggestedPrompts: Record<AgentType, string[]> = {
  inventory: ['Show low stock items', 'Stock levels for warehouse Mumbai', 'Generate reorder suggestions'],
  sales: ['Show pipeline summary', 'Top deals this month', 'Customer with highest revenue'],
  procurement: ['Overdue purchase orders', 'Compare supplier prices', 'Pending deliveries this week'],
  finance: ['Monthly revenue breakdown', 'Profit margin analysis', 'Cash flow forecast'],
  excel: ['Generate stock report', 'Export customer list', 'Create sales summary'],
  general: ['How do I add a product?', 'Explain deal stages', 'What reports are available?'],
};

export default function AIAssistantPage() {
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('general');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      agentType: selectedAgent,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await chatWithFallback(
        [...messages, userMessage],
        `You are the StockFlow ${agents.find(a => a.type === selectedAgent)?.name} assistant.`
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        agentType: selectedAgent,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        agentType: selectedAgent,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const agent = agents.find((a) => a.type === selectedAgent)!;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex h-[calc(100vh-8rem)] gap-6"
    >
      {/* Agent Selector */}
      <div className="hidden w-64 flex-shrink-0 lg:block">
        <Card className="h-full">
          <CardContent className="p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground mb-3">AI Agents</h3>
            {agents.map((a) => (
              <button
                key={a.type}
                onClick={() => setSelectedAgent(a.type)}
                className={cn(
                  'w-full flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors',
                  selectedAgent === a.type
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-secondary'
                )}
              >
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-[8px]', a.bg)}>
                  <a.icon className={cn('h-4 w-4', a.color)} />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">{a.name}</p>
                  <p className="text-[10px] text-muted-foreground">{a.description}</p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Chat Area */}
      <div className="flex flex-1 flex-col">
        {/* Agent Header */}
        <div className="mb-4 flex items-center gap-3">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-[12px]', agent.bg)}>
            <agent.icon className={cn('h-5 w-5', agent.color)} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{agent.name}</h2>
            <p className="text-xs text-muted-foreground">{agent.description}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className={cn('flex h-16 w-16 items-center justify-center rounded-full mb-4', agent.bg)}>
                <Bot className={cn('h-8 w-8', agent.color)} />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">Start a conversation</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                Ask me anything about {agent.description.toLowerCase()}. I can help you with insights, data, and actions.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {msg.role === 'assistant' && (
                <div className={cn('flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full', agent.bg)}>
                  <Bot className={cn('h-3.5 w-3.5', agent.color)} />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[75%] rounded-[16px] px-4 py-3 text-sm',
                  msg.role === 'user'
                    ? 'bg-primary/20 text-foreground'
                    : 'glass'
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {msg.role === 'user' && (
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <User className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
            </motion.div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className={cn('flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full', agent.bg)}>
                <Bot className={cn('h-3.5 w-3.5', agent.color)} />
              </div>
              <div className="glass rounded-[16px] px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        {messages.length === 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {suggestedPrompts[selectedAgent].map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="glass rounded-[16px] p-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
              <Paperclip className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${agent.name}...`}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
              <Mic className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
