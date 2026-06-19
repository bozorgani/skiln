const mongoose = require('mongoose');

const lessonProgressSchema = new mongoose.Schema(
  {
    lessonId: { type: String, required: true },
    completed: { type: Boolean, default: false },
    completedAt: Date,
    watchedPercentage: { type: Number, default: 0, min: 0, max: 100 },
    lastWatchedSeconds: { type: Number, default: 0, min: 0 },
    lastAccessedAt: Date,
  },
  { _id: false }
);

const progressSchema = new mongoose.Schema(
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
    completedLessons: [{
      type: String,
    }],
    lessonProgress: [lessonProgressSchema],
    lastWatchedLesson: {
      type: String,
    },
    lastAccessed: Date,
    totalLessons: {
      type: Number,
      default: 0,
      min: 0,
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    startedAt: Date,
    completedAt: Date,
    certificateIssued: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

progressSchema.index({ user: 1, course: 1 }, { unique: true });
progressSchema.index({ user: 1 });
progressSchema.index({ course: 1 });

const Progress = mongoose.model('Progress', progressSchema);

module.exports = Progress;
