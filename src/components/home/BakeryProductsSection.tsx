import React, { useState, useEffect } from 'react';
import { storageService } from '../../services/storage';
import { BakeryProduct, BakeryOrder } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { STUDIO_WHATSAPP_NUMBER } from '../../data/giftHampers';
import {
  Cake,
  Sparkles,
  ShoppingBag,
  Check,
  Star,
  Clock,
  MapPin,
  User,
  Phone,
  Calendar,
  X,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Truck,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const BakeryProductsSection: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<BakeryProduct[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Modal / Ordering State
  const [selectedProduct, setSelectedProduct] = useState<BakeryProduct | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedWeight, setSelectedWeight] = useState<string>('1 Kg');
  const [messageOnCake, setMessageOnCake] = useState<string>('');
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'WHATSAPP_UPI' | 'COD'>('WHATSAPP_UPI');

  // Order Confirmation State
  const [confirmedOrder, setConfirmedOrder] = useState<BakeryOrder | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const refreshProducts = () => {
    const list = storageService.getBakeryProducts();
    setProducts(list);
  };

  useEffect(() => {
    refreshProducts();
    // Pre-fill user name if logged in
    if (user?.name && !customerName) {
      setCustomerName(user.name);
    }
  }, [user]);

  const categories = ['All', 'Cakes', 'Cupcakes', 'Pastries', 'Brownies', 'Cheesecakes'];

  const filteredProducts =
    activeCategory === 'All'
      ? products
      : products.filter(p => p.category.toLowerCase() === activeCategory.toLowerCase());

  const openOrderModal = (product: BakeryProduct) => {
    setSelectedProduct(product);
    setQuantity(1);
    setSelectedWeight(product.weight || '1 Kg');
    setMessageOnCake('');
    setDeliveryDate('');
    setSpecialInstructions('');
    setErrors({});
  };

  const closeOrderModal = () => {
    setSelectedProduct(null);
    setConfirmedOrder(null);
  };

  const calculateTotal = () => {
    if (!selectedProduct) return 0;
    let unit = selectedProduct.price;
    if (selectedWeight === '500g') unit = Math.round(selectedProduct.price * 0.6);
    if (selectedWeight === '2 Kg') unit = selectedProduct.price * 1.9;
    return unit * quantity;
  };

  const handlePlaceOrder = () => {
    const errs: { [key: string]: string } = {};
    if (!customerName.trim()) errs.customerName = 'Please enter your name.';
    if (!customerPhone.trim()) {
      errs.customerPhone = 'Please enter your phone number.';
    } else if (customerPhone.replace(/[^0-9]/g, '').length < 10) {
      errs.customerPhone = 'Please enter a valid 10-digit number.';
    }
    if (!deliveryAddress.trim()) errs.deliveryAddress = 'Please enter delivery address.';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (!selectedProduct) return;

    const total = calculateTotal();
    const createdOrder = storageService.createBakeryOrder({
      userId: user?.id,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: user?.email,
      deliveryAddress: deliveryAddress.trim(),
      deliveryDate: deliveryDate || 'Earliest Kitchen Slot',
      messageOnCake: messageOnCake.trim(),
      specialInstructions: specialInstructions.trim(),
      items: [
        {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          productImage: selectedProduct.image,
          price: selectedProduct.price,
          quantity,
          weight: selectedWeight,
          isEggless: selectedProduct.isEggless
        }
      ],
      totalAmount: total,
      paymentMethod,
      paymentStatus: 'PENDING'
    });

    // Build WhatsApp message
    const waText =
      `🎂 *NEW BAKERY ORDER — CAKEXPERIMENT*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔖 *Order Number:* ${createdOrder.orderNumber}\n` +
      `🍰 *Item:* ${selectedProduct.name} (${selectedWeight})\n` +
      `📦 *Quantity:* ${quantity}\n` +
      `💰 *Total Amount:* ₹${total.toLocaleString('en-IN')}\n` +
      `💳 *Payment Method:* ${paymentMethod === 'WHATSAPP_UPI' ? 'WhatsApp UPI' : 'Cash on Delivery'}\n\n` +
      (messageOnCake.trim() ? `✨ *Message on Cake:* "${messageOnCake.trim()}"\n\n` : '') +
      `📍 *DELIVERY DETAILS:*\n` +
      `👤 *Customer:* ${customerName.trim()}\n` +
      `📱 *Phone:* ${customerPhone.trim()}\n` +
      `📅 *Date:* ${deliveryDate || 'Earliest available'}\n` +
      `🏠 *Address:* ${deliveryAddress.trim()}\n` +
      (specialInstructions.trim() ? `📝 *Notes:* ${specialInstructions.trim()}\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `_Hello Chef Anisha! I have placed an order for this fresh bake on your website. Please confirm kitchen slot and payment!_`;

    const encoded = encodeURIComponent(waText);
    const waUrl = `https://wa.me/${STUDIO_WHATSAPP_NUMBER}?text=${encoded}`;
    createdOrder.whatsappUrl = waUrl;

    // Save updated order with waUrl
    storageService.updateBakeryOrderStatus(createdOrder.id, 'ORDER_RECEIVED');
    setConfirmedOrder(createdOrder);

    // Open WhatsApp
    window.open(waUrl, '_blank');
  };

  return (
    <section
      id="products"
      style={{
        padding: '6.5rem 0 5.5rem 0',
        backgroundColor: '#FFFFFF',
        scrollMarginTop: '6rem',
        position: 'relative'
      }}
    >
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 3rem auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--color-berry)',
              backgroundColor: 'var(--color-berry-light)',
              padding: '0.4rem 1.1rem',
              borderRadius: '999px',
              marginBottom: '1rem'
            }}
          >
            <Cake size={14} /> Fresh Bakery & Designer Products
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2.1rem, 3.8vw, 3.1rem)',
              color: 'var(--color-plum)',
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: '1rem'
            }}
          >
            Handcrafted Cakes, Pastries & Gourmet Treats
          </h2>

          <p
            style={{
              fontSize: '1.05rem',
              color: '#6F5B60',
              lineHeight: 1.7,
              maxWidth: '680px',
              margin: '0 auto'
            }}
          >
            Order freshly baked designer cakes and artisanal desserts prepared by Chef Anisha using pure butter, single-origin cocoa, and premium ingredients. Track your order status in real time!
          </p>
        </div>

        {/* Category Filter Pills */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0.65rem',
            marginBottom: '3rem'
          }}
        >
          {categories.map(cat => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '0.55rem 1.3rem',
                  borderRadius: '999px',
                  border: isActive ? '1.5px solid var(--color-berry)' : '1px solid #EEDCE0',
                  backgroundColor: isActive ? 'var(--color-berry)' : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : 'var(--color-plum)',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 4px 14px rgba(169, 87, 104, 0.25)' : 'none'
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Products Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '2rem',
            marginBottom: '4rem'
          }}
        >
          {filteredProducts.map(product => (
            <div
              key={product.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                border: '1.5px solid var(--color-rose-subtle)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 8px 30px rgba(87, 51, 58, 0.05)',
                transition: 'all 0.3s ease',
                position: 'relative'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 16px 40px rgba(87, 51, 58, 0.12)';
                e.currentTarget.style.borderColor = 'var(--color-rose)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(87, 51, 58, 0.05)';
                e.currentTarget.style.borderColor = 'var(--color-rose-subtle)';
              }}
            >
              {/* Image & Top Badges */}
              <div style={{ position: 'relative', aspectRatio: '16/11', overflow: 'hidden' }}>
                <img
                  src={product.image}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                />

                {/* Eggless / Chef Badge */}
                <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {product.isEggless && (
                    <span
                      style={{
                        backgroundColor: '#FFFFFF',
                        color: '#2E7D32',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    >
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#2E7D32' }} />
                      100% Eggless
                    </span>
                  )}
                  {product.badge && (
                    <span
                      style={{
                        backgroundColor: 'var(--color-berry)',
                        color: '#FFFFFF',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase'
                      }}
                    >
                      {product.badge}
                    </span>
                  )}
                </div>

                {/* Weight Tag */}
                {product.weight && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      right: '12px',
                      backgroundColor: 'rgba(30, 12, 16, 0.85)',
                      color: '#FFF',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      backdropFilter: 'blur(4px)'
                    }}
                  >
                    {product.weight}
                  </span>
                )}
              </div>

              {/* Product Info */}
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-berry)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {product.category}
                    </span>
                    {product.rating && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.82rem', fontWeight: 600, color: '#D4AF37' }}>
                        <Star size={13} fill="#D4AF37" /> {product.rating.toFixed(1)}
                      </span>
                    )}
                  </div>

                  <h3
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: 'var(--color-plum)',
                      margin: '0 0 0.5rem 0',
                      lineHeight: 1.3
                    }}
                  >
                    {product.name}
                  </h3>

                  <p style={{ fontSize: '0.88rem', color: '#6F5B60', lineHeight: 1.55, marginBottom: '1.25rem' }}>
                    {product.description}
                  </p>
                </div>

                <div>
                  {/* Price Row */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginBottom: '1.1rem' }}>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-berry)' }}>
                      ₹{product.price.toLocaleString('en-IN')}
                    </span>
                    {product.originalPrice && (
                      <span style={{ fontSize: '0.9rem', color: '#9B8388', textDecoration: 'line-through' }}>
                        ₹{product.originalPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  {/* Order Button */}
                  <button
                    type="button"
                    onClick={() => openOrderModal(product)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.85rem 1.25rem',
                      borderRadius: '12px',
                      backgroundColor: 'var(--color-plum)',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      boxShadow: '0 4px 15px rgba(87, 51, 58, 0.15)'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = 'var(--color-berry)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = 'var(--color-plum)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <ShoppingBag size={17} />
                    <span>Order Now</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Live Order Tracking Banner for logged in users */}
        <div
          style={{
            backgroundColor: 'var(--color-cream)',
            borderRadius: '24px',
            border: '1.5px solid var(--color-rose-subtle)',
            padding: '2rem 2.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
            boxShadow: '0 8px 30px rgba(87, 51, 58, 0.05)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '16px',
                backgroundColor: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-berry)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                flexShrink: 0
              }}
            >
              <Truck size={28} />
            </div>
            <div>
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--color-plum)', margin: '0 0 0.2rem 0' }}>
                Track Your Bakery Order in Real Time
              </h4>
              <p style={{ fontSize: '0.9rem', color: '#6F5B60', margin: 0 }}>
                View your ordered cakes, kitchen preparation progress, and doorstep delivery status right in your account.
              </p>
            </div>
          </div>

          <Link
            to="/my-purchases"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'var(--color-berry)',
              color: '#FFFFFF',
              padding: '0.85rem 1.6rem',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.95rem',
              textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(169, 87, 104, 0.25)',
              transition: 'all 0.2s ease'
            }}
          >
            <span>View My Orders & Tracking</span>
            <ArrowRight size={17} />
          </Link>
        </div>
      </div>

      {/* ================= ORDER MODAL ================= */}
      {selectedProduct && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(57, 28, 35, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={closeOrderModal}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '2rem',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={closeOrderModal}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                color: '#8A7378',
                cursor: 'pointer'
              }}
            >
              <X size={22} />
            </button>

            {!confirmedOrder ? (
              <>
                {/* Product Header */}
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    style={{ width: '80px', height: '80px', borderRadius: '14px', objectFit: 'cover' }}
                  />
                  <div>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-berry)', letterSpacing: '0.06em' }}>
                      {selectedProduct.category}
                    </span>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--color-plum)', margin: '0.1rem 0 0.3rem 0' }}>
                      {selectedProduct.name}
                    </h3>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-berry)' }}>
                      ₹{calculateTotal().toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                  {/* Weight Selector */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                      Weight / Size:
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {['500g', '1 Kg', '2 Kg'].map(w => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setSelectedWeight(w)}
                          style={{
                            flex: 1,
                            padding: '0.55rem',
                            borderRadius: '10px',
                            border: selectedWeight === w ? '1.5px solid var(--color-berry)' : '1px solid #D5C2C6',
                            backgroundColor: selectedWeight === w ? '#FFF5F7' : '#FFFFFF',
                            color: selectedWeight === w ? 'var(--color-berry)' : 'var(--color-plum)',
                            fontWeight: 600,
                            fontSize: '0.88rem',
                            cursor: 'pointer'
                          }}
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                      Quantity:
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <button
                        type="button"
                        onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                        style={{ width: '38px', height: '38px', borderRadius: '10px', border: '1px solid #D5C2C6', backgroundColor: '#FFF', fontSize: '1.1rem', cursor: 'pointer' }}
                      >
                        -
                      </button>
                      <div style={{ width: '60px', height: '38px', borderRadius: '10px', border: '1px solid #D5C2C6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem' }}>
                        {quantity}
                      </div>
                      <button
                        type="button"
                        onClick={() => setQuantity(prev => prev + 1)}
                        style={{ width: '38px', height: '38px', borderRadius: '10px', border: '1px solid #D5C2C6', backgroundColor: '#FFF', fontSize: '1.1rem', cursor: 'pointer' }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Message on Cake */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                      Message on Cake / Piping (Optional):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Happy Birthday Ananya 🎂"
                      value={messageOnCake}
                      onChange={e => setMessageOnCake(e.target.value)}
                      style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '10px', border: '1px solid #D5C2C6', fontSize: '0.92rem', outline: 'none' }}
                    />
                  </div>

                  {/* Customer Name & Phone */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                        Your Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Karthik"
                        value={customerName}
                        onChange={e => {
                          setCustomerName(e.target.value);
                          if (errors.customerName) setErrors(prev => ({ ...prev, customerName: '' }));
                        }}
                        style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '10px', border: errors.customerName ? '1.5px solid #D9383A' : '1px solid #D5C2C6', fontSize: '0.92rem', outline: 'none' }}
                      />
                      {errors.customerName && <span style={{ fontSize: '0.75rem', color: '#D9383A' }}>{errors.customerName}</span>}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                        WhatsApp Number *
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. 9876543210"
                        value={customerPhone}
                        onChange={e => {
                          setCustomerPhone(e.target.value);
                          if (errors.customerPhone) setErrors(prev => ({ ...prev, customerPhone: '' }));
                        }}
                        style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '10px', border: errors.customerPhone ? '1.5px solid #D9383A' : '1px solid #D5C2C6', fontSize: '0.92rem', outline: 'none' }}
                      />
                      {errors.customerPhone && <span style={{ fontSize: '0.75rem', color: '#D9383A' }}>{errors.customerPhone}</span>}
                    </div>
                  </div>

                  {/* Delivery Date */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                      Preferred Delivery Date / Pickup Slot:
                    </label>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={e => setDeliveryDate(e.target.value)}
                      style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '10px', border: '1px solid #D5C2C6', fontSize: '0.92rem', outline: 'none', color: 'var(--color-plum)' }}
                    />
                  </div>

                  {/* Delivery Address */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                      Delivery Address & City *
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Enter street address, landmark, city and pincode"
                      value={deliveryAddress}
                      onChange={e => {
                        setDeliveryAddress(e.target.value);
                        if (errors.deliveryAddress) setErrors(prev => ({ ...prev, deliveryAddress: '' }));
                      }}
                      style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '10px', border: errors.deliveryAddress ? '1.5px solid #D9383A' : '1px solid #D5C2C6', fontSize: '0.92rem', outline: 'none', fontFamily: 'inherit' }}
                    />
                    {errors.deliveryAddress && <span style={{ fontSize: '0.75rem', color: '#D9383A' }}>{errors.deliveryAddress}</span>}
                  </div>

                  {/* Payment Choice */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-plum)', marginBottom: '0.4rem' }}>
                      Payment Preference:
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.65rem 0.8rem',
                          borderRadius: '10px',
                          border: paymentMethod === 'WHATSAPP_UPI' ? '1.5px solid var(--color-berry)' : '1px solid #D5C2C6',
                          backgroundColor: paymentMethod === 'WHATSAPP_UPI' ? '#FFF5F7' : '#FFFFFF',
                          cursor: 'pointer',
                          fontSize: '0.88rem',
                          fontWeight: 600
                        }}
                      >
                        <input
                          type="radio"
                          name="payOpt"
                          checked={paymentMethod === 'WHATSAPP_UPI'}
                          onChange={() => setPaymentMethod('WHATSAPP_UPI')}
                          style={{ accentColor: 'var(--color-berry)' }}
                        />
                        <span>WhatsApp UPI</span>
                      </label>

                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.65rem 0.8rem',
                          borderRadius: '10px',
                          border: paymentMethod === 'COD' ? '1.5px solid var(--color-berry)' : '1px solid #D5C2C6',
                          backgroundColor: paymentMethod === 'COD' ? '#FFF5F7' : '#FFFFFF',
                          cursor: 'pointer',
                          fontSize: '0.88rem',
                          fontWeight: 600
                        }}
                      >
                        <input
                          type="radio"
                          name="payOpt"
                          checked={paymentMethod === 'COD'}
                          onChange={() => setPaymentMethod('COD')}
                          style={{ accentColor: 'var(--color-berry)' }}
                        />
                        <span>Cash on Delivery</span>
                      </label>
                    </div>
                  </div>

                  {/* CTA Submit Button */}
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      borderRadius: '14px',
                      backgroundColor: '#25D366',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '1.02rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.6rem',
                      boxShadow: '0 6px 20px rgba(37, 211, 102, 0.35)',
                      marginTop: '0.5rem'
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.96.523 1.761.8 2.796.8 3.181 0 5.768-2.587 5.768-5.766.001-3.182-2.585-5.786-5.768-5.786zm0 10.359c-.89 0-1.636-.244-2.434-.693l-.427-.24-1.579.414.421-1.54-.271-.433c-.512-.816-.782-1.488-.781-2.541.001-2.529 2.059-4.587 4.589-4.587 2.531 0 4.59 2.058 4.59 4.588-.001 2.53-2.058 4.589-4.589 4.589zm3.018-3.447c-.166-.083-.981-.484-1.133-.539-.152-.055-.262-.083-.373.083-.11.166-.428.539-.525.65-.097.11-.193.125-.359.042-.166-.083-.701-.258-1.335-.824-.493-.44-.826-.984-.923-1.15-.097-.166-.01-.256.073-.338.075-.074.166-.193.249-.29.083-.097.11-.166.166-.276.055-.11.028-.207-.014-.29-.042-.083-.373-.898-.511-1.23-.135-.323-.272-.279-.373-.284-.097-.005-.207-.006-.318-.006s-.29.041-.442.207c-.152.166-.58.567-.58 1.383 0 .816.594 1.605.677 1.715.083.11 1.169 1.785 2.832 2.502.396.171.705.273.946.35.398.126.76.108 1.047.065.32-.048.981-.401 1.119-.788.138-.387.138-.719.097-.788-.041-.07-.152-.11-.318-.193z" />
                    </svg>
                    <span>Place Order & Continue to WhatsApp</span>
                  </button>
                </div>
              </>
            ) : (
              /* Order Confirmation & Tracking Card */
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: '#E8F9EE',
                    color: '#25D366',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.25rem auto'
                  }}
                >
                  <CheckCircle2 size={36} />
                </div>

                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: 'var(--color-plum)', margin: '0 0 0.5rem 0' }}>
                  Order Placed Successfully!
                </h3>

                <p style={{ fontSize: '0.95rem', color: '#6F5B60', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                  Your bakery order has been registered in Chef Anisha’s kitchen queue. You can track preparation status live in your account!
                </p>

                <div
                  style={{
                    backgroundColor: '#FFF8F9',
                    borderRadius: '16px',
                    border: '1px solid #F0D9DE',
                    padding: '1.25rem',
                    textAlign: 'left',
                    marginBottom: '1.5rem',
                    fontSize: '0.9rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#8A7378' }}>Tracking Number:</span>
                    <strong style={{ color: 'var(--color-berry)', fontFamily: 'monospace', fontSize: '1rem' }}>
                      {confirmedOrder.orderNumber}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#8A7378' }}>Item:</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-plum)' }}>
                      {confirmedOrder.items[0]?.productName} ({confirmedOrder.items[0]?.weight})
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#8A7378' }}>Total Amount:</span>
                    <strong style={{ color: 'var(--color-plum)' }}>
                      ₹{confirmedOrder.totalAmount.toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8A7378' }}>Status:</span>
                    <span style={{ backgroundColor: '#FFF3CD', color: '#856404', padding: '0.15rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>
                      🟡 Order Received
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <a
                    href={confirmedOrder.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.95rem',
                      borderRadius: '12px',
                      backgroundColor: '#25D366',
                      color: '#FFF',
                      fontWeight: 700,
                      textDecoration: 'none'
                    }}
                  >
                    <ExternalLink size={17} /> Open WhatsApp Chat
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      closeOrderModal();
                      navigate('/my-purchases');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.9rem',
                      borderRadius: '12px',
                      backgroundColor: 'var(--color-plum)',
                      color: '#FFF',
                      border: 'none',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Truck size={17} /> Track Order in My Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

