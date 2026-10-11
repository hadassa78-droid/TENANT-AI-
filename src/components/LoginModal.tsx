import React, { useState } from 'react';
import { DemoAccount } from '../types';
import { ArrowRight, Lock } from 'lucide-react';

interface LoginModalProps {
  demoAccounts: DemoAccount[];
  onLogin: (email: string, password: string) => Promise<boolean>;
  onRegisterTenant: (data: {
    tenantName: string;
    companyDomain: string;
    industry: string;
    adminEmail: string;
    adminName: string;
    title: string;
    department: string;
    password: string;
  }) => Promise<boolean>;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  demoAccounts,
  onLogin,
  onRegisterTenant,
}) => {
  const [formMode, setFormMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingAccount, setLoadingAccount] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [tenantName, setTenantName] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [industry, setIndustry] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const handleSelectProfile = async (acc: DemoAccount) => {
    setError(null);
    setLoadingAccount(acc.email);
    setLoading(true);
    const success = await onLogin(acc.email, acc.password);
    setLoading(false);
    setLoadingAccount(null);
    if (!success) {
      setError(`Unable to sign in as ${acc.name}. Please verify workspace status.`);
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const success = await onLogin(email, password);
    setLoading(false);
    if (!success) {
      setError(
        'Invalid email or password. Please verify your credentials or select an isolated account portal on the left.'
      );
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!tenantName.trim() || !adminEmail.trim() || !regPassword.trim()) {
      setError('Organization name, administrator email, and password are required.');
      return;
    }
    setLoading(true);
    const success = await onRegisterTenant({
      tenantName,
      companyDomain,
      industry,
      adminEmail,
      adminName,
      title,
      department,
      password: regPassword,
    });
    setLoading(false);
    if (!success) {
      setError(
        'Provisioning failed. An organization or user with these details may already exist.'
      );
    }
  };

  const adminProfile = demoAccounts.find((a) => a.role === 'admin');
  const tenantProfiles = demoAccounts.filter((a) => a.role !== 'admin');

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-between">
      {/* Bold Institutional Top Bar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <span className="font-display text-xl font-extrabold tracking-tight text-[#0F172A] whitespace-nowrap shrink-0">
            TENANT AI
          </span>
          <div className="hidden sm:flex items-center gap-6 text-xs font-medium text-slate-600">
            <span>Single-Account Isolation</span>
            <span aria-hidden="true">·</span>
            <span>Strict Organization Boundaries</span>
            <span aria-hidden="true">·</span>
            <span>Grounded Document RAG</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (adminProfile) handleSelectProfile(adminProfile);
            }}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-[#1E3A8A] hover:bg-[#1E40AF] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            System Admin Sign In
          </button>
        </div>
      </header>

      {/* Main Two-Column Executive Entrance */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-10 lg:py-14">
        <div className="max-w-4xl mb-10">
          <p className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] mb-2">
            Enterprise Multi-Tenant Knowledge & Governance Platform
          </p>
          <h1
            className="font-display text-3xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight leading-[1.15]"
            style={{ textWrap: 'balance' }}
          >
            Single-account isolated workspaces with strict organizational boundaries.
          </h1>
          <p className="mt-4 text-base text-slate-600 leading-relaxed max-w-2xl">
            When an organization account signs in, its session is locked exclusively to its own partition and account profile. Cross-account switching is disabled inside active sessions—only the System Administrator retains multi-tenant governance visibility.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm font-medium flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-xs font-bold text-red-700 hover:underline ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (7 cols): Isolated Account Sign-In Portals */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-slate-200">
              <div>
                <h2 className="font-display text-xl font-extrabold text-[#0F172A]">
                  01. Authenticate Into an Isolated Account
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Select an account portal below to sign in. Once authenticated, you will only have access to that single account until you sign out.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500 tabular-nums shrink-0">
                {demoAccounts.length} Isolated Accounts
              </span>
            </div>

            {/* Dedicated System Administrator Portal */}
            {adminProfile && (
              <div className="mt-5 pb-5 border-b border-slate-200">
                <div className="text-xs font-bold text-slate-600 mb-2.5">
                  Platform Administration & Global Governance
                </div>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSelectProfile(adminProfile)}
                  className="w-full text-left p-4 rounded-lg border border-slate-300 bg-slate-50/80 hover:bg-slate-100 hover:border-[#1E3A8A] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-extrabold text-base text-[#0F172A]">
                        {adminProfile.name}
                      </span>
                      <span className="text-slate-400" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-xs font-bold text-[#1E3A8A]">
                        {adminProfile.title}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600">
                      {adminProfile.department} · Full Multi-Tenant Visibility · Audit & Account Provisioning
                    </div>
                    <div className="text-xs font-mono text-slate-500">
                      {adminProfile.email}
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-[#1E3A8A] group-hover:translate-x-0.5 transition-transform whitespace-nowrap">
                    <span>
                      {loadingAccount === adminProfile.email
                        ? 'Authenticating...'
                        : 'Sign In as Admin'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              </div>
            )}

            {/* Isolated Organization Accounts */}
            <div className="mt-5">
              <div className="text-xs font-bold text-slate-600 mb-3">
                Isolated Enterprise Organization Accounts
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {tenantProfiles.map((acc) => {
                  const isBusy = loadingAccount === acc.email;
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      disabled={loading}
                      onClick={() => handleSelectProfile(acc)}
                      className="p-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-[#1E3A8A] text-left transition-colors flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-display font-extrabold text-sm text-[#0F172A]">
                            {acc.name}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 capitalize shrink-0">
                            {acc.role}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-[#1E3A8A] mt-0.5 flex items-center gap-1">
                          <Lock className="w-3 h-3 shrink-0" />
                          <span>{acc.tenantName}</span>
                        </div>
                        <div className="text-xs text-slate-600 mt-1.5">
                          {acc.title} · {acc.department}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="font-mono text-slate-500 truncate">{acc.email}</span>
                        <span className="font-bold text-slate-900 group-hover:text-[#1E3A8A] flex items-center gap-1 shrink-0 whitespace-nowrap">
                          <span>{isBusy ? 'Signing in...' : 'Sign In'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Manual Credential Sign-In & Organization Registration */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg mb-6">
              <button
                type="button"
                onClick={() => {
                  setFormMode('login');
                  setError(null);
                }}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-md transition-colors whitespace-nowrap ${
                  formMode === 'login'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Credential Sign-In
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormMode('register');
                  setError(null);
                }}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-md transition-colors whitespace-nowrap ${
                  formMode === 'register'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                New Organization
              </button>
            </div>

            {formMode === 'login' ? (
              <form onSubmit={handleManualLogin} className="space-y-4">
                <div>
                  <h2 className="font-display text-xl font-extrabold text-[#0F172A]">
                    02. Sign In with Credentials
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Enter your corporate email address and password to establish an isolated account session.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Corporate Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@organization.com"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1E3A8A]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#1E3A8A] hover:bg-[#1E40AF] text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {loading ? 'Verifying Credentials...' : 'Sign In to Isolated Account'}
                </button>

                <div className="pt-4 border-t border-slate-200 text-xs text-slate-500 space-y-2">
                  <div className="font-bold text-slate-700">
                    Reference Account Credentials
                  </div>
                  <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                    <div>alice@acme.com / acme123</div>
                    <div>bob@acme.com / acme123</div>
                    <div>charlie@globex.com / globex123</div>
                    <div>tony@stark.com / stark123</div>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <h2 className="font-display text-xl font-extrabold text-[#0F172A]">
                    02. Provision Organization Partition
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Register a dedicated company vault and isolated manager account.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Organization Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={tenantName}
                      onChange={(e) => setTenantName(e.target.value)}
                      placeholder="e.g. Vanguard BioLabs"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1E3A8A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Corporate Domain
                    </label>
                    <input
                      type="text"
                      value={companyDomain}
                      onChange={(e) => setCompanyDomain(e.target.value)}
                      placeholder="vanguardbio.com"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1E3A8A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Industry Sector
                  </label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. Pharmaceutical Research"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1E3A8A]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Account Holder Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="Dr. Clara Vance"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1E3A8A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Corporate Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="clara@vanguardbio.com"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1E3A8A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Director of Compliance"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1E3A8A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Clinical Governance"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1E3A8A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Account Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1E3A8A]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#1E3A8A] hover:bg-[#1E40AF] text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {loading ? 'Provisioning Workspace...' : 'Create Isolated Organization & Sign In'}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Quiet Institutional Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>Tenant AI — Enterprise Multi-Tenant Knowledge Governance</span>
          <span>Single-Account Session Isolation · Zero Cross-Tenant Visibility</span>
        </div>
      </footer>
    </div>
  );
};
