const mongoose = require('mongoose');
const slugify = require('slugify');

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    description: { type: String, required: true },
    thumbnail: String,
    content: { type: String, required: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

blogSchema.pre('validate', async function setSlug(next) {
  if (!this.isModified('title')) return next();
  const baseSlug = slugify(this.title, { lower: true, strict: true });
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
  next();
});

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;

