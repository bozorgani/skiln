const ApiError = require('../../core/ApiError');
const Course = require('./course.model');

const courseProjection = 'title description shortDescription price discountPercent thumbnail teacher sections students status category level duration ratings createdAt updatedAt _id';

const createCourse = async (payload) => {
  return Course.create(payload);
};

const updateCourse = async (id, payload) => {
  // استفاده از updateOne با $set برای به‌روزرسانی صحیح
  const result = await Course.updateOne(
    { _id: id },
    { $set: payload },
    { runValidators: true }
  );

  if (result.matchedCount === 0) {
    throw new ApiError(404, 'Course not found');
  }

  // بعد از آپدیت، دوره را برگردان
  const course = await Course.findById(id).select(courseProjection);
  
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }
  
  return course;
};

const toPositiveInt = (value, fallback, max = 100) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildSort = (sortValue, hasTextSearch = false) => {
  if (hasTextSearch && !sortValue) {
    return { score: { $meta: 'textScore' }, createdAt: -1 };
  }

  const allowed = new Set(['createdAt', 'updatedAt', 'price', 'title', 'duration', 'studentsEnrolled']);
  const raw = typeof sortValue === 'string' && sortValue.trim() ? sortValue.trim() : '-createdAt';
  const sort = {};

  raw.split(',').forEach((part) => {
    const field = part.trim();
    if (!field) return;
    const direction = field.startsWith('-') ? -1 : 1;
    const name = field.replace(/^-/, '');
    if (allowed.has(name)) {
      sort[name === 'studentsEnrolled' ? 'students' : name] = direction;
    }
  });

  return Object.keys(sort).length ? sort : { createdAt: -1 };
};

const listCourses = async (filters = {}) => {
  const query = {};
  const includeUnpublished =
    (filters.includeUnpublished === 'true' || filters.includeUnpublished === true) &&
    filters.canViewUnpublished === true;

  if (filters.status && ['draft', 'published'].includes(filters.status)) {
    query.status = filters.status === 'published' || includeUnpublished ? filters.status : 'published';
  } else if (filters.isPublished === 'true' || filters.isPublished === true) {
    query.status = 'published';
  } else if (!includeUnpublished) {
    query.status = 'published';
  }

  if (filters.teacher) query.teacher = filters.teacher;
  if (filters.category) query.category = new RegExp(`^${escapeRegex(String(filters.category).trim())}$`, 'i');
  if (filters.level && ['Beginner', 'Intermediate', 'Advanced'].includes(filters.level)) {
    query.level = filters.level;
  }

  const hasTextSearch = typeof filters.search === 'string' && filters.search.trim().length > 0;
  if (hasTextSearch) {
    query.$text = { $search: filters.search.trim() };
  }

  const page = toPositiveInt(filters.page, 1, 100000);
  const limit = toPositiveInt(filters.limit, 12, 100);
  const skip = (page - 1) * limit;
  const sort = buildSort(filters.sort, hasTextSearch);

  const [courses, total] = await Promise.all([
    Course.find(query, hasTextSearch ? { score: { $meta: 'textScore' } } : undefined)
      .populate('teacher', 'name email role')
      .select(courseProjection)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Course.countDocuments(query),
  ]);

  const normalizedCourses = courses.map((course) => ({
    ...course,
    studentsEnrolled: Array.isArray(course.students) ? course.students.length : 0,
  }));

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return {
    courses: normalizedCourses,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      limit,
      hasPrevPage: page > 1,
      hasNextPage: page < totalPages,
    },
  };
};

