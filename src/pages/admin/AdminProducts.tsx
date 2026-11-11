import React, { useState, useEffect } from 'react';
import { storageService } from '../../services/storage';
import { BakeryProduct, BakeryOrder, ProductTrackingStatus } from '../../types';
import {
  Cake,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  Truck,
  Package,
  Search,
  Filter,
  Eye,
  X,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

const TRACKING_STEPS: { status: ProductTrackingStatus; label: string; color: string; bg: string }[] = [
  { status: 'ORDER_RECEIVED', label: 'Order Received', color: '#B7791F', bg: '#FEFCBF' },
  { status: 'IN_KITCHEN', label: 'In Kitchen / Baking', color: '#9C4221', bg: '#FEEBC8' },
  { status: 'PACKED', label: 'Packed & Boxed', color: '#2B6CB0', bg: '#BEE3F8' },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', color: '#6B46C1', bg: '#E9D8FD' },
  { status: 'DELIVERED', label: 'Delivered', color: '#22543D', bg: '#C6F6D5' },
  { status: 'CANCELLED', label: 'Cancelled', color: '#742A2A', bg: '#FED7D7' }
];

export const AdminProducts: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('orders');
  const [products, setProducts] = useState<BakeryProduct[]>([]);
  const [orders, setOrders] = useState<BakeryOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Product Modal State
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<BakeryProduct | null>(null);
  const [formData, setFormData] = useState<Partial<BakeryProduct>>({
    name: '',
    category: 'Cakes',
    price: 799,
    originalPrice: 999,
    weight: '1 Kg',
    description: '',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
    isEggless: true,
    inStock: true,
    badge: 'Bestseller'
  });

  // Order Details Modal State
  const [selectedOrder, setSelectedOrder] = useState<BakeryOrder | null>(null);
  const [customStatusNote, setCustomStatusNote] = useState('');

  const loadData = () => {
    setProducts(storageService.getBakeryProducts());
    setOrders(storageService.getBakeryOrders());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Orders
  const filteredOrders = orders.filter(o => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerPhone.includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || o.trackingStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered Products
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenProductModal = (prod?: BakeryProduct) => {
    if (prod) {
      setEditingProduct(prod);
      setFormData(prod);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        category: 'Cakes',
        price: 799,
        originalPrice: 999,
        weight: '1 Kg',
        description: '',
        image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
        isEggless: true,
        inStock: true,
        badge: 'Fresh'
      });
    }
    setProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;

    storageService.saveBakeryProduct({
      ...(editingProduct ? { id: editingProduct.id } : {}),
      name: formData.name,
      category: formData.category as any,
      price: Number(formData.price),
      originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
      weight: formData.weight || '1 Kg',
      description: formData.description || '',
      image: formData.image || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
      isEggless: formData.isEggless ?? true,
      inStock: formData.inStock ?? true,
      badge: formData.badge
    });

    setProductModalOpen(false);
    loadData();
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm('Are you sure you want to delete this bakery product?')) {
      storageService.deleteBakeryProduct(id);
      loadData();
    }
  };

  const handleUpdateTrackingStatus = (orderId: string, status: ProductTrackingStatus) => {
    const note = customStatusNote.trim() || undefined;
    storageService.updateBakeryOrderStatus(orderId, status, note);
    setCustomStatusNote('');
    loadData();
    if (selectedOrder && selectedOrder.id === orderId) {
      const updated = storageService.getBakeryOrders().find(o => o.id === orderId);
      if (updated) setSelectedOrder(updated);
    }
  };

  const notifyCustomerWhatsApp = (order: BakeryOrder, newStatus: ProductTrackingStatus) => {
    const statusObj = TRACKING_STEPS.find(s => s.status === newStatus);
    const text =
      `Hello ${order.customerName}! 🎂\n` +
      `Your Cakexperiment order *#${order.orderNumber}* status has been updated to:\n` +
      `*${statusObj?.label.toUpperCase()}* ✅\n\n` +
      `📦 Item: ${order.items[0]?.productName} (${order.items[0]?.weight})\n` +
      `📅 Delivery: ${order.deliveryDate || 'As scheduled'}\n` +
      `📍 Address: ${order.deliveryAddress}\n\n` +
      `Thank you for ordering with Cakexperiment Studio!`;
    const url = `https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--color-plum)', margin: '0 0 0.3rem 0' }}>
            Bakery Products & Order Tracking
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
            Manage artisan bakery catalogue, live customer orders, kitchen preparation, and delivery tracking.
          </p>
        </div>

        {/* Action Button */}
        {activeTab === 'products' ? (
          <button
            type="button"
            onClick={() => handleOpenProductModal()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'var(--color-berry)',
              color: '#FFF',
              border: 'none',
              padding: '0.75rem 1.4rem',
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(169, 87, 104, 0.25)'
            }}
          >
            <Plus size={18} />
            <span>Add Bakery Product</span>
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Total Orders: <strong>{orders.length}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid #EEDCE0', marginBottom: '2rem' }}>
        <button
          type="button"
          onClick={() => {
            setActiveTab('orders');
            setSearchTerm('');
          }}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            background: 'none',
            fontFamily: 'inherit',
            fontWeight: 700,
            fontSize: '1rem',
            color: activeTab === 'orders' ? 'var(--color-berry)' : 'var(--color-plum)',
            borderBottom: activeTab === 'orders' ? '3px solid var(--color-berry)' : '3px solid transparent',
            marginBottom: '-2px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Truck size={18} />
          <span>Product Orders & Tracking ({orders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('products');
            setSearchTerm('');
          }}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            background: 'none',
            fontFamily: 'inherit',
            fontWeight: 700,
            fontSize: '1rem',
            color: activeTab === 'products' ? 'var(--color-berry)' : 'var(--color-plum)',
            borderBottom: activeTab === 'products' ? '3px solid var(--color-berry)' : '3px solid transparent',
            marginBottom: '-2px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Cake size={18} />
          <span>Catalogue & Products ({products.length})</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', minWidth: '280px', flex: 1, maxWidth: '420px' }}>
          <Search size={16} color="#8A7378" style={{ position: 'absolute', top: '12px', left: '12px' }} />
          <input
            type="text"
            placeholder={activeTab === 'orders' ? 'Search by Order #, Name, Phone...' : 'Search bakery products...'}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 0.75rem 0.65rem 2.4rem',
              borderRadius: '10px',
              border: '1px solid #D5C2C6',
              fontSize: '0.92rem',
              outline: 'none',
              backgroundColor: '#FFFFFF'
            }}
          />
        </div>

        {activeTab === 'orders' && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Filter size={16} color="var(--color-berry)" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                padding: '0.65rem 1rem',
                borderRadius: '10px',
                border: '1px solid #D5C2C6',
                backgroundColor: '#FFFFFF',
                fontSize: '0.9rem',
                color: 'var(--color-plum)',
                outline: 'none'
              }}
            >
              <option value="ALL">All Statuses</option>
              {TRACKING_STEPS.map(s => (
                <option key={s.status} value={s.status}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ================= TAB 1: ORDERS & TRACKING ================= */}
      {activeTab === 'orders' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(87, 51, 58, 0.04)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.92rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#FFF8F9', borderBottom: '1px solid #EEDCE0', color: 'var(--color-plum)' }}>
                  <th style={{ padding: '1rem' }}>Order #</th>
                  <th style={{ padding: '1rem' }}>Customer</th>
                  <th style={{ padding: '1rem' }}>Product / Items</th>
                  <th style={{ padding: '1rem' }}>Amount</th>
                  <th style={{ padding: '1rem' }}>Delivery Slot</th>
                  <th style={{ padding: '1rem' }}>Tracking Status</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#8A7378' }}>
                      No bakery orders found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => {
                    const statusObj = TRACKING_STEPS.find(s => s.status === order.trackingStatus) || TRACKING_STEPS[0];
                    return (
                      <tr key={order.id} style={{ borderBottom: '1px solid #F0D9DE' }}>
                        {/* Order # */}
                        <td style={{ padding: '1rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-berry)' }}>
                          {order.orderNumber}
                        </td>

                        {/* Customer */}
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 600, color: 'var(--color-plum)' }}>{order.customerName}</div>
                          <div style={{ fontSize: '0.8rem', color: '#7E696E' }}>{order.customerPhone}</div>
                        </td>

                        {/* Items */}
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <img
                              src={order.items[0]?.productImage}
                              alt=""
                              style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover' }}
                            />
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--color-plum)' }}>
                                {order.items[0]?.productName}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#7E696E' }}>
                                {order.items[0]?.weight} × {order.items[0]?.quantity}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Amount */}
                        <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--color-plum)' }}>
                          ₹{order.totalAmount.toLocaleString('en-IN')}
                        </td>

                        {/* Delivery */}
                        <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                          <div style={{ color: 'var(--color-plum)', fontWeight: 500 }}>{order.deliveryDate || 'Not specified'}</div>
                          <div style={{ color: '#8A7378', fontSize: '0.78rem' }} className="truncate" title={order.deliveryAddress}>
                            {order.deliveryAddress}
                          </div>
                        </td>

                        {/* Tracking Status */}
                        <td style={{ padding: '1rem' }}>
                          <select
                            value={order.trackingStatus}
                            onChange={e => handleUpdateTrackingStatus(order.id, e.target.value as ProductTrackingStatus)}
                            style={{
                              padding: '0.4rem 0.75rem',
                              borderRadius: '8px',
                              border: `1.5px solid ${statusObj.color}`,
                              backgroundColor: statusObj.bg,
                              color: statusObj.color,
                              fontWeight: 700,
                              fontSize: '0.84rem',
                              outline: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            {TRACKING_STEPS.map(s => (
                              <option key={s.status} value={s.status}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                            {/* WhatsApp notify */}
                            <button
                              type="button"
                              onClick={() => notifyCustomerWhatsApp(order, order.trackingStatus)}
                              title="Send Tracking Update via WhatsApp"
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                border: '1px solid #25D366',
                                backgroundColor: '#E8F9EE',
                                color: '#25D366',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              <MessageCircle size={16} />
                            </button>

                            {/* View details */}
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(order)}
                              title="View Order Details"
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                border: '1px solid #D5C2C6',
                                backgroundColor: '#FFFFFF',
                                color: 'var(--color-plum)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              <Eye size={16} />
                            </button>
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
      )}

      {/* ================= TAB 2: PRODUCTS CATALOGUE ================= */}
      {activeTab === 'products' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {filteredProducts.map(prod => (
            <div
              key={prod.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                border: '1.5px solid var(--border-subtle)',
                overflow: 'hidden',
                boxShadow: '0 4px 14px rgba(87, 51, 58, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ position: 'relative', aspectRatio: '16/10' }}>
                <img src={prod.image} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <span
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    backgroundColor: prod.inStock ? '#E8F9EE' : '#FDE8E8',
                    color: prod.inStock ? '#2E7D32' : '#C53030',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px'
                  }}
                >
                  {prod.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
                {prod.badge && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: 'var(--color-berry)',
                      color: '#FFF',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px'
                    }}
                  >
                    {prod.badge}
                  </span>
                )}
              </div>

              <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-berry)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    {prod.category} • {prod.weight}
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--color-plum)', margin: '0 0 0.4rem 0' }}>
                    {prod.name}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#6F5B60', lineHeight: 1.5, marginBottom: '1rem' }}>
                    {prod.description}
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1rem' }}>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', fontWeight: 700, color: 'var(--color-berry)' }}>
                      ₹{prod.price.toLocaleString('en-IN')}
                    </span>
                    {prod.originalPrice && (
                      <span style={{ fontSize: '0.85rem', color: '#9B8388', textDecoration: 'line-through' }}>
                        ₹{prod.originalPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenProductModal(prod)}
                      style={{
                        flex: 1,
                        padding: '0.6rem',
                        borderRadius: '10px',
                        border: '1px solid #D5C2C6',
                        backgroundColor: '#FFF',
                        color: 'var(--color-plum)',
                        fontWeight: 600,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <Edit2 size={14} /> Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(prod.id)}
                      style={{
                        padding: '0.6rem',
                        borderRadius: '10px',
                        border: '1px solid #F0D9DE',
                        backgroundColor: '#FFF5F7',
                        color: '#D9383A',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= PRODUCT ADD/EDIT MODAL ================= */}
      {productModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(57, 28, 35, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={() => setProductModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', color: 'var(--color-plum)', margin: 0 }}>
                {editingProduct ? 'Edit Bakery Product' : 'Add New Bakery Product'}
              </h3>
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#8A7378', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-plum)', marginBottom: '0.3rem' }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Belgian Dark Chocolate Truffle Cake"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: '1px solid #D5C2C6', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-plum)', marginBottom: '0.3rem' }}>
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: '1px solid #D5C2C6', backgroundColor: '#FFF', outline: 'none' }}
                  >
                    <option value="Cakes">Cakes</option>
                    <option value="Cupcakes">Cupcakes</option>
                    <option value="Pastries">Pastries</option>
                    <option value="Brownies">Brownies</option>
                    <option value="Cheesecakes">Cheesecakes</option>
                    <option value="Tarts">Tarts</option>
                    <option value="Desserts">Desserts</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-plum)', marginBottom: '0.3rem' }}>
                    Weight / Size
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1 Kg or Box of 6"
                    value={formData.weight || ''}
                    onChange={e => setFormData({ ...formData, weight: e.target.value })}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: '1px solid #D5C2C6', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-plum)', marginBottom: '0.3rem' }}>
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.price || ''}
                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: '1px solid #D5C2C6', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-plum)', marginBottom: '0.3rem' }}>
                    Original Price (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.originalPrice || ''}
                    onChange={e => setFormData({ ...formData, originalPrice: e.target.value ? Number(e.target.value) : undefined })}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: '1px solid #D5C2C6', outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-plum)', marginBottom: '0.3rem' }}>
                  Image URL
                </label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.image || ''}
                  onChange={e => setFormData({ ...formData, image: e.target.value })}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: '1px solid #D5C2C6', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-plum)', marginBottom: '0.3rem' }}>
                  Badge Tag (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bestseller / Chef Special / Fresh"
                  value={formData.badge || ''}
                  onChange={e => setFormData({ ...formData, badge: e.target.value })}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: '1px solid #D5C2C6', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-plum)', marginBottom: '0.3rem' }}>
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: '1px solid #D5C2C6', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.isEggless ?? true}
                    onChange={e => setFormData({ ...formData, isEggless: e.target.checked })}
                    style={{ accentColor: 'var(--color-berry)' }}
                  />
                  <span>100% Eggless</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.inStock ?? true}
                    onChange={e => setFormData({ ...formData, inStock: e.target.checked })}
                    style={{ accentColor: 'var(--color-berry)' }}
                  />
                  <span>In Stock</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: '1px solid #D5C2C6',
                    backgroundColor: '#FFF',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: 'var(--color-berry)',
                    color: '#FFF',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ORDER DETAILS MODAL ================= */}
      {selectedOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(57, 28, 35, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-berry)' }}>
                  Bakery Order Details
                </span>
                <h3 style={{ fontFamily: 'monospace', fontSize: '1.4rem', color: 'var(--color-plum)', margin: '0.1rem 0 0 0' }}>
                  {selectedOrder.orderNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'none', border: 'none', color: '#8A7378', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Customer Info */}
            <div style={{ backgroundColor: '#FFF8F9', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              <div><strong>Customer:</strong> {selectedOrder.customerName}</div>
              <div><strong>WhatsApp Phone:</strong> {selectedOrder.customerPhone}</div>
              <div><strong>Address:</strong> {selectedOrder.deliveryAddress}</div>
              <div><strong>Slot:</strong> {selectedOrder.deliveryDate || 'Not specified'}</div>
              {selectedOrder.messageOnCake && (
                <div style={{ color: 'var(--color-berry)', marginTop: '0.3rem' }}>
                  <strong>Message on Cake:</strong> "{selectedOrder.messageOnCake}"
                </div>
              )}
            </div>

            {/* Update Tracking Stepper */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-plum)', marginBottom: '0.5rem' }}>
                Update Kitchen & Delivery Status:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
                {TRACKING_STEPS.map(s => {
                  const isCurrent = selectedOrder.trackingStatus === s.status;
                  return (
                    <button
                      key={s.status}
                      type="button"
                      onClick={() => handleUpdateTrackingStatus(selectedOrder.id, s.status)}
                      style={{
                        padding: '0.55rem 0.5rem',
                        borderRadius: '8px',
                        border: isCurrent ? `2px solid ${s.color}` : '1px solid #D5C2C6',
                        backgroundColor: isCurrent ? s.bg : '#FFFFFF',
                        color: isCurrent ? s.color : 'var(--color-plum)',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        cursor: 'pointer'
                      }}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>

              {/* Status Note */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Optional kitchen note (e.g., Sponge baked, out with delivery partner)"
                  value={customStatusNote}
                  onChange={e => setCustomStatusNote(e.target.value)}
                  style={{ flex: 1, padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #D5C2C6', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* Status History */}
            {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: '#8A7378', marginBottom: '0.5rem' }}>
                  Live Status Log
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.84rem' }}>
                  {selectedOrder.statusHistory.map((h, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--color-plum)' }}>
                      <CheckCircle size={14} color="#25D366" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <strong>{h.status.replace(/_/g, ' ')}</strong> - {h.note || ''}
                        <div style={{ fontSize: '0.72rem', color: '#9B8388' }}>
                          {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WhatsApp notification action */}
            <button
              type="button"
              onClick={() => notifyCustomerWhatsApp(selectedOrder, selectedOrder.trackingStatus)}
              style={{
                width: '100%',
                padding: '0.85rem',
                borderRadius: '12px',
                backgroundColor: '#25D366',
                color: '#FFF',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <MessageCircle size={18} />
              <span>Send Live Status Update on WhatsApp</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

