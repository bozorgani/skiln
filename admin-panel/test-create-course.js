/**
 * Test script to create a course via API
 * Run with: node test-create-course.js
 */

const axios = require('axios');

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Test data - you can modify this
const testCourseData = {
  title: 'دوره تست API',
  description: 'این یک دوره تستی است که از طریق API ایجاد می‌شود. این توضیحات کامل دوره است.',
  shortDescription: 'دوره تستی برای بررسی API',
  thumbnail: 'https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=Test+Course',
  price: 50000,
  category: 'General',
  level: 'Beginner',
  duration: 120,
  isPublished: false
};

// Token - replace with your actual token
// You can get it from browser console: localStorage.getItem('token')
const TOKEN = process.env.TEST_TOKEN || 'YOUR_TOKEN_HERE';

async function testCreateCourse() {
  console.log('🧪 Starting course creation test...\n');
  console.log('📝 Test Data:');
  console.log(JSON.stringify(testCourseData, null, 2));
  console.log('\n');

  if (!TOKEN || TOKEN === 'YOUR_TOKEN_HERE') {
    console.error('❌ Error: Token is required!');
    console.log('Please set TEST_TOKEN environment variable or edit the script.');
    console.log('You can get your token from browser console: localStorage.getItem("token")');
    process.exit(1);
  }

  try {
    console.log('📡 Sending request to:', `${API_URL}/courses`);
    console.log('🔑 Using token:', TOKEN.substring(0, 20) + '...');
    console.log('\n');

    const startTime = Date.now();

    const response = await axios.post(
      `${API_URL}/courses`,
      testCourseData,
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000,
        validateStatus: (status) => status < 500 // Don't throw on 4xx errors
      }
    );

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('✅ Response received in', duration, 'ms');
    console.log('📊 Status:', response.status);
    console.log('📦 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log('\n🎉 Course created successfully!');
      console.log('📚 Course ID:', response.data.data?.course?._id || response.data.data?.course?.id);
    } else {
      console.log('\n⚠️  Request completed but course creation failed');
      console.log('❌ Error:', response.data.message);
    }

  } catch (error) {
    console.error('\n❌ Error occurred:');
    
    if (error.response) {
      // Server responded with error status
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Response Headers:', error.response.headers);
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received');
      console.error('Request config:', {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      });
    } else {
      // Error in request setup
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    if (error.code === 'ECONNABORTED') {
      console.error('\n⏱️  Request timeout - the server took too long to respond');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n🔌 Connection refused - is the API Gateway running?');
    } else if (error.code === 'ECONNRESET') {
      console.error('\n🔌 Connection reset - the server closed the connection');
    }

    process.exit(1);
  }
}

// Run the test
testCreateCourse();






