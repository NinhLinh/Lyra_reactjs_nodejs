const Order = require('../models/Order');

const normalizeDiscountType = (type) => {
  if (!type) return undefined;
  const value = String(type).trim().toLowerCase();
  if (value === 'percentage') return 'percent';
  if (value === 'fixed_amount') return 'fixed';
  if (value === 'percent' || value === 'fixed') return value;
  return undefined;
};

const normalizeArrayField = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') return value.split(',').map(item => item.trim()).filter(Boolean);
  return [];
};

const normalizeCouponInput = (body) => ({
  code: body.code?.toString().trim().toUpperCase(),
  description: body.description,
  discountType: normalizeDiscountType(body.discountType ?? body.discount_type),
  discountValue: body.discountValue ?? body.discount_value,
  minOrderValue: Number(body.minOrderValue ?? body.min_order_value ?? 0),
  maxDiscount: body.maxDiscount ?? body.max_discount_amount,
  active: typeof body.active === 'boolean'
    ? body.active
    : (typeof body.status === 'string' ? body.status.toLowerCase() === 'active' : true),
  status: body.status,
  startDate: body.startDate ? new Date(body.startDate) : body.start_date ? new Date(body.start_date) : undefined,
  endDate: body.endDate ? new Date(body.endDate) : body.end_date ? new Date(body.end_date) : undefined,
  usageLimit: body.usageLimit ?? body.usage_limit,
  usedCount: body.usedCount ?? body.used_count,
  applicableCategories: normalizeArrayField(body.applicableCategories ?? body.applicable_categories),
  applicableProducts: normalizeArrayField(body.applicableProducts ?? body.applicable_products),
});

const isCouponActiveNow = (coupon) => {
  const now = new Date();
  if (!coupon.active) return false;
  if (coupon.startDate && now < coupon.startDate) return false;
  if (coupon.endDate && now > coupon.endDate) return false;
  return true;
};

const isCouponUsageAvailable = async (coupon, excludeOrderId) => {
  if (coupon.usageLimit == null) return true;
  const query = { couponCode: coupon.code };
  if (excludeOrderId) query._id = { $ne: excludeOrderId };
  const count = await Order.countDocuments(query);
  return count < coupon.usageLimit;
};

const getEligibleCartItems = (coupon, products, productMap) => {
  const hasCategoryRules = Array.isArray(coupon.applicableCategories) && coupon.applicableCategories.length > 0;
  const hasProductRules = Array.isArray(coupon.applicableProducts) && coupon.applicableProducts.length > 0;

  return products.filter(item => {
    const product = productMap.get(item.product.toString());
    if (!product) return false;
    if (hasProductRules && coupon.applicableProducts.some(id => id.toString() === product._id.toString())) {
      return true;
    }
    if (hasCategoryRules && product.category && coupon.applicableCategories.includes(product.category)) {
      return true;
    }
    return !hasCategoryRules && !hasProductRules;
  });
};

const calculateCouponDiscountForCart = (coupon, products, productMap) => {
  const eligibleItems = getEligibleCartItems(coupon, products, productMap);
  if (eligibleItems.length === 0) return null;

  const eligibleSubtotal = eligibleItems.reduce((sum, item) => {
    const product = productMap.get(item.product.toString());
    const price = typeof item.price === 'number' ? item.price : product?.price ?? 0;
    return sum + price * item.quantity;
  }, 0);

  if (eligibleSubtotal <= 0) return null;

  let discount = coupon.discountType === 'percent'
    ? eligibleSubtotal * (coupon.discountValue / 100)
    : coupon.discountValue;

  if (coupon.maxDiscount != null) {
    discount = Math.min(discount, coupon.maxDiscount);
  }

  discount = Math.max(0, discount);
  if (discount <= 0) return null;

  return { discount, eligibleSubtotal, eligibleItems };
};

const calculateBestCouponForCart = async (coupons, products, productMap, subtotal) => {
  let best = { coupon: null, discount: 0, total: subtotal };

  for (const coupon of coupons) {
    if (!isCouponActiveNow(coupon)) continue;
    if (!(await isCouponUsageAvailable(coupon))) continue;
    if (subtotal < (coupon.minOrderValue || 0)) continue;

    const result = calculateCouponDiscountForCart(coupon, products, productMap);
    if (!result) continue;

    const total = Math.max(0, subtotal - result.discount);
    if (result.discount > best.discount) {
      best = {
        coupon: {
          _id: coupon._id,
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minOrderValue: coupon.minOrderValue,
          maxDiscount: coupon.maxDiscount,
          startDate: coupon.startDate,
          endDate: coupon.endDate,
          usageLimit: coupon.usageLimit,
          usedCount: coupon.usedCount,
          applicableCategories: coupon.applicableCategories,
          applicableProducts: coupon.applicableProducts,
        },
        discount: result.discount,
        total,
      };
    }
  }

  return best;
};

const validateCouponCodeForOrder = async ({ couponCode, products, productMap, subtotal, excludeOrderId }) => {
  if (!couponCode) return { discount: 0, couponCodeToSave: null, coupon: null, reason: 'no_coupon' };
  const Coupon = require('../models/Coupon');
  const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
  if (!coupon) return { discount: 0, couponCodeToSave: null, coupon: null, reason: 'coupon_not_found' };
  if (!isCouponActiveNow(coupon)) return { discount: 0, couponCodeToSave: null, coupon: null, reason: 'coupon_inactive_or_expired' };
  if (!(await isCouponUsageAvailable(coupon, excludeOrderId))) return { discount: 0, couponCodeToSave: null, coupon: null, reason: 'usage_limit_exceeded' };
  if (subtotal < (coupon.minOrderValue || 0)) return { discount: 0, couponCodeToSave: null, coupon: null, reason: 'min_order_value_not_met' };

  const result = calculateCouponDiscountForCart(coupon, products, productMap);
  if (!result) return { discount: 0, couponCodeToSave: null, coupon: null, reason: 'no_eligible_products' };

  return { discount: result.discount, couponCodeToSave: coupon.code, coupon, reason: 'valid' };
};

module.exports = {
  normalizeCouponInput,
  calculateBestCouponForCart,
  validateCouponCodeForOrder,
  isCouponActiveNow,
  normalizeDiscountType,
};
