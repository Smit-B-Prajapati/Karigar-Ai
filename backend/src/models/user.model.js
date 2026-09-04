import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/env.config.js';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter your full name'],
    trim: true,
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    sparse: true, // allows null/undefined while preserving uniqueness
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address'],
  },
  phone: {
    type: String,
    trim: true,
    sparse: true,
  },
  password: {
    type: String,
    required: [true, 'Please enter a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Do not expose password by default
  },
  preferredLanguage: {
    type: String,
    enum: ['EN', 'HI', 'GU'],
    default: 'EN',
  },
  location: {
    type: String,
    default: 'India',
  },
  avatar: {
    type: String,
    default: '',
  },
  storeName: {
    type: String,
    default: '',
  },
  craftType: {
    type: String,
    default: 'Indian Handicrafts & Textiles',
  },
  experienceYears: {
    type: Number,
    default: 5,
  },
  upiId: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


// Custom validator: Ensure either email or phone is provided
userSchema.pre('validate', function () {
  if (!this.email && !this.phone) {
    this.invalidate('email', 'Please provide either an email or phone number');
  }
});

// Pre-save hook: Secure bcrypt password hashing
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method: Compare input password with hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method: Generate JWT auth token
userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email, name: this.name },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

export const User = mongoose.model('User', userSchema);
export default User;
