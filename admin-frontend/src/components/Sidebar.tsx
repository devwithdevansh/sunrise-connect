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
  Activity,
  BarChart3,
  LogOut,
  Settings
} from 'lucide-react';
import logo from '../assets/sunrise-round-logo.png';
import dwdLogo from '../assets/logo.png';

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

interface SidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onClose }) => {
  const { currentScreen, setScreen, currentUser, logout, activeStudents } = useApp();

  if (currentScreen === 'login') return null;

  const unpaidCount = React.useMemo(() => {
    return activeStudents.filter(s => s.status !== 'PAID' && s.status !== 'RTE').length;
  }, [activeStudents]);

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
        ...(currentUser?.role === 'ADMIN' ? [{ id: 'fee-structure' as ScreenType, label: 'Fee Structure', icon: Layers }] : []),
      ]
    },
    {
      title: 'STUDENTS',
      items: [
        { id: 'students', label: 'Students', icon: Users },
        ...(currentUser?.role === 'ADMIN' ? [
          { id: 'promote-students' as ScreenType, label: 'Promote', icon: Layers },
          { id: 'import-excel' as ScreenType, label: 'Import Excel', icon: FileSpreadsheet }
        ] : []),
      ]
    },
    {
      title: 'NOTIFY',
      items: [
        ...(currentUser?.role === 'ADMIN' ? [{ id: 'whatsapp' as ScreenType, label: 'WhatsApp', icon: MessageSquare }] : []),
        { id: 'notifications', label: 'Notifications', icon: Bell },
      ]
    },
    {
      title: 'APP',
      items: [
        { id: 'parent-app', label: 'Parent App Preview', icon: Smartphone, disabled: true },
        { id: 'receipts', label: 'Receipts', icon: Receipt },
      ]
    },
    ...(currentUser?.role === 'ADMIN' ? [{
      title: 'ADMIN',
      items: [
        { id: 'setup' as ScreenType, label: 'Setup', icon: Settings },
        { id: 'staff-management' as ScreenType, label: 'Staff Management', icon: Users },
        { id: 'audit-log' as ScreenType, label: 'Audit Log', icon: Activity },
        { id: 'reports' as ScreenType, label: 'Reports', icon: BarChart3 },
      ]
    }] : [])
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      
      <aside className={`
        bg-[#1E293B] text-slate-300 flex flex-col h-screen shrink-0 border-r border-slate-700/50
        transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'fixed inset-y-0 left-0 z-50 w-72 translate-x-0 shadow-2xl' : 'fixed inset-y-0 left-0 z-50 w-72 -translate-x-full lg:relative lg:translate-x-0 lg:w-64 lg:flex lg:sticky lg:top-0'}
      `}>
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-700/50 flex items-center gap-3">
        <div className="flex-shrink-0">
          <img src={logo} alt="Sunrise Connect" className="h-10 w-10 object-contain" />
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
                    onClick={() => {
                      if (!item.disabled) {
                        setScreen(item.id);
                        if (onClose) onClose();
                      }
                    }}
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
            onClick={(e) => { e.preventDefault(); logout(); }}
            title="Log Out"
            className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Company Footprint */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/80 backdrop-blur-md">
        <div className="flex flex-col items-center justify-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest leading-none mt-1">Made by</span>
            <img src={dwdLogo} alt="dwd" className="h-5 object-contain opacity-90 invert mix-blend-screen contrast-125" />
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold tracking-wider leading-none">
            <span>9687629341</span>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
};
