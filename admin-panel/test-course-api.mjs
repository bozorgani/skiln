/**
 * Complete test script for course creation API
 * This script will:
 * 1. Login and get token
 * 2. Create a course with test data
 * 3. Show results
 */

import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Test credentials (use admin credentials)
const TEST_PHONE = '09123456789'; // Change if needed
const TEST_CODE = '1234'; // Development code

// Test course data
const testCourseData = {
  title: 'دوره تست API - ' + new Date().toISOString(),
  description: 'این یک دوره تستی است که از طریق API ایجاد می‌شود. این توضیحات کامل دوره است که برای تست API استفاده می‌شود.',
  shortDescription: 'دوره تستی برای بررسی API',
  thumbnail: 'https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=Test+Course',
  price: 50000,
  category: 'General',
  level: 'Beginner',
  duration: 120,
  isPublished: false
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCourseCreation() {
  console.log('🧪 Starting Complete Course Creation Test\n');
  console.log('='.repeat(60));
  
  let token = null;
  
  try {
    // Step 1: Send verification code
    console.log('\n📱 Step 1: Sending verification code...');
    console.log(`Phone: ${TEST_PHONE}`);
    
    const sendCodeResponse = await axios.post(
      `${API_URL}/auth/send-code`,
      { phoneNumber: TEST_PHONE },
      { timeout: 10000 }
    );
    
    if (!sendCodeResponse.data.success) {
      throw new Error('Failed to send code: ' + sendCodeResponse.data.message);
    }
    
    console.log('✅ Code sent successfully');
    
    // Get the actual code from response (development mode)
    let actualCode = TEST_CODE;
    if (sendCodeResponse.data.data?.code) {
      actualCode = sendCodeResponse.data.data.code;
      console.log(`📝 Verification code received: ${actualCode}`);
    } else {
      console.log(`📝 Using test code: ${actualCode}`);
    }
    
    // Wait a bit
    await sleep(1000);
    
    // Step 2: Verify code and get token
    console.log('\n🔐 Step 2: Verifying code and getting token...');
    console.log(`Using code: ${actualCode}`);
    
    const verifyResponse = await axios.post(
      `${API_URL}/auth/verify-code`,
      {
        phoneNumber: TEST_PHONE,
        code: actualCode,
        name: 'Test Admin'
      },
      { timeout: 10000 }
    );
    
    if (!verifyResponse.data.success || !verifyResponse.data.data?.token) {
      throw new Error('Failed to verify code: ' + (verifyResponse.data.message || 'No token received'));
    }
    
    token = verifyResponse.data.data.token;
    const user = verifyResponse.data.data.user;
    
    console.log('✅ Token received');
    console.log(`Token: ${token.substring(0, 30)}...`);
    console.log(`User: ${user.name || user.email || user.phoneNumber}`);
    console.log(`Role: ${user.role}`);
    
    if (user.role !== 'admin') {
      console.error('❌ User is not admin! Role:', user.role);
      process.exit(1);
    }
    
    // Wait a bit
    await sleep(500);
    
    // Step 3: Create course
    console.log('\n📚 Step 3: Creating course...');
    console.log('Course Data:');
    console.log(JSON.stringify(testCourseData, null, 2));
    
    const startTime = Date.now();
    
    console.log('Sending POST request to:', `${API_URL}/courses`);
    console.log('Request size:', JSON.stringify(testCourseData).length, 'bytes');
    
    const createResponse = await axios.post(
      `${API_URL}/courses`,
      testCourseData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000, // 60 seconds timeout
        validateStatus: (status) => status < 500 // Don't throw on 4xx errors
      }
    );
    
    const duration = Date.now() - startTime;
    
    console.log(`\n✅ Course creation completed in ${duration}ms`);
    console.log('Status:', createResponse.status);
    console.log('Response:');
    console.log(JSON.stringify(createResponse.data, null, 2));
    
    if (createResponse.data.success) {
      const course = createResponse.data.data?.course;
      console.log('\n🎉 Course created successfully!');
      console.log('Course ID:', course?._id || course?.id);
      console.log('Course Title:', course?.title);
      console.log('Course Price:', course?.price);
    } else {
      console.log('\n⚠️  Request completed but course creation failed');
      console.log('Error:', createResponse.data.message);
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
        console.error('⏱️  Timeout: Request took longer than expected');
      } else if (error.code === 'ECONNREFUSED') {
        console.error('🔌 Connection refused: Is API Gateway running on port 5000?');
      } else if (error.code === 'ECONNRESET') {
        console.error('🔌 Connection reset: Server closed the connection');
      }
    } else {
      console.error('❌ Error:', error.message);
      console.error('Stack:', error.stack);
    }
    
    process.exit(1);
  }
}

// Run the test
testCourseCreation();

