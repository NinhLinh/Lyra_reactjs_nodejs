import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { FiTrash } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface CouponResult {
  coupon: {
    code: string;
    description?: string;
    discountType: string;
    discountValue: number;
    minOrderValue: number;
    maxDiscount?: number;
  } | null;
  discount: number;
  subtotal: number;
  total: number;
}

const Checkout: React.FC = () => {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponResult, setCouponResult] = useState<CouponResult | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank'>('cash');
  const [shippingName, setShippingName] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [note, setNote] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isConfirmingOrder, setIsConfirmingOrder] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart]
  );

  useEffect(() => {
    if (!user) return;
    setShippingName(user.name || '');
    setShippingPhone(user.phone || '');
    setShippingAddress(user.address || '');
  }, [user]);

  useEffect(() => {
    const applyBestCoupon = async () => {
      if (cart.length === 0) {
        setCouponResult(null);
        return;
      }

      setCouponLoading(true);
      setCouponError(null);

      try {
        const payload = cart.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.product.price,
        }));

        const res = await axios.post('http://localhost:5000/api/coupons/apply', { products: payload });
        setCouponResult(res.data);
      } catch (err: any) {
        setCouponError(err.response?.data?.error || 'Failed to calculate promotions.');
        setCouponResult(null);
      } finally {
        setCouponLoading(false);
      }
    };

    applyBestCoupon();
  }, [cart]);

  const handlePlaceOrder = () => {
    if (!user) {
      navigate('/auth?redirect=/checkout');
      return;
    }

    if (cart.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    if (!shippingName || !shippingPhone || !shippingAddress) {
      setError('Please provide recipient name, phone and address.');
      return;
    }

    setError(null);
    setModalError(null);
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      setModalError(null);
      setIsConfirmingOrder(true);
      const token = localStorage.getItem('token');
      const products = cart.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
      }));

      const res = await axios.post(
        'http://localhost:5000/api/orders',
        {
          products,
          paymentMethod,
          shippingName,
          shippingPhone,
          shippingAddress,
          note,
          couponCode: couponResult?.coupon?.code,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      clearCart();
      navigate(`/orders/${res.data._id}`);
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Unable to create order.');
    } finally {
      setIsConfirmingOrder(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto mt-[80px] lg:mt-[100px] px-4">
        <div className="bg-white p-8 rounded shadow">
          <h2 className="text-2xl font-bold mb-4">Checkout</h2>
          <p className="mb-4">You must be logged in to proceed to checkout.</p>
          <Link to="/auth" state={{ redirect: '/checkout' }} className="bg-blue-500 text-white px-4 py-2 rounded">
            Login to continue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto mt-[80px] lg:mt-[100px] px-4">
      <div className="bg-white p-8 rounded shadow">
        <h2 className="text-2xl font-bold mb-6">Confirm your order</h2>

        {cart.length === 0 ? (
          <p>Your cart is empty. Go back to <Link to="/products" className="text-blue-500 hover:underline">products</Link> to add items.</p>
        ) : (
          <>
            <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
              <div>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-4">Selected products</h3>
                  {cart.map(item => (
                    <div key={item.product._id} className="flex justify-between items-center mb-4 gap-4 border-b pb-4">
                      <div className="flex items-center gap-4">
                        <img src={item.product.image} alt={item.product.name} className="h-16 w-16 object-cover rounded" />
                        <div>
                          <p className="font-semibold">{item.product.name}</p>
                          <p className="text-sm text-gray-600">${item.product.price.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                          className="px-3 bg-black/10 rounded"
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                          className="px-3 bg-black/10 rounded"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <p>${(item.product.price * item.quantity).toFixed(2)}</p>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product._id)}
                          className="text-red-500"
                        >
                          <FiTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-4">Recipient & shipping</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      value={shippingName}
                      onChange={(e) => setShippingName(e.target.value)}
                      placeholder="Recipient name"
                      className="w-full p-3 border rounded"
                    />
                    <input
                      value={shippingPhone}
                      onChange={(e) => setShippingPhone(e.target.value)}
                      placeholder="Phone number*"
                      className="w-full p-3 border rounded"
                    />
                    <input
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Shipping address*"
                      className="w-full p-3 border rounded sm:col-span-2"
                    />
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Order note (optional)"
                      className="w-full p-3 border rounded sm:col-span-2"
                      rows={4}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4">Payment method</h3>
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={paymentMethod === 'cash'}
                        onChange={() => setPaymentMethod('cash')}
                      />
                      Cash on delivery
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank"
                        checked={paymentMethod === 'bank'}
                        onChange={() => setPaymentMethod('bank')}
                      />
                      Bank transfer
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg border">
                <h3 className="text-xl font-semibold mb-4">Order summary</h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Promotion</span>
                    <span>{couponLoading ? 'Checking…' : couponResult && couponResult.discount > 0 ? `-${couponResult.discount.toFixed(2)}` : '-$0.00'}</span>
                  </div>
                  {couponResult?.coupon && (
                    <div className="rounded bg-white p-3 border mt-3 text-sm text-green-700">
                      <p className="font-semibold">Best offer applied:</p>
                      <p>{couponResult.coupon.code} — {couponResult.coupon.description || 'Auto-applied discount'}</p>
                      <p>Discount: ${couponResult.discount.toFixed(2)}</p>
                    </div>
                  )}
                  <div className="border-t pt-3 flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${(couponResult ? couponResult.total : subtotal).toFixed(2)}</span>
                  </div>
                </div>

                {couponError && <p className="mt-4 text-red-500">{couponError}</p>}
                {error && <p className="mt-4 text-red-500">{error}</p>}

                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="mt-6 w-full bg-green-600 text-white px-5 py-3 rounded hover:bg-green-700 disabled:opacity-60"
                >
                  {loading ? 'Preparing confirmation...' : 'Show confirmation'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Confirm your order</h3>
                <button onClick={() => setShowConfirmModal(false)} className="text-gray-500 hover:text-gray-900">Close</button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">Products</h4>
                  {cart.map(item => (
                    <div key={item.product._id} className="flex justify-between items-center py-2 border-b">
                      <div>
                        <p>{item.product.name} x {item.quantity}</p>
                        <p className="text-sm text-gray-500">${item.product.price.toFixed(2)} each</p>
                      </div>
                      <p className="font-semibold">${(item.product.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="font-semibold">Customer info</h4>
                  <p>{shippingName}</p>
                  <p>{shippingPhone}</p>
                  <p>{shippingAddress}</p>
                </div>

                <div>
                  <h4 className="font-semibold">Payment method</h4>
                  <p>{paymentMethod === 'cash' ? 'Cash on delivery' : 'Bank transfer'}</p>
                </div>

                {note && (
                  <div>
                    <h4 className="font-semibold">Note</h4>
                    <p>{note}</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Promotion</span>
                    <span>{couponLoading ? 'Checking…' : couponResult && couponResult.discount > 0 ? `-${couponResult.discount.toFixed(2)}` : '-$0.00'}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg mt-3">
                    <span>Total</span>
                    <span>${(couponResult ? couponResult.total : subtotal).toFixed(2)}</span>
                  </div>
                </div>

                {modalError && <p className="text-red-500">{modalError}</p>}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="w-full sm:w-auto px-4 py-2 border rounded"
                >
                  Edit information
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  disabled={isConfirmingOrder}
                  className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
                >
                  {isConfirmingOrder ? 'Submitting...' : 'Confirm and submit order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
