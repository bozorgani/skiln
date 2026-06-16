const mongoose = require('mongoose');
const slugify = require('slugify');

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    description: { type: String, trim: true },
    excerpt: { type: String, trim: true, maxlength: 500 },
    thumbnail: String,
    featuredImage: String,
    content: { type: String, required: true },
    category: { type: String, default: 'عمومی', trim: true, index: true },
    tags: [{ type: String, trim: true }],
    readingTime: { type: Number, default: 5, min: 1 },
    views: { type: Number, default: 0, min: 0 },
    likes: { type: Number, default: 0, min: 0 },
    publishedAt: Date,
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

blogSchema.index({ title: 'text', description: 'text', excerpt: 'text', content: 'text', tags: 'text' }, { default_language: 'none' });

blogSchema.pre('validate', async function setDerivedFields(next) {
  if (this.isModified('title') || !this.slug) {
    const baseSlug = slugify(this.title || '', { lower: true, strict: true }) || `post-${Date.now()}`;
    let slugCandidate = baseSlug;
    let counter = 1;

    while (
      await this.constructor.exists({
        slug: slugCandidate,
        _id: { $ne: this._id },
      })
    ) {
      slugCandidate = `${baseSlug}-${counter}`;
      counter += 1;
    }

    this.slug = slugCandidate;
  }

  if (!this.description && this.excerpt) {
    this.description = this.excerpt;
  }
  if (!this.excerpt && this.description) {
    this.excerpt = this.description.slice(0, 500);
  }
  if (!this.thumbnail && this.featuredImage) {
    this.thumbnail = this.featuredImage;
  }
  if (!this.featuredImage && this.thumbnail) {
    this.featuredImage = this.thumbnail;
  }
  if (this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  next();
});

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;