const getCourseById = async (id, filters = {}) => {
  const query = { _id: id };
  
  // بررسی includeUnpublished برای admin-panel
  const includeUnpublished =
    (filters.includeUnpublished === 'true' || filters.includeUnpublished === true) &&
    filters.canViewUnpublished === true;
  
  // اگر includeUnpublished نباشد (یعنی از سایت اصلی)، فقط دوره‌های published را نشان بده
  // اما اگر user درخواست داده و admin یا teacher است، می‌تواند draft را هم ببیند
  // برای امنیت بیشتر، به طور پیش‌فرض فقط published را نشان بده
  if (!includeUnpublished) {
    query.status = 'published';
  }
  
  const course = await Course.findOne(query)
    .populate('teacher', 'name email role')
    .populate('students', 'name email role')
    .select(courseProjection);

  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  const user = filters.user || null;
  const courseObject = course.toObject();
  const canSeeAllContent = user && (user.role === 'admin' || isTeacherOwner(course, user) || isStudentEnrolled(course, user._id));

  if (!canSeeAllContent && courseObject.sections) {
    for (let sectionIndex = 0; sectionIndex < courseObject.sections.length; sectionIndex += 1) {
      const section = courseObject.sections[sectionIndex];
      for (let lessonIndex = 0; lessonIndex < (section.lessons || []).length; lessonIndex += 1) {
        const lesson = section.lessons[lessonIndex];
        const canAccessPublic = courseObject.price === 0 || section.isFree || lesson.isFree || lesson.isPreview;
        if (!canAccessPublic) {
          delete lesson.content;
          delete lesson.videoUrl;
          lesson.locked = true;
          lesson.canAccess = false;
        } else {
          lesson.canAccess = true;
          lesson.locked = false;
        }
      }
    }
  }

  return courseObject;
};

const setCourseStatus = async (id, status) => {
  if (!['draft', 'published'].includes(status)) {
    throw new ApiError(400, 'Invalid course status');
  }
  return updateCourse(id, { status });
};

const enrollUser = async (courseId, userId) => {
  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }
  const alreadyEnrolled = course.students.some(
    (studentId) => studentId.toString() === userId.toString()
  );
  if (alreadyEnrolled) {
    return course;
  }
  course.students.push(userId);
  await course.save();
  return course.populate('students', 'name email role');
};

const deleteCourse = async (id) => {
  const course = await Course.findByIdAndDelete(id);
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  const user = filters.user || null;
  const courseObject = course.toObject();
  const canSeeAllContent = user && (user.role === 'admin' || isTeacherOwner(course, user) || isStudentEnrolled(course, user._id));

  if (!canSeeAllContent && courseObject.sections) {
    for (let sectionIndex = 0; sectionIndex < courseObject.sections.length; sectionIndex += 1) {
      const section = courseObject.sections[sectionIndex];
      for (let lessonIndex = 0; lessonIndex < (section.lessons || []).length; lessonIndex += 1) {
        const lesson = section.lessons[lessonIndex];
        const canAccessPublic = courseObject.price === 0 || section.isFree || lesson.isFree || lesson.isPreview;
        if (!canAccessPublic) {
          delete lesson.content;
          delete lesson.videoUrl;
          lesson.locked = true;
          lesson.canAccess = false;
        } else {
          lesson.canAccess = true;
          lesson.locked = false;
        }
      }
    }
  }

  return courseObject;
};

const getCourseAnalytics = async (id) => {
  const course = await Course.findById(id)
    .populate('teacher', 'name email')
    .populate('students', 'name email')
    .select(courseProjection);

  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  return {
    course,
    stats: {
      totalStudents: course.students?.length || 0,
      totalLessons: course.sections?.reduce((acc, section) => acc + (section.lessons?.length || 0), 0) || 0,
      totalSections: course.sections?.length || 0,
    },
  };
};

// Lessons management
const toIdString = (value) => (value?._id || value)?.toString();

const hasPaidOrder = async (courseId, userId) => {
  if (!userId) return false;
  const Order = require('../orders/order.model');
  const paidOrder = await Order.findOne({ user: userId, course: courseId, status: 'paid' });
  if (paidOrder) return true;

  const legacyOrder = await Order.findOne({ user: userId, course: courseId });
  return !!(legacyOrder && (!legacyOrder.status || legacyOrder.status === null));
};

