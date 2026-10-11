export type RolePersona =
  | 'compliance_officer'
  | 'security_auditor'
  | 'policy_analyst'
  | 'general_assistant';

export type ModelOption =
  | 'gemini-3.8-flash'
  | 'gemini-3.1-flash-lite'
  | 'mock';

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  industry?: string;
  createdAt: string;
  status: 'active' | 'suspended';
  documentCount?: number;
  userCount?: number;
  conversationCount?: number;
  storageKb?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'member' | 'manager' | 'admin';
  tenantId: string;
  title?: string;
  department?: string;
  clearanceLevel?: string;
  bio?: string;
  preferredPersona?: RolePersona;
  createdAt?: string;
  lastActiveAt?: string;
}

export interface UserProfileSummary extends User {
  tenantName: string;
  tenantDomain: string;
  documentCount: number;
  conversationCount: number;
  recentActionsCount: number;
  isDemoAccount?: boolean;
  demoPassword?: string;
}

export interface DocumentItem {
  id: string;
  tenantId: string;
  title: string;
  fileName: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  chunkCount: number;
  preview?: string;
  content?: string;
  chunks?: string[];
}

export interface SearchGroundingSource {
  title: string;
  url: string;
}

export interface MessageCitation {
  documentId: string;
  docTitle: string;
  snippet: string;
  score: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  citations?: MessageCitation[];
  groundingSources?: SearchGroundingSource[];
  modelUsed?: string;
  rolePersona?: RolePersona;
}

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  tenantId: string;
  userEmail: string;
  action: string;
  ip: string;
  status: number;
  details: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
}

export interface DemoAccount {
  id: string;
  name: string;
  email: string;
  role: 'member' | 'manager' | 'admin';
  title: string;
  department: string;
  clearanceLevel: string;
  tenantName: string;
  tenantId: string;
  password: string;
  preferredPersona: RolePersona;
}

export interface AttackTestResult {
  attackType: string;
  description: string;
  attemptingUser: string;
  userTenant: string;
  blocked: boolean;
  responseStatus: number;
  httpStatus: number;
  reason: string;
  message: string;
  safeguard: string;
  auditLogRecorded: boolean;
  auditEntry?: AuditLog;
}

export interface AdminMetrics {
  totalTenants: number;
  totalDocuments: number;
  totalUsers: number;
  totalConversations: number;
  totalAuditLogs: number;
  securityIncidentsBlocked: number;
  tenants: Required<Tenant>[];
  users: UserProfileSummary[];
}
