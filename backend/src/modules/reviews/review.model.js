const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, trim: true },
    content: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    isApproved: { type: Boolean, default: false, index: true },
    moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    moderatedAt: Date,
  },
  { timestamps: true }
);

reviewSchema.index({ course: 1, user: 1 }, { unique: true });
reviewSchema.index({ content: 'text', title: 'text' }, { default_language: 'none' });

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
