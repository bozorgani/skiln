/**
 * Simple test script to create a course via API
 * Usage: 
 *   1. Get your token from browser: localStorage.getItem('token')
 *   2. Run: node test-create-course-simple.mjs YOUR_TOKEN_HERE
 *   OR: set TEST_TOKEN=YOUR_TOKEN_HERE && node test-create-course-simple.mjs
 */

import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Get token from command line argument or environment variable
const TOKEN = process.argv[2] || process.env.TEST_TOKEN;

// Simple test data without large image
const testCourseData = {
  title: 'دوره تست API - ' + new Date().toISOString(),
  description: 'این یک دوره تستی است که از طریق API ایجاد می‌شود.',
  shortDescription: 'دوره تستی',
  thumbnail: 'https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=Test',
  price: 50000,
  category: 'General',
  level: 'Beginner',
  duration: 120,
  isPublished: false
};

async function testCreateCourse() {
  console.log('🧪 Testing Course Creation API\n');
  console.log('='.repeat(50));
  
  if (!TOKEN) {
    console.error('❌ Error: Token is required!');
    console.log('\nUsage:');
    console.log('  node test-create-course-simple.mjs YOUR_TOKEN');
    console.log('  OR: set TEST_TOKEN=YOUR_TOKEN && node test-create-course-simple.mjs');
    console.log('\nGet your token from browser console:');
    console.log('  localStorage.getItem("token")');
    process.exit(1);
  }

  console.log('📝 Test Data:');
  console.log(JSON.stringify(testCourseData, null, 2));
  console.log('\n📡 Endpoint:', `${API_URL}/courses`);
  console.log('🔑 Token:', TOKEN.substring(0, 30) + '...\n');
  console.log('='.repeat(50));
  console.log('');

  try {
    const startTime = Date.now();
    
    console.log('⏳ Sending request...');

    const response = await axios.post(
      `${API_URL}/courses`,
      testCourseData,
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const duration = Date.now() - startTime;

    console.log(`\n✅ Success! (${duration}ms)`);
    console.log('📊 Status:', response.status);
    console.log('📦 Response:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log('\n🎉 Course created successfully!');
      const courseId = response.data.data?.course?._id || response.data.data?.course?.id;
      console.log('📚 Course ID:', courseId);
    }

  } catch (error) {
    console.error('\n❌ Error occurred!\n');
    
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📦 Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('❌ No response received from server');
      console.error('Request URL:', error.config?.url);
      
      if (error.code === 'ECONNABORTED') {
        console.error('⏱️  Timeout: Request took longer than 30 seconds');
      } else if (error.code === 'ECONNREFUSED') {
        console.error('🔌 Connection refused: Is API Gateway running on port 5000?');
      } else if (error.code === 'ECONNRESET') {
        console.error('🔌 Connection reset: Server closed the connection');
      }
    } else {
      console.error('❌ Error:', error.message);
    }
    
    process.exit(1);
  }
}

testCreateCourse();






