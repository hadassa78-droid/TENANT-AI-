import React, { useState, useEffect } from 'react';
import { User, Tenant, RolePersona, AuditLog } from '../types';
import { Check, Lock, ShieldCheck, LogOut } from 'lucide-react';

interface SameTenantMember {
  id: string;
  name: string;
  email: string;
  role: string;
  title: string;
  department: string;
  clearanceLevel: string;
}

interface ProfilesViewProps {
  user: User;
  tenant: Tenant | null;
  sameTenantMembers: SameTenantMember[];
  recentAudit: AuditLog[];
  onUpdateProfile: (data: {
    name: string;
    title: string;
    department: string;
    bio: string;
    preferredPersona: RolePersona;
    newPassword?: string;
  }) => Promise<boolean>;
  onLogout: () => void;
}

export const ProfilesView: React.FC<ProfilesViewProps> = ({
  user,
  tenant,
  sameTenantMembers,
  recentAudit,
  onUpdateProfile,
  onLogout,
}) => {
  const [name, setName] = useState(user.name);
  const [title, setTitle] = useState(user.title || '');
  const [department, setDepartment] = useState(user.department || '');
  const [bio, setBio] = useState(user.bio || '');
  const [preferredPersona, setPreferredPersona] = useState<RolePersona>(
    user.preferredPersona || 'compliance_officer'
  );
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    setName(user.name);
    setTitle(user.title || '');
    setDepartment(user.department || '');
    setBio(user.bio || '');
    setPreferredPersona(user.preferredPersona || 'compliance_officer');
    setNewPassword('');
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedNotice(null);
    const ok = await onUpdateProfile({
      name,
      title,
      department,
      bio,
      preferredPersona,
      newPassword: newPassword.trim() ? newPassword.trim() : undefined,
    });
    setSaving(false);
    if (ok) {
      setNewPassword('');
      setSavedNotice('Account profile settings updated and saved to your isolated session.');
      setTimeout(() => setSavedNotice(null), 3500);
    }
  };

  const formatPersonaLabel = (persona: RolePersona) => {
    switch (persona) {
      case 'compliance_officer':
        return 'Chief Compliance Officer';
      case 'security_auditor':
        return 'Security & Governance Auditor';
      case 'policy_analyst':
        return 'Enterprise Policy Analyst';
      default:
        return 'General Knowledge Assistant';
    }
  };

  const activeOrgName = tenant ? tenant.name : user.tenantId;

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8 space-y-10">
      {/* Bold, High-Visibility Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] mb-1.5">
            Single-Account Cryptographic Isolation
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            Isolated Account & Organization Profile
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
            Your session is strictly confined to <strong>{activeOrgName}</strong>. Cross-account profile switching is disabled to guarantee complete organizational boundary integrity.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onLogout}
            className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-600" />
            <span>Sign Out to Change Account</span>
          </button>
        </div>
      </div>

      {/* Section 1: Isolated Account Identity & Personal Settings Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left (5 cols): Isolated Account & Organization Partition Boundary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 space-y-6">
            <div className="pb-5 border-b border-slate-200">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1E3A8A] mb-2">
                <Lock className="w-3.5 h-3.5" />
                <span>Authenticated Account Identity</span>
              </div>
              <h2 className="font-display text-2xl font-extrabold text-[#0F172A]">
                {user.name}
              </h2>
              <p className="text-sm text-[#1E3A8A] font-semibold mt-1">
                {user.title || 'Enterprise Specialist'} · {user.department || 'Operations'}
              </p>
              <p className="text-xs font-mono text-slate-500 mt-1">{user.email}</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Organization Vault</span>
                <span className="font-bold text-slate-900">{activeOrgName}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Corporate Domain</span>
                <span className="font-mono text-slate-800">
                  {tenant?.domain || `${user.tenantId}.com`}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Isolated Partition ID</span>
                <span className="font-mono font-semibold text-[#1E3A8A]">
                  {user.tenantId}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Account Role</span>
                <span className="font-bold text-slate-900 capitalize">{user.role}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Security Clearance</span>
                <span className="font-medium text-slate-800">
                  {user.clearanceLevel || 'Level 2 — Standard Access'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 font-medium">Default AI Persona</span>
                <span className="font-semibold text-[#1E3A8A]">
                  {formatPersonaLabel(user.preferredPersona || 'compliance_officer')}
                </span>
              </div>
            </div>

            {user.bio && (
              <div className="pt-4 border-t border-slate-200">
                <div className="text-xs font-bold text-slate-700 mb-1">
                  Account Scope & Operational Mandate
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{user.bio}</p>
              </div>
            )}

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Account Boundary Enforcement Active</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                External organizations, rival company documents, and foreign user profiles are completely inaccessible from this session.
              </p>
            </div>
          </div>

          {/* Same-Organization Authorized Colleagues (Strictly Same Tenant Only) */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="pb-3 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-[#0F172A]">
                  Authorized {activeOrgName} Personnel
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Accounts registered within your organization partition ({user.tenantId}).
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-600 tabular-nums">
                {sameTenantMembers.length}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {sameTenantMembers.map((member) => {
                const isMe = member.email === user.email;
                return (
                  <div
                    key={member.email}
                    className="py-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">
                        {member.name} {isMe ? '(Current Account)' : ''}
                      </div>
                      <div className="text-slate-600 mt-0.5">
                        {member.title} · {member.department}
                      </div>
                      <div className="font-mono text-slate-400 text-[11px] mt-0.5">
                        {member.email}
                      </div>
                    </div>
                    <span className="font-semibold text-slate-600 capitalize shrink-0">
                      {member.role}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right (7 cols): Personal Profile & Credential Editor */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
          <div className="pb-5 border-b border-slate-200 mb-6">
            <h2 className="font-display text-xl font-extrabold text-[#0F172A]">
              01. Update Personal Profile & AI Preferences
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Customize your identity metadata, default analytical persona, and account password within {activeOrgName}.
            </p>
          </div>

          {savedNotice && (
            <div className="mb-6 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{savedNotice}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#1E3A8A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Job Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. VP of Aerospace Engineering"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#1E3A8A]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Department / Division
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. R&D & Flight Systems"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#1E3A8A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Default AI Assistant Persona
                </label>
                <select
                  value={preferredPersona}
                  onChange={(e) => setPreferredPersona(e.target.value as RolePersona)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#1E3A8A]"
                >
                  <option value="compliance_officer">Chief Compliance Officer</option>
                  <option value="security_auditor">Security & Governance Auditor</option>
                  <option value="policy_analyst">Enterprise Policy Analyst</option>
                  <option value="general_assistant">General Knowledge Assistant</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Professional Scope & Responsibilities
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Describe your operational role and responsibilities..."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#1E3A8A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Change Account Password (Optional)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to retain current password"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1E3A8A]"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Changes apply strictly to {user.email}
              </span>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-lg bg-[#1E3A8A] hover:bg-[#1E40AF] text-white text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving Account Settings...' : 'Save Account Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Section 2: Personal Session Activity & Audit Trail */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-4">
        <div className="pb-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-extrabold text-[#0F172A]">
              02. Account Activity & Session Audit Log
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Chronological record of actions performed exclusively by {user.name} ({user.email}).
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 tabular-nums">
            {recentAudit.length} Recorded Events
          </span>
        </div>

        {recentAudit.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No recent session activity recorded for this account.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-bold">Timestamp</th>
                  <th className="py-3 px-4 font-bold">Action</th>
                  <th className="py-3 px-4 font-bold">Partition</th>
                  <th className="py-3 px-4 font-bold text-right">Status</th>
                  <th className="py-3 px-4 font-bold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {recentAudit.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-mono tabular-nums text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {log.tenantId}
                    </td>
                    <td className="py-2.5 px-4 font-mono tabular-nums text-right whitespace-nowrap">
                      <span
                        className={
                          log.status >= 400
                            ? 'text-red-700 font-bold'
                            : 'text-emerald-700 font-semibold'
                        }
                      >
                        HTTP {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 max-w-md truncate">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
