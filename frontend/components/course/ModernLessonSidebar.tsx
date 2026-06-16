'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Lock, Play, ChevronDown, ChevronUp, BookOpen, Clock, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

interface ModernLessonSidebarProps {
  courseId: string;
  course: any;
  lessons: any[];
  currentLessonId: string;
  enrollment: any;
  isAdmin?: boolean;
}

export default function ModernLessonSidebar({
  courseId,
  course,
  lessons,
  currentLessonId,
  enrollment,
  isAdmin: isAdminProp,
}: ModernLessonSidebarProps) {
  const { user } = useAuth();
  const isAdmin = isAdminProp || user?.role === 'admin';
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  
  // Group lessons by section
  const sections = course?.sections || [];
  const lessonsBySection = sections.map((section: any, sectionIndex: number) => {
    const sectionLessons = lessons.filter((lesson: any) => 
      lesson.sectionIndex === sectionIndex || lesson.sectionTitle === section.title
    );
    return {
      ...section,
      sectionIndex,
      lessons: sectionLessons,
    };
  });

  // Auto-expand section with current lesson
  const currentSectionIndex = lessons.findIndex((l: any) => l._id === currentLessonId);
  const currentSection = lessons[currentSectionIndex]?.sectionIndex ?? 0;
  if (!expandedSections.has(currentSection)) {
    setExpandedSections(new Set([...expandedSections, currentSection]));
  }

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const isCompleted = (lessonId: string) => {
    if (!enrollment?.progress) return false;
    return enrollment.progress.completedLessons?.some(
      (id: string) => {
        const idStr = id.toString();
        const lessonIdStr = lessonId.toString();
        return idStr === lessonIdStr || 
               idStr === lessonIdStr.replace(`${courseId}-`, '') ||
               lessonIdStr.includes(idStr);
      }
    ) || false;
  };
  
  const canAccessLesson = (lesson: any, prevLesson: any = null, allLessons: any[] = []) => {
    if (isAdmin) return true;
    
    const isSectionFree = lesson.sectionIsFree || false;
    const isLessonFree = lesson.isFree || lesson.isPreview || false;
    const isCourseFree = course?.price === 0 || false;
    
    // Free lessons can be accessed directly
    if (isSectionFree || isLessonFree || isCourseFree) return true;
    
    // If user is enrolled, check if previous lesson is completed
    if (enrollment) {
      // Find previous lesson index
      const currentIndex = allLessons.findIndex((l: any) => l._id === lesson._id);
      if (currentIndex > 0) {
        const previousLesson = allLessons[currentIndex - 1];
        // Check if previous lesson is completed
        const prevCompleted = isCompleted(previousLesson._id);
        return prevCompleted;
      }
      // First lesson can be accessed if enrolled
      return currentIndex === 0;
    }
    
    return false;
  };

  // Calculate progress
  const totalLessons = lessons.length;
  const completedLessons = enrollment?.progress?.completedLessons?.length || 0;
  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Course Info Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-indigo-500/5 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-indigo-600 text-white shadow-lg">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg font-bold line-clamp-2 mb-1">
                {course?.title || 'دوره'}
              </CardTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{totalLessons} درس</span>
              </div>
            </div>
          </div>
        </CardHeader>
        {enrollment && !isAdmin && (
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-muted-foreground">پیشرفت دوره</span>
                <span className="text-primary font-bold">{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary via-indigo-600 to-purple-600 rounded-full transition-all duration-500 shadow-lg"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {completedLessons} از {totalLessons} درس تکمیل شد
                </span>
                {progressPercentage === 100 && (
                  <div className="flex items-center gap-1 text-green-600 font-bold">
                    <Award className="h-3.5 w-3.5" />
                    <span>تکمیل شد!</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Lessons List */}
      <Card className="border-2 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 via-transparent to-indigo-500/10 border-b sticky top-0 z-10">
          <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            محتوای دوره
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[calc(100vh-20rem)] overflow-y-auto">
            {(!sections || sections.length === 0) ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>هیچ جلسه‌ای موجود نیست</p>
                {process.env.NODE_ENV === 'development' && (
                  <p className="text-xs mt-2 text-red-500">
                    Debug: sections = {JSON.stringify(sections?.length || 0)}, 
                    lessons = {lessons?.length || 0}, 
                    course = {course ? 'exists' : 'null'}
                  </p>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {lessonsBySection.map((section: any, sectionIdx: number) => {
                  const isExpanded = expandedSections.has(section.sectionIndex);
                  const sectionLessons = section.lessons || [];
                  const sectionCompletedLessons = sectionLessons.filter((lesson: any) => 
                    isCompleted(lesson._id)
                  ).length;
                  const sectionProgress = sectionLessons.length > 0 
                    ? (sectionCompletedLessons / sectionLessons.length) * 100 
                    : 0;

                  return (
                    <div key={sectionIdx} className="bg-background">
                      {/* Section Header */}
                      <button
                        onClick={() => toggleSection(section.sectionIndex)}
                        className="w-full p-4 hover:bg-accent/50 transition-colors duration-200"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={cn(
                              "flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm flex-shrink-0 transition-all",
                              isExpanded 
                                ? "bg-gradient-to-br from-primary to-indigo-600 text-white shadow-lg" 
                                : "bg-muted text-muted-foreground"
                            )}>
                              {section.sectionIndex + 1}
                            </div>
                            <div className="flex-1 min-w-0 text-right">
                              <h3 className="font-bold text-sm sm:text-base truncate">
                                {section.title}
                              </h3>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                <span>{sectionLessons.length} درس</span>
                                {enrollment && sectionLessons.length > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className={cn(
                                      sectionProgress === 100 ? "text-green-600 font-bold" : "text-muted-foreground"
                                    )}>
                                      {sectionCompletedLessons}/{sectionLessons.length}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {enrollment && sectionLessons.length > 0 && (
                              <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden hidden sm:block">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all duration-500",
                                    sectionProgress === 100 
                                      ? "bg-gradient-to-r from-green-500 to-emerald-600" 
                                      : "bg-gradient-to-r from-primary to-indigo-600"
                                  )}
                                  style={{ width: `${sectionProgress}%` }}
                                />
                              </div>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Section Lessons */}
                      {isExpanded && (
                        <div className="bg-muted/20 divide-y divide-border/30">
                          {sectionLessons.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground text-xs">
                              درسی در این جلسه وجود ندارد
                            </div>
                          ) : (
                            sectionLessons.map((lesson: any, lessonIdx: number) => {
                              const isCurrent = lesson._id === currentLessonId || 
                                `${courseId}-${lesson._id}` === currentLessonId ||
                                lesson._id === currentLessonId.replace(`${courseId}-`, '');
                              const completed = !isAdmin && isCompleted(lesson._id);
                              
                              // Find previous lesson for access check
                              const lessonIndexInAll = lessons.findIndex((l: any) => l._id === lesson._id);
                              const prevLesson = lessonIndexInAll > 0 ? lessons[lessonIndexInAll - 1] : null;
                              
                              const isSectionFree = lesson.sectionIsFree || section.isFree || false;
                              const isLessonFree = lesson.isFree || lesson.isPreview || false;
                              const isCourseFree = course?.price === 0 || false;
                              
                              // Check if previous lesson is completed (for sequential access)
                              const prevCompleted = prevLesson ? isCompleted(prevLesson._id) : true;
                              // enrollment is truthy if it exists (object), so we check !!enrollment
                              const canAccess = isAdmin || 
                                isSectionFree || 
                                isLessonFree || 
                                isCourseFree || 
                                (!!enrollment && (lessonIndexInAll === 0 || prevCompleted));

                              return (
                                <Link
                                  key={lesson._id}
                                  href={canAccess ? `/courses/${courseId}/lessons/${lesson._id}` : '#'}
                                  className={cn(
                                    'block p-3 pr-6 hover:bg-accent/70 transition-all duration-200 border-r-2',
                                    isCurrent 
                                      ? 'bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary shadow-md' 
                                      : 'border-transparent hover:border-primary/30',
                                    !canAccess && 'opacity-60 cursor-not-allowed'
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0">
                                      {completed ? (
                                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                          <CheckCircle2 className="h-4 w-4 text-white" />
                                        </div>
                                      ) : canAccess ? (
                                        <div className={cn(
                                          "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                                          isCurrent 
                                            ? "bg-gradient-to-br from-primary to-indigo-600 text-white shadow-lg" 
                                            : "bg-muted text-muted-foreground group-hover:bg-primary/20"
                                        )}>
                                          <Play className="h-3 w-3 fill-current" />
                                        </div>
                                      ) : (
                                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                                          <Lock className="h-3 w-3 text-muted-foreground" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={cn(
                                        "text-xs sm:text-sm font-medium truncate mb-0.5",
                                        isCurrent 
                                          ? "text-primary font-bold" 
                                          : completed 
                                            ? "text-green-700 dark:text-green-400" 
                                            : "text-foreground"
                                      )}>
                                        {lesson.title}
                                      </p>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        <span>{lesson.duration || 0} دقیقه</span>
                                        {(isSectionFree || isLessonFree) && (
                                          <>
                                            <span>•</span>
                                            <span className="text-green-600 font-bold text-[10px]">رایگان</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </Link>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

