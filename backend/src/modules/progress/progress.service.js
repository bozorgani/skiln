const ApiError = require('../../core/ApiError');
const Progress = require('./progress.model');
const Course = require('../courses/course.model');
const Certificate = require('../certificates/certificate.model');

const getCourseLessonIds = (course) => {
  const ids = [];
  (course.sections || []).forEach((section, sectionIndex) => {
    (section.lessons || []).forEach((_lesson, lessonIndex) => {
      ids.push(`${course._id}-${sectionIndex}-${lessonIndex}`);
    });
  });
  return ids;
};

const normalizeLessonId = (course, lessonId) => {
  const raw = String(lessonId || '');
  if (!raw) return raw;

  const courseId = course._id.toString();
  if (raw.startsWith(`${courseId}-`)) return raw;

  const twoPart = /^(\d+)-(\d+)$/.exec(raw);
  if (twoPart) return `${courseId}-${twoPart[1]}-${twoPart[2]}`;

  const numeric = /^(\d+)$/.exec(raw);
  if (numeric) {
    const index = Number(numeric[1]) - 1;
    let counter = 0;
    for (let sectionIndex = 0; sectionIndex < (course.sections || []).length; sectionIndex += 1) {
      for (let lessonIndex = 0; lessonIndex < (course.sections[sectionIndex].lessons || []).length; lessonIndex += 1) {
        if (counter === index) return `${courseId}-${sectionIndex}-${lessonIndex}`;
        counter += 1;
      }
    }
  }

  return raw;
};

const isEnrolled = (course, userId) => {
  return (course.students || []).some((studentId) => studentId.toString() === userId.toString());
};

const getOrCreateProgress = async (courseId, userId) => {
  let progress = await Progress.findOne({ user: userId, course: courseId });

  if (!progress) {
    progress = await Progress.create({
      user: userId,
      course: courseId,
      completedLessons: [],
      lessonProgress: [],
      completionPercentage: 0,
      startedAt: new Date(),
      lastAccessed: new Date(),
    });
  }

  return progress;
};

const recalculateProgress = async (course, progress) => {
  const validLessonIds = getCourseLessonIds(course);
  const validSet = new Set(validLessonIds);

  const completedFromLegacy = (progress.completedLessons || [])
    .map((lessonId) => normalizeLessonId(course, lessonId))
    .filter((lessonId) => validSet.has(lessonId));

  const completedFromDetails = (progress.lessonProgress || [])
    .filter((item) => item.completed)
    .map((item) => normalizeLessonId(course, item.lessonId))
    .filter((lessonId) => validSet.has(lessonId));

  const completedLessons = Array.from(new Set([...completedFromLegacy, ...completedFromDetails]));
  const watchedByLesson = new Map();

  (progress.lessonProgress || []).forEach((item) => {
    const lessonId = normalizeLessonId(course, item.lessonId);
    if (!validSet.has(lessonId)) return;
    const watched = item.completed
      ? 100
      : Math.min(100, Math.max(0, Number(item.watchedPercentage || 0)));
    watchedByLesson.set(lessonId, Math.max(watchedByLesson.get(lessonId) || 0, watched));
  });

  completedLessons.forEach((lessonId) => watchedByLesson.set(lessonId, 100));

  const watchedSum = validLessonIds.reduce(
    (sum, lessonId) => sum + Math.min(100, Math.max(0, watchedByLesson.get(lessonId) || 0)),
    0
  );

  progress.totalLessons = validLessonIds.length;
  progress.completedLessons = completedLessons;
  progress.completionPercentage = validLessonIds.length > 0
    ? Math.min(100, Math.round(watchedSum / validLessonIds.length))
    : 0;

  if (!progress.startedAt) progress.startedAt = progress.createdAt || new Date();

  if (progress.completionPercentage === 100) {
    if (!progress.completedAt) progress.completedAt = new Date();
    if (!progress.certificateIssued) {
      await issueCertificate(course._id, progress.user, progress);
      progress.certificateIssued = true;
    }
  } else {
    progress.completedAt = null;
    progress.certificateIssued = false;
  }

  return progress;
};

