const axios = require('axios');

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

async function test() {
  try {
    // تست login
    console.log('🔐 تست ورود...');
    const loginRes = await axiosInstance.post('/auth/login', {
      phone: '09123456789',
      password: 'Test123456'
    });
    
    console.log('✅ Login موفق:', loginRes.status);
    console.log('📦 Cookie headers:', loginRes.headers['set-cookie']);
    
    // تست get me
    console.log('\n👤 تست دریافت اطلاعات کاربر...');
    const meRes = await axiosInstance.get('/auth/me');
    
    console.log('✅ Get me موفق:', meRes.status);
    console.log('👤 کاربر:', meRes.data.data?.user?.name);
    
  } catch (error) {
    console.error('❌ خطا:', error.response?.status, error.response?.data);
  }
}

test();


