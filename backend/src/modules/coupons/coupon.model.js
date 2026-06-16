const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ['percent', 'fixed'],
      default: 'percent',
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    maxDiscountAmount: {
      type: Number,
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    // اگر این آرایه خالی باشد، کوپن برای همه دوره‌ها قابل استفاده است
    applicableCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
    startsAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    maxUses: {
      type: Number,
      min: 0,
    },
    totalUses: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;