const isTeacherOwner = (course, user) => {
  if (!course || !user || user.role !== 'teacher') return false;
  return toIdString(course.teacher) === toIdString(user);
};

const isStudentEnrolled = (course, userId) => {
  if (!course || !userId) return false;
  return course.students?.some((studentId) => toIdString(studentId) === userId.toString()) || false;
};

const canAccessLesson = async ({ course, section, lesson, user }) => {
  if (!course || !section || !lesson) return false;
  if (course.price === 0 || section.isFree || lesson.isFree || lesson.isPreview) return true;
  if (!user) return false;
  if (user.role === 'admin' || isTeacherOwner(course, user)) return true;
  if (isStudentEnrolled(course, user._id)) return true;

  const paid = await hasPaidOrder(course._id, user._id);
  if (paid) {
    course.students.push(user._id);
    await course.save();
    return true;
  }

  return false;
};

const parseVirtualLessonId = (courseId, lessonIdOrIndex, sectionIndexOrNull) => {
  if (typeof lessonIdOrIndex === 'string' && lessonIdOrIndex.includes('-')) {
    const parts = lessonIdOrIndex.split('-');
    if (parts.length === 3) {
      return {
        courseId: parts[0],
        sectionIndex: Number.parseInt(parts[1], 10),
        lessonIndex: Number.parseInt(parts[2], 10),
      };
    }
  }

  if (sectionIndexOrNull !== null && sectionIndexOrNull !== undefined) {
    return {
      courseId,
      sectionIndex: Number.parseInt(sectionIndexOrNull, 10),
      lessonIndex: Number.parseInt(lessonIdOrIndex, 10),
    };
  }

  return { courseId, sectionIndex: null, lessonIndex: null };
};

const buildLessonDto = ({ courseId, section, sectionIndex, lesson, lessonIndex, canAccess }) => {
  const dto = {
    ...lesson.toObject(),
    _id: `${courseId}-${sectionIndex}-${lessonIndex}`,
    sectionIndex,
    lessonIndex,
    sectionTitle: section.title,
    sectionIsFree: section.isFree || false,
    canAccess,
    locked: !canAccess,
  };

  if (!canAccess) {
    delete dto.content;
    delete dto.videoUrl;
  }

  return dto;
};

const getLessonsByCourse = async (courseId, user = null) => {
  const course = await Course.findById(courseId).select('sections students price teacher');
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  const lessons = [];
  for (let sectionIndex = 0; sectionIndex < course.sections.length; sectionIndex += 1) {
    const section = course.sections[sectionIndex];
    for (let lessonIndex = 0; lessonIndex < section.lessons.length; lessonIndex += 1) {
      const lesson = section.lessons[lessonIndex];
      const access = await canAccessLesson({ course, section, lesson, user });
      lessons.push(buildLessonDto({ courseId, section, sectionIndex, lesson, lessonIndex, canAccess: access }));
    }
  }

  const isEnrolled = user
    ? user.role === 'admin' || isTeacherOwner(course, user) || course.price === 0 || isStudentEnrolled(course, user._id)
    : course.price === 0;

  return { lessons, isEnrolled };
};

