export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: 'admin' | 'teacher' | 'student';
  avatar?: string;
  emailVerified?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

