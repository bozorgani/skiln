const mongoose = require('mongoose');

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
      type: String, // lessonId (virtual ID: courseId-sectionIndex-lessonIndex)
    }],
    lastWatchedLesson: {
      type: String, // lessonId of the last watched lesson
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completedAt: {
      type: Date, // تاریخ تکمیل دوره (زمانی که 100% شود)
    },
    certificateIssued: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index برای جستجوی سریع
progressSchema.index({ user: 1, course: 1 }, { unique: true });
progressSchema.index({ user: 1 });

const Progress = mongoose.model('Progress', progressSchema);

module.exports = Progress;







