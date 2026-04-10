const express = require('express');
const Coupon = require('../models/Coupon');
const Product = require('../models/Product');
const admin = require('../middleware/admin');
const { normalizeCouponInput, calculateBestCouponForCart } = require('../utils/couponUtils');

const router = express.Router();

// List all coupons (admin only)
router.get('/', admin, async (req, res) => {
  try {
    const coupons = await Coupon.find().lean();
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create coupon (admin only)
router.post('/', admin, async (req, res) => {
  try {
    const couponData = normalizeCouponInput(req.body);
    const coupon = new Coupon(couponData);
    await coupon.save();
    res.status(201).json(coupon);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update coupon (admin only)
router.put('/:id', admin, async (req, res) => {
  try {
    const couponData = normalizeCouponInput(req.body);
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, couponData, { new: true });
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    res.json(coupon);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete coupon (admin only)
router.delete('/:id', admin, async (req, res) => {
  try {
    const deleted = await Coupon.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Coupon not found' });
    res.json({ message: 'Coupon deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Apply best available coupon for a cart
router.post('/apply', async (req, res) => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.json({ coupon: null, discount: 0, subtotal: 0, total: 0 });
    }

    const productIds = products.map(item => item.product).filter(Boolean);
    const dbProducts = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(dbProducts.map(product => [product._id.toString(), product]));

    const subtotal = products.reduce((sum, item) => {
      const product = productMap.get(item.product.toString());
      const price = typeof item.price === 'number' ? item.price : product?.price ?? 0;
      return sum + price * item.quantity;
    }, 0);

    const coupons = await Coupon.find().lean();
    const best = await calculateBestCouponForCart(coupons, products, productMap, subtotal);

    res.json({ coupon: best.coupon, discount: best.discount, subtotal, total: best.total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
