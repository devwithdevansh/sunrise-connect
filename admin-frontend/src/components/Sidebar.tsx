import React from 'react';
import { useApp } from '../store';
import type { ScreenType } from '../store';
import {
  LayoutDashboard,
  CreditCard,
  AlertTriangle,
  Layers,
  Users,
  FileSpreadsheet,
  MessageSquare,
  Bell,
  Smartphone,
  Receipt,
  History,
  BarChart3,
  LogOut,
  Sun,
  Settings
} from 'lucide-react';

interface MenuItem {
  id: ScreenType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  disabled?: boolean;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

export const Sidebar: React.FC = () => {
  const { currentScreen, setScreen, currentUser, logout } = useApp();

  if (currentScreen === 'login') return null;

  const unpaidCount = 233;

  const menuGroups: MenuGroup[] = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ]
    },
    {
      title: 'FEES',
      items: [
        { id: 'collect-fee', label: 'Collect Fee', icon: CreditCard },
        { id: 'unpaid-fees', label: 'Unpaid Fees', icon: AlertTriangle, badge: unpaidCount },
        { id: 'fee-structure', label: 'Fee Structure', icon: Layers },
      ]
    },
    {
      title: 'STUDENTS',
      items: [
        { id: 'students', label: 'Students', icon: Users },
        { id: 'reports', label: 'Import Excel', icon: FileSpreadsheet, disabled: true },
      ]
    },
    {
      title: 'NOTIFY',
      items: [
        { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
        { id: 'notifications', label: 'Notifications', icon: Bell },
      ]
    },
    {
      title: 'APP',
      items: [
        { id: 'parent-app', label: 'Parent App Preview', icon: Smartphone },
        { id: 'receipts', label: 'Receipts', icon: Receipt },
      ]
    },
    {
      title: 'ADMIN',
      items: [
        { id: 'setup', label: 'Setup', icon: Settings },
        { id: 'audit', label: 'Audit Log', icon: History },
        { id: 'reports', label: 'Reports', icon: BarChart3 },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-[#1E293B] text-slate-300 flex flex-col h-screen sticky top-0 shrink-0 border-r border-slate-700/50">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-700/50 flex items-center gap-3">
        <div className="bg-[#F59E0B] p-2 rounded-lg text-white">
          <Sun className="h-6 w-6 animate-spin-slow" />
        </div>
        <div>
          <h1 className="font-bold text-white tracking-wide text-lg">Sunrise Connect</h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">School Fee Portal</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-grow py-4 overflow-y-auto px-3 space-y-5 custom-scrollbar">
        {menuGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <span className="px-3 text-[10px] font-semibold text-slate-500 tracking-wider block">
              {group.title}
            </span>
            <div className="space-y-[2px]">
              {group.items.map((item) => {
                const isActive = currentScreen === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => !item.disabled && setScreen(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-slate-700/50 text-[#F59E0B] border-l-4 border-[#F59E0B]'
                        : item.disabled
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:bg-slate-700/30 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 ${isActive ? 'text-[#F59E0B]' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="bg-[#EF4444] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Active User Section */}
      {currentUser && (
        <div className="p-4 border-t border-slate-700/50 bg-slate-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-9 w-9 rounded-full bg-[#F59E0B] text-slate-900 font-bold flex items-center justify-center shrink-0">
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-semibold text-white truncate">{currentUser.name}</h4>
              <p className="text-[10px] text-slate-400 truncate">{currentUser.role === 'ADMIN' ? 'Administrator' : 'Staff Member'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      )}
    </aside>
  );
};
