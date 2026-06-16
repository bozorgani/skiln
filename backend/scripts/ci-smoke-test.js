require('dotenv').config();
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const User = require('../src/modules/users/user.model');

const API_URL = process.env.API_URL || `http://127.0.0.1:${process.env.PORT || 5000}/api`;
const JWT_SECRET = process.env.JWT_SECRET || 'ci-test-secret-change-in-production';

const jsonFetch = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${path} failed: ${response.status} ${JSON.stringify(body)}`);
  }
  return body;
};

const signToken = (user, client) => jwt.sign({
  sub: user._id,
  role: user.role,
  client,
}, JWT_SECRET, { expiresIn: '15m' });

const main = async () => {
  await connectDB();

  const suffix = Date.now().toString().slice(-8);
  const admin = await User.create({
    name: `CI Admin ${suffix}`,
    phone: `091${suffix}`.slice(0, 11).padEnd(11, '0'),
    role: 'admin',
  });
  const student = await User.create({
    name: `CI Student ${suffix}`,
    phone: `092${suffix}`.slice(0, 11).padEnd(11, '1'),
    role: 'student',
  });

  const adminToken = signToken(admin, 'admin-panel');
  const studentToken = signToken(student, 'frontend');

  const health = await jsonFetch('/health');
  assert.equal(health.status, 'ok');

  const docsResponse = await fetch(`${API_URL}/docs/openapi.yaml`);
  assert.equal(docsResponse.ok, true);

  const courseResponse = await jsonFetch('/courses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      title: `CI Smoke Course ${suffix}`,
      description: 'Course created by CI smoke test',
      shortDescription: 'CI smoke course',
      price: 1000,
      thumbnail: '/uploads/images/ci-placeholder.jpg',
      status: 'published',
      category: 'CI',
      level: 'Beginner',
      sections: [
        {
          title: 'Section 1',
          isFree: true,
          lessons: [{ title: 'Lesson 1', isFree: true, duration: 5 }],
        },
      ],
    }),
  });
  const course = courseResponse.data;
  assert.ok(course?._id);

  const publicCourses = await jsonFetch('/courses?category=CI&limit=5');
  assert.ok(Array.isArray(publicCourses.data.courses));

  const blogResponse = await jsonFetch('/blogs', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      title: `CI Smoke Blog ${suffix}`,
      content: '<h2>Hello</h2><script>alert(1)</script><p>Safe content</p>',
      excerpt: 'CI blog excerpt',
      category: 'CI',
      tags: ['ci', 'smoke'],
      isPublished: true,
    }),
  });
  assert.ok(blogResponse.data.blog._id);
  assert.equal(blogResponse.data.blog.content.includes('<script>'), false);

  const intent = await jsonFetch('/payments/create-intent', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({ courseId: course._id }),
  });
  assert.equal(intent.data.paymentRequired, true);
  assert.ok(intent.data.paymentId);

  const paid = await jsonFetch('/payments/test-payment', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({ paymentId: intent.data.paymentId }),
  });
  assert.equal(paid.data.success, true);
  assert.equal(paid.data.payment.status, 'succeeded');

  const payment = await jsonFetch(`/payments/${intent.data.paymentId}`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert.equal(payment.data.payment.status, 'succeeded');

  console.log('CI smoke test passed');
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
