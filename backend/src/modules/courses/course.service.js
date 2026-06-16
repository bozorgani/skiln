const ApiError = require('../../core/ApiError');
const Course = require('./course.model');

const courseProjection = 'title description shortDescription price thumbnail teacher sections students status category level duration createdAt updatedAt _id';

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
  return course;
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
  return course;
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
const getLessonsByCourse = async (courseId, userId = null) => {
  const course = await Course.findById(courseId).select('sections students price');
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }
  
  // Check if user is enrolled
  let isEnrolled = false;
  if (userId) {
    isEnrolled = course.students.some(
      (studentId) => studentId.toString() === userId.toString()
    );
    
    // Also check if there's a paid order (fallback check)
    if (!isEnrolled) {
      const Order = require('../orders/order.model');
      // Check for paid orders first, then check for any order (legacy data)
      let hasPaidOrder = await Order.findOne({
        user: userId,
        course: courseId,
        status: 'paid',
      });
      
      // If no paid order found, check for any order (legacy data without status field)
      if (!hasPaidOrder) {
        const anyOrder = await Order.findOne({
          user: userId,
          course: courseId,
        });
        // If order exists but has no status field, consider it as paid
        if (anyOrder && (!anyOrder.status || anyOrder.status === null)) {
          hasPaidOrder = anyOrder;
        }
      }
      
      if (hasPaidOrder) {
        // User has paid but not enrolled - enroll them now
        course.students.push(userId);
        await course.save();
        isEnrolled = true;
        console.log(`[Lessons Fix] User ${userId} was enrolled based on paid order`);
      }
    }
  }
  
  // Also check if course is free
  const isCourseFree = course.price === 0;
  
  const lessons = [];
  course.sections.forEach((section, sectionIndex) => {
    const isSectionFree = section.isFree || false;
    section.lessons.forEach((lesson, lessonIndex) => {
      // ایجاد یک _id مجازی برای هر درس (ترکیب courseId-sectionIndex-lessonIndex)
      const virtualId = `${courseId}-${sectionIndex}-${lessonIndex}`;
      lessons.push({
        ...lesson.toObject(),
        _id: virtualId, // _id مجازی برای استفاده در frontend
        sectionIndex,
        lessonIndex,
        sectionTitle: section.title,
        sectionIsFree: isSectionFree, // اضافه کردن فیلد isFree جلسه
      });
    });
  });
  
  return {
    lessons,
    isEnrolled: isEnrolled || isCourseFree, // User is enrolled if in students array or course is free
  };
};

const getLessonById = async (courseId, lessonIdOrIndex, sectionIndexOrNull) => {
  const course = await Course.findById(courseId).select('sections');
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }
  
  let sectionIndex, lessonIndex;
  
  // اگر lessonId به صورت "courseId-sectionIndex-lessonIndex" است
  if (typeof lessonIdOrIndex === 'string' && lessonIdOrIndex.includes('-')) {
    const parts = lessonIdOrIndex.split('-');
    if (parts.length === 3) {
      sectionIndex = parseInt(parts[1]);
      lessonIndex = parseInt(parts[2]);
    } else {
      throw new ApiError(400, 'Invalid lesson ID format');
    }
  } else if (sectionIndexOrNull !== null && sectionIndexOrNull !== undefined) {
    // اگر به صورت sectionIndex و lessonIndex فرستاده شده
    sectionIndex = parseInt(sectionIndexOrNull);
    lessonIndex = parseInt(lessonIdOrIndex);
  } else {
    // تلاش برای پیدا کردن درس با جستجو در تمام sections
    let found = false;
    for (let sIdx = 0; sIdx < course.sections.length; sIdx++) {
      const section = course.sections[sIdx];
      for (let lIdx = 0; lIdx < section.lessons.length; lIdx++) {
        const lesson = section.lessons[lIdx];
        // مقایسه با title (به عنوان fallback)
        if (lesson.title && typeof lessonIdOrIndex === 'string') {
          if (lesson.title === lessonIdOrIndex || `${courseId}-${sIdx}-${lIdx}` === lessonIdOrIndex) {
            sectionIndex = sIdx;
            lessonIndex = lIdx;
            found = true;
            break;
          }
        }
      }
      if (found) break;
    }
    if (!found) {
      throw new ApiError(404, 'Lesson not found');
    }
  }
  
  if (!course.sections[sectionIndex]) {
    throw new ApiError(404, 'Section not found');
  }
  
  if (!course.sections[sectionIndex].lessons[lessonIndex]) {
    throw new ApiError(404, 'Lesson not found');
  }
  
  const section = course.sections[sectionIndex];
  const isSectionFree = section.isFree || false;
  const virtualId = `${courseId}-${sectionIndex}-${lessonIndex}`;
  
  return {
    ...section.lessons[lessonIndex].toObject(),
    _id: virtualId, // _id مجازی
    sectionIndex,
    lessonIndex,
    sectionTitle: section.title,
    sectionIsFree: isSectionFree,
  };
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
  createLesson,
  updateLesson,
  deleteLesson,
};

