const { z } = require('zod');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId');
const phoneNumber = z.string().regex(/^(?:\+98|0098|98|0)?9\d{9}$/, 'Invalid phone number');
const otpCode = z.string().regex(/^\d{4,8}$/, 'Invalid verification code');
const booleanLike = z.preprocess((value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}, z.boolean());

const optionalName = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().min(2).max(100).optional()
);

const authSchemas = {
  sendCode: z.object({ phoneNumber }),
  verifyCode: z.object({
    phoneNumber,
    code: otpCode,
    name: optionalName,
  }),
};

const lessonSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(1000).optional(),
  duration: z.coerce.number().min(0).optional(),
  content: z.string().optional(),
  isFree: booleanLike.optional(),
}).passthrough();

const sectionSchema = z.object({
  title: z.string().trim().min(1).max(200),
  lessons: z.array(lessonSchema).optional(),
  isFree: booleanLike.optional(),
}).passthrough();

const courseCreate = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().min(1).max(20000),
  shortDescription: z.string().trim().max(200).optional(),
  price: z.coerce.number().min(0),
  thumbnail: z.string().trim().optional(),
  teacher: objectId.optional(),
  sections: z.array(sectionSchema).optional(),
  status: z.enum(['draft', 'published']).optional(),
  category: z.string().trim().max(100).optional(),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
  duration: z.coerce.number().min(0).optional(),
}).passthrough();

const courseSchemas = {
  create: courseCreate,
  update: courseCreate.partial().refine((value) => Object.keys(value).length > 0, 'At least one field is required'),
  status: z.object({ status: z.enum(['draft', 'published']) }),
};

const blogBase = z.object({
  title: z.string().trim().min(2).max(250),
  content: z.string().min(1).max(200000),
  description: z.string().trim().max(1000).optional(),
  excerpt: z.string().trim().max(500).optional(),
  thumbnail: z.string().trim().optional(),
  featuredImage: z.string().trim().optional(),
  category: z.string().trim().max(100).optional(),
  tags: z.union([z.array(z.string().trim().max(60)), z.string()]).optional(),
  readingTime: z.coerce.number().min(1).max(240).optional(),
  isPublished: booleanLike.optional(),
  seo: z.object({
    metaTitle: z.string().trim().max(250).optional(),
    metaDescription: z.string().trim().max(500).optional(),
    keywords: z.array(z.string().trim().max(80)).optional(),
  }).optional(),
}).passthrough();

const blogSchemas = {
  create: blogBase,
  update: blogBase.partial().refine((value) => Object.keys(value).length > 0, 'At least one field is required'),
};

const paymentSchemas = {
  createIntent: z.object({
    courseId: objectId,
    couponCode: z.string().trim().max(100).optional(),
  }),
  testPayment: z.object({
    orderId: objectId.optional(),
    paymentId: objectId.optional(),
    courseId: objectId.optional(),
    amount: z.coerce.number().min(0).optional(),
  }).refine((value) => value.orderId || value.paymentId, 'orderId or paymentId is required'),
  adminPurchase: z.object({
    courseId: objectId,
    userId: objectId.optional(),
  }),
};

const categorySchemas = {
  create: z.object({
    name: z.string().trim().min(2).max(120),
    slug: z.string().trim().max(140).optional(),
    type: z.enum(['course', 'blog']),
    description: z.string().trim().max(1000).optional(),
    icon: z.string().trim().max(80).optional(),
    color: z.string().trim().max(120).optional(),
    order: z.coerce.number().min(0).max(100000).optional(),
    isActive: booleanLike.optional(),
  }),
  update: z.object({
    name: z.string().trim().min(2).max(120).optional(),
    slug: z.string().trim().max(140).optional(),
    type: z.enum(['course', 'blog']).optional(),
    description: z.string().trim().max(1000).optional(),
    icon: z.string().trim().max(80).optional(),
    color: z.string().trim().max(120).optional(),
    order: z.coerce.number().min(0).max(100000).optional(),
    isActive: booleanLike.optional(),
  }).refine((value) => Object.keys(value).length > 0, 'At least one field is required'),
};

const contactSchemas = {
  create: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(180),
    phone: z.string().trim().max(30).optional().or(z.literal('')),
    subject: z.string().trim().min(2).max(200),
    message: z.string().trim().min(10).max(5000),
  }),
  update: z.object({
    status: z.enum(['new', 'read', 'replied', 'closed']).optional(),
    reply: z.string().trim().max(5000).optional(),
  }).refine((value) => value.status || value.reply, 'status or reply is required'),
};

const reviewSchemas = {
  create: z.object({
    title: z.string().trim().max(160).optional(),
    content: z.string().trim().min(3).max(2000),
    rating: z.coerce.number().int().min(1).max(5),
  }),
  moderate: z.object({
    isApproved: booleanLike,
  }),
};

module.exports = {
  authSchemas,
  courseSchemas,
  blogSchemas,
  paymentSchemas,
  categorySchemas,
  contactSchemas,
  reviewSchemas,
  objectId,
};
