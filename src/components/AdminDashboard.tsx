import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiEdit2, FiTrash2, FiPlus, FiDollarSign, FiBox, FiShoppingCart, FiUsers } from 'react-icons/fi';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  createdAt?: string;
}

interface Coupon {
  _id: string;
  code: string;
  description: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  maxDiscount?: number;
  minOrderValue: number;
  active: boolean;
  startDate?: string;
  endDate?: string;
  usageLimit?: number;
  usedCount: number;
  applicableCategories: string[];
  applicableProducts: string[];
}

interface Order {
  _id: string;
  user: { _id: string; name: string; email: string };
  products: Array<{ product: Product; quantity: number }>;
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  shippingName: string;
  shippingAddress: string;
  createdAt: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  createdAt?: string;
}

type TabType = 'dashboard' | 'products' | 'coupons' | 'orders' | 'users';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  
  const [productForm, setProductForm] = useState<Partial<Product>>({ name: '', description: '', price: 0, image: '', category: '', stock: 0 });
  const [couponForm, setCouponForm] = useState({
    code: '', description: '', discountType: 'percent' as const, discountValue: 0,
    minOrderValue: 0, maxDiscount: 0, active: true, startDate: '', endDate: '',
    usageLimit: 0, applicableCategories: '', applicableProducts: '',
  });
  const [users, setUsers] = useState<User[]>([]);

  const { user } = useAuth();
  const API_URL = 'http://localhost:5000/api';
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user, activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === 'dashboard') {
        const res = await axios.get(`${API_URL}/orders/admin/statistics`, { headers });
        setStatistics(res.data);
      } else if (activeTab === 'products') {
        const res = await axios.get(`${API_URL}/products`, { headers });
        setProducts(res.data);
      } else if (activeTab === 'coupons') {
        const res = await axios.get(`${API_URL}/coupons`, { headers });
        setCoupons(res.data);
      } else if (activeTab === 'orders') {
        const res = await axios.get(`${API_URL}/orders/admin/all-orders`, { headers });
        setOrders(res.data);
      } else if (activeTab === 'users') {
        const res = await axios.get(`${API_URL}/users/admin/all-users`, { headers });
        setUsers(res.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  // Product Management
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedProduct) {
        await axios.put(`${API_URL}/products/${selectedProduct._id}`, productForm, { headers });
      } else {
        await axios.post(`${API_URL}/products`, productForm, { headers });
      }
      setProductForm({ name: '', description: '', price: 0, image: '', category: '', stock: 0 });
      setSelectedProduct(null);
      fetchData();
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to save product');
    }
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await axios.delete(`${API_URL}/products/${id}`, { headers });
      fetchData();
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to delete product');
    }
  };

  // Coupon Management
  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        code: couponForm.code,
        description: couponForm.description,
        discountType: couponForm.discountType,
        discountValue: Number(couponForm.discountValue),
        minOrderValue: Number(couponForm.minOrderValue),
        maxDiscount: couponForm.maxDiscount ? Number(couponForm.maxDiscount) : undefined,
        active: couponForm.active,
        status: couponForm.active ? 'active' : 'inactive',
        startDate: couponForm.startDate || undefined,
        endDate: couponForm.endDate || undefined,
        usageLimit: couponForm.usageLimit ? Number(couponForm.usageLimit) : undefined,
        applicableCategories: couponForm.applicableCategories.split(',').map(c => c.trim()).filter(Boolean),
        applicableProducts: couponForm.applicableProducts.split(',').map(c => c.trim()).filter(Boolean),
      };

      if (selectedCoupon) {
        await axios.put(`${API_URL}/coupons/${selectedCoupon._id}`, data, { headers });
      } else {
        await axios.post(`${API_URL}/coupons`, data, { headers });
      }

      setCouponForm({
        code: '', description: '', discountType: 'percent', discountValue: 0, minOrderValue: 0,
        maxDiscount: 0, active: true, startDate: '', endDate: '', usageLimit: 0,
        applicableCategories: '', applicableProducts: '',
      });
      setSelectedCoupon(null);
      fetchData();
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to save coupon');
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await axios.delete(`${API_URL}/coupons/${id}`, { headers });
      fetchData();
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to delete coupon');
    }
  };

  // Order Management
  const updateOrderStatus = async (orderId: string, status: string, paymentStatus: string) => {
    try {
      await axios.put(`${API_URL}/orders/admin/orders/${orderId}/status`, { status, paymentStatus }, { headers });
      fetchData();
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to update order');
    }
  };

  // User Management
  const updateUserRole = async (userId: string, newRole: 'customer' | 'admin') => {
    try {
      await axios.put(`${API_URL}/users/admin/${userId}/role`, { role: newRole }, { headers });
      fetchData();
      alert(`User role updated to ${newRole}`);
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to update user role');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm('Delete this user? This action cannot be undone.')) return;
    try {
      await axios.delete(`${API_URL}/users/admin/${userId}`, { headers });
      fetchData();
      alert('User deleted');
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to delete user');
    }
  };

  if (user?.role !== 'admin') {
    return <div className="max-w-6xl mx-auto mt-10 p-6 bg-red-50 border border-red-200 rounded text-red-700">Access denied. Admin only.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {(['dashboard', 'products', 'coupons', 'orders', 'users'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded font-semibold transition ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            {statistics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Total Revenue</p>
                      <p className="text-3xl font-bold text-green-600">${statistics.totalRevenue?.toFixed(2) || '0'}</p>
                    </div>
                    <FiDollarSign className="text-4xl text-green-400" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Total Orders</p>
                      <p className="text-3xl font-bold text-blue-600">{statistics.totalOrders}</p>
                    </div>
                    <FiShoppingCart className="text-4xl text-blue-400" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Total Products</p>
                      <p className="text-3xl font-bold text-purple-600">{statistics.totalProducts}</p>
                    </div>
                    <FiBox className="text-4xl text-purple-400" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Total Customers</p>
                      <p className="text-3xl font-bold text-orange-600">{statistics.totalUsers}</p>
                    </div>
                    <FiUsers className="text-4xl text-orange-400" />
                  </div>
                </div>
              </div>
            )}

            {/* Recent Orders */}
            <div className="bg-white p-6 rounded shadow">
              <h2 className="text-2xl font-bold mb-4">Recent Orders</h2>
              {statistics?.recentOrders?.length === 0 ? (
                <p className="text-gray-500">No orders yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Order ID</th>
                        <th className="text-left py-2">Customer</th>
                        <th className="text-left py-2">Total</th>
                        <th className="text-left py-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statistics?.recentOrders?.map((order: any) => (
                        <tr key={order._id} className="border-b hover:bg-gray-50">
                          <td className="py-2 font-mono text-xs">{order._id.slice(-8)}</td>
                          <td className="py-2">{order.user?.name}</td>
                          <td className="py-2 font-semibold text-green-600">${order.total?.toFixed(2)}</td>
                          <td className="py-2 text-gray-500 text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div>
            {/* Add/Edit Product Form */}
            <form onSubmit={handleProductSubmit} className="bg-white p-6 rounded shadow mb-6">
              <h2 className="text-2xl font-bold mb-4">{selectedProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Product Name"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="p-2 border rounded"
                  required
                />
                <input
                  type="text"
                  placeholder="Category"
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  className="p-2 border rounded"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                  className="p-2 border rounded"
                  required
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                  className="p-2 border rounded"
                />
              </div>
              <textarea
                placeholder="Description"
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                className="w-full p-2 border rounded mt-4 h-20"
              />
              <input
                type="text"
                placeholder="Image URL"
                value={productForm.image}
                onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                className="w-full p-2 border rounded mt-4"
              />
              <div className="flex gap-2 mt-4">
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-semibold flex items-center gap-2">
                  <FiPlus /> {selectedProduct ? 'Update' : 'Add'} Product
                </button>
                {selectedProduct && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProduct(null);
                      setProductForm({ name: '', description: '', price: 0, image: '', category: '', stock: 0 });
                    }}
                    className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* Products List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(product => (
                <div key={product._id} className="bg-white p-4 rounded shadow hover:shadow-lg transition">
                  {product.image && <img src={product.image} alt={product.name} className="w-full h-40 object-cover rounded mb-3" />}
                  <h3 className="font-bold text-lg mb-2">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-green-600 font-bold text-lg">${product.price}</span>
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">Stock: {product.stock}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setProductForm(product);
                      }}
                      className="flex-1 bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 flex items-center justify-center gap-1 text-sm"
                    >
                      <FiEdit2 size={16} /> Edit
                    </button>
                    <button
                      onClick={() => deleteProduct(product._id)}
                      className="flex-1 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 flex items-center justify-center gap-1 text-sm"
                    >
                      <FiTrash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coupons Tab */}
        {activeTab === 'coupons' && (
          <div>
            {/* Add/Edit Coupon Form */}
            <form onSubmit={handleCouponSubmit} className="bg-white p-6 rounded shadow mb-6">
              <h2 className="text-2xl font-bold mb-4">{selectedCoupon ? 'Edit Coupon' : 'Create New Coupon'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Coupon Code"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  className="p-2 border rounded"
                  required
                />
                <select
                  value={couponForm.discountType}
                  onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value as any })}
                  className="p-2 border rounded"
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed ($)</option>
                </select>
                <input
                  type="number"
                  placeholder="Discount Value"
                  value={couponForm.discountValue}
                  onChange={(e) => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })}
                  className="p-2 border rounded"
                  required
                />
                <input
                  type="number"
                  placeholder="Min Order Value"
                  value={couponForm.minOrderValue}
                  onChange={(e) => setCouponForm({ ...couponForm, minOrderValue: Number(e.target.value) })}
                  className="p-2 border rounded"
                />
                <input
                  type="number"
                  placeholder="Max Discount (optional)"
                  value={couponForm.maxDiscount}
                  onChange={(e) => setCouponForm({ ...couponForm, maxDiscount: Number(e.target.value) })}
                  className="p-2 border rounded"
                />
                <input
                  type="number"
                  placeholder="Usage Limit (optional)"
                  value={couponForm.usageLimit}
                  onChange={(e) => setCouponForm({ ...couponForm, usageLimit: Number(e.target.value) })}
                  className="p-2 border rounded"
                />
              </div>
              <textarea
                placeholder="Description"
                value={couponForm.description}
                onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                className="w-full p-2 border rounded mt-4 h-16"
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <input type="date" value={couponForm.startDate} onChange={(e) => setCouponForm({ ...couponForm, startDate: e.target.value })} className="p-2 border rounded" placeholder="Start Date" />
                <input type="date" value={couponForm.endDate} onChange={(e) => setCouponForm({ ...couponForm, endDate: e.target.value })} className="p-2 border rounded" placeholder="End Date" />
                <label className="flex items-center gap-2 p-2">
                  <input type="checkbox" checked={couponForm.active} onChange={(e) => setCouponForm({ ...couponForm, active: e.target.checked })} />
                  <span>Active</span>
                </label>
              </div>
              <input
                type="text"
                placeholder="Applicable Categories (comma separated)"
                value={couponForm.applicableCategories}
                onChange={(e) => setCouponForm({ ...couponForm, applicableCategories: e.target.value })}
                className="w-full p-2 border rounded mt-4"
              />
              <div className="flex gap-2 mt-4">
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-semibold flex items-center gap-2">
                  <FiPlus /> {selectedCoupon ? 'Update' : 'Create'} Coupon
                </button>
                {selectedCoupon && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCoupon(null);
                      setCouponForm({
                        code: '', description: '', discountType: 'percent', discountValue: 0, minOrderValue: 0,
                        maxDiscount: 0, active: true, startDate: '', endDate: '', usageLimit: 0,
                        applicableCategories: '', applicableProducts: '',
                      });
                    }}
                    className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* Coupons List */}
            <div className="space-y-3">
              {coupons.map(coupon => (
                <div key={coupon._id} className="bg-white p-4 rounded shadow hover:shadow-lg transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">{coupon.code}</h3>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${coupon.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {coupon.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">{coupon.description}</p>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">
                      {coupon.discountType === 'percent' ? `${coupon.discountValue}%` : `$${coupon.discountValue}`}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500 mb-3">
                    <p>Min: ${coupon.minOrderValue}</p>
                    {coupon.maxDiscount && <p>Max: ${coupon.maxDiscount}</p>}
                    {coupon.usageLimit && <p>Limit: {coupon.usageLimit}</p>}
                    <p>Used: {coupon.usedCount}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedCoupon(coupon)}
                      className="flex-1 bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 flex items-center justify-center gap-1 text-sm"
                    >
                      <FiEdit2 size={16} /> Edit
                    </button>
                    <button
                      onClick={() => deleteCoupon(coupon._id)}
                      className="flex-1 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 flex items-center justify-center gap-1 text-sm"
                    >
                      <FiTrash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-2xl font-bold mb-4">All Orders</h2>
            {orders.length === 0 ? (
              <p className="text-gray-500">No orders yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-3">Order ID</th>
                      <th className="text-left py-3">Customer</th>
                      <th className="text-right py-3">Total</th>
                      <th className="text-center py-3">Order Status</th>
                      <th className="text-center py-3">Payment</th>
                      <th className="text-center py-3">Date</th>
                      <th className="text-center py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 font-mono text-xs">{order._id.slice(-8)}</td>
                        <td className="py-3">
                          <div>
                            <p className="font-semibold">{order.user?.name}</p>
                            <p className="text-xs text-gray-500">{order.user?.email}</p>
                          </div>
                        </td>
                        <td className="py-3 text-right font-bold text-green-600">${order.total?.toFixed(2)}</td>
                        <td className="py-3 text-center">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order._id, e.target.value, order.paymentStatus)}
                            className="px-2 py-1 border rounded text-xs"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="py-3 text-center">
                          <select
                            value={order.paymentStatus}
                            onChange={(e) => updateOrderStatus(order._id, order.status, e.target.value)}
                            className={`px-2 py-1 border rounded text-xs ${
                              order.paymentStatus === 'paid' ? 'bg-green-100' : order.paymentStatus === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="failed">Failed</option>
                          </select>
                        </td>
                        <td className="py-3 text-center text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 text-center">
                          <button className="text-blue-600 hover:text-blue-700 font-semibold text-xs">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-2xl font-bold mb-4">Manage Users</h2>
            {users.length === 0 ? (
              <p className="text-gray-500">No users yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-3">Name</th>
                      <th className="text-left py-3">Email</th>
                      <th className="text-center py-3">Role</th>
                      <th className="text-center py-3">Joined Date</th>
                      <th className="text-center py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 font-semibold">{u.name}</td>
                        <td className="py-3 text-gray-600">{u.email}</td>
                        <td className="py-3 text-center">
                          <span className={`px-3 py-1 rounded text-xs font-semibold ${u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 text-center text-xs text-gray-500">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</td>
                        <td className="py-3 text-center space-x-2 flex justify-center">
                          {u.role === 'customer' ? (
                            <button
                              onClick={() => updateUserRole(u._id, 'admin')}
                              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-xs font-semibold"
                            >
                              Promote
                            </button>
                          ) : (
                            <button
                              onClick={() => updateUserRole(u._id, 'customer')}
                              className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-xs font-semibold"
                            >
                              Demote
                            </button>
                          )}
                          <button
                            onClick={() => deleteUser(u._id)}
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-xs font-semibold flex items-center gap-1"
                          >
                            <FiTrash2 size={14} /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
