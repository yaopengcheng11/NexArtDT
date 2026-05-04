import { useState } from 'react';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Mail, Lock, Key, ArrowRight, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { Logo } from './Logo';

export function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register' | 'request'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      
      // Ensure admin document exists on login
      if (normalizedEmail === 'yao_pengcheng@outlook.com') {
        const userRef = doc(db, 'users', userCredential.user.uid);
        await setDoc(userRef, {
          email: normalizedEmail,
          role: 'admin',
          createdAt: serverTimestamp()
        }, { merge: true });
      }
    } catch (err: any) {
      setError('登录失败，请检查邮箱和密码。');
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const requestRef = doc(db, 'registration_requests', normalizedEmail);
      await setDoc(requestRef, {
        email: normalizedEmail,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setSuccess('注册请求已发送，请等待管理员审批并发送注册码。');
      setMode('login');
    } catch (err: any) {
      console.error("Request error:", err);
      const errorMessage = err.message || '';
      const errorCode = err.code || '';
      
      if (errorCode === 'permission-denied' || errorMessage.toLowerCase().includes('permission')) {
        setError('发送失败：您可能已经提交过申请，请耐心等待审批。');
      } else if (errorCode === 'resource-exhausted' || errorMessage.toLowerCase().includes('quota')) {
        setError('发送失败：系统配额已用完，请明天再试。');
      } else if (errorCode === 'unavailable' || errorMessage.toLowerCase().includes('offline')) {
        setError('发送失败：网络连接不可用，请检查网络后重试。');
      } else {
        setError(`发送请求失败：${errorMessage || '请稍后再试'} (Code: ${errorCode})`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const normalizedEmail = email.trim().toLowerCase();
    const isAdminEmail = normalizedEmail === 'yao_pengcheng@outlook.com';

    try {
      if (!isAdminEmail) {
        // 1. Verify code by attempting to update the request document
        const requestRef = doc(db, 'registration_requests', normalizedEmail);
        await updateDoc(requestRef, {
          status: 'used',
          registrationCode: code,
          email: normalizedEmail
        });
      }

      // 2. If update succeeds (or is admin), create Auth user.
      const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      
      // 3. Create User document
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: normalizedEmail,
        role: isAdminEmail ? 'admin' : 'user',
        createdAt: serverTimestamp()
      });

    } catch (err: any) {
      console.error(err);
      let errorMsg = '注册失败。请检查注册码是否正确或已被使用。';
      if (err.code === 'auth/email-already-in-use') {
        errorMsg = '该邮箱已被注册，请直接登录。';
      } else if (err.code === 'auth/weak-password') {
        errorMsg = '密码太弱，请输入至少6位字符。';
      } else if (err.message) {
        errorMsg = `注册失败: ${err.message}`;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 selection:bg-secondary/30">
      <div className="w-full max-w-md bg-surface-container-low rounded-3xl shadow-2xl border border-white/5 overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            <Logo size="lg" className="mb-4" />
            <h1 className="text-2xl font-bold text-white tracking-tight">AI 金融助手</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              {mode === 'login' ? '欢迎回来，请登录' : mode === 'register' ? '输入注册码完成注册' : '申请注册账号'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-xl bg-error/20 border border-error/50 flex items-start gap-2 text-error text-sm">
              <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-3 rounded-xl bg-secondary/20 border border-secondary/50 flex items-start gap-2 text-secondary text-sm">
              <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>{success}</p>
            </div>
          )}

          <form onSubmit={mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : handleRequest} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-on-surface-variant ml-1">邮箱地址</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-high border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-primary/50 transition-colors"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {(mode === 'login' || mode === 'register') && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface-variant ml-1">密码</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface-container-high border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-primary/50 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {mode === 'register' && email.trim().toLowerCase() !== 'yao_pengcheng@outlook.com' && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface-variant ml-1">注册码</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-surface-container-high border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-primary/50 transition-colors"
                    placeholder="6位注册码"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-on-primary font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 mt-6"
            >
              {loading ? '处理中...' : mode === 'login' ? '登录' : mode === 'register' ? '完成注册' : '发送申请'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-2 text-sm text-on-surface-variant">
            {mode === 'login' ? (
              <>
                <button onClick={() => { setMode('request'); setError(''); setSuccess(''); }} className="hover:text-white transition-colors">
                  没有账号？申请注册
                </button>
                <button onClick={() => { setMode('register'); setError(''); setSuccess(''); }} className="hover:text-white transition-colors">
                  已有注册码？完成注册
                </button>
              </>
            ) : (
              <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }} className="hover:text-white transition-colors">
                返回登录
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
