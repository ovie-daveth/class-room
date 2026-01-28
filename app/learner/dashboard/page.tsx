'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, BookOpen, Clock, Target } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  language: string;
  level: string;
  lessons_count: number;
  progress: number;
}

interface UserProfile {
  id: string;
  full_name: string;
  role: string;
}

export default function LearnerDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth/signin');
          return;
        }

        // Load profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileData) setProfile(profileData);

        // Load all courses
        const { data: coursesData } = await supabase
          .from('courses')
          .select('*')
          .limit(10);

        if (coursesData) {
          // Get enrollment status for each course
          const coursesWithProgress = await Promise.all(
            coursesData.map(async (course) => {
              const { data: enrollment } = await supabase
                .from('enrollments')
                .select('progress')
                .eq('course_id', course.id)
                .eq('user_id', session.user.id)
                .single();

              return {
                ...course,
                progress: enrollment?.progress || 0,
                isEnrolled: !!enrollment,
              };
            })
          );

          setCourses(coursesWithProgress);
          setEnrolledCourses(coursesWithProgress.filter((c: any) => c.isEnrolled));
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router, supabase]);

  const handleEnrollCourse = async (courseId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await supabase.from('enrollments').insert([
        {
          user_id: session.user.id,
          course_id: courseId,
          progress: 0,
          enrolled_at: new Date(),
        },
      ]);

      const { data: coursesData } = await supabase
        .from('courses')
        .select('*');

      if (coursesData) {
        const coursesWithProgress = await Promise.all(
          coursesData.map(async (course) => {
            const { data: enrollment } = await supabase
              .from('enrollments')
              .select('progress')
              .eq('course_id', course.id)
              .eq('user_id', session.user.id)
              .single();

            return {
              ...course,
              progress: enrollment?.progress || 0,
              isEnrolled: !!enrollment,
            };
          })
        );

        setCourses(coursesWithProgress);
        setEnrolledCourses(coursesWithProgress.filter((c: any) => c.isEnrolled));
      }
    } catch (err) {
      console.error('Error enrolling in course:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {profile?.full_name}
            </h1>
            <p className="text-muted-foreground mt-1">
              Continue your learning journey
            </p>
          </div>
          <Button
            onClick={() => {
              supabase.auth.signOut();
              router.push('/');
            }}
            variant="outline"
          >
            Sign Out
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* In Progress Courses */}
        {enrolledCourses.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Continue Learning
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course) => (
                <Link key={course.id} href={`/learner/course/${course.id}`}>
                  <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors cursor-pointer h-full">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-5 h-5 text-primary" />
                      <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded">
                        {course.language}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {course.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {course.description}
                    </p>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                          <span>Progress</span>
                          <span>{course.progress}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {course.lessons_count} lessons
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Available Courses */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Available Courses
          </h2>
          {courses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No courses available yet</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course: any) => (
                <div
                  key={course.id}
                  className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded">
                        {course.language}
                      </span>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 bg-muted text-muted-foreground rounded">
                      {course.level}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {course.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <Target className="w-4 h-4" />
                    {course.lessons_count} lessons
                  </div>
                  <Button
                    onClick={() => handleEnrollCourse(course.id)}
                    className="w-full"
                    disabled={course.isEnrolled}
                  >
                    {course.isEnrolled ? 'Enrolled' : 'Enroll Now'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
