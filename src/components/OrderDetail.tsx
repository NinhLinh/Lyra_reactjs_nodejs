import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiTrash } from 'react-icons/fi';

interface ProductRef {
  _id: string;
  name: string;
  price: number;
  image?: string;
}

interface OrderItem {
  product: ProductRef;
  quantity: number;
}

interface Order {
  _id: string;
  products: OrderItem[];
  subtotal?: number;
  discount?: number;
  couponCode?: string;
  shippingName?: string;
  shippingPhone?: string;
  shippingAddress?: string;
  paymentMethod?: string;
  total: number;
  status: string;
  paymentStatus: string;
  note?: string;
  createdAt: string;
}

const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();
const getOrderQuantity = (order: Order) => order.products.reduce((sum, item) => sum + item.quantity, 0);

const statusSteps = ['ordered', 'processing', 'shipped', 'delivered'];
const statusLabel: Record<string, string> = {
  ordered: 'Ordered',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  pending: 'Processing',
  completed: 'Delivered',
};
const getCurrentStep = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized === 'pending') return 1;
  if (normalized === 'completed') return 3;
  const idx = statusSteps.indexOf(normalized);
  return idx >= 0 ? idx : 0;
};

const OrderDetail: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrder(res.data);
      setItems(res.data.products);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to load order.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchOrder();
  }, [id, user]);

  const updateLine = (productId: string, quantity: number) => {
    setItems(prev => prev.flatMap(item => {
      if (item.product._id !== productId) return item;
      if (quantity <= 0) return [];
      return { ...item, quantity };
    }));
  };

  const handleSave = async () => {
    if (!order || !id) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        products: items.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
        })),
        couponCode: order.couponCode,
      };
      const res = await axios.put(`http://localhost:5000/api/orders/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrder(res.data);
      setItems(res.data.products);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to update order.');
    } finally {
      setSaving(false);
    }
  };

  const handlePay = async () => {
    if (!order || !id) return;
    setPaying(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`http://localhost:5000/api/orders/${id}/pay`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrder(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to complete payment.');
    } finally {
      setPaying(false);
    }
  };

  const orderTotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto mt-[80px] lg:mt-[100px] px-4">
        <div className="bg-white p-8 rounded shadow">
          <h2 className="text-2xl font-bold mb-4">Order detail</h2>
          <p className="mb-4">Please login to view your order.</p>
          <Link to="/auth" className="bg-blue-500 text-white px-4 py-2 rounded">Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-[80px] px-4 py-10">
      <div className="mb-6">
        <div className="flex gap-4 items-center justify-between">
          <h2 className="text-2xl font-bold">Order detail</h2>
          <Link
            to="/orders"
            className="inline-block rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-black hover:text-white"
          >
            Back to history
          </Link>
        </div>
        <p className="text-sm text-slate-500 mt-2 md:mt-0">Review your order, update quantities and complete payment.</p>
      </div>

      {loading ? (
        <div className="rounded-3xl bg-white p-8 shadow-sm">Loading order...</div>
      ) : error ? (
        <div className="rounded-3xl bg-white p-8 shadow-sm text-red-500">{error}</div>
      ) : !order ? (
        <div className="rounded-3xl bg-white p-8 shadow-sm">Order not found.</div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-[32px] border border-sky-200 bg-sky-50 p-5">
            <div className="flex gap-4 sm:flex-row items-center justify-between">
              <p className="text-sm text-slate-500">ID: {order._id}</p>
              <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm">
                {order.paymentStatus.toUpperCase()}
              </span>
            </div>
            <div className="mt-6 relative">
              <div className="absolute inset-x-0 top-1/2 h-[2px] bg-slate-200" />
              <div className="grid grid-cols-4 gap-4 relative">
                {statusSteps.map((step, index) => {
                  const currentStep = getCurrentStep(order.status);
                  const active = index <= currentStep;
                  return (
                    <div key={step} className="flex flex-col items-center gap-2">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${active ? 'bg-emerald-600 text-white' : 'bg-white text-slate-400 ring-1 ring-slate-200'}`}>
                        {index + 1}
                      </div>
                      <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500 text-center">
                        {statusLabel[step] || step}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[32px] border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Shipping Details</h3>
              <div className="space-y-3 text-sm text-slate-600">
                <p><span className="font-medium text-slate-800">Recipient:</span> {order.shippingName || 'N/A'}</p>
                <p><span className="font-medium text-slate-800">Phone:</span> {order.shippingPhone || 'N/A'}</p>
                <p><span className="font-medium text-slate-800">Address:</span> {order.shippingAddress || 'N/A'}</p>
                <p><span className="font-medium text-slate-800">Delivery Note:</span> {order.note || 'No note'}</p>
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Payment Information</h3>
              <div className="space-y-3 text-sm text-slate-600">
                <p><span className="font-medium text-slate-800">Method:</span> {order.paymentMethod || 'Bank Transfer'}</p>
                <p>
                  <span className="font-medium text-slate-800">Status:</span>{' '}
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                    {order.paymentStatus}
                  </span>
                </p>
                <p><span className="font-medium text-slate-800">Date:</span> {formatDate(order.createdAt)}</p>
                <p className="text-sm text-slate-500">Payment validation pending</p>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Order Summary</h3>
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.product._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-4">
                    {item.product.image ? (
                      <img src={item.product.image} alt={item.product.name} className="h-16 w-16 rounded-xl object-cover" />
                    ) : (
                      <div className="h-16 w-16 rounded-xl bg-slate-200" />
                    )}
                    <div>
                      <p className="font-semibold text-slate-900">{item.product.name}</p>
                      <p className="text-sm text-slate-500">{formatCurrency(item.product.price)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1">
                    <button
                      type="button"
                      onClick={() => updateLine(item.product._id, item.quantity - 1)}
                      className="h-9 w-9 rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed"
                      disabled={order.paymentStatus === 'paid'}
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateLine(item.product._id, item.quantity + 1)}
                      className="h-9 w-9 rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed"
                      disabled={order.paymentStatus === 'paid'}
                    >
                      +
                    </button>
                    <span className="ml-4 text-sm font-semibold text-slate-900">{formatCurrency(item.product.price * item.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.subtotal ?? orderTotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Discount:</span>
                <span>{formatCurrency(order.discount ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between text-lg font-semibold text-slate-900">
                <span>Total:</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link to="/contact-us" className="text-sm font-medium text-slate-500 hover:underline">
                Contact support
              </Link>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving || order.paymentStatus === 'paid'}
                  className="rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
                <button
                  onClick={handlePay}
                  disabled={order.paymentStatus === 'paid' || paying}
                  className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60"
                >
                  {order.paymentStatus === 'paid' ? 'Already paid' : paying ? 'Processing payment...' : 'Pay now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
