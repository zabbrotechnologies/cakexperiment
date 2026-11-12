import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ecommerceApi } from '../../services/ecommerceApi';
import {
  IndianRupee,
  Users,
  ShoppingBag,
  BookOpen,
  Clock,
  TrendingUp,
  Award,
  AlertTriangle,
  Package,
  RefreshCw,
  ArrowRight
} from 'lucide-react';

type AnalyticsRange = 'today' | '7d' | '30d' | '1y' | 'all';

const RANGE_OPTIONS: { key: AnalyticsRange; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '1y', label: '1 Year' },
  { key: 'all', label: 'All Time' }
];

export const AdminDashboard: React.FC = () => {
  const [range, setRange] = useState<AnalyticsRange>('30d');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async (selectedRange: AnalyticsRange) => {
    setLoading(true);
    setError(null);
    try {
      const res = await ecommerceApi.adminGetAnalytics(selectedRange);
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Unable to load analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics(range);
  }, [range, loadAnalytics]);

  const kpis = data?.kpis || {};
  const salesByCategory: any[] = data?.salesByCategory || [];
  const bestSellingProducts: any[] = data?.bestSellingProducts || [];
  const lowStockProducts: any[] = data?.lowStockProducts || [];
  const recentProductOrders: any[] = data?.recentProductOrders || [];
  const recentCourseOrders: any[] = data?.recentCourseOrders || [];
  const recentStudents: any[] = data?.recentStudents || [];

  const formatINR = (val: number | string | undefined) =>
    `₹${Number(val || 0).toLocaleString('en-IN')}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header + Date Range Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--color-plum)', fontWeight: 600 }}>
            Dashboard &amp; Dual-Commerce Analytics
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Live revenue, product fulfillment, COD collections, and course enrollment metrics from Neon PostgreSQL
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', padding: '0.25rem' }}>
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setRange(opt.key)}
                style={{
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.38rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: range === opt.key ? 'var(--color-berry)' : 'transparent',
                  color: range === opt.key ? '#FFFFFF' : 'var(--text-muted)'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => loadAnalytics(range)}
            className="btn btn-outline btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.9rem 1.2rem', borderRadius: 'var(--radius-md)', backgroundColor: '#FFEBEE', color: '#C62828', border: '1px solid #FFCDD2', fontSize: '0.88rem' }}>
          {error}
        </div>
      )}

      {/* Primary KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(215px, 1fr))', gap: '1.1rem' }}>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '1.35rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Collected Revenue</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#E8F5E9', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IndianRupee size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-plum)' }}>
            {loading && !data ? '...' : formatINR(kpis.totalRevenue)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#2E7D32', marginTop: '0.3rem', fontWeight: 500 }}>
            Courses: {formatINR(kpis.courseRevenue)} &bull; Collected COD: {formatINR(kpis.collectedCodRevenue)}
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '1.35rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>Pending COD Receivable</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#FFF8E1', color: '#F57C00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#E65100' }}>
            {loading && !data ? '...' : formatINR(kpis.pendingCodValue)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            Active product orders awaiting delivery/collection
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '1.35rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>Physical Product Orders</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#E3F2FD', color: '#1565C0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-plum)' }}>
            {loading && !data ? '...' : Number(kpis.totalProductOrders || 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#1565C0', marginTop: '0.3rem', fontWeight: 500 }}>
            {Number(kpis.activeProductOrders || 0)} active &bull; Avg {formatINR(kpis.averageProductOrderValue)}
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '1.35rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>Course Enrollments</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--color-blush)', color: 'var(--color-berry)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-plum)' }}>
            {loading && !data ? '...' : Number(kpis.totalCoursePurchases || 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            {Number(kpis.totalCourseOrders || 0)} course orders &bull; {Number(kpis.publishedCourses || 0)}/{Number(kpis.totalCourses || 0)} live
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '1.35rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>Registered Customers</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#F3E5F5', color: '#7B1FA2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-plum)' }}>
            {loading && !data ? '...' : Number(kpis.totalCustomers || 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            {Number(kpis.totalActiveProducts || 0)} active shop products
          </div>
        </div>
      </div>

      {/* Low Stock Alert Strip */}
      {(Number(kpis.lowStockCount || 0) > 0 || Number(kpis.outOfStockCount || 0) > 0) && (
        <div style={{ backgroundColor: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 'var(--radius-md)', padding: '0.9rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#8D5800', fontSize: '0.88rem', fontWeight: 600 }}>
            <AlertTriangle size={18} />
            <span>
              Inventory Alert: {Number(kpis.outOfStockCount || 0)} out of stock, {Number(kpis.lowStockCount || 0)} low-stock items (&le;5 units)
            </span>
          </div>
          <Link to="/admin/products" className="btn btn-outline btn-sm" style={{ fontSize: '0.78rem' }}>
            Manage Inventory <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {/* Middle Row: Sales by Category + Best Selling Products + Low Stock Watch */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1.5rem' }}>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '1.5rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '1.05rem', color: 'var(--color-plum)', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} color="var(--color-berry)" /> Sales by Category
          </h2>
          {salesByCategory.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>No product category sales recorded in this range.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {salesByCategory.map((cat) => (
                <div key={cat.categoryName || cat.category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-cream)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--color-plum)' }}>{cat.categoryName || cat.category}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{Number(cat.unitsSold ?? cat.units ?? 0)} units sold</div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--color-berry)', fontSize: '0.92rem' }}>
                    {formatINR(cat.grossSales ?? cat.revenue)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '1.5rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '1.05rem', color: 'var(--color-plum)', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={18} color="var(--color-berry)" /> Best-Selling Bakery Products
          </h2>
          {bestSellingProducts.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>No physical product sales recorded yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {bestSellingProducts.map((p) => (
                <div key={p.productId || p.id || p.productName || p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-cream)' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--color-plum)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.productName || p.name}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{Number(p.unitsSold ?? p.units ?? 0)} units &bull; {p.categoryName || 'Shop'}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--color-plum)', fontSize: '0.9rem' }}>
                    {formatINR(p.grossSales ?? p.revenue)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '1.5rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '1.05rem', color: 'var(--color-plum)', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={18} color="#E65100" /> Low &amp; Out-of-Stock Watch
          </h2>
          {lowStockProducts.length === 0 ? (
            <p style={{ color: '#2E7D32', fontSize: '0.86rem', fontWeight: 500 }}>All active products have healthy stock levels.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {lowStockProducts.map((p) => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: Number(p.stock) === 0 ? '#FFEBEE' : '#FFF8E1' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--color-plum)' }}>{p.name}</div>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: Number(p.stock) === 0 ? '#C62828' : '#E65100' }}>
                    {Number(p.stock) === 0 ? 'OUT OF STOCK' : `${p.stock} left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Recent Physical Product Orders & Recent Course Requests + Students */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '1.5rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.08rem', color: 'var(--color-plum)', fontWeight: 600 }}>Recent Physical Product Orders</h2>
            <Link to="/admin/product-orders" style={{ fontSize: '0.8rem', color: 'var(--color-berry)', fontWeight: 600 }}>Product Orders &rarr;</Link>
          </div>
          {recentProductOrders.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No physical product orders placed yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentProductOrders.map((ord) => (
                <div key={ord.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-cream)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--color-plum)' }}>
                      {ord.order_number} &bull; {ord.customer_name || ord.user_name || 'Customer'}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Fulfillment: {ord.status || ord.fulfillment_status} &bull; {ord.cod_collected ? 'COD Collected' : 'COD Pending'}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-plum)' }}>
                    {formatINR(ord.total_amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '1.5rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.08rem', color: 'var(--color-plum)', fontWeight: 600 }}>Recent Course Orders &amp; Students</h2>
            <Link to="/admin/orders" style={{ fontSize: '0.8rem', color: 'var(--color-berry)', fontWeight: 600 }}>Course Queue &rarr;</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentCourseOrders.slice(0, 4).map((ord) => (
              <div key={ord.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-cream)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--color-plum)' }}>
                    {ord.order_number} &bull; {ord.customer_name || ord.user_name || 'Student'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Status: {ord.status}
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-berry)' }}>
                  {formatINR(ord.total_amount)}
                </div>
              </div>
            ))}
            {recentStudents.slice(0, 2).map((u) => (
              <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-subtle)' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-plum)', fontWeight: 600 }}>New Student: {u.name}</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{u.email}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
