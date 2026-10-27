import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { Order, Payment } from '../../types';
import { Receipt, CheckCircle, Download, ExternalLink, Sparkles, X } from 'lucide-react';

export const MyPurchases: React.FC = () => {
  const { user } = useAuth();
  const allOrders = storageService.getOrders();
  const allPayments = storageService.getPayments();

  const studentOrders = user ? allOrders.filter(o => o.userId === user.id) : [];
  const [selectedReceipt, setSelectedReceipt] = useState<Order | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div>
        <h2 style={{ fontSize: '1.8rem', color: 'var(--color-plum)' }}>Digital Orders & Receipts</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Official tax receipts and simulated transaction records for all course enrollments
        </p>
      </div>

      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '2rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
        
        {studentOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--color-blush)', color: 'var(--color-berry)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem auto' }}>
              <Receipt size={24} />
            </div>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--color-plum)', marginBottom: '0.4rem' }}>No Purchase Records</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              You have not purchased any course licenses yet.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.8rem 1rem' }}>Order Number</th>
                  <th style={{ padding: '0.8rem 1rem' }}>Masterclass</th>
                  <th style={{ padding: '0.8rem 1rem' }}>Date</th>
                  <th style={{ padding: '0.8rem 1rem' }}>Amount</th>
                  <th style={{ padding: '0.8rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.8rem 1rem', textAlign: 'right' }}>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {studentOrders.map((ord) => {
                  const payment = allPayments.find(p => p.orderId === ord.id);
                  return (
                    <tr key={ord.id} style={{ borderBottom: '1px solid #FAF0F2' }}>
                      <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-plum)', fontFamily: 'monospace' }}>
                        {ord.orderNumber}
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
                      <td style={{ padding: '1rem' }}>
                        <span className="badge" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', textTransform: 'capitalize' }}>
                          <CheckCircle size={12} /> {ord.paymentStatus}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedReceipt(ord)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                        >
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Simulated Receipt Modal */}
      {selectedReceipt && (
        <div className="modal-overlay" onClick={() => setSelectedReceipt(null)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-cream)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} color="var(--color-berry)" />
                <h3 style={{ fontSize: '1.2rem', color: 'var(--color-plum)', margin: 0 }}>
                  Official Digital Invoice Receipt
                </h3>
              </div>
              <button onClick={() => setSelectedReceipt(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="var(--color-plum)" />
              </button>
            </div>

            <div style={{ padding: '2rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 600, color: 'var(--color-plum)' }}>
                  Cakexperiment Academy
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Rue de Patisserie, Digital Atelier • GSTIN: 27AABCA1234F1Z5
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px dashed var(--border-subtle)' }}>
                <div>
                  <div style={{ color: 'var(--text-light)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Billed To</div>
                  <div style={{ fontWeight: 600, color: 'var(--color-plum)' }}>{selectedReceipt.userName}</div>
                  <div style={{ color: 'var(--text-muted)' }}>{selectedReceipt.userEmail}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--text-light)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Order Ref</div>
                  <div style={{ fontWeight: 600, color: 'var(--color-plum)', fontFamily: 'monospace' }}>{selectedReceipt.orderNumber}</div>
                  <div style={{ color: 'var(--text-muted)' }}>{new Date(selectedReceipt.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-plum)' }}>{selectedReceipt.courseTitle}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Digital Course License (Lifetime Access)</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-plum)' }}>
                  {storageService.formatINR(selectedReceipt.amount)}
                </div>
              </div>

              <div style={{ paddingTop: '1rem', borderTop: '2px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-plum)' }}>Total Paid</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-berry)' }}>
                  {storageService.formatINR(selectedReceipt.amount)}
                </span>
              </div>

              <button
                onClick={() => {
                  alert('Receipt printing simulated! In production, this downloads a signed PDF invoice.');
                  setSelectedReceipt(null);
                }}
                className="btn btn-primary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Download size={16} /> Download PDF Receipt
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