const getLessonById = async (courseId, lessonIdOrIndex, sectionIndexOrNull, user = null) => {
  const parsed = parseVirtualLessonId(courseId, lessonIdOrIndex, sectionIndexOrNull);
  const resolvedCourseId = parsed.courseId || courseId;
  const course = await Course.findById(resolvedCourseId).select('sections students price teacher');
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  let { sectionIndex, lessonIndex } = parsed;

  if (sectionIndex === null || lessonIndex === null || Number.isNaN(sectionIndex) || Number.isNaN(lessonIndex)) {
    let found = false;
    for (let sIdx = 0; sIdx < course.sections.length; sIdx += 1) {
      const section = course.sections[sIdx];
      for (let lIdx = 0; lIdx < section.lessons.length; lIdx += 1) {
        const lesson = section.lessons[lIdx];
        if (lesson.title === lessonIdOrIndex || `${resolvedCourseId}-${sIdx}-${lIdx}` === lessonIdOrIndex) {
          sectionIndex = sIdx;
          lessonIndex = lIdx;
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (!found) throw new ApiError(404, 'Lesson not found');
  }

  const section = course.sections[sectionIndex];
  if (!section) throw new ApiError(404, 'Section not found');

  const lesson = section.lessons[lessonIndex];
  if (!lesson) throw new ApiError(404, 'Lesson not found');

  const access = await canAccessLesson({ course, section, lesson, user });
  if (!access) {
    throw new ApiError(403, 'برای مشاهده این درس باید در دوره ثبت‌نام کنید');
  }

  return buildLessonDto({ courseId: resolvedCourseId, section, sectionIndex, lesson, lessonIndex, canAccess: true });
};

const findVideoLessonAccess = async (filename, user = null) => {
  const escaped = String(filename).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const course = await Course.findOne({
    'sections.lessons.content': { $regex: `(?:^|/)${escaped}(?:$|[?#])` },
  }).select('sections students price teacher');

  if (!course) return { found: false, canAccess: false };

  for (let sectionIndex = 0; sectionIndex < course.sections.length; sectionIndex += 1) {
    const section = course.sections[sectionIndex];
    for (let lessonIndex = 0; lessonIndex < section.lessons.length; lessonIndex += 1) {
      const lesson = section.lessons[lessonIndex];
      const content = lesson.content || lesson.videoUrl || '';
      if (new RegExp(`(?:^|/)${escaped}(?:$|[?#])`).test(content)) {
        const access = await canAccessLesson({ course, section, lesson, user });
        return { found: true, canAccess: access, course, sectionIndex, lessonIndex };
      }
    }
  }

  return { found: false, canAccess: false };
};

const createLesson = async (courseId, sectionIndex, lessonData) => {
  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }
  
  if (!course.sections[sectionIndex]) {
    throw new ApiError(404, 'Section not found');
  }
  
  course.sections[sectionIndex].lessons.push(lessonData);
  await course.save();
  
  const lesson = course.sections[sectionIndex].lessons[course.sections[sectionIndex].lessons.length - 1];
  return {
    ...lesson.toObject(),
    sectionIndex,
    lessonIndex: course.sections[sectionIndex].lessons.length - 1,
    sectionTitle: course.sections[sectionIndex].title,
  };
};

const updateLesson = async (courseId, sectionIndex, lessonIndex, lessonData) => {
  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }
  
  if (!course.sections[sectionIndex]) {
    throw new ApiError(404, 'Section not found');
  }
  
  if (!course.sections[sectionIndex].lessons[lessonIndex]) {
    throw new ApiError(404, 'Lesson not found');
  }
  
  Object.assign(course.sections[sectionIndex].lessons[lessonIndex], lessonData);
  await course.save();
  
  return {
    ...course.sections[sectionIndex].lessons[lessonIndex].toObject(),
    sectionIndex,
    lessonIndex,
    sectionTitle: course.sections[sectionIndex].title,
  };
};

const deleteLesson = async (courseId, sectionIndex, lessonIndex) => {
  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }
  
  if (!course.sections[sectionIndex]) {
    throw new ApiError(404, 'Section not found');
  }
  
  if (!course.sections[sectionIndex].lessons[lessonIndex]) {
    throw new ApiError(404, 'Lesson not found');
  }
  
  course.sections[sectionIndex].lessons.splice(lessonIndex, 1);
  await course.save();
  
  return { success: true };
};

module.exports = {
  createCourse,
  updateCourse,
  listCourses,
  getCourseById,
  setCourseStatus,
  enrollUser,
  deleteCourse,
  getCourseAnalytics,
  getLessonsByCourse,
  getLessonById,
  findVideoLessonAccess,
  createLesson,
  updateLesson,
  deleteLesson,
};

