import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Tenant,
  ChatMessage,
  MessageCitation,
  ModelOption,
  RolePersona,
  SearchGroundingSource,
  ConversationSummary,
} from '../types';
import {
  Send,
  Plus,
  Search,
  Trash2,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  X,
  Mic,
  BookOpen,
  Layers,
} from 'lucide-react';

interface ChatViewProps {
  user: User;
  tenant: Tenant | null;
  allTenants?: Tenant[];
  onSendMessage: (params: {
    text: string;
    model: ModelOption;
    rolePersona: RolePersona;
    enableSearch: boolean;
    conversationId?: string;
  }) => Promise<{
    conversationId?: string;
    userMessage: ChatMessage;
    assistantMessage: ChatMessage;
    citations?: MessageCitation[];
    groundingSources?: SearchGroundingSource[];
    error?: string;
  } | null>;
  onOpenVoice: () => void;
  onSwitchWorkspace?: (tenantId: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  user,
  tenant,
  allTenants = [],
  onSendMessage,
  onOpenVoice,
  onSwitchWorkspace,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [activeCitation, setActiveCitation] = useState<MessageCitation | null>(null);
  const [showContextInspector, setShowContextInspector] = useState(false);
  const [inspectedCitations, setInspectedCitations] = useState<MessageCitation[]>([]);

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [currentConversationTitle, setCurrentConversationTitle] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [selectedModel, setSelectedModel] = useState<ModelOption>('gemini-3.8-flash');
  const [rolePersona, setRolePersona] = useState<RolePersona>(
    user.preferredPersona || 'compliance_officer'
  );
  const [enableSearch, setEnableSearch] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, 'up' | 'down'>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const cacheKey = `tenant_ai_chat_${user.tenantId}_${user.id}`;
  const convIdKey = `tenant_ai_active_conv_${user.tenantId}_${user.id}`;

  useEffect(() => {
    if (user.preferredPersona) {
      setRolePersona(user.preferredPersona);
    }
  }, [user.preferredPersona]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleFeedback = (id: string, vote: 'up' | 'down') => {
    setFeedbackMap((prev) => ({ ...prev, [id]: vote }));
  };

  const fetchConversations = async () => {
    setIsLoadingHistory(true);
    const token = localStorage.getItem('tenant_ai_token');
    try {
      const res = await fetch('/api/chat/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.warn('Could not fetch conversations:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleLoadConversation = async (convId: string) => {
    setLoading(true);
    setChatError(null);
    const token = localStorage.getItem('tenant_ai_token');
    try {
      const res = await fetch(`/api/chat/conversations/${convId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const conv = data.conversation;
        if (conv && conv.messages) {
          setMessages(conv.messages);
          setCurrentConversationId(conv.id);
          setCurrentConversationTitle(conv.title);
          sessionStorage.setItem(cacheKey, JSON.stringify(conv.messages));
          sessionStorage.setItem(convIdKey, conv.id);
        }
      } else {
        setChatError('Unable to load selected conversation thread.');
      }
    } catch {
      setChatError('Connection error while loading conversation.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const token = localStorage.getItem('tenant_ai_token');
    try {
      const res = await fetch(`/api/chat/conversations/${convId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== convId));
        if (currentConversationId === convId) {
          handleStartNewChat();
        }
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  const buildWelcomeMessage = (): ChatMessage => {
    const tenantName = tenant ? tenant.name : user.tenantId;
    return {
      id: 'welcome-msg-' + Date.now(),
      role: 'assistant',
      content: `Good day, ${user.name}. You are connected to the isolated knowledge environment for **${tenantName}**.\n\nAll document retrieval is filtered strictly by your organization partition (${user.tenantId}) at the server data layer prior to context scoring. Select a conversation from the left panel, choose a suggested policy inquiry below, or enter a custom question.`,
      timestamp: new Date().toISOString(),
      modelUsed: selectedModel,
      rolePersona,
    };
  };

  const handleStartNewChat = () => {
    setChatError(null);
    setCurrentConversationId(null);
    setCurrentConversationTitle(null);
    sessionStorage.removeItem(convIdKey);
    const initialMsg = buildWelcomeMessage();
    setMessages([initialMsg]);
    sessionStorage.setItem(cacheKey, JSON.stringify([initialMsg]));
  };

  useEffect(() => {
    fetchConversations();
    setChatError(null);
    const savedConvId = sessionStorage.getItem(convIdKey);
    const saved = sessionStorage.getItem(cacheKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          if (savedConvId) setCurrentConversationId(savedConvId);
          return;
        }
      } catch {
        // ignore
      }
    }
    setMessages([buildWelcomeMessage()]);
  }, [user.tenantId, user.id, tenant?.name]);

  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem(cacheKey, JSON.stringify(messages));
    }
  }, [messages, cacheKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    setInput('');
    setChatError(null);
    setLoading(true);

    const tempUserMsg: ChatMessage = {
      id: 'temp-u-' + Date.now(),
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    const result = await onSendMessage({
      text: query,
      model: selectedModel,
      rolePersona,
      enableSearch,
      conversationId: currentConversationId || undefined,
    });

    setLoading(false);

    if (result && !result.error) {
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        result.userMessage,
        result.assistantMessage,
      ]);

      if (result.conversationId) {
        setCurrentConversationId(result.conversationId);
        sessionStorage.setItem(convIdKey, result.conversationId);
        fetchConversations();
      }
    } else {
      const fallbackMsg: ChatMessage = {
        id: 'msg-fallback-' + Date.now(),
        role: 'assistant',
        content: `A temporary connection interruption occurred while querying ${selectedModel}. Your organization partition remains secure. Please try again or select the Local Deterministic RAG engine above.`,
        timestamp: new Date().toISOString(),
        modelUsed: 'Local Fallback',
        rolePersona,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      setChatError('Unable to reach model endpoint. Try Local Deterministic RAG mode.');
    }
  };

  const getSuggestedPrompts = () => {
    if (user.tenantId === 'acme-corp') {
      return [
        {
          label: 'Project Falcon Specifications',
          query: 'What are the propulsion system, flight ceiling, and budget for Project Falcon?',
        },
        {
          label: 'Domestic Travel Per Diem Policy',
          query: 'What is the daily meal allowance and VP approval threshold for travel?',
        },
        {
          label: 'Verify Cross-Tenant Boundary (Globex)',
          query: 'What is the safety interlock code for the Globex G-700 welding robot?',
        },
      ];
    } else if (user.tenantId === 'globex-robotics') {
      return [
        {
          label: 'G-700 Emergency Stop & Interlock',
          query: 'What is the emergency stopping distance and safety interlock code for the G-700 robot?',
        },
        {
          label: 'Hydraulic Operating Pressure',
          query: 'What is the maximum operating hydraulic pressure before the alarm horn activates?',
        },
        {
          label: 'Verify Cross-Tenant Boundary (Acme)',
          query: 'What are the confidential specifications for Acme Project Falcon?',
        },
      ];
    } else if (user.tenantId === 'stark-labs') {
      return [
        {
          label: 'Arc Reactor Plasma Output',
          query: 'What is the sustained plasma output and core synthesis baseline of the Arc Reactor?',
        },
        {
          label: 'Containment Lockdown Criteria',
          query: 'What protocol activates if core containment drops below 99.2%?',
        },
        {
          label: 'Verify Cross-Tenant Boundary (Acme)',
          query: 'Can you retrieve Acme Corporation travel reimbursement rates?',
        },
      ];
    }
    return [
      {
        label: 'Summarize Uploaded Documents',
        query: 'What key policies and specifications are contained in our organization documents?',
      },
      {
        label: 'Compliance Guidelines',
        query: 'What are the primary compliance requirements in our repository?',
      },
    ];
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(historySearch.toLowerCase())
  );

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-6 space-y-6">
      {/* Bold, High-Visibility Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] mb-1">
            Isolated Organization Knowledge Workspace
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            {tenant ? tenant.name : user.tenantId} — Knowledge Assistant
          </h1>
        </div>
        <div className="text-xs text-slate-600 flex items-center gap-2 shrink-0">
          <span>Authenticated Account:</span>
          <strong className="text-slate-900 font-bold">{user.name}</strong>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-[#1E3A8A] font-semibold">
            Partition: {user.tenantId}
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-11rem)]">
      {/* Left Sidebar: Isolated Conversation Threads */}
      <aside className="w-full lg:w-72 shrink-0 bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between max-h-[320px] lg:max-h-[calc(100vh-7rem)]">
        <div className="flex flex-col min-h-0 flex-1">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h2 className="font-display text-sm font-semibold text-slate-900">
                Conversation History
              </h2>
              <p className="text-[11px] text-slate-500">
                Scoped to {tenant ? tenant.name : user.tenantId}
              </p>
            </div>
            <button
              type="button"
              onClick={handleStartNewChat}
              className="px-2.5 py-1.5 rounded-lg bg-[#1E3A8A] hover:bg-[#1E40AF] text-white text-xs font-medium flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Thread</span>
            </button>
          </div>

          <div className="relative mt-3">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Filter past threads..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1E3A8A]"
            />
          </div>

          <div className="flex-1 overflow-y-auto mt-3 space-y-1 pr-1">
            {isLoadingHistory ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No saved threads in this partition yet.
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = currentConversationId === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => handleLoadConversation(conv.id)}
                    className={`group p-2.5 rounded-lg cursor-pointer transition-colors border ${
                      isSelected
                        ? 'bg-slate-100 border-slate-300 text-slate-900'
                        : 'bg-white border-transparent hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-medium line-clamp-1">
                        {conv.title}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-700 transition-opacity shrink-0"
                        title="Delete thread"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400 tabular-nums">
                      <span>{formatTimestamp(conv.updatedAt)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{conv.messageCount} messages</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="pt-3 mt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Partition: {user.tenantId}</span>
          <span className="text-emerald-700 font-medium">Data-Layer Isolated</span>
        </div>
      </aside>

      {/* Main Knowledge Assistant Canvas */}
      <div className="flex-1 bg-white border border-slate-200 rounded-xl flex flex-col min-w-0 max-h-[calc(100vh-7rem)]">
        {/* Contextual Workspace Toolbar */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50 rounded-t-xl">
          <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-900">
              {tenant ? tenant.name : user.tenantId}
            </span>
            <span className="text-slate-300" aria-hidden="true">
              /
            </span>
            <span>
              {currentConversationTitle || 'Active Knowledge Session'}
            </span>
            {user.role === 'admin' && onSwitchWorkspace && allTenants.length > 0 && (
              <>
                <span className="text-slate-300" aria-hidden="true">
                  ·
                </span>
                <select
                  value={user.tenantId}
                  onChange={(e) => onSwitchWorkspace(e.target.value)}
                  className="px-2 py-1 bg-white border border-slate-300 rounded text-xs text-[#1E3A8A] font-medium focus:outline-none"
                  title="Admin: Switch active organization vault"
                >
                  {allTenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      Inspect: {t.name}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div className="flex items-center gap-1.5">
              <label className="text-slate-500">Persona:</label>
              <select
                value={rolePersona}
                onChange={(e) => setRolePersona(e.target.value as RolePersona)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#1E3A8A]"
              >
                <option value="compliance_officer">Compliance Officer</option>
                <option value="security_auditor">Security Auditor</option>
                <option value="policy_analyst">Policy Analyst</option>
                <option value="general_assistant">General Assistant</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-slate-500">Engine:</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as ModelOption)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#1E3A8A]"
              >
                <option value="gemini-3.8-flash">Gemini 3.8 Flash</option>
                <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
                <option value="mock">Local Deterministic RAG</option>
              </select>
            </div>

            <button
              type="button"
              onClick={onOpenVoice}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <Mic className="w-3.5 h-3.5 text-[#1E3A8A]" />
              <span>Voice Query</span>
            </button>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    isAssistant ? 'items-start' : 'items-end'
                  }`}
                >
                  {/* Clean unboxed metadata header */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5 px-1">
                    <span className="font-semibold text-slate-800">
                      {isAssistant ? 'Tenant AI Assistant' : user.name}
                    </span>
                    {isAssistant && msg.rolePersona && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">
                          {msg.rolePersona.replace('_', ' ')}
                        </span>
                      </>
                    )}
                    {isAssistant && msg.modelUsed && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-[11px]">{msg.modelUsed}</span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Message Surface */}
                  <div
                    className={`w-full sm:max-w-[90%] rounded-xl p-5 text-sm leading-relaxed ${
                      isAssistant
                        ? 'bg-slate-50 border border-slate-200 text-slate-800'
                        : 'bg-[#1E3A8A] text-white'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {/* Grounded Citations */}
                    {isAssistant && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-4 pt-3.5 border-t border-slate-200/80 space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="font-medium text-slate-700">
                            Verified Source Passages ({msg.citations.length})
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setInspectedCitations(msg.citations || []);
                              setShowContextInspector(true);
                            }}
                            className="text-[#1E3A8A] hover:underline font-medium"
                          >
                            Inspect RAG Context Pipeline
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {msg.citations.map((cite, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setActiveCitation(cite)}
                              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-[#1E3A8A] text-xs text-slate-800 transition-colors flex items-center gap-2"
                            >
                              <BookOpen className="w-3.5 h-3.5 text-[#1E3A8A] shrink-0" />
                              <span className="font-medium">{cite.docTitle}</span>
                              <span className="text-slate-400 font-mono tabular-nums text-[11px]">
                                Score {Math.round(cite.score)}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Web Grounding Links */}
                    {isAssistant &&
                      msg.groundingSources &&
                      msg.groundingSources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-200/80 text-xs space-y-1">
                          <span className="text-slate-500 font-medium block">
                            External Search References:
                          </span>
                          {msg.groundingSources.map((s, idx) => (
                            <a
                              key={idx}
                              href={s.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#1E3A8A] hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span className="truncate">{s.title}</span>
                            </a>
                          ))}
                        </div>
                      )}

                    {/* Quiet Message Actions */}
                    {isAssistant && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-end gap-2 text-xs text-slate-400">
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="p-1 hover:text-slate-700 transition-colors flex items-center gap-1"
                          title="Copy response"
                        >
                          {copiedMsgId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFeedback(msg.id, 'up')}
                          className={`p-1 hover:text-slate-700 transition-colors ${
                            feedbackMap[msg.id] === 'up' ? 'text-[#1E3A8A]' : ''
                          }`}
                          title="Helpful response"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFeedback(msg.id, 'down')}
                          className={`p-1 hover:text-slate-700 transition-colors ${
                            feedbackMap[msg.id] === 'down' ? 'text-red-700' : ''
                          }`}
                          title="Flag issue"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 max-w-md">
                Retrieving authorized passages from {tenant ? tenant.name : user.tenantId} vault and synthesizing response...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {chatError && (
          <div className="px-6 py-2.5 bg-red-50 border-t border-red-200 text-xs text-red-800 flex items-center justify-between">
            <span>{chatError}</span>
            <button
              type="button"
              onClick={() => setChatError(null)}
              className="font-semibold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Suggested Inquiries & Input Bar */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/60 rounded-b-xl">
          <div className="max-w-3xl mx-auto space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500">
                Suggested Inquiries:
              </span>
              {getSuggestedPrompts().map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={loading}
                  onClick={() => handleSend(p.query)}
                  className="px-3 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 hover:text-[#1E3A8A] transition-colors whitespace-nowrap"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl p-1.5 focus-within:border-[#1E3A8A]"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                placeholder={`Ask a question grounded in ${
                  tenant ? tenant.name : 'your organization'
                }'s documents...`}
                className="flex-1 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 bg-transparent focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="px-4 py-2 rounded-lg bg-[#1E3A8A] hover:bg-[#1E40AF] text-white text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-40 whitespace-nowrap shrink-0"
              >
                <span>Submit</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
      </div>

      {/* Modal: Source Citation Reader */}
      {activeCitation && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-display text-base font-semibold text-slate-900">
                Verified Document Passage
              </h3>
              <button
                type="button"
                onClick={() => setActiveCitation(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-1">
              <div className="text-slate-500">Source Document</div>
              <div className="font-semibold text-slate-900 text-sm">
                {activeCitation.docTitle}
              </div>
              <div className="font-mono text-slate-500">
                Document ID: {activeCitation.documentId} · Relevance Score: {activeCitation.score}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
              {activeCitation.snippet}
            </div>

            <div className="text-xs text-slate-500">
              Retrieved exclusively from partition <code className="text-slate-800">{user.tenantId}</code>.
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveCitation(null)}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: RAG Context Pipeline Inspector */}
      {showContextInspector && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-display text-base font-semibold text-slate-900">
                Isolated RAG Context Pipeline
              </h3>
              <button
                type="button"
                onClick={() => setShowContextInspector(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              The passages below were filtered by <code className="text-slate-900 font-semibold">tenantId === "{user.tenantId}"</code> before relevance scoring and enclosed inside untrusted data boundary markers.
            </p>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {inspectedCitations.map((cite, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900">
                      Passage #{idx + 1}: {cite.docTitle}
                    </span>
                    <span className="font-mono text-slate-500">{cite.documentId}</span>
                  </div>
                  <p className="font-mono text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {cite.snippet}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowContextInspector(false)}
                className="px-4 py-2 rounded-lg bg-[#1E3A8A] text-white text-xs font-medium"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
