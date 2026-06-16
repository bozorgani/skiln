const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    amount: { type: Number, required: true },
    provider: { 
      type: String, 
      required: true,
      enum: ['stripe', 'zarinpal', 'payir', 'idpay', 'admin', 'free'], // روش‌های پرداخت
      default: 'admin'
    },
    status: {
      type: String,
      enum: ['initiated', 'succeeded', 'failed', 'pending', 'cancelled'],
      default: 'initiated',
    },
    transactionId: { type: String }, // ممکن است برای admin null باشد
    paymentMethod: { type: String }, // روش پرداخت (card, online, etc.)
    metadata: { type: Object },
    isAdminPurchase: { type: Boolean, default: false }, // آیا توسط admin خریداری شده
  },
  { timestamps: true }
);

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;

