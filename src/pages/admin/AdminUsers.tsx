import React, { useState, useEffect } from 'react';
import { storageService } from '../../services/storage';
import { Users, Search, CheckCircle, Ban, BookOpen, Shield, RefreshCw, User } from 'lucide-react';

interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'student' | 'admin';
  status?: string;
  email_verified?: boolean;
  created_at?: string;
  createdAt?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  profile_image?: string;
  active_enrollments_count?: number;
}

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setErrorMsg(null);
    try {
      const token = localStorage.getItem('cakexperiment_auth_token');
      const res = await fetch('/api/admin/users', {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.users)) {
          setUsers(data.users);
          return;
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMsg(errData.error || `Server returned HTTP ${res.status}`);
      }
    } catch (err: any) {
      console.warn('Failed to fetch from /api/admin/users:', err);
      setErrorMsg('Unable to connect to database server. Please check your network or login session.');
    }
  };

  useEffect(() => {
    fetchUsers().finally(() => setLoading(false));
  }, []);

  const handleToggleStatus = async (u: AdminUserRecord) => {
    const currentStatus = u.status || 'active';
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    setActionUserId(u.id);

    try {
      const token = localStorage.getItem('cakexperiment_auth_token');
      const res = await fetch(`/api/admin/users/${u.id}/status`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: nextStatus })
      });

      if (res.ok) {
        setUsers(prev =>
          prev.map(item => (item.id === u.id ? { ...item, status: nextStatus } : item))
        );
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Failed to update user status.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update user status.');
    } finally {
      setActionUserId(null);
    }
  };

  const filteredUsers = users.filter(u =>
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.id || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '100%', minWidth: 0 }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--color-plum)', fontWeight: 600 }}>
            Student & Account Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Registered accounts ({users.length} total) stored in Neon PostgreSQL database
          </p>
        </div>

        <button
          onClick={() => {
            setLoading(true);
            fetchUsers().finally(() => setLoading(false));
          }}
          className="btn btn-outline btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Students
        </button>
      </div>

      {errorMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', backgroundColor: '#FFEBEE', color: '#C62828', padding: '0.9rem 1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid #FFCDD2', fontSize: '0.88rem' }}>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Search Input */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--border-subtle)', width: '100%', maxWidth: '380px' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '2.5rem', padding: '0.55rem 0.6rem 0.55rem 2.5rem' }}
          />
          <Search size={16} color="var(--text-light)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
        </div>
      </div>

      {/* Users Table */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', width: '100%' }}>
        <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: '850px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-cream)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '1rem' }}>User Profile</th>
                <th style={{ padding: '1rem' }}>Platform Role</th>
                <th style={{ padding: '1rem' }}>Joined Date</th>
                <th style={{ padding: '1rem' }}>Enrolled Courses</th>
                <th style={{ padding: '1rem' }}>Account Status</th>
                <th style={{ padding: '1rem', textAlign: 'right', minWidth: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading registered student accounts from Neon PostgreSQL...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No registered accounts found matching "{search}".
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isAdmin = u.role?.toUpperCase() === 'ADMIN';
                  const isSuspended = u.status === 'suspended';

                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #FAF0F2' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--color-blush)',
                              color: 'var(--color-berry)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid var(--border-subtle)',
                              flexShrink: 0
                            }}
                          >
                            <User size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--color-plum)' }}>{u.name}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.email}</div>
                            <div style={{ fontSize: '0.70rem', color: 'var(--color-berry)', fontFamily: 'monospace' }}>
                              ID: {u.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '1rem' }}>
                        <span
                          className={`badge ${isAdmin ? 'badge-berry' : 'badge-blush'}`}
                          style={{ textTransform: 'capitalize', fontWeight: 600 }}
                        >
                          {isAdmin ? 'Admin' : 'Student'}
                        </span>
                      </td>

                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                        {u.created_at || u.createdAt
                          ? new Date(u.created_at || u.createdAt!).toLocaleDateString()
                          : 'Recent'}
                      </td>

                      <td style={{ padding: '1rem', color: 'var(--color-plum)', fontWeight: 600 }}>
                        {u.active_enrollments_count ?? 0} Masterclasses
                      </td>

                      <td style={{ padding: '1rem' }}>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: !isSuspended ? '#E8F5E9' : '#FFEBEE',
                            color: !isSuspended ? '#2E7D32' : '#C62828',
                            textTransform: 'capitalize',
                            fontWeight: 600
                          }}
                        >
                          {!isSuspended ? 'Active' : 'Suspended'}
                        </span>
                      </td>

                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        {!isAdmin && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={actionUserId === u.id}
                            className="btn btn-secondary btn-sm"
                            style={{
                              fontSize: '0.78rem',
                              padding: '0.35rem 0.75rem',
                              color: isSuspended ? '#2E7D32' : 'var(--color-berry)',
                              borderColor: isSuspended ? '#2E7D32' : 'var(--border-subtle)'
                            }}
                          >
                            {actionUserId === u.id
                              ? 'Updating...'
                              : isSuspended
                              ? 'Activate'
                              : 'Suspend'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
