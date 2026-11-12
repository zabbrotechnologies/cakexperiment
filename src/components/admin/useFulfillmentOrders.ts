import { useState, useEffect, useCallback } from 'react';
import { ecommerceApi } from '../../services/ecommerceApi';
import type { ProductOrder, ProductOrderStatus } from '../../types';

export const ORDER_STATUS_FILTER_OPTIONS = [
  'all',
  'pending',
  'placed',
  'confirmed',
  'crafting',
  'dispatched',
  'delivered',
  'cancelled'
];

export function useFulfillmentOrders(mode: 'PRODUCT' | 'HAMPER') {
  const [orders, setOrders] = useState<ProductOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<ProductOrder | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ecommerceApi.adminGetProductAndHamperOrders(statusFilter, search);
      setOrders(mode === 'HAMPER' ? data.hamperOrders || [] : data.orders || []);
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to load orders.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [mode, statusFilter, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleUpdateStatus = async (orderId: string, nextStatus: ProductOrderStatus) => {
    setIsProcessingAction(true);
    setActionErrorMsg(null);
    try {
      const updated = await ecommerceApi.adminUpdateProductOrderStatus(
        orderId,
        nextStatus,
        statusNote.trim() || undefined
      );
      setStatusNote('');
      const label = updated.orderType === 'HAMPER' ? 'Gift Hamper order' : 'Product order';
      setActionSuccessMsg(`${label} #${updated.orderNumber} updated to ${nextStatus.toUpperCase()}.`);
      await fetchOrders();
      if (selectedOrder?.id === updated.id) setSelectedOrder(updated);
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to update order status.');
    } finally {
      setIsProcessingAction(false);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    }
  };

  const handleCollectPayment = async (ord: ProductOrder) => {
    setIsProcessingAction(true);
    setActionErrorMsg(null);
    try {
      const updated = await ecommerceApi.adminCollectCodPayment(ord.id);
      setActionSuccessMsg(
        ord.orderType === 'HAMPER'
          ? `Recorded Gift Hamper payment for #${updated.orderNumber}.`
          : `Recorded COD payment collection for #${updated.orderNumber}.`
      );
      await fetchOrders();
      if (selectedOrder?.id === updated.id) setSelectedOrder(updated);
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to record payment.');
    } finally {
      setIsProcessingAction(false);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    }
  };

  const handleContactCustomer = (ord: ProductOrder) => {
    const phone = ord.customerPhone.replace(/[^0-9]/g, '');
    const waPhone = phone.length === 10 ? `91${phone}` : phone;
    const orderKind = ord.orderType === 'HAMPER' ? 'Gift Hamper Order' : 'Product Order';
    const text = encodeURIComponent(
      `Hello ${ord.customerName}! This is Cakexperiment Studio regarding your ${orderKind} #${ord.orderNumber} (Total: ₹${ord.totalAmount}, Status: ${ord.status.toUpperCase()}).`
    );
    const targetUrl = waPhone ? `https://wa.me/${waPhone}?text=${text}` : `https://wa.me/918248957918?text=${text}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return {
    orders,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    selectedOrder,
    setSelectedOrder,
    statusNote,
    setStatusNote,
    isProcessingAction,
    actionSuccessMsg,
    actionErrorMsg,
    handleUpdateStatus,
    handleCollectPayment,
    handleContactCustomer
  };
}

