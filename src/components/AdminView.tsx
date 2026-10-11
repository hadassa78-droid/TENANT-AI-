import React, { useState, useEffect } from 'react';
import {
  User,
  Tenant,
  AuditLog,
  AdminMetrics,
  RolePersona,
} from '../types';
import {
  RefreshCw,
  Search,
  Plus,
  Trash2,
  Check,
  X,
  UserPlus,
  LogOut,
} from 'lucide-react';

interface AdminViewProps {
  user: User;
  activeTenant: Tenant | null;
  onSwitchWorkspace: (tenantId: string) => Promise<void>;
  onRefreshAccounts: () => Promise<void>;
  onLogout: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  user,
  activeTenant,
  onSwitchWorkspace,
  onRefreshAccounts,
  onLogout,
}) => {
  const [adminTab, setAdminTab] = useState<'tenants' | 'users' | 'logs'>('tenants');
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [tenantLogFilter, setTenantLogFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [userOrgFilter, setUserOrgFilter] = useState('ALL');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showCreateTenantModal, setShowCreateTenantModal] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantDomain, setNewTenantDomain] = useState('');
  const [newTenantIndustry, setNewTenantIndustry] = useState('');

  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'member' | 'manager' | 'admin'>('member');
  const [newUserTenantId, setNewUserTenantId] = useState('acme-corp');
  const [newUserTitle, setNewUserTitle] = useState('');
  const [newUserDepartment, setNewUserDepartment] = useState('');
  const [newUserClearance, setNewUserClearance] = useState('Level 2 — Standard Access');
  const [newUserPersona, setNewUserPersona] = useState<RolePersona>('general_assistant');
  const [newUserPassword, setNewUserPassword] = useState('enterprise123');

  const fetchAdminData = async () => {
    if (user.role !== 'admin') return;
    setLoading(true);
    const token = localStorage.getItem('tenant_ai_token');
    try {
      const [metricsRes, logsRes] = await Promise.all([
        fetch('/api/admin/metrics', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/admin/logs?severity=${severityFilter}&tenantId=${tenantLogFilter}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (metricsRes.ok) {
        const mData = await metricsRes.json();
        setMetrics(mData);
      }
      if (logsRes.ok) {
        const lData = await logsRes.json();
        setLogs(lData.logs || []);
      }
    } catch (err) {
      console.error('Failed to load admin telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.role === 'admin') {
      fetchAdminData();
    }
  }, [user.role, severityFilter, tenantLogFilter]);

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleToggleTenantStatus = async (tenantId: string, currentStatus: string) => {
    const token = localStorage.getItem('tenant_ai_token');
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchAdminData();
        showToast(`Organization "${tenantId}" status updated to ${newStatus}.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const token = localStorage.getItem('tenant_ai_token');
    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newTenantName,
          domain: newTenantDomain,
          industry: newTenantIndustry,
        }),
      });
      if (res.ok) {
        setNewTenantName('');
        setNewTenantDomain('');
        setNewTenantIndustry('');
        setShowCreateTenantModal(false);
        await fetchAdminData();
        await onRefreshAccounts();
        showToast('New organization partition provisioned.');
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Could not create organization.');
      }
    } catch {
      setErrorMessage('Network error while provisioning organization.');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const token = localStorage.getItem('tenant_ai_token');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          role: newUserRole,
          tenantId: newUserTenantId,
          title: newUserTitle || 'Enterprise Specialist',
          department: newUserDepartment || 'Operations',
          clearanceLevel: newUserClearance,
          preferredPersona: newUserPersona,
          password: newUserPassword || 'enterprise123',
        }),
      });
      if (res.ok) {
        setNewUserName('');
        setNewUserEmail('');
        setNewUserTitle('');
        setNewUserDepartment('');
        setShowCreateUserModal(false);
        await fetchAdminData();
        await onRefreshAccounts();
        showToast('New isolated user account provisioned.');
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Could not create user profile.');
      }
    } catch {
      setErrorMessage('Network error while creating user profile.');
    }
  };

  const handleUpdateUserRoleOrTenant = async (
    targetEmail: string,
    updates: { role?: string; tenantId?: string }
  ) => {
    const token = localStorage.getItem('tenant_ai_token');
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(targetEmail)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        await fetchAdminData();
        await onRefreshAccounts();
        showToast(`Updated governance assignment for ${targetEmail}.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (targetEmail: string) => {
    const token = localStorage.getItem('tenant_ai_token');
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(targetEmail)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchAdminData();
        await onRefreshAccounts();
        showToast(`Removed user profile ${targetEmail}.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-6 py-14">
        <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-red-700 mb-1">
              Strict Account Boundary Enforced
            </p>
            <h1 className="font-display text-3xl font-extrabold text-[#0F172A]">
              Administrative Access Restricted
            </h1>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Your current session is strictly isolated to <strong>{user.name}</strong> ({user.email}) within <strong>{activeTenant ? activeTenant.name : user.tenantId}</strong>. Cross-account switching is disabled. To access the System Administration Console, please sign out of this company session and sign in with System Administrator credentials.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onLogout}
              className="px-4 py-2.5 rounded-lg bg-[#1E3A8A] hover:bg-[#1E40AF] text-white text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out to Authenticate as Administrator</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredUsers = (metrics?.users || []).filter((u) => {
    if (userOrgFilter !== 'ALL' && u.tenantId !== userOrgFilter) return false;
    if (userSearchQuery.trim()) {
      const q = userSearchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.title || '').toLowerCase().includes(q) ||
        (u.department || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredLogs = logs.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      l.userEmail.toLowerCase().includes(q) ||
      l.tenantId.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8 space-y-8">
      {/* Bold, High-Visibility Executive Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] mb-1.5">
            Platform Security Operations & Multi-Tenant Governance
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            Executive Administration Dashboard
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
            Full administrative visibility across all isolated corporate organizations, registered user accounts, and platform-wide security audit logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              setShowCreateTenantModal(true);
            }}
            className="px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Provision Organization</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              setShowCreateUserModal(true);
            }}
            className="px-3.5 py-2.5 rounded-lg bg-[#1E3A8A] hover:bg-[#1E40AF] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Isolated Account</span>
          </button>

          <button
            type="button"
            onClick={fetchAdminData}
            disabled={loading}
            className="px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-emerald-700 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4-Column Tabular KPI Strip */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="text-xs font-bold text-slate-600">Active Organizations</div>
            <div className="font-display text-3xl font-extrabold text-[#0F172A] tabular-nums mt-2">
              {metrics.totalTenants}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Cryptographically isolated partitions
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="text-xs font-bold text-slate-600">Isolated User Accounts</div>
            <div className="font-display text-3xl font-extrabold text-[#0F172A] tabular-nums mt-2">
              {metrics.totalUsers}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Bound strictly to single company vaults
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="text-xs font-bold text-slate-600">Indexed Vault Documents</div>
            <div className="font-display text-3xl font-extrabold text-[#0F172A] tabular-nums mt-2">
              {metrics.totalDocuments}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Across {metrics.totalConversations} isolated chat threads
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="text-xs font-bold text-slate-600">
              Boundary Violations Blocked
            </div>
            <div className="font-display text-3xl font-extrabold text-red-700 tabular-nums mt-2">
              {metrics.securityIncidentsBlocked}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Cross-tenant requests rejected (HTTP 403)
            </div>
          </div>
        </div>
      )}

      {/* Segmented Workspace Selector */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-6 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setAdminTab('tenants')}
            className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
              adminTab === 'tenants'
                ? 'border-[#1E3A8A] text-[#0F172A] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            01. Organizations & Vault Partitions ({metrics?.tenants.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setAdminTab('users')}
            className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
              adminTab === 'users'
                ? 'border-[#1E3A8A] text-[#0F172A] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            02. User Accounts & Role Governance ({metrics?.users.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setAdminTab('logs')}
            className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
              adminTab === 'logs'
                ? 'border-[#1E3A8A] text-[#0F172A] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            03. Immutable Security & Audit Log ({logs.length})
          </button>
        </div>
      </div>

      {/* TAB 1: Organizations & Vault Partitions */}
      {adminTab === 'tenants' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-extrabold text-[#0F172A]">
                Corporate Organization Registry
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Inspect storage metrics, switch your active admin inspection context, or suspend organization access.
              </p>
            </div>
            <div className="text-xs text-slate-600">
              Admin Inspection Context:{' '}
              <strong className="text-[#1E3A8A]">
                {activeTenant ? activeTenant.name : user.tenantId}
              </strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5 font-bold">Organization Name</th>
                  <th className="py-3 px-5 font-bold">Partition ID</th>
                  <th className="py-3 px-5 font-bold">Domain & Sector</th>
                  <th className="py-3 px-5 font-bold text-right">Accounts</th>
                  <th className="py-3 px-5 font-bold text-right">Documents</th>
                  <th className="py-3 px-5 font-bold text-right">Storage</th>
                  <th className="py-3 px-5 font-bold">Status</th>
                  <th className="py-3 px-5 font-bold text-right">Governance Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {metrics?.tenants.map((t) => {
                  const isCurrentContext = user.tenantId === t.id;
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-900">{t.name}</td>
                      <td className="py-3.5 px-5 font-mono text-slate-600">{t.id}</td>
                      <td className="py-3.5 px-5 text-slate-600">
                        {t.domain} · <span className="text-slate-500">{t.industry}</span>
                      </td>
                      <td className="py-3.5 px-5 font-mono tabular-nums text-right">
                        {t.userCount}
                      </td>
                      <td className="py-3.5 px-5 font-mono tabular-nums text-right">
                        {t.documentCount}
                      </td>
                      <td className="py-3.5 px-5 font-mono tabular-nums text-right">
                        {t.storageKb} KB
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`font-bold capitalize ${
                            t.status === 'active' ? 'text-emerald-700' : 'text-red-700'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={async () => {
                            await onSwitchWorkspace(t.id);
                            showToast(`Admin inspection context set to ${t.name}.`);
                          }}
                          className={`px-2.5 py-1 rounded border text-xs font-semibold transition-colors ${
                            isCurrentContext
                              ? 'border-[#1E3A8A] bg-slate-100 text-[#1E3A8A]'
                              : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          {isCurrentContext ? 'Inspecting Vault' : 'Inspect Vault'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleTenantStatus(t.id, t.status)}
                          className="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
                        >
                          {t.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: User Profiles & Role Governance */}
      {adminTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-extrabold text-[#0F172A]">
                Isolated User Accounts & Access Governance
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Admin oversight of all registered user accounts across organizations. Modify role permissions or organization assignments.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Filter by name, email, title..."
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1E3A8A]"
                />
              </div>

              <select
                value={userOrgFilter}
                onChange={(e) => setUserOrgFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#1E3A8A]"
              >
                <option value="ALL">All Organizations</option>
                {metrics?.tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5 font-bold">Account Name & Title</th>
                  <th className="py-3 px-5 font-bold">Email Address</th>
                  <th className="py-3 px-5 font-bold">Department & Clearance</th>
                  <th className="py-3 px-5 font-bold">Isolated Organization</th>
                  <th className="py-3 px-5 font-bold">Governance Role</th>
                  <th className="py-3 px-5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {filteredUsers.map((u) => (
                  <tr key={u.email} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-slate-500 text-[11px]">{u.title}</div>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-slate-600">{u.email}</td>
                    <td className="py-3.5 px-5">
                      <div className="text-slate-800 font-medium">{u.department}</div>
                      <div className="text-slate-500 text-[11px]">{u.clearanceLevel}</div>
                    </td>
                    <td className="py-3.5 px-5">
                      <select
                        value={u.tenantId}
                        onChange={(e) =>
                          handleUpdateUserRoleOrTenant(u.email, { tenantId: e.target.value })
                        }
                        className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#1E3A8A]"
                      >
                        {metrics?.tenants.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3.5 px-5">
                      <select
                        value={u.role}
                        onChange={(e) =>
                          handleUpdateUserRoleOrTenant(u.email, { role: e.target.value })
                        }
                        className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 capitalize focus:outline-none focus:border-[#1E3A8A]"
                      >
                        <option value="member">member</option>
                        <option value="manager">manager</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      {u.email === user.email ? (
                        <span className="text-slate-400 text-[11px]">Active Admin</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.email)}
                          className="p-1 text-slate-400 hover:text-red-700 transition-colors"
                          title="Remove user account"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Immutable Security & Operational Audit Log */}
      {adminTab === 'logs' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-extrabold text-[#0F172A]">
                Immutable Security & Operational Audit Trail
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Every authentication event, document upload, RAG retrieval, and blocked cross-tenant request is logged chronologically.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#1E3A8A]"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical Violations</option>
                <option value="WARN">Warnings</option>
                <option value="INFO">Informational</option>
              </select>

              <select
                value={tenantLogFilter}
                onChange={(e) => setTenantLogFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#1E3A8A]"
              >
                <option value="ALL">All Organizations</option>
                <option value="system">System Governance</option>
                {metrics?.tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search audit events..."
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1E3A8A]"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="py-3 px-4 font-bold">Timestamp</th>
                  <th className="py-3 px-4 font-bold">Severity</th>
                  <th className="py-3 px-4 font-bold">Partition</th>
                  <th className="py-3 px-4 font-bold">Actor</th>
                  <th className="py-3 px-4 font-bold">Event Action</th>
                  <th className="py-3 px-4 font-bold text-right">HTTP</th>
                  <th className="py-3 px-4 font-bold">Diagnostic Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      log.severity === 'CRITICAL' ? 'bg-red-50/40' : ''
                    }`}
                  >
                    <td className="py-2.5 px-4 font-mono tabular-nums text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-4 font-mono whitespace-nowrap">
                      <span
                        className={
                          log.severity === 'CRITICAL'
                            ? 'text-red-700 font-bold'
                            : log.severity === 'WARN'
                            ? 'text-amber-700 font-semibold'
                            : 'text-slate-600'
                        }
                      >
                        {log.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-700 whitespace-nowrap">
                      {log.tenantId}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {log.userEmail}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-4 font-mono tabular-nums text-right whitespace-nowrap">
                      <span
                        className={
                          log.status >= 400
                            ? 'text-red-700 font-bold'
                            : 'text-emerald-700 font-semibold'
                        }
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 max-w-md truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Provision New Organization */}
      {showCreateTenantModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-display text-lg font-extrabold text-[#0F172A]">
                Provision Organization Partition
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateTenantModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  placeholder="e.g. Aether Aerospace"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Corporate Domain
                </label>
                <input
                  type="text"
                  value={newTenantDomain}
                  onChange={(e) => setNewTenantDomain(e.target.value)}
                  placeholder="aetheraero.com"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Industry Sector
                </label>
                <input
                  type="text"
                  value={newTenantIndustry}
                  onChange={(e) => setNewTenantIndustry(e.target.value)}
                  placeholder="Defense & Propulsion"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#1E3A8A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTenantModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#1E3A8A] hover:bg-[#1E40AF] text-white text-xs font-semibold"
                >
                  Provision Partition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Isolated User Account */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-display text-lg font-extrabold text-[#0F172A]">
                Create Isolated User Account
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateUserModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Marcus Sterling"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#1E3A8A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Corporate Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="marcus@acme.com"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#1E3A8A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assigned Organization *
                  </label>
                  <select
                    value={newUserTenantId}
                    onChange={(e) => setNewUserTenantId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#1E3A8A]"
                  >
                    {metrics?.tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Governance Role *
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) =>
                      setNewUserRole(e.target.value as 'member' | 'manager' | 'admin')
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#1E3A8A]"
                  >
                    <option value="member">Member (Standard Access)</option>
                    <option value="manager">Manager (Organization Lead)</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={newUserTitle}
                    onChange={(e) => setNewUserTitle(e.target.value)}
                    placeholder="Senior Risk Officer"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#1E3A8A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={newUserDepartment}
                    onChange={(e) => setNewUserDepartment(e.target.value)}
                    placeholder="Corporate Compliance"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#1E3A8A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Default AI Persona
                  </label>
                  <select
                    value={newUserPersona}
                    onChange={(e) => setNewUserPersona(e.target.value as RolePersona)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#1E3A8A]"
                  >
                    <option value="compliance_officer">Compliance Officer</option>
                    <option value="security_auditor">Security Auditor</option>
                    <option value="policy_analyst">Policy Analyst</option>
                    <option value="general_assistant">General Assistant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Initial Password *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:outline-none focus:border-[#1E3A8A]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#1E3A8A] hover:bg-[#1E40AF] text-white text-xs font-semibold"
                >
                  Create Isolated Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
