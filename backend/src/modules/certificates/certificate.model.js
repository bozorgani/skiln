const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    progress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Progress',
      required: true,
    },
    certificateNumber: {
      type: String,
      required: true,
      unique: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Index برای جستجوی سریع
certificateSchema.index({ user: 1, course: 1 }, { unique: true });
certificateSchema.index({ certificateNumber: 1 });
certificateSchema.index({ user: 1 });

const Certificate = mongoose.model('Certificate', certificateSchema);

module.exports = Certificate;







