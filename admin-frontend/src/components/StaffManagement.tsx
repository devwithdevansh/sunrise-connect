import React, { useState } from 'react';
import { useApp } from '../store';
import { UserPlus, Users, ShieldCheck, ShieldOff, KeyRound, Eye, EyeOff, Trash2 } from 'lucide-react';

// Removed StaffUser interface as it's no longer used locally

export const StaffManagement: React.FC = () => {
  const { currentUser, authFetch, users, refreshData, isLoadingDetails } = useApp();
  const staffMembers = users.filter((u: any) => u.role !== 'ADMIN');

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);

  // Reset password
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetPassword, setResetNewPassword] = useState('');

  // Headers are automatically handled by authFetch, but we still need Content-Type for POST/PATCH
  const defaultHeaders = { 'Content-Type': 'application/json' };

  const handleCreate = async () => {
    setFormError('');
    if (!formName.trim() || !formEmail.trim() || !formPassword.trim()) {
      setFormError('All fields are required');
      return;
    }
    if (formPassword.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }
    setCreating(true);
    try {
      const res = await authFetch('/api/v1/users', {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify({ name: formName.trim(), email: formEmail.trim().toLowerCase(), password: formPassword })
      });
      if (!res.ok) {
        const data = await res.json();
        setFormError(data.message || 'Failed to create account');
        return;
      }
      setShowForm(false);
      setFormName(''); setFormEmail(''); setFormPassword('');
      refreshData();
    } catch (err) {
      setFormError('Network error');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (userId: string) => {
    await authFetch(`/api/v1/users/${userId}/toggle-status`, { method: 'PATCH' });
    refreshData();
  };

  const handleResetPassword = async () => {
    if (!resetUserId || resetPassword.length < 6) return;
    await authFetch(`/api/v1/users/${resetUserId}/reset-password`, {
      method: 'PATCH',
      headers: defaultHeaders,
      body: JSON.stringify({ newPassword: resetPassword })
    });
    setResetUserId(null);
    setResetNewPassword('');
    alert('Password reset successfully!');
  };

  const handleDelete = async (userId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the account for "${name}"? This action cannot be undone.`)) return;
    const res = await authFetch(`/api/v1/users/${userId}`, { method: 'DELETE' });
    if (res.ok) {
      refreshData();
    } else {
      const data = await res.json();
      alert(data.message || 'Failed to delete staff account');
    }
  };

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <p className="text-slate-400 font-bold text-lg">Access Denied</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 max-w-5xl mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="h-6 w-6 text-violet-500" /> Staff Management
          </h2>
          <p className="text-slate-500 text-sm mt-1">Create and manage clerk/staff accounts for the admin panel.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors"
        >
          <UserPlus className="h-4 w-4" /> New Clerk Account
        </button>
      </header>

      {/* Create Form */}
      {showForm && (
        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-violet-900">Create New Clerk Account</h3>
          {formError && <p className="text-red-600 text-sm font-bold bg-red-50 p-2 rounded-lg">{formError}</p>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text" placeholder="Full Name" value={formName}
              onChange={e => setFormName(e.target.value)}
              className="border border-violet-200 bg-white rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
            <input
              type="email" placeholder="Email Address" value={formEmail}
              onChange={e => setFormEmail(e.target.value)}
              className="border border-violet-200 bg-white rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'} placeholder="Password (min 6 chars)" value={formPassword}
                onChange={e => setFormPassword(e.target.value)}
                className="border border-violet-200 bg-white rounded-xl px-4 py-2.5 text-sm font-medium w-full focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
              <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCreate} disabled={creating}
              className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Account'}
            </button>
            <button onClick={() => { setShowForm(false); setFormError(''); }} className="text-sm font-bold text-slate-500 hover:text-slate-700">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Staff List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {isLoadingDetails ? (
          <div className="p-10 text-center text-slate-400 font-semibold">Loading staff...</div>
        ) : staffMembers.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            <p className="font-bold">No clerk accounts yet</p>
            <p className="text-xs mt-1">Click "New Clerk Account" to create one.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-xs font-bold uppercase text-slate-500">
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4">Last Login</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffMembers.map((staff: any) => (
                <tr key={staff._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-slate-800">{staff.name}</td>
                  <td className="p-4 text-slate-600 font-mono text-xs">{staff.email}</td>
                  <td className="p-4 text-center">
                    {staff.isActive ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100">
                        <ShieldCheck className="h-3 w-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold border border-red-100">
                        <ShieldOff className="h-3 w-3" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-slate-500 text-xs font-medium">
                    {staff.lastLogin ? new Date(staff.lastLogin).toLocaleString('en-IN') : 'Never'}
                  </td>
                  <td className="p-4 text-center space-x-2">
                    <button
                      onClick={() => handleToggle(staff._id)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                        staff.isActive
                          ? 'text-red-600 bg-red-50 border-red-100 hover:bg-red-100'
                          : 'text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100'
                      }`}
                    >
                      {staff.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => setResetUserId(staff._id)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border text-amber-600 bg-amber-50 border-amber-100 hover:bg-amber-100 transition-colors"
                    >
                      <KeyRound className="h-3 w-3 inline mr-1" />Reset
                    </button>
                    <button
                      onClick={() => handleDelete(staff._id, staff.name)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border text-rose-600 bg-rose-50 border-rose-100 hover:bg-rose-100 transition-colors"
                      title="Permanently remove this staff member"
                    >
                      <Trash2 className="h-3 w-3 inline mr-1" />Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Reset Password Modal */}
      {resetUserId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-slate-800">Reset Staff Password</h3>
            <input
              type="password" placeholder="New Password (min 6 chars)" value={resetPassword}
              onChange={e => setResetNewPassword(e.target.value)}
              className="border rounded-xl px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setResetUserId(null); setResetNewPassword(''); }} className="text-sm font-bold text-slate-500">Cancel</button>
              <button
                onClick={handleResetPassword} disabled={resetPassword.length < 6}
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-bold text-sm disabled:opacity-50 transition-colors"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
