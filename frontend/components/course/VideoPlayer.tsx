'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ReactPlayer from 'react-player';
import { progressAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { CheckCircle2, Play } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  lessonId: string;
  courseId: string;
  enrollment: any;
  lesson?: any; // Current lesson object
  course?: any; // Course object
  nextLesson?: any; // Next lesson object
  nextLessonId?: string | null;
  autoNavigate?: boolean; // برای فعال/غیرفعال کردن auto-navigation
  isAdmin?: boolean;
}

export default function VideoPlayer({ 
  url, 
  lessonId, 
  courseId, 
  enrollment, 
  lesson,
  course,
  nextLesson,
  nextLessonId,
  autoNavigate = true,
  isAdmin: isAdminProp,
}: VideoPlayerProps) {
  const { user } = useAuth();
  const isAdmin = isAdminProp || user?.role === 'admin';
  const { toast } = useToast();
  const router = useRouter();
  const [completed, setCompleted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [player, setPlayer] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const hasNavigated = useRef(false); // برای جلوگیری از navigate چندباره

  // Mount effect - only run on client
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (enrollment) {
      const isCompleted = enrollment.progress?.completedLessons?.some(
        (id: string) => id.toString() === lessonId
      );
      setCompleted(!!isCompleted);
    }
    // Reset navigation flag when lesson changes
    hasNavigated.current = false;
  }, [enrollment, lessonId]);

  const handleProgress = async (progress: { played: number }) => {
    // Don't track progress for admins
    if (isAdmin) return;
    
    // Mark as completed when 90% watched
    if (progress.played >= 0.9 && !completed && enrollment && !hasNavigated.current) {
      try {
        await progressAPI.updateProgress(courseId, lessonId, true);
        setCompleted(true);
        
        // Check if we can navigate to next lesson
        // Only navigate if:
        // 1. Current lesson is free/preview OR course is free OR lesson is now completed
        // 2. AND next lesson exists and is accessible
        const isCurrentLessonFree = lesson?.isFree || lesson?.isPreview || false;
        const isCourseFree = course?.price === 0 || false;
        const isNextLessonFree = nextLesson?.isFree || nextLesson?.isPreview || false;
        const canAccessNextLesson = isNextLessonFree || isCourseFree || enrollment;
        
        const shouldNavigate = autoNavigate && 
          nextLessonId && 
          canAccessNextLesson && 
          (isCurrentLessonFree || isCourseFree || true); // true because lesson is now completed
        
        toast({
          title: 'درس تکمیل شد!',
          description: shouldNavigate
            ? 'در حال هدایت به درس بعدی...' 
            : 'عالی! این درس را با موفقیت تکمیل کردید.',
          variant: 'success',
        });
        
        hasNavigated.current = true;
        
        // Auto-navigate to next lesson after a short delay
        if (shouldNavigate) {
          setTimeout(() => {
            router.push(`/courses/${courseId}/lessons/${nextLessonId}`);
          }, 2000); // 2 seconds delay to show the toast
        }
      } catch (error) {
        console.error('Error updating progress:', error);
      }
    }
  };

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (player) {
      player.getInternalPlayer().playbackRate = rate;
    }
  };

  // Build full video URL if it's a relative path
  const getVideoUrl = () => {
    if (!url) {
      console.warn('[VideoPlayer] No URL provided');
      return '';
    }
    
    // If it's already a full URL (http/https/data), return as is
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      console.log('[VideoPlayer] Full URL:', url);
      return url;
    }
    
    // Build full URL from relative path
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const baseUrl = API_URL.replace('/api', '');
    const fullUrl = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
    console.log('[VideoPlayer] Constructed URL:', { original: url, full: fullUrl, baseUrl });
    return fullUrl;
  };
  
  const videoUrl = getVideoUrl();
  
  // Log video URL for debugging
  useEffect(() => {
    console.log('[VideoPlayer] Video URL:', videoUrl);
    console.log('[VideoPlayer] Lesson:', lesson);
    console.log('[VideoPlayer] Props:', { url, lessonId, courseId });
  }, [videoUrl, url, lessonId, courseId, lesson]);

  return (
    <div className="relative w-full h-full">
      <div className="w-full h-full bg-black">
        {mounted ? (
          videoUrl ? (
            <ReactPlayer
              ref={setPlayer}
              url={videoUrl}
              width="100%"
              height="100%"
              controls
              playbackRate={playbackRate}
              onProgress={handleProgress}
              onError={(error: any) => {
                console.error('[VideoPlayer] Error playing video:', error);
                console.error('[VideoPlayer] URL:', videoUrl);
                toast({
                  title: 'خطا در پخش ویدیو',
                  description: 'لطفاً بررسی کنید که لینک ویدیو معتبر است',
                  variant: 'destructive',
                });
              }}
              onReady={() => {
                console.log('[VideoPlayer] Video ready to play');
              }}
              config={{
                file: {
                  attributes: {
                    controlsList: 'nodownload',
                    style: {
                      width: '100%',
                      height: '100%',
                    },
                  },
                  forceVideo: true, // Force video player for file URLs
                  forceHLS: false, // Disable HLS if not needed
                  forceDASH: false, // Disable DASH if not needed
                },
                // Support multiple video formats
                youtube: {
                  playerVars: { controls: 1 },
                },
                vimeo: {
                  playerOptions: { responsive: true },
                },
              }}
              onStart={() => {
                console.log('[VideoPlayer] Video started playing');
              }}
              onBuffer={() => {
                console.log('[VideoPlayer] Video buffering...');
              }}
              onBufferEnd={() => {
                console.log('[VideoPlayer] Video buffer ended');
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <div className="text-center">
                <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold mb-2">ویدیو در دسترس نیست</p>
                <p className="text-sm text-muted-foreground">
                  لطفاً لینک ویدیو را در پنل مدیریت تنظیم کنید
                </p>
                {process.env.NODE_ENV === 'development' && (
                  <p className="text-xs mt-2 text-red-500">
                    Debug: url = {url || 'empty'}, videoUrl = {videoUrl || 'empty'}
                  </p>
                )}
              </div>
            </div>
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white">
            <div className="text-center">
              <div className="relative inline-block">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
                <Play className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-primary animate-pulse" />
              </div>
              <p className="text-sm mt-4 text-muted-foreground">در حال بارگذاری پخش‌کننده...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


