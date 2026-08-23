import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send, Mic, MicOff, Plus, Package, Users, Truck, Download,
  TrendingUp, FileSpreadsheet, HelpCircle, Bot, User,
  MessageSquare, Trash2, MoreVertical, Loader2, PanelRightOpen,
  PanelRightClose, BookOpen, Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  useConversations,
  useCreateConversation,
  useDeleteConversation,
  useStreamMessage,
} from '@/hooks/useAIChat';
import type { AgentType, Message } from '@/services/ai/types';
import type { ToolCall } from '@/hooks/useAIChat';
import { supabase } from '@/lib/supabase';

const agents = [
  { type: 'inventory' as AgentType, name: 'Inventory', icon: Package, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { type: 'sales' as AgentType, name: 'Sales & CRM', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { type: 'procurement' as AgentType, name: 'Procurement', icon: Truck, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { type: 'finance' as AgentType, name: 'Finance', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { type: 'excel' as AgentType, name: 'Excel & Data', icon: FileSpreadsheet, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { type: 'general' as AgentType, name: 'General', icon: HelpCircle, color: 'text-gray-400', bg: 'bg-gray-500/10' },
];

const suggestedPrompts: Record<AgentType, string[]> = {
  inventory: ['Show low stock items', 'Stock levels for warehouse Mumbai', 'Generate reorder suggestions', 'What items need restocking?'],
  sales: ['Show pipeline summary', 'Top deals this month', 'Customer with highest revenue', 'Conversion rate analysis'],
  procurement: ['Overdue purchase orders', 'Compare supplier prices', 'Pending deliveries this week', 'Best suppliers by delivery time'],
  finance: ['Monthly revenue breakdown', 'Profit margin analysis', 'Cash flow forecast', 'Outstanding invoices summary'],
  excel: ['Generate stock report', 'Export customer list', 'Create sales summary', 'Import data template'],
  general: ['How do I add a product?', 'Explain deal stages', 'What reports are available?', 'Show system overview'],
};

const toolDisplayNames: Record<string, string> = {
  search_inventory: 'Searching inventory...',
  get_stock_levels: 'Checking stock levels...',
  search_customers: 'Looking up customers...',
  get_sales_pipeline: 'Analyzing pipeline...',
  get_purchase_orders: 'Fetching purchase orders...',
  get_supplier_info: 'Getting supplier info...',
  calculate_metrics: 'Calculating metrics...',
  search_knowledge: 'Searching knowledge base...',
  generate_report: 'Generating report...',
  get_financial_summary: 'Analyzing finances...',
};

interface ChatMessage extends Message {
  sources?: string[];
  toolCalls?: ToolCall[];
}

export default function AIAssistantPage() {
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('general');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const { data: conversations, refetch: refetchConversations } = useConversations();
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const stream = useStreamMessage();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, stream.streamedContent]);

  const handleNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    stream.reset();
  }, [stream]);

  const handleLoadConversation = useCallback((conv: { id: string; messages: Message[]; agentType: AgentType }) => {
    setActiveConversationId(conv.id);
    setMessages(conv.messages as ChatMessage[]);
    setSelectedAgent(conv.agentType);
    stream.reset();
  }, [stream]);

  const handleDeleteConversation = useCallback((id: string) => {
    deleteConversation.mutate(id);
    if (activeConversationId === id) {
      handleNewConversation();
    }
  }, [deleteConversation, activeConversationId, handleNewConversation]);

  const refetchConversation = useCallback(async (conversationId: string) => {
    // Re-fetch the conversation from the database to get the server-written version.
    // The Edge Function is the authoritative writer for ai_conversations.messages
    // during streaming - the client must not overwrite its data.
    const { data } = await supabase
      .from('ai_conversations')
      .select('messages')
      .eq('id', conversationId)
      .single();

    if (data?.messages) {
      const msgs = (data.messages as Array<{ id: string; role: 'user' | 'assistant' | 'system'; content: string; timestamp: string; agentType?: AgentType; sources?: string[] }>).map((m) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      })) as ChatMessage[];
      setMessages(msgs);
    }

    // Also invalidate the conversations list so sidebar updates
    await refetchConversations();
  }, [refetchConversations]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || stream.isStreaming) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      agentType: selectedAgent,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');

    let convId = activeConversationId;

    if (!convId) {
      try {
        const title = content.trim().slice(0, 50) + (content.length > 50 ? '...' : '');
        const conv = await createConversation.mutateAsync({ title, agentType: selectedAgent });
        convId = conv.id;
        setActiveConversationId(conv.id);
      } catch {
        toast.error('Failed to create conversation');
        return;
      }
    }

    try {
      const result = await stream.startStream(content.trim(), selectedAgent, convId);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.content,
        timestamp: new Date(),
        agentType: selectedAgent,
        sources: result.sources,
        toolCalls: stream.toolCalls,
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);

      // The Edge Function is the authoritative writer for conversation messages.
      // Re-fetch from the database to get the server-written version instead of
      // performing a client-side overwrite that could race with the Edge Function.
      if (convId) {
        await refetchConversation(convId);
      }
    } catch {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        agentType: selectedAgent,
      };
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);

      // On error, the Edge Function may not have saved anything, so re-fetch
      // to stay consistent with the database state.
      if (convId) {
        await refetchConversation(convId);
      }
    }
  }, [messages, selectedAgent, activeConversationId, createConversation, stream, refetchConversation]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const toggleVoiceInput = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition is not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join('');
      setInput(transcript);
    };

    recognition.onerror = () => {
      setIsRecording(false);
      toast.error('Voice recognition failed');
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  }, [isRecording]);

  const exportAsMarkdown = useCallback(() => {
    if (messages.length === 0) {
      toast.error('No messages to export');
      return;
    }

    const agentName = agents.find((a) => a.type === selectedAgent)?.name || 'AI';
    let md = `# ${agentName} Conversation\n\n`;
    md += `*Exported on ${new Date().toLocaleString()}*\n\n---\n\n`;

    for (const msg of messages) {
      const role = msg.role === 'user' ? 'You' : agentName;
      md += `**${role}** (${msg.timestamp.toLocaleTimeString()}):\n\n${msg.content}\n\n---\n\n`;
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Conversation exported');
  }, [messages, selectedAgent]);

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const currentAgent = agents.find((a) => a.type === selectedAgent)!;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex h-[calc(100vh-8rem)] gap-4"
    >
      {/* LEFT PANEL - Conversation History */}
      <div className="hidden w-64 flex-shrink-0 lg:flex lg:flex-col">
        <div className="glass rounded-[24px] h-full flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border">
            <Button
              onClick={handleNewConversation}
              className="w-full rounded-[16px] gap-2"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              New Conversation
            </Button>
          </div>
          <ScrollArea className="flex-1 p-2">
            <div className="space-y-1">
              <AnimatePresence>
                {conversations?.map((conv) => (
                  <motion.div
                    key={conv.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className={cn(
                      'group flex items-center gap-2 rounded-[12px] px-3 py-2 cursor-pointer transition-colors',
                      activeConversationId === conv.id
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-white/5'
                    )}
                    onClick={() => handleLoadConversation(conv)}
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{conv.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                          {conv.agentType}
                        </Badge>
                        <span className="text-[9px] text-muted-foreground">
                          {getRelativeTime(conv.updatedAt)}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConversation(conv.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </motion.div>
                ))}
              </AnimatePresence>
              {(!conversations || conversations.length === 0) && (
                <div className="text-center py-8">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No conversations yet</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header with Agent Tabs */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {agents.map((a) => (
              <button
                key={a.type}
                onClick={() => setSelectedAgent(a.type)}
                className={cn(
                  'flex items-center gap-1.5 rounded-[12px] px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap',
                  selectedAgent === a.type
                    ? 'bg-primary/10 border border-primary/20 text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                )}
              >
                <a.icon className={cn('h-3.5 w-3.5', selectedAgent === a.type ? a.color : '')} />
                {a.name}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={exportAsMarkdown}
              title="Export as Markdown"
            >
              <Download className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowRightPanel(!showRightPanel)}
              title="Toggle RAG Context Panel"
            >
              {showRightPanel ? (
                <PanelRightClose className="h-4 w-4 text-muted-foreground" />
              ) : (
                <PanelRightOpen className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
          {messages.length === 0 && !stream.isStreaming && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className={cn('flex h-16 w-16 items-center justify-center rounded-full mb-4 mx-auto', currentAgent.bg)}>
                  <Bot className={cn('h-8 w-8', currentAgent.color)} />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-1">
                  Start a conversation with {currentAgent.name}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mb-6">
                  Ask me anything. I can search your data, run analysis, and provide insights.
                </p>
              </motion.div>

              {/* Suggested Prompts */}
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {suggestedPrompts[selectedAgent].map((prompt) => (
                  <motion.button
                    key={prompt}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => sendMessage(prompt)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all"
                  >
                    {prompt}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {msg.role === 'assistant' && (
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                    <Bot className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                )}
                <div className={cn('max-w-[75%] space-y-2')}>
                  {/* Tool Calls */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="space-y-1.5">
                      {msg.toolCalls.map((tc, i) => (
                        <div key={i} className="glass rounded-[12px] px-3 py-2 flex items-center gap-2">
                          <Wrench className="h-3 w-3 text-primary" />
                          <span className="text-[11px] text-muted-foreground">
                            {toolDisplayNames[tc.name] || `Running ${tc.name}...`}
                          </span>
                          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 ml-auto">
                            Done
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Message Content */}
                  <div
                    className={cn(
                      'rounded-[16px] px-4 py-3 text-sm',
                      msg.role === 'user'
                        ? 'bg-primary/20 text-foreground'
                        : 'glass'
                    )}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-headings:text-foreground prose-strong:text-foreground prose-code:text-primary prose-code:bg-primary/10 prose-code:rounded prose-code:px-1">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                    <p className="mt-1.5 text-[10px] text-muted-foreground">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {/* Source Citations */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {msg.sources.map((source, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-5 gap-1 text-muted-foreground"
                        >
                          <BookOpen className="h-2.5 w-2.5" />
                          {source}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                    <User className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Streaming Response */}
          {stream.isStreaming && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 justify-start"
            >
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                <Bot className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <div className="max-w-[75%] space-y-2">
                {/* Active Tool Calls */}
                {stream.toolCalls.length > 0 && (
                  <div className="space-y-1.5">
                    {stream.toolCalls.map((tc, i) => (
                      <div key={i} className="glass rounded-[12px] px-3 py-2 flex items-center gap-2">
                        {tc.status === 'running' ? (
                          <Loader2 className="h-3 w-3 text-primary animate-spin" />
                        ) : (
                          <Wrench className="h-3 w-3 text-primary" />
                        )}
                        <span className="text-[11px] text-muted-foreground">
                          {toolDisplayNames[tc.name] || `Running ${tc.name}...`}
                        </span>
                        {tc.status === 'complete' && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 ml-auto">
                            Done
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {/* Streamed Content */}
                {stream.streamedContent && (
                  <div className="glass rounded-[16px] px-4 py-3 text-sm">
                    <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-headings:text-foreground prose-strong:text-foreground prose-code:text-primary prose-code:bg-primary/10 prose-code:rounded prose-code:px-1">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {stream.streamedContent}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
                {/* Typing indicator when no content yet */}
                {!stream.streamedContent && stream.toolCalls.length === 0 && (
                  <div className="glass rounded-[16px] px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="glass rounded-[16px] p-3">
          <div className="flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${currentAgent.name}... (Shift+Enter for newline)`}
              className="min-h-[40px] max-h-[120px] border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 resize-none text-sm"
              rows={1}
            />
            <div className="flex items-center gap-1 flex-shrink-0 pb-0.5">
              <Button
                variant="ghost"
                size="icon"
                className={cn('h-8 w-8', isRecording && 'text-red-400 bg-red-500/10')}
                onClick={toggleVoiceInput}
                title={isRecording ? 'Stop recording' : 'Voice input'}
              >
                {isRecording ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
              <Button
                size="icon"
                className="h-8 w-8 rounded-[12px]"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || stream.isStreaming}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - RAG Context */}
      <AnimatePresence>
        {showRightPanel && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 280 }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="hidden lg:block flex-shrink-0 overflow-hidden"
          >
            <div className="glass rounded-[24px] h-full flex flex-col overflow-hidden w-[280px]">
              <div className="p-4 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  RAG Context
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Data accessed by the AI in this conversation
                </p>
              </div>
              <ScrollArea className="flex-1 p-4">
                {stream.toolCalls.length > 0 || messages.some((m) => m.toolCalls && m.toolCalls.length > 0) ? (
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      Tools Used
                    </h4>
                    {getAllToolCalls(messages, stream.toolCalls).map((tc, i) => (
                      <div key={i} className="rounded-[12px] border border-border p-2.5 space-y-1">
                        <div className="flex items-center gap-2">
                          <Wrench className="h-3 w-3 text-primary" />
                          <span className="text-[11px] font-medium text-foreground">{tc.name}</span>
                        </div>
                        {tc.input && Object.keys(tc.input).length > 0 && (
                          <pre className="text-[10px] text-muted-foreground bg-black/20 rounded-[8px] p-1.5 overflow-x-auto">
                            {JSON.stringify(tc.input, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                    {/* Sources Summary */}
                    {messages.some((m) => m.sources && m.sources.length > 0) && (
                      <>
                        <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-4">
                          Knowledge Sources
                        </h4>
                        {getAllSources(messages).map((source, i) => (
                          <div key={i} className="flex items-center gap-2 text-[11px] text-foreground">
                            <BookOpen className="h-3 w-3 text-primary" />
                            {source}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Wrench className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">
                      No tools or context accessed yet. Start a conversation to see AI data access here.
                    </p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function getAllToolCalls(messages: ChatMessage[], streamToolCalls: ToolCall[]): ToolCall[] {
  const allCalls: ToolCall[] = [];
  for (const msg of messages) {
    if (msg.toolCalls) {
      allCalls.push(...msg.toolCalls);
    }
  }
  allCalls.push(...streamToolCalls);
  return allCalls;
}

function getAllSources(messages: ChatMessage[]): string[] {
  const sources = new Set<string>();
  for (const msg of messages) {
    if (msg.sources) {
      for (const s of msg.sources) {
        sources.add(s);
      }
    }
  }
  return Array.from(sources);
}