const updateLessonDetail = (progress, lessonId, completed, meta = {}) => {
  const now = new Date();
  const hasCompletionState = typeof completed === 'boolean';
  const watchedPercentage = Math.min(100, Math.max(0, Number(meta.watchedPercentage || (completed ? 100 : 0))));
  const lastWatchedSeconds = Math.max(0, Number(meta.lastWatchedSeconds || 0));

  const details = progress.lessonProgress || [];
  const existing = details.find((item) => item.lessonId === lessonId);

  if (existing) {
    if (hasCompletionState) {
      existing.completed = completed;
      existing.completedAt = completed ? (existing.completedAt || now) : undefined;
    }
    existing.watchedPercentage = Math.max(existing.watchedPercentage || 0, watchedPercentage);
    existing.lastWatchedSeconds = Math.max(existing.lastWatchedSeconds || 0, lastWatchedSeconds);
    existing.lastAccessedAt = now;
  } else {
    details.push({
      lessonId,
      completed: completed === true,
      completedAt: completed ? now : undefined,
      watchedPercentage,
      lastWatchedSeconds,
      lastAccessedAt: now,
    });
  }

  progress.lessonProgress = details;
};

const updateProgress = async (courseId, userId, lessonId, completed, meta = {}) => {
  const course = await Course.findById(courseId);
  if (!course) throw new ApiError(404, 'دوره یافت نشد');
  if (!isEnrolled(course, userId)) throw new ApiError(403, 'شما در این دوره ثبت‌نام نکرده‌اید');

  const normalizedLessonId = normalizeLessonId(course, lessonId);
  const validLessonIds = getCourseLessonIds(course);
  if (!validLessonIds.includes(normalizedLessonId)) {
    throw new ApiError(400, 'شناسه درس نامعتبر است');
  }

  const progress = await getOrCreateProgress(courseId, userId);
  progress.lastWatchedLesson = normalizedLessonId;
  progress.lastAccessed = new Date();
  if (!progress.startedAt) progress.startedAt = new Date();

  updateLessonDetail(progress, normalizedLessonId, completed, meta);

  if (completed === true) {
    if (!progress.completedLessons.map(String).includes(normalizedLessonId)) {
      progress.completedLessons.push(normalizedLessonId);
    }
  } else if (completed === false && !meta.trackOnly) {
    progress.completedLessons = (progress.completedLessons || []).filter(
      (id) => normalizeLessonId(course, id) !== normalizedLessonId
    );
  }

  await recalculateProgress(course, progress);
  await progress.save();

  return buildProgressResponse(course, progress, normalizedLessonId, completed);
};

const buildProgressResponse = (course, progress, lessonId = null, completed = null) => ({
  courseId: course._id,
  lessonId,
  completed,
  progress: {
    completedLessons: progress.completedLessons || [],
    lessonProgress: progress.lessonProgress || [],
    completionPercentage: progress.completionPercentage || 0,
    totalLessons: progress.totalLessons || getCourseLessonIds(course).length,
    lastWatchedLesson: progress.lastWatchedLesson,
    lastAccessed: progress.lastAccessed,
    startedAt: progress.startedAt,
    completedAt: progress.completedAt,
    certificateIssued: progress.certificateIssued || false,
  },
});

const getProgress = async (courseId, userId) => {
  const course = await Course.findById(courseId);
  if (!course) throw new ApiError(404, 'دوره یافت نشد');
  if (!isEnrolled(course, userId)) return null;

  const progress = await getOrCreateProgress(courseId, userId);
  progress.lastAccessed = progress.lastAccessed || new Date();
  await recalculateProgress(course, progress);
  await progress.save();

  const certificate = await Certificate.findOne({ user: userId, course: courseId });

  return {
    completedLessons: progress.completedLessons || [],
    lessonProgress: progress.lessonProgress || [],
    totalLessons: progress.totalLessons || getCourseLessonIds(course).length,
    completionPercentage: progress.completionPercentage || 0,
    lastWatchedLesson: progress.lastWatchedLesson,
    lastAccessed: progress.lastAccessed,
    startedAt: progress.startedAt,
    completedAt: progress.completedAt,
    certificateIssued: progress.certificateIssued || false,
    certificate: certificate ? {
      certificateNumber: certificate.certificateNumber,
      issuedAt: certificate.issuedAt,
    } : null,
  };
};

const issueCertificate = async (courseId, userId, progress) => {
  const existingCertificate = await Certificate.findOne({ user: userId, course: courseId });
  if (existingCertificate) return existingCertificate;

  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const certificateNumber = `CERT-${timestamp}-${random}`;

  return Certificate.create({
    user: userId,
    course: courseId,
    progress: progress._id,
    certificateNumber,
    completedAt: progress.completedAt || new Date(),
  });
};

module.exports = {
  getOrCreateProgress,
  updateProgress,
  getProgress,
  issueCertificate,
  recalculateProgress,
  normalizeLessonId,
  getCourseLessonIds,
};
