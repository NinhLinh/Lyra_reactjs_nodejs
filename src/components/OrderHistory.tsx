import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiEye, FiTrash, FiPackage } from "react-icons/fi";

interface Order {
  _id: string;
  products: { product: { name: string; price: number }; quantity: number }[];
  subtotal?: number;
  discount?: number;
  couponCode?: string;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  createdAt: string;
}

const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();
const getOrderQuantity = (order: Order) => order.products.reduce((sum, item) => sum + item.quantity, 0);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    completed: "bg-green-100 text-green-700 border-green-200",
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
    default: "bg-gray-100 text-gray-700 border-gray-200"
  };
  const currentStyle = styles[status.toLowerCase()] || styles.default;
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${currentStyle} capitalize text-center`}>
      {status}
    </span>
  );
};

interface OrderCardProps {
  order: Order;
  onRemove: (id: string) => void;
}

const MobileOrderCard: React.FC<OrderCardProps> = ({ order, onRemove }) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="text-sm font-bold text-gray-900">Order #{order._id.slice(-8).toUpperCase()}</h3>
        <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
      </div>
      <StatusBadge status={order.status} />
    </div>

    <div className="flex flex-wrap gap-y-2 mb-4 justify-between">
      <div className="flex flex-col">
        <span className="text-[10px] uppercase text-gray-400 font-bold tracking-tight">Date</span>
        <span className="text-sm font-medium text-gray-600">{formatDate(order.createdAt)}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] uppercase text-gray-400 font-bold tracking-tight">Items</span>
        <div className="flex items-center gap-2">
           <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-sm font-bold text-gray-600">
            {getOrderQuantity(order)}
          </span>
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] uppercase text-gray-400 font-bold tracking-tight">Total</span>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-gray-900">{formatCurrency(order.total)}</span>
          <span className={`text-xs font-medium ${order.discount && order.discount > 0 ? 'text-red-500' : 'text-gray-400'}`}>
            -{formatCurrency(order.discount ?? 0)} Off
          </span>
        </div>
      </div>
    </div>

    <div className="text-sm text-gray-500 mb-4 italic capitalize">
      {order.paymentStatus} / {order.paymentMethod || 'N/A'}
    </div>

    <div className="flex gap-2">
      <Link to={`/orders/${order._id}`}
        className="flex-1 bg-black text-white flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
      >
        <FiEye /> View Details
      </Link>
      <button
        onClick={() => onRemove(order._id)}
        className="px-4 border border-gray-200 text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors"
      >
        <FiTrash />
      </button>
    </div>
  </div>
);

const DesktopOrderRow: React.FC<OrderCardProps> = ({ order, onRemove }) => (
  <tr className="hover:bg-gray-50/80 transition-colors group">
    <td className="px-6 py-5">
      <div className="flex flex-col">
        <span className="text-sm font-bold text-gray-900 mb-1">#{order._id.slice(-8).toUpperCase()}</span>
        <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
      </div>
    </td>
    <td className="px-6 py-5">
      <div className="flex flex-col gap-1">
        <StatusBadge status={order.status} />
      </div>
    </td>
    <td className="px-6 py-5 text-center">
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-xs font-bold text-gray-600 border border-gray-200">
        {getOrderQuantity(order)}
      </span>
    </td>
    <td className="px-6 py-5 text-sm text-gray-600">
      {formatCurrency(order.discount ?? 0)}
    </td>
    <td className="px-6 py-5">
      <div className="flex flex-col">
        <span className="text-sm font-bold text-gray-900">{formatCurrency(order.total)}</span>
      </div>
    </td>
    <td className="px-6 py-5">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-400 font-medium px-1 uppercase leading-none">
          {order.paymentStatus} / {order.paymentMethod || 'N/A'}
        </span>
      </div>
    </td>
    <td className="px-6 py-5">
      <div className="flex items-center justify-end gap-2">
        <Link
          to={`/orders/${order._id}`}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
          title="View Details"
        >
          <FiEye className="text-lg" />
        </Link>
        <button
          onClick={() => onRemove(order._id)}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
          title="Delete Order"
        >
          <FiTrash className="text-lg" />
        </button>
      </div>
    </td>
  </tr>
);

const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [sortOption, setSortOption] = useState('date_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageSizeOptions = [10, 20, 30, 50, 100];

  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await axios.get('http://localhost:5000/api/orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(res.data);
      } catch (error: any) {
        console.error('Fetch orders failed', error);
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          localStorage.removeItem('token');
        }
      }
    };

    fetchOrders();
  }, [user]);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      if (sortOption === 'date_desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortOption === 'date_asc') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortOption === 'discount_desc') {
        return (b.discount ?? 0) - (a.discount ?? 0);
      }
      if (sortOption === 'discount_asc') {
        return (a.discount ?? 0) - (b.discount ?? 0);
      }
      return 0;
    });
  }, [orders, sortOption]);

  const totalPages = Math.max(1, Math.ceil(sortedOrders.length / pageSize));
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedOrders.slice(startIndex, startIndex + pageSize);
  }, [sortedOrders, currentPage, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleAskRemove = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowConfirm(true);
  };
  const handleRemoveOrder = async () => {
    if (!selectedOrderId) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.delete(`http://localhost:5000/api/orders/${selectedOrderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setOrders(prev => prev.filter(order => order._id !== selectedOrderId));
      setShowConfirm(false);
      setSelectedOrderId(null);
    } catch (error) {
      console.error('Delete order failed', error);
    }
  };

  if (!user) return <div className="text-center py-20 font-medium text-gray-500">Please login to view order history.</div>;

  return (
    <div className="max-w-5xl lg:max-w-4xl mx-auto mt-[80px] px-4 py-10 md:py-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Order History</h2>
          <p className="text-gray-500 mt-1">Manage and track your recent purchases</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 font-medium">Sort by</span>
          <select
            value={sortOption}
            onChange={e => setSortOption(e.target.value)}
            className="rounded-xl border bg-white p-2 text-sm shadow-sm focus:ring-2 focus:ring-black outline-none transition-all"
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="discount_desc">Highest Discount</option>
          </select>
        </div>
      </div>

      {orders.length > 0 && (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 font-medium">Show</span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-xl border p-2 text-sm shadow-sm focus:ring-2 focus:ring-black outline-none transition-all"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <span className="text-sm text-gray-500">orders per page</span>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <FiPackage className="mx-auto text-4xl text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No orders found yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Order Info</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Qty</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Discount</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Total</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Payment</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
              {paginatedOrders.map(order => (
                <DesktopOrderRow key={order._id} order={order} onRemove={handleAskRemove} />
              ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden divide-y divide-gray-100 bg-gray-50/30 p-4 space-y-4">
            {paginatedOrders.map(order => (
              <MobileOrderCard key={order._id} order={order} onRemove={handleAskRemove} />
            ))}
          </div>
          <div className="flex flex-col gap-3 items-stretch border-t border-gray-100 px-4 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center justify-between md:gap-4">
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
              <div className="text-sm text-gray-500">
                Showing {sortedOrders.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, sortedOrders.length)} of {sortedOrders.length} orders
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 mx-auto">
              <FiTrash className="text-2xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 text-center">Delete Order</h2>
            <p className="text-sm text-gray-500 text-center mt-2 mb-8 leading-relaxed">
              Are you sure you want to remove this order from your history? This action cannot be undone.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-3 rounded-2xl border border-gray-200 font-bold text-gray-700 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveOrder}
                className="px-4 py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
