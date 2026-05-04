import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { chatWithAI } from '../lib/gemini';
import { useData } from '../context/DataContext';
import Markdown from 'react-markdown';
import { Logo } from './Logo';

export function ChatCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { getAllData, globalModel, customStocks } = useData();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const contextData = getAllData();
      const response = await chatWithAI(userMessage, contextData, messages, globalModel, customStocks);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: '抱歉，系统出现错误，请稍后再试。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-24 right-6 w-14 h-14 rounded-full bg-primary text-on-primary shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-40",
          isOpen && "scale-0"
        )}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Chat Panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 w-full sm:w-96 bg-surface-container-low border-l border-white/10 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-surface-container">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <div>
              <h3 className="text-sm font-bold text-white">AI 金融助手</h3>
              <p className="text-[11px] text-on-surface-variant">基于当前实盘数据为您解答</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex gap-3">
            <Logo size="sm" className="mt-1" />
            <div className="bg-surface-container-high rounded-2xl rounded-tl-none px-4 py-3 text-xs text-white/90 leading-relaxed">
              您好！我是您的 AI 金融助手。我已经读取了最新的市场数据、热搜动态和全球战事分析。请问有什么我可以帮您的？
            </div>
          </div>

          {messages.map((msg, index) => (
            <div key={index} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
              <div className={cn(
                "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1",
                msg.role === 'user' ? "bg-secondary/20" : ""
              )}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-secondary" /> : <Logo size="sm" />}
              </div>
              <div className={cn(
                "rounded-2xl px-4 py-3 text-xs leading-relaxed max-w-[85%]",
                msg.role === 'user' 
                  ? "bg-secondary text-on-secondary rounded-tr-none" 
                  : "bg-surface-container-high text-white/90 rounded-tl-none"
              )}>
                {msg.role === 'user' ? (
                  msg.text
                ) : (
                  <div className="markdown-body prose prose-invert prose-sm max-w-none">
                    <Markdown>{msg.text}</Markdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3">
              <Logo size="sm" className="mt-1" />
              <div className="bg-surface-container-high rounded-2xl rounded-tl-none px-4 py-3 text-xs text-white/90 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/10 bg-surface-container">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="询问关于当前市场的问题..."
              className="w-full bg-surface-container-high border border-white/10 rounded-full pl-5 pr-12 py-3 text-xs text-white placeholder-white/40 focus:outline-none focus:border-primary/50 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-2 rounded-full bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
