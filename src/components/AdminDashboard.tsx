import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
}

const AdminDashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({ name: '', description: '', price: '', image: '', category: '', stock: '' });
  const [coupons, setCoupons] = useState<any[]>([]);
  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    discountType: 'percent',
    discountValue: '',
    minOrderValue: '',
    maxDiscount: '',
    active: true,
    startDate: '',
    endDate: '',
    usageLimit: '',
    applicableCategories: '',
    applicableProducts: '',
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchProducts();
      fetchCoupons();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data);
    } catch (err) {
      console.error('Error fetching products:', err);
      alert('Failed to fetch products. Check backend.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/products', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setForm({ name: '', description: '', price: '', image: '', category: '', stock: '' });
      fetchProducts();
    } catch (err) {
      console.error('Error adding product:', err);
      alert('Failed to add product. Ensure you are admin.');
    }
  };

  const fetchCoupons = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/coupons', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCoupons(res.data);
    } catch (err) {
      console.error('Error fetching coupons:', err);
    }
  };

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/coupons', {
        code: couponForm.code,
        description: couponForm.description,
        discountType: couponForm.discountType,
        discountValue: Number(couponForm.discountValue),
        minOrderValue: Number(couponForm.minOrderValue) || 0,
        maxDiscount: couponForm.maxDiscount ? Number(couponForm.maxDiscount) : undefined,
        active: couponForm.active,
        status: couponForm.active ? 'active' : 'inactive',
        startDate: couponForm.startDate || undefined,
        endDate: couponForm.endDate || undefined,
        usageLimit: couponForm.usageLimit ? Number(couponForm.usageLimit) : undefined,
        applicableCategories: couponForm.applicableCategories
          .split(',')
          .map(item => item.trim())
          .filter(Boolean),
        applicableProducts: couponForm.applicableProducts
          .split(',')
          .map(item => item.trim())
          .filter(Boolean),
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCouponForm({
        code: '',
        description: '',
        discountType: 'percent',
        discountValue: '',
        minOrderValue: '',
        maxDiscount: '',
        active: true,
        startDate: '',
        endDate: '',
        usageLimit: '',
        applicableCategories: '',
        applicableProducts: '',
      });
      fetchCoupons();
    } catch (err) {
      console.error('Error adding coupon:', err);
      alert('Failed to add coupon. Ensure you are admin.');
    }
  };

  const deleteCoupon = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/coupons/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCoupons();
    } catch (err) {
      console.error('Error deleting coupon:', err);
      alert('Failed to delete coupon.');
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product.');
    }
  };

  if (user?.role !== 'admin') return <p>Access denied.</p>;

  return (
    <div className="max-w-6xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow mb-6">
        <h3 className="text-xl mb-4">Add Product</h3>
        <input type="text" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full p-2 mb-2 border" required />
        <input type="text" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full p-2 mb-2 border" />
        <input type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full p-2 mb-2 border" required />
        <input type="text" placeholder="Image URL" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="w-full p-2 mb-2 border" />
        <input type="text" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full p-2 mb-2 border" />
        <input type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="w-full p-2 mb-4 border" />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Add Product</button>
      </form>
      <form onSubmit={handleCouponSubmit} className="bg-white p-6 rounded shadow mb-6">
        <h3 className="text-xl mb-4">Add Coupon</h3>
        <input type="text" placeholder="Code" value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} className="w-full p-2 mb-2 border" required />
        <input type="text" placeholder="Description" value={couponForm.description} onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })} className="w-full p-2 mb-2 border" />
        <div className="grid grid-cols-2 gap-2 mb-2">
          <select value={couponForm.discountType} onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })} className="w-full p-2 border">
            <option value="percent">Percent</option>
            <option value="fixed">Fixed</option>
          </select>
          <input type="number" placeholder="Value" value={couponForm.discountValue} onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })} className="w-full p-2 border" required />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input type="number" placeholder="Min order value" value={couponForm.minOrderValue} onChange={(e) => setCouponForm({ ...couponForm, minOrderValue: e.target.value })} className="w-full p-2 border" />
          <input type="number" placeholder="Max discount" value={couponForm.maxDiscount} onChange={(e) => setCouponForm({ ...couponForm, maxDiscount: e.target.value })} className="w-full p-2 border" />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <label className="flex flex-col">
            <span className="text-sm text-gray-600 mb-1">Start date</span>
            <input type="date" value={couponForm.startDate} onChange={(e) => setCouponForm({ ...couponForm, startDate: e.target.value })} className="w-full p-2 border" />
          </label>
          <label className="flex flex-col">
            <span className="text-sm text-gray-600 mb-1">End date</span>
            <input type="date" value={couponForm.endDate} onChange={(e) => setCouponForm({ ...couponForm, endDate: e.target.value })} className="w-full p-2 border" />
          </label>
        </div>
        <input type="number" placeholder="Usage limit" value={couponForm.usageLimit} onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value })} className="w-full p-2 mb-2 border" />
        <input type="text" placeholder="Applicable categories (comma separated)" value={couponForm.applicableCategories} onChange={(e) => setCouponForm({ ...couponForm, applicableCategories: e.target.value })} className="w-full p-2 mb-2 border" />
        <input type="text" placeholder="Applicable product IDs (comma separated)" value={couponForm.applicableProducts} onChange={(e) => setCouponForm({ ...couponForm, applicableProducts: e.target.value })} className="w-full p-2 mb-2 border" />
        <label className="flex items-center gap-2 mb-4">
          <input type="checkbox" checked={couponForm.active} onChange={(e) => setCouponForm({ ...couponForm, active: e.target.checked })} />
          Active
        </label>
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">Add Coupon</button>
      </form>
      <div className="bg-white p-6 rounded shadow mb-6">
        <h3 className="text-xl mb-4">Coupons</h3>
        {coupons.length === 0 ? (
          <p>No coupons yet.</p>
        ) : (
          <div className="space-y-3">
            {coupons.map(coupon => (
              <div key={coupon._id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{coupon.code}</p>
                    <span className={`text-[10px] font-semibold ${coupon.active ? 'text-green-600' : 'text-gray-500'}`}>
                      {coupon.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{coupon.description || 'No description'}</p>
                  <p className="text-sm">{coupon.discountType === 'percent' ? `${coupon.discountValue}%` : `$${coupon.discountValue}`} off</p>
                  {coupon.applicableCategories && coupon.applicableCategories.length > 0 && (
                    <p className="text-xs text-gray-500">Categories: {coupon.applicableCategories.join(', ')}</p>
                  )}
                  {coupon.usageLimit != null && (
                    <p className="text-xs text-gray-500">Usage limit: {coupon.usageLimit}</p>
                  )}
                </div>
                <button onClick={() => deleteCoupon(coupon._id)} className="bg-red-500 text-white px-3 py-1 rounded">Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <h3 className="text-xl mb-4">Products</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(product => (
          <div key={product._id} className="bg-white p-4 rounded shadow">
            <h4 className="font-bold">{product.name}</h4>
            <p>${product.price}</p>
            <button onClick={() => deleteProduct(product._id)} className="bg-red-500 text-white px-2 py-1 rounded mt-2">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
