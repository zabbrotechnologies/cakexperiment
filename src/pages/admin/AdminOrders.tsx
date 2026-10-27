import React, { useState } from 'react';
import { storageService } from '../../services/storage';
import { Order } from '../../types';
import { ShoppingBag, Search, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(() => storageService.getOrders());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredOrders = orders.filter((o) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!o.orderNumber.toLowerCase().includes(q) && !o.userName.toLowerCase().includes(q) && !o.courseTitle.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (statusFilter !== 'all' && o.paymentStatus !== statusFilter) {
      return false;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--color-plum)', fontWeight: 600 }}>
          Digital Course Orders
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Real-time record of all student masterclass course purchases
        </p>
      </div>

      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--border-subtle)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
          <input
            type="text"
            placeholder="Search by Order # or student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '2.5rem', padding: '0.55rem 0.6rem 0.55rem 2.5rem' }}
          />
          <Search size={16} color="var(--text-light)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.55rem 0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', backgroundColor: '#FFFFFF', fontSize: '0.85rem', outline: 'none' }}
          >
            <option value="all">All Orders</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-cream)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '1rem' }}>Order Ref</th>
                <th style={{ padding: '1rem' }}>Student Name</th>
                <th style={{ padding: '1rem' }}>Masterclass Title</th>
                <th style={{ padding: '1rem' }}>Date & Time</th>
                <th style={{ padding: '1rem' }}>Amount</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No orders found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} style={{ borderBottom: '1px solid #FAF0F2' }}>
                    <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-plum)' }}>
                      {ord.orderNumber}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-plum)' }}>{ord.userName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ord.userEmail}</div>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--color-plum)', fontWeight: 500 }}>
                      {ord.courseTitle}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                      {new Date(ord.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--color-plum)' }}>
                      {storageService.formatINR(ord.amount)}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: ord.paymentStatus === 'paid' ? '#E8F5E9' : (ord.paymentStatus === 'refunded' ? '#ECEFF1' : '#FFF3E0'),
                          color: ord.paymentStatus === 'paid' ? '#2E7D32' : (ord.paymentStatus === 'refunded' ? '#546E7A' : '#E65100'),
                          textTransform: 'capitalize'
                        }}
                      >
                        {ord.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
