import React, { useState } from 'react';
import { storageService } from '../../services/storage';
import { Payment } from '../../types';
import { CreditCard, Search, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';

export const AdminPayments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>(() => storageService.getPayments());
  const [search, setSearch] = useState('');

  const handleRefund = (pay: Payment) => {
    if (window.confirm(`Simulate refund for payment of ${storageService.formatINR(pay.amount)} to ${pay.userName}?`)) {
      storageService.refundOrder(pay.orderId);
      setPayments(storageService.getPayments());
    }
  };

  const filtered = payments.filter(p =>
    p.transactionReference.toLowerCase().includes(search.toLowerCase()) ||
    p.userName.toLowerCase().includes(search.toLowerCase()) ||
    p.courseTitle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--color-plum)', fontWeight: 600 }}>
          Payment Ledger & Gateway Transactions
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Simulated Stripe, Razorpay & UPI transactions with refund auditing
        </p>
      </div>

      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--border-subtle)', width: '100%', maxWidth: '340px' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search transaction ref or student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '2.5rem', padding: '0.55rem 0.6rem 0.55rem 2.5rem' }}
          />
          <Search size={16} color="var(--text-light)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
        </div>
      </div>

      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-cream)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '1rem' }}>Transaction ID</th>
                <th style={{ padding: '1rem' }}>Student & Course</th>
                <th style={{ padding: '1rem' }}>Gateway / Method</th>
                <th style={{ padding: '1rem' }}>Amount</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((pay) => (
                <tr key={pay.id} style={{ borderBottom: '1px solid #FAF0F2' }}>
                  <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-plum)' }}>
                    {pay.transactionReference}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-plum)' }}>{pay.userName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pay.courseTitle}</div>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    <div>{pay.provider}</div>
                    <div style={{ color: 'var(--text-light)' }}>{pay.paymentMethod}</div>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--color-plum)' }}>
                    {storageService.formatINR(pay.amount)}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: pay.status === 'successful' ? '#E8F5E9' : (pay.status === 'refunded' ? '#ECEFF1' : '#FFEBEE'),
                        color: pay.status === 'successful' ? '#2E7D32' : (pay.status === 'refunded' ? '#546E7A' : '#C62828'),
                        textTransform: 'capitalize'
                      }}
                    >
                      {pay.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    {pay.status === 'successful' && (
                      <button
                        onClick={() => handleRefund(pay)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <RotateCcw size={12} /> Refund
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
