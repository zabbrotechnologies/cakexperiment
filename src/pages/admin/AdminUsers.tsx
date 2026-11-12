import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ecommerceApi } from '../../services/ecommerceApi';
import { Search, RefreshCw, User, ShoppingBag, BookOpen, Eye, X, Phone, Trash2, CheckCircle } from 'lucide-react';
import { ConfirmActionModal } from '../../components/admin/ConfirmActionModal';

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
  product_orders_count?: number;
  course_orders_count?: number;
  product_spend?: number;
  course_spend?: number;
  latest_order_at?: string | null;
}

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserRecord | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [historyUser, setHistoryUser] = useState<AdminUserRecord | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const fetchUsers = async () => {
    setErrorMsg(null);
    try {
      const customers = await ecommerceApi.adminGetCustomers();
      setUsers(customers);
    } catch (err: any) {
      console.warn('Failed to fetch CRM customers:', err);
      setErrorMsg(err?.message || 'Unable to load customer CRM records.');
    }
  };

  useEffect(() => {
    fetchUsers().finally(() => setLoading(false));
  }, []);

  const openOrderHistory = async (u: AdminUserRecord) => {
    setHistoryUser(u);
    setLoadingOrders(true);
    setCustomerOrders([]);
    try {
      const orders = await ecommerceApi.adminGetCustomerOrders(u.id);
      setCustomerOrders(orders);
    } catch {
      setCustomerOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

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
        setErrorMsg(errData.error || 'Failed to update user status.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update user status.');
    } finally {
      setActionUserId(null);
    }
  };

  const handleConfirmDeleteCustomer = async () => {
    if (!deleteTarget) return;
    setDeletingUser(true);
    setDeleteError(null);

    try {
      const token = localStorage.getItem('cakexperiment_auth_token');
      const res = await fetch(`/api/admin/users/${encodeURIComponent(deleteTarget.id)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete customer account.');
      }

      const deletedName = deleteTarget.name;
      setUsers(prev => prev.filter(item => item.id !== deleteTarget.id));
      if (historyUser?.id === deleteTarget.id) setHistoryUser(null);
      setDeleteTarget(null);
      setSuccessMsg(`Deleted customer account "${deletedName}".`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete customer account.');
    } finally {
      setDeletingUser(false);
    }
  };

  const filteredUsers = users.filter(u =>
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.phone || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.id || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '100%', minWidth: 0 }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--color-plum)', fontWeight: 600 }}>
            Customer CRM &amp; Accounts
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Registered students &amp; shoppers ({users.length} total) synced across courses &amp; physical orders
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
          Refresh CRM
        </button>
      </div>

      {successMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '0.9rem 1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid #C8E6C9', fontSize: '0.88rem' }}>
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', backgroundColor: '#FFEBEE', color: '#C62828', padding: '0.9rem 1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid #FFCDD2', fontSize: '0.88rem' }}>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Search Input */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--border-subtle)', width: '100%', maxWidth: '420px' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search by name, email, phone, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '2.5rem', padding: '0.55rem 0.6rem 0.55rem 2.5rem' }}
          />
          <Search size={16} color="var(--text-light)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
        </div>
      </div>

      {/* Users CRM Table */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', width: '100%' }}>
        <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: '980px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-cream)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '1rem' }}>Customer Profile</th>
                <th style={{ padding: '1rem' }}>Role / Phone</th>
                <th style={{ padding: '1rem' }}>Product Orders</th>
                <th style={{ padding: '1rem' }}>Course Access</th>
                <th style={{ padding: '1rem' }}>Latest Activity</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'right', minWidth: '175px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading customer CRM records from Neon PostgreSQL...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
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
                            <div style={{ fontSize: '0.68rem', color: 'var(--color-berry)', fontFamily: 'monospace' }}>
                              {u.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '1rem' }}>
                        <span
                          className={`badge ${isAdmin ? 'badge-berry' : 'badge-blush'}`}
                          style={{ textTransform: 'capitalize', fontWeight: 600, marginBottom: '0.25rem', display: 'inline-block' }}
                        >
                          {isAdmin ? 'Admin' : 'Customer'}
                        </span>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Phone size={12} /> {u.phone || 'Not provided'}
                        </div>
                      </td>

                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: 'var(--color-plum)' }}>
                          <ShoppingBag size={14} color="var(--color-berry)" />
                          {Number(u.product_orders_count || 0)} orders
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                          Spend: ₹{Number(u.product_spend || 0).toLocaleString('en-IN')}
                        </div>
                      </td>

                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: 'var(--color-plum)' }}>
                          <BookOpen size={14} color="var(--color-berry)" />
                          {Number(u.active_enrollments_count || 0)} enrolled ({Number(u.course_orders_count || 0)} req)
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                          Spend: ₹{Number(u.course_spend || 0).toLocaleString('en-IN')}
                        </div>
                      </td>

                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        <div>Joined: {u.created_at || u.createdAt ? new Date(u.created_at || u.createdAt!).toLocaleDateString('en-IN') : 'Recent'}</div>
                        <div>Last order: {u.latest_order_at ? new Date(u.latest_order_at).toLocaleDateString('en-IN') : 'None yet'}</div>
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
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.45rem', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => openOrderHistory(u)}
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            <Eye size={13} /> Orders
                          </button>
                          {!isAdmin && (
                            <>
                              <button
                                onClick={() => handleToggleStatus(u)}
                                disabled={actionUserId === u.id}
                                className="btn btn-secondary btn-sm"
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '0.35rem 0.65rem',
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
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteError(null);
                                  setDeleteTarget(u);
                                }}
                                className="btn btn-outline btn-sm"
                                title={`Delete ${u.name}`}
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '0.35rem 0.55rem',
                                  borderColor: '#FFCDD2',
                                  color: '#C62828',
                                  display: 'inline-flex',
                                  alignItems: 'center'
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Order History Modal */}
      {historyUser && createPortal(
        <div
          onClick={() => setHistoryUser(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(40, 15, 22, 0.55)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            overflowY: 'auto'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '680px',
              width: '100%',
              maxHeight: 'calc(100dvh - 40px)',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-cream)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--color-plum)' }}>
                  Order History — {historyUser.name}
                </h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {historyUser.email} &bull; {historyUser.phone || 'No phone on file'}
                </p>
              </div>
              <button onClick={() => setHistoryUser(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {loadingOrders ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Loading customer order history...
                </div>
              ) : customerOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  This customer has not placed any physical product or course orders yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {customerOrders.map((ord) => (
                    <div key={ord.id} style={{ padding: '0.95rem 1.1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', backgroundColor: '#FDFBFB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-plum)' }}>{ord.order_number}</span>
                          <span className="badge" style={{ fontSize: '0.68rem', backgroundColor: ord.order_type === 'PRODUCT' ? '#E3F2FD' : '#FFF3E0', color: ord.order_type === 'PRODUCT' ? '#1565C0' : '#E65100' }}>
                            {ord.order_type === 'PRODUCT' ? 'Physical Product' : 'Online Course'}
                          </span>
                          <span className="badge badge-blush" style={{ fontSize: '0.68rem' }}>
                            {ord.order_type === 'PRODUCT' ? (ord.fulfillment_status || ord.status) : ord.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-body)', marginTop: '0.3rem' }}>
                          {Array.isArray(ord.items) && ord.items.length > 0
                            ? ord.items.map((it: any) => `${it.name}${it.variant ? ` (${it.variant})` : ''} × ${it.quantity}`).join(', ')
                            : 'Order items recorded'}
                        </div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          Placed {new Date(ord.created_at).toLocaleString('en-IN')} &bull; Payment: {ord.payment_method || 'WhatsApp'} ({ord.payment_status || 'PENDING'})
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--color-plum)', fontSize: '1rem' }}>
                        ₹{Number(ord.total_amount || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      <ConfirmActionModal
        open={Boolean(deleteTarget)}
        title="Delete Customer Account?"
        itemLabel={deleteTarget ? `${deleteTarget.name} (${deleteTarget.email})` : undefined}
        description="This will permanently delete the customer account, active sessions, enrollments, wishlist, cart items, and associated order records from Customer CRM. This action cannot be undone."
        confirmLabel="Delete Customer"
        isProcessing={deletingUser}
        errorMessage={deleteError}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        onConfirm={handleConfirmDeleteCustomer}
      />
    </div>
  );
};
