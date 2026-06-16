import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

async function getLessons(courseId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Cookie'] = `token=${token.value}`;
    }
    
    const response = await fetch(`${API_URL}/courses/${courseId}/lessons`, {
      headers,
      credentials: 'include',
      next: { revalidate: 60 },
    });
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    return data.data?.lessons || [];
  } catch (error) {
    return [];
  }
}

export default async function LessonRedirectPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id, lessonId } = await params;
  
  // اگر lessonId به صورت عدد است (1, 2, 3...) باید به _id مجازی تبدیل شود
  const lessons = await getLessons(id);
  
  let targetLessonId = lessonId;
  
  // اگر lessonId یک عدد است، باید lesson را با index پیدا کنم
  if (/^\d+$/.test(lessonId)) {
    const lessonIndex = parseInt(lessonId) - 1; // lessonId از 1 شروع می‌شود
    if (lessons[lessonIndex]) {
      targetLessonId = lessons[lessonIndex]._id || `${id}-${lessons[lessonIndex].sectionIndex}-${lessons[lessonIndex].lessonIndex}`;
    }
  }
  
  // Redirect از /lesson/ به /lessons/ برای سازگاری
  redirect(`/courses/${id}/lessons/${targetLessonId}`);
}

