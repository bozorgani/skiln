export interface User {
  id: string;
  _id?: string;
  name: string;
  phone?: string;
  phoneNumber?: string;
  email?: string;
  role: 'admin' | 'teacher' | 'student' | 'user';
  avatar?: string;
  bio?: string;
  enrolledCourses?: any[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
