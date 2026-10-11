import React, { useState, useRef, useEffect } from 'react';
import { User, Tenant } from '../types';
import { ChevronDown, LogOut, Lock } from 'lucide-react';

export type ActiveTab = 'chat' | 'documents' | 'profiles' | 'security' | 'admin';

interface HeaderProps {
  user: User;
  tenant: Tenant | null;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  tenant,
  activeTab,
  setActiveTab,
  onLogout,
}) => {
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowAccountMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems: { id: ActiveTab; label: string }[] =
    user.role === 'admin'
      ? [
          { id: 'admin', label: 'Admin Dashboard' },
          { id: 'chat', label: 'Knowledge Assistant' },
          { id: 'documents', label: 'Document Vault' },
          { id: 'profiles', label: 'Account Profile' },
          { id: 'security', label: 'Boundary Verification' },
        ]
      : [
          { id: 'chat', label: 'Knowledge Assistant' },
          { id: 'documents', label: 'Document Vault' },
          { id: 'profiles', label: 'Account Profile' },
          { id: 'security', label: 'Boundary Verification' },
        ];

  const activeOrgLabel =
    user.role === 'admin'
      ? `System Admin · ${tenant ? tenant.name : 'All Partitions'}`
      : tenant
      ? tenant.name
      : user.tenantId;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Bold, high-visibility brand wordmark */}
        <button
          type="button"
          onClick={() => setActiveTab(user.role === 'admin' ? 'admin' : 'chat')}
          className="font-display text-xl font-extrabold tracking-tight text-[#0F172A] whitespace-nowrap shrink-0 text-left focus:outline-none"
        >
          TENANT AI
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`py-5 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'border-[#1E3A8A] text-[#0F172A] font-bold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Isolated Single Account Identity & Sign Out */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowAccountMenu((prev) => !prev)}
            className="px-3.5 py-2 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-800 flex items-center gap-2.5 transition-colors whitespace-nowrap shrink-0"
          >
            <Lock className="w-3.5 h-3.5 text-[#1E3A8A] shrink-0" />
            <span className="font-bold text-slate-900">{user.name}</span>
            <span className="text-slate-400" aria-hidden="true">
              ·
            </span>
            <span className="text-slate-700 font-medium max-w-[170px] truncate">
              {activeOrgLabel}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {showAccountMenu && (
            <div className="absolute right-0 mt-2 w-76 bg-white rounded-xl shadow-lg border border-slate-200 py-3 z-50 text-xs">
              <div className="px-4 pb-3 border-b border-slate-100 space-y-1">
                <div className="text-[11px] font-semibold text-[#1E3A8A]">
                  Isolated Session Boundary
                </div>
                <div className="font-bold text-slate-900 text-sm">{user.name}</div>
                <div className="text-slate-600">
                  {user.title || user.role} · {activeOrgLabel}
                </div>
                <div className="text-slate-500 font-mono text-[11px]">{user.email}</div>
              </div>

              <div className="px-4 py-2.5 border-b border-slate-100 text-[11px] text-slate-500 leading-relaxed">
                This session is cryptographically locked to{' '}
                <strong className="text-slate-800">
                  {tenant ? tenant.name : user.tenantId}
                </strong>
                . Cross-account switching is disabled while signed in.
              </div>

              <div className="px-2 pt-2 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('profiles');
                    setShowAccountMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold transition-colors"
                >
                  Account & Organization Profile
                </button>
                {user.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('admin');
                      setShowAccountMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold transition-colors"
                  >
                    Executive Admin Dashboard
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowAccountMenu(false);
                    onLogout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-red-700 hover:bg-red-50 font-semibold flex items-center justify-between transition-colors"
                >
                  <span>Sign Out of Account</span>
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="flex md:hidden border-t border-slate-200 px-4 py-2 overflow-x-auto gap-2 bg-slate-50">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              activeTab === item.id
                ? 'bg-[#1E3A8A] text-white'
                : 'text-slate-700 hover:bg-slate-200/60'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
