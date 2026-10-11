import React, { useState, useEffect } from 'react';
import {
  User,
  Tenant,
  DemoAccount,
  DocumentItem,
  AttackTestResult,
  ModelOption,
  RolePersona,
  AuditLog,
} from './types';
import { Header, ActiveTab } from './components/Header';
import { LoginModal } from './components/LoginModal';
import { ChatView } from './components/ChatView';
import { DocumentsView } from './components/DocumentsView';
import { ProfilesView } from './components/ProfilesView';
import { SecurityLabView } from './components/SecurityLabView';
import { AdminView } from './components/AdminView';
import { VoiceModal } from './components/VoiceModal';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [allTenants, setAllTenants] = useState<Tenant[]>([]);
  const [sameTenantMembers, setSameTenantMembers] = useState<any[]>([]);
  const [recentAudit, setRecentAudit] = useState<AuditLog[]>([]);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const fetchDemoAccounts = async () => {
    try {
      const res = await fetch('/api/auth/demo-accounts');
      if (res.ok) {
        const data = await res.json();
        setDemoAccounts(data.accounts || []);
      }
    } catch (err) {
      console.warn('Could not load demo accounts:', err);
    }
  };

  const fetchCurrentSession = async () => {
    const savedToken = localStorage.getItem('tenant_ai_token');
    if (!savedToken) return;
    try {
      const meRes = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      if (meRes.ok) {
        const meData = await meRes.json();
        setUser(meData.user);
        setTenant(meData.tenant);
        setRecentAudit(meData.recentAudit || []);
        setSameTenantMembers(meData.sameTenantMembers || []);
        setAllTenants(meData.allTenants || []);
      } else {
        localStorage.removeItem('tenant_ai_token');
      }
    } catch {
      localStorage.removeItem('tenant_ai_token');
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await Promise.all([fetchDemoAccounts(), fetchCurrentSession()]);
      setLoadingInitial(false);
    };
    initialize();
  }, []);

  const fetchDocuments = async () => {
    const currentToken = localStorage.getItem('tenant_ai_token');
    if (!currentToken) return;
    try {
      const res = await fetch('/api/documents', {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user?.tenantId, user?.email]);

  const handleLogin = async (email: string, pass: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('tenant_ai_token', data.token);
        setUser(data.user);
        setTenant(data.tenant);
        await fetchCurrentSession();
        if (data.user.role === 'admin') {
          setActiveTab('admin');
        } else {
          setActiveTab('chat');
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
  };

  const handleSwitchWorkspace = async (targetTenantId: string) => {
    const currentToken = localStorage.getItem('tenant_ai_token');
    try {
      const res = await fetch('/api/auth/switch-tenant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ tenantId: targetTenantId }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setTenant(data.tenant);
        fetchDocuments();
      }
    } catch (err) {
      console.error('Switch workspace error:', err);
    }
  };

  const handleRegisterTenant = async (data: {
    tenantName: string;
    companyDomain: string;
    industry: string;
    adminEmail: string;
    adminName: string;
    title: string;
    department: string;
    password: string;
  }): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/register-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await fetchDemoAccounts();
        return await handleLogin(data.adminEmail, data.password);
      }
      return false;
    } catch (err) {
      console.error('Registration error:', err);
      return false;
    }
  };

  const handleUpdateProfile = async (data: {
    name: string;
    title: string;
    department: string;
    bio: string;
    preferredPersona: RolePersona;
    newPassword?: string;
  }): Promise<boolean> => {
    const currentToken = localStorage.getItem('tenant_ai_token');
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setUser(updated.user);
        setTenant(updated.tenant);
        await fetchDemoAccounts();
        await fetchCurrentSession();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Profile update error:', err);
      return false;
    }
  };

  const handleLogout = async () => {
    const currentToken = localStorage.getItem('tenant_ai_token');
    if (currentToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${currentToken}` },
        });
      } catch (err) {
        console.error(err);
      }
    }
    localStorage.removeItem('tenant_ai_token');
    setUser(null);
    setTenant(null);
    setDocuments([]);
    setSameTenantMembers([]);
    setAllTenants([]);
  };

  const handleUploadDocument = async (data: {
    title: string;
    fileName: string;
    content: string;
  }): Promise<boolean> => {
    const currentToken = localStorage.getItem('tenant_ai_token');
    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await fetchCurrentSession();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleDeleteDocument = async (id: string): Promise<boolean> => {
    const currentToken = localStorage.getItem('tenant_ai_token');
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.ok) {
        fetchDocuments();
        await fetchCurrentSession();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleSendMessage = async (params: {
    text: string;
    model: ModelOption;
    rolePersona: RolePersona;
    enableSearch: boolean;
    conversationId?: string;
  }) => {
    const currentToken = localStorage.getItem('tenant_ai_token');
    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          message: params.text,
          model: params.model,
          rolePersona: params.rolePersona,
          enableSearch: params.enableSearch,
          forceMockAI: params.model === 'mock',
          conversationId: params.conversationId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        fetchCurrentSession();
        return {
          conversationId: data.conversationId,
          userMessage: data.userMessage,
          assistantMessage: data.assistantMessage,
          citations: data.citations,
          groundingSources: data.groundingSources,
        };
      }

      const errData = await res.json().catch(() => ({}));
      return {
        error: errData.error || 'Server returned an error',
        userMessage: {
          id: 'err-u',
          role: 'user' as const,
          content: params.text,
          timestamp: new Date().toISOString(),
        },
        assistantMessage: {
          id: 'err-a',
          role: 'assistant' as const,
          content:
            'Connection temporarily interrupted. Switching to local deterministic synthesis.',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (err: any) {
      return {
        error: err.message || 'Network error',
        userMessage: {
          id: 'err-u',
          role: 'user' as const,
          content: params.text,
          timestamp: new Date().toISOString(),
        },
        assistantMessage: {
          id: 'err-a',
          role: 'assistant' as const,
          content: 'Network timeout. Please retry.',
          timestamp: new Date().toISOString(),
        },
      };
    }
  };

  const handleRunAttack = async (params: {
    attackType: string;
    targetDocumentId?: string;
    spoofedTenantId?: string;
    crossTenantConvId?: string;
  }): Promise<AttackTestResult | null> => {
    const currentToken = localStorage.getItem('tenant_ai_token');
    try {
      const res = await fetch('/api/security/test-attack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        const data = await res.json();
        fetchCurrentSession();
        return data;
      }
      return null;
    } catch (err) {
      console.error('Verification test error:', err);
      return null;
    }
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-slate-600">
        <div className="text-xs font-semibold tracking-wide">
          Loading Tenant AI Enterprise Workspace...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginModal
        demoAccounts={demoAccounts}
        onLogin={handleLogin}
        onRegisterTenant={handleRegisterTenant}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col">
      <Header
        user={user}
        tenant={tenant}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        {activeTab === 'chat' && (
          <ChatView
            user={user}
            tenant={tenant}
            allTenants={allTenants}
            onSendMessage={handleSendMessage}
            onOpenVoice={() => setIsVoiceOpen(true)}
            onSwitchWorkspace={handleSwitchWorkspace}
          />
        )}
        {activeTab === 'documents' && (
          <DocumentsView
            user={user}
            tenant={tenant}
            documents={documents}
            onUpload={handleUploadDocument}
            onDelete={handleDeleteDocument}
            onRefresh={fetchDocuments}
          />
        )}
        {activeTab === 'profiles' && (
          <ProfilesView
            user={user}
            tenant={tenant}
            sameTenantMembers={sameTenantMembers}
            recentAudit={recentAudit}
            onUpdateProfile={handleUpdateProfile}
            onLogout={handleLogout}
          />
        )}
        {activeTab === 'security' && (
          <SecurityLabView
            user={user}
            tenant={tenant}
            onRunAttack={handleRunAttack}
          />
        )}
        {activeTab === 'admin' && (
          <AdminView
            user={user}
            activeTenant={tenant}
            onSwitchWorkspace={handleSwitchWorkspace}
            onRefreshAccounts={fetchDemoAccounts}
            onLogout={handleLogout}
          />
        )}
      </main>

      <VoiceModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        user={user}
        tenant={tenant}
      />
    </div>
  );
}
