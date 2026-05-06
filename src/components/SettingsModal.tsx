import { X, LogOut, Bot } from 'lucide-react';
import { cn } from '../lib/utils';
import { useData } from '../context/DataContext';
import { auth } from '../lib/firebase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { globalModel, setGlobalModel } = useData();

  if (!isOpen) return null;

  const models = [
    { id: 'gemini', name: 'Gemini 3 Flash' },
    { id: 'openai', name: 'GPT-5.4 Mini' },
    { id: 'deepseek', name: 'DeepSeek' },
    { id: 'doubao', name: '豆包 (Doubao)' },
    { id: 'mimo', name: '小米 MiMo' }
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-surface-container-low border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-surface-container">
          <h3 className="text-base font-bold text-white">全局设置</h3>
          <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 space-y-6">
          {/* Model Selection */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-white/90">
              <Bot className="w-4 h-4 text-primary" />
              全局 AI 模型
            </label>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              选择在此应用中用于数据分析和聊天助手的默认 AI 模型。
            </p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {models.map(m => (
                <button
                  key={m.id}
                  onClick={() => setGlobalModel(m.id)}
                  className={cn(
                    "px-3 py-3 rounded-xl text-xs font-medium border transition-all duration-200 flex items-center justify-center",
                    globalModel === m.id 
                      ? "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(var(--color-primary),0.2)]" 
                      : "bg-surface-container-high border-white/5 text-white/70 hover:bg-surface-bright hover:text-white"
                  )}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px w-full bg-white/5" />

          {/* Logout */}
          <button
            onClick={() => { onClose(); auth.signOut(); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-error/10 text-error hover:bg-error/20 border border-error/20 transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
}
