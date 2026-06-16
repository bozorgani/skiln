export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  role: 'user' | 'admin';
  avatar?: string;
  enrolledCourses?: any[];
}

