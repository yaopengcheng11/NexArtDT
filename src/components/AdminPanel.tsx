import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { CheckCircle, XCircle, Key, Clock, Mail, ShieldAlert, Send, Trash2 } from 'lucide-react';

interface Request {
  id: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected' | 'used';
  registrationCode?: string;
  createdAt: any;
}

export function AdminPanel() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, email: string } | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'registration_requests'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reqs: Request[] = [];
      snapshot.forEach((doc) => {
        reqs.push({ id: doc.id, ...doc.data() } as Request);
      });
      setRequests(reqs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching requests:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (id: string, email: string) => {
    // Generate a 6-digit random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      await updateDoc(doc(db, 'registration_requests', id), {
        status: 'approved',
        registrationCode: code,
        email: email
      });

      // Call our backend API to send the email using QQ SMTP
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: email, code }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to send email via API:", errorData);
        // alert("审批成功，但邮件发送失败，请检查 QQ 邮箱配置或使用手动发送。");
      }

    } catch (error) {
      console.error("Error approving request:", error);
      // alert("审批失败");
    }
  };

  const handleReject = async (id: string, email: string) => {
    try {
      await updateDoc(doc(db, 'registration_requests', id), {
        status: 'rejected',
        email: email
      });
    } catch (error) {
      console.error("Error rejecting request:", error);
      // alert("拒绝失败");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteDoc(doc(db, 'registration_requests', deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting request:", error);
      // alert("删除失败");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-on-surface-variant">加载中...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-error/20 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-error" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">管理员控制台</h2>
          <p className="text-xs text-on-surface-variant">审批用户注册请求</p>
        </div>
      </div>

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant bg-surface-container rounded-2xl border border-white/5">
            暂无注册请求
          </div>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="bg-surface-container rounded-2xl p-5 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-on-surface-variant" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">{req.email}</h3>
                  <div className="flex items-center gap-4 mt-1 text-[11px] text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {req.createdAt?.toDate().toLocaleString() || '未知时间'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${
                      req.status === 'pending' ? 'bg-warning/20 text-warning' :
                      req.status === 'approved' ? 'bg-secondary/20 text-secondary' :
                      req.status === 'used' ? 'bg-primary/20 text-primary' :
                      'bg-error/20 text-error'
                    }`}>
                      {req.status === 'pending' ? '待审批' :
                       req.status === 'approved' ? '已批准' :
                       req.status === 'used' ? '已注册' : '已拒绝'}
                    </span>
                  </div>
                  {req.registrationCode && (
                    <div className="mt-2 flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-xs bg-surface-container-highest px-3 py-1.5 rounded-lg w-fit border border-white/5">
                        <Key className="w-4 h-4 text-secondary" />
                        <span className="text-white font-mono tracking-widest">{req.registrationCode}</span>
                        <span className="text-[11px] text-on-surface-variant ml-2">(系统已尝试自动发送邮件)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 sm:ml-auto">
                {req.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(req.id, req.email)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/20 text-secondary hover:bg-secondary/30 transition-colors text-xs font-medium"
                    >
                      <CheckCircle className="w-4 h-4" />
                      批准
                    </button>
                    <button
                      onClick={() => handleReject(req.id, req.email)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-warning/20 text-warning hover:bg-warning/30 transition-colors text-xs font-medium"
                    >
                      <XCircle className="w-4 h-4" />
                      拒绝
                    </button>
                  </>
                )}
                <button
                  onClick={() => setDeleteConfirm({ id: req.id, email: req.email })}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-error/20 text-error hover:bg-error/30 transition-colors text-xs font-medium ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-high rounded-2xl p-6 max-w-md w-full border border-white/10 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-2">确认删除</h3>
            <p className="text-sm text-on-surface-variant mb-6">
              您确定要删除 <span className="text-white font-medium">{deleteConfirm.email}</span> 的注册申请吗？此操作不可恢复。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl bg-surface-container text-white hover:bg-surface-container-highest transition-colors text-xs font-medium"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-error text-white hover:bg-error/90 transition-colors text-xs font-medium"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
