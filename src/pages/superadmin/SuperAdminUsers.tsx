// src/pages/superadmin/SuperAdminUsers.tsx
//
// Super admin user management: list, search, create, activate/deactivate,
// delete. Talks to /users (super admin only on the server).

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, Trash2, UserCheck, UserX, X, Users, ShieldCheck } from 'lucide-react';
import axiosClient from '../../api/api';
import { useAppSelector } from '../../store/hooks';
import type { UserMetadata, UserRole } from '../../store/slices/authSlice';

interface Stats {
  totalUsers: number;
  totalAdmins: number;
  totalSuperAdmins: number;
  activeUsers: number;
  inactiveUsers: number;
}

interface ListResponse {
  users: UserMetadata[];
  total: number;
  page: number;
  totalPages: number;
}

const emptyForm = {
  pjNumber: '',
  fullName: '',
  email: '',
  phone: '',
  station: '',
  designation: '',
  role: 'admin' as UserRole,
};

const errMsg = (e: unknown): string => {
  const data = (e as { response?: { data?: { message?: string } } })?.response?.data;
  return data?.message || 'Request failed';
};

const SuperAdminUsers = () => {
  const me = useAppSelector((s) => s.auth.user);
  const [users, setUsers] = useState<UserMetadata[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<'' | UserRole>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const [reloadKey, setReloadKey] = useState(0);
  const load = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [list, st] = await Promise.all([
          axiosClient.get('/users', {
            params: { page, limit: 15, search: query || undefined, role: role || undefined },
          }),
          axiosClient.get('/users/stats'),
        ]);
        if (cancelled) return;
        const data = list.data.data as ListResponse;
        setUsers(data.users);
        setTotalPages(Math.max(1, data.totalPages));
        setStats(st.data.data as Stats);
        setError(null);
      } catch (e) {
        if (!cancelled) setError(errMsg(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, query, role, reloadKey]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axiosClient.post('/users', {
        ...form,
        phone: form.phone.trim() || undefined,
      });
      toast.success('Account created');
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (u: UserMetadata) => {
    try {
      await axiosClient.patch(`/users/${u.id}/status`, { isActive: !u.isActive });
      toast.success(u.isActive ? 'Account deactivated' : 'Account activated');
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const remove = async (u: UserMetadata) => {
    if (!confirm(`Delete ${u.fullName}? This cannot be undone.`)) return;
    try {
      await axiosClient.delete(`/users/${u.id}`);
      toast.success('Account deleted');
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const set = (k: keyof typeof emptyForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const cards = [
    { label: 'Total accounts', value: stats?.totalUsers, icon: Users },
    { label: 'Admins', value: stats?.totalAdmins, icon: UserCheck },
    { label: 'Super admins', value: stats?.totalSuperAdmins, icon: ShieldCheck },
    { label: 'Inactive', value: stats?.inactiveUsers, icon: UserX },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Users &amp; Admins</h1>
          <p className="text-sm text-gray-500">
            Manage who can sign in to the admin workspace. Sign-in is by PJ number and
            an emailed code.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm text-white"
        >
          <Plus className="h-4 w-4" /> New account
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {c.label}
                </p>
                <Icon className="h-4 w-4 text-amber-600" />
              </div>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{c.value ?? '–'}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, PJ number or email"
            className="w-full rounded border border-gray-300 py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value as '' | UserRole);
            setPage(1);
          }}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super admin</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">PJ number</th>
              <th className="px-3 py-2">Station</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-gray-500">
                  No accounts found.
                </td>
              </tr>
            )}
            {!loading &&
              users.map((u) => {
                const self = u.id === me?.id;
                return (
                  <tr key={u.id} className="border-t border-gray-100">
                    <td className="px-3 py-3">
                      <p className="font-medium text-slate-900">
                        {u.fullName} {self && <span className="text-xs text-gray-400">(you)</span>}
                      </p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs">{u.pjNumber}</td>
                    <td className="px-3 py-3">
                      <p>{u.station}</p>
                      <p className="text-xs text-gray-500">{u.designation}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.role === 'super_admin'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {u.role === 'super_admin' ? 'Super admin' : 'Admin'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={self}
                          onClick={() => toggleStatus(u)}
                          className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-40"
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          disabled={self}
                          aria-label="Delete"
                          onClick={() => remove(u)}
                          className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 disabled:opacity-40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded border border-gray-300 px-3 py-1 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border border-gray-300 px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">New account</h2>
              <button type="button" onClick={() => setShowForm(false)} aria-label="Close">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium text-gray-600">
                PJ number
                <input required value={form.pjNumber} onChange={set('pjNumber')} placeholder="PJ-0001" className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
              </label>
              <label className="text-xs font-medium text-gray-600">
                Full name
                <input required value={form.fullName} onChange={set('fullName')} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
              </label>
              <label className="text-xs font-medium text-gray-600">
                Email
                <input required type="email" value={form.email} onChange={set('email')} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
              </label>
              <label className="text-xs font-medium text-gray-600">
                Phone (optional)
                <input value={form.phone} onChange={set('phone')} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
              </label>
              <label className="text-xs font-medium text-gray-600">
                Station
                <input required value={form.station} onChange={set('station')} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
              </label>
              <label className="text-xs font-medium text-gray-600">
                Designation
                <input required value={form.designation} onChange={set('designation')} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
              </label>
              <label className="text-xs font-medium text-gray-600 sm:col-span-2">
                Role
                <select value={form.role} onChange={set('role')} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm">
                  <option value="admin">Admin — creates and edits content</option>
                  <option value="super_admin">Super admin — approves content, manages users</option>
                </select>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded border border-gray-300 px-4 py-2 text-sm">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50">
                {saving ? 'Creating…' : 'Create account'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SuperAdminUsers;
