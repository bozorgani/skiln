const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const roles = ['admin', 'teacher', 'student'];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      sparse: true,
    },
    password: {
      type: String,
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: roles,
      default: 'student',
    },
    avatar: String,
    bio: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.toJSON = function removePassword() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

userSchema.statics.roles = roles;

const User = mongoose.model('User', userSchema);

module.exports = User;

