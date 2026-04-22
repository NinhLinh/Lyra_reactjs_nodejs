const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const auth = require('../middleware/auth');
const { validateCouponCodeForOrder } = require('../utils/couponUtils');

const router = express.Router();

// Create order
router.post('/', auth, async (req, res) => {
  const { products, paymentMethod, shippingName, shippingPhone, shippingAddress, couponCode, note } = req.body;

  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  try {
    const productIds = products.map(item => item.product);
    const dbProducts = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(dbProducts.map(prod => [prod._id.toString(), prod]));

    const orderProducts = products.map(item => ({
      product: item.product,
      quantity: item.quantity,
    }));

    const subtotal = orderProducts.reduce((sum, item) => {
      const product = productMap.get(item.product.toString());
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    let discount = 0;
    let couponCodeToSave = null;
    let couponValidationReason = 'no_coupon';

    if (couponCode) {
      const { discount: couponDiscount, couponCodeToSave: codeToSave, reason } = await validateCouponCodeForOrder({
        couponCode,
        products: orderProducts,
        productMap,
        subtotal,
      });
      discount = couponDiscount;
      couponCodeToSave = codeToSave;
      couponValidationReason = reason;
    }

    const total = Math.max(0, subtotal - discount);

    const order = new Order({
      user: req.user.id,
      products: orderProducts,
      subtotal,
      discount,
      total,
      couponCode: couponCodeToSave,
      shippingName,
      shippingPhone,
      shippingAddress,
      note,
      paymentMethod: paymentMethod || 'cash',
    });

    await order.save();

    if (couponCodeToSave) {
      await Coupon.findOneAndUpdate({ code: couponCodeToSave }, { $inc: { usedCount: 1 } });
    }

    const responseOrder = order.toObject();
    responseOrder.couponValidationReason = couponValidationReason;
    res.status(201).json(responseOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get user orders
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).populate('products.product').lean();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single order
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('products.product').lean();
    if (!order || order.user.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update pending order
router.put('/:id', auth, async (req, res) => {
  const { products, paymentMethod, shippingName, shippingPhone, shippingAddress, couponCode, note } = req.body;

  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'Order must contain products' });
  }

  try {
    const order = await Order.findById(req.params.id);
    if (!order || order.user.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'Cannot update a paid order' });
    }

    const productIds = products.map(item => item.product);
    const dbProducts = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(dbProducts.map(prod => [prod._id.toString(), prod]));

    const orderProducts = products.map(item => ({
      product: item.product,
      quantity: item.quantity,
    }));

    const subtotal = orderProducts.reduce((sum, item) => {
      const product = productMap.get(item.product.toString());
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    let discount = 0;
    let couponCodeToSave = null;
    let couponValidationReason = 'no_coupon';
    const originalCouponCode = order.couponCode;
    const couponToValidate = couponCode || order.couponCode;

    if (couponToValidate) {
      const { discount: couponDiscount, couponCodeToSave: codeToSave, reason } = await validateCouponCodeForOrder({
        couponCode: couponToValidate,
        products: orderProducts,
        productMap,
        subtotal,
        excludeOrderId: order._id,
      });
      discount = couponDiscount;
      couponCodeToSave = codeToSave;
      couponValidationReason = reason;
    }

    order.products = orderProducts;
    order.subtotal = subtotal;
    order.discount = discount;
    order.total = Math.max(0, subtotal - discount);
    order.couponCode = couponCodeToSave;
    order.paymentMethod = paymentMethod || order.paymentMethod;
    order.shippingName = shippingName || order.shippingName;
    order.shippingPhone = shippingPhone || order.shippingPhone;
    order.shippingAddress = shippingAddress || order.shippingAddress;
    order.note = note ?? order.note;

    await order.save();

    if (couponCodeToSave !== originalCouponCode) {
      if (originalCouponCode) {
        await Coupon.findOneAndUpdate({ code: originalCouponCode }, { $inc: { usedCount: -1 } });
      }
      if (couponCodeToSave) {
        await Coupon.findOneAndUpdate({ code: couponCodeToSave }, { $inc: { usedCount: 1 } });
      }
    }

    const updatedOrder = await Order.findById(order._id).populate('products.product').lean();
    updatedOrder.couponValidationReason = couponValidationReason;
    res.json(updatedOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Pay order
router.put('/:id/pay', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order || order.user.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'Order already paid' });
    }

    order.paymentStatus = 'paid';
    order.status = 'completed';
    await order.save();

    const updatedOrder = await Order.findById(order._id).populate('products.product').lean();
    res.json(updatedOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete order
router.delete('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order || order.user.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await Order.deleteOne({ _id: order._id });
    res.json({ message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN: Get all orders
const admin = require('../middleware/admin');
router.get('/admin/all-orders', admin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('products.product', 'name price image')
      .sort({ createdAt: -1 })
      .lean();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN: Get order statistics
router.get('/admin/statistics', admin, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    
    const totalUsers = await Order.distinct('user');
    const totalProducts = await Product.countDocuments();
    
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .populate('products.product', 'name price')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalUsers: totalUsers.length,
      totalProducts,
      recentOrders,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN: Update order status
router.put('/admin/orders/:id/status', admin, async (req, res) => {
  const { status, paymentStatus } = req.body;
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { ...(status && { status }), ...(paymentStatus && { paymentStatus }) },
      { new: true }
    ).populate('user', 'name email').populate('products.product', 'name price image');
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
