'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import Link from 'next/link';

interface Lesson {
  id: string;
  title: string;
  content: string;
  order: number;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  lesson_id: string;
}

interface CourseData {
  id: string;
  title: string;
  description: string;
}

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const [course, setCourse] = useState<CourseData | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissionText, setSubmissionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const loadCourse = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth/signin');
          return;
        }

        // Load course
        const { data: courseData } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();

        if (courseData) setCourse(courseData);

        // Load lessons
        const { data: lessonsData } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', courseId)
          .order('order', { ascending: true });

        if (lessonsData) setLessons(lessonsData);

        // Load assignments for current lesson
        if (lessonsData && lessonsData.length > 0) {
          const { data: assignmentsData } = await supabase
            .from('assignments')
            .select('*')
            .eq('lesson_id', lessonsData[0].id);

          if (assignmentsData) setAssignments(assignmentsData);
        }
      } catch (err) {
        console.error('Error loading course:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [courseId, router, supabase]);

  const currentLesson = lessons[currentLessonIndex];

  const handleLessonChange = async (index: number) => {
    setCurrentLessonIndex(index);
    setSubmissionText('');

    // Load assignments for the new lesson
    if (lessons[index]) {
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('*')
        .eq('lesson_id', lessons[index].id);

      if (assignmentsData) setAssignments(assignmentsData);
    }

    // Update progress
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const newProgress = Math.round(((index + 1) / lessons.length) * 100);
      await supabase
        .from('enrollments')
        .update({ progress: newProgress })
        .eq('user_id', session.user.id)
        .eq('course_id', courseId);

      // Award certificate if course is completed
      if (newProgress === 100) {
        try {
          await fetch('/api/certificates/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: session.user.id,
              courseId,
            }),
          });
          alert('Congratulations! You have completed the course and earned a certificate!');
        } catch (err) {
          console.error('Error generating certificate:', err);
        }
      }
    }
  };

  const handleSubmitAssignment = async (assignmentId: string) => {
    if (!submissionText.trim()) return;

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await supabase.from('submissions').insert([
        {
          user_id: session.user.id,
          assignment_id: assignmentId,
          content: submissionText,
          status: 'completed',
          submitted_at: new Date(),
        },
      ]);

      setSubmissionText('');
      alert('Assignment submitted successfully!');
    } catch (err) {
      console.error('Error submitting assignment:', err);
      alert('Error submitting assignment');
    } finally {
      setSubmitting(false);
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
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/learner/dashboard">
            <Button variant="ghost" className="gap-2">
              <ChevronLeft className="w-5 h-5" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{course?.title}</h1>
          <div className="w-32"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar - Lessons */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-4 sticky top-4">
              <h2 className="font-semibold text-foreground mb-4">Lessons</h2>
              <div className="space-y-2">
                {lessons.map((lesson, index) => (
                  <button
                    key={lesson.id}
                    onClick={() => handleLessonChange(index)}
                    className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${
                      index === currentLessonIndex
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    {index <= currentLessonIndex ? (
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 flex-shrink-0" />
                    )}
                    <span className="text-sm">{lesson.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {currentLesson && (
              <>
                {/* Lesson Content */}
                <div className="bg-card border border-border rounded-lg p-8">
                  <h2 className="text-3xl font-bold text-foreground mb-6">
                    {currentLesson.title}
                  </h2>
                  <div className="prose prose-invert max-w-none">
                    <div className="text-foreground whitespace-pre-wrap leading-relaxed">
                      {currentLesson.content}
                    </div>
                  </div>
                </div>

                {/* Assignments */}
                {assignments.length > 0 && (
                  <div className="bg-card border border-border rounded-lg p-8">
                    <h3 className="text-xl font-bold text-foreground mb-6">
                      Assignments
                    </h3>
                    <div className="space-y-6">
                      {assignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="border border-border rounded-lg p-6 bg-background"
                        >
                          <h4 className="text-lg font-semibold text-foreground mb-2">
                            {assignment.title}
                          </h4>
                          <p className="text-muted-foreground mb-4">
                            {assignment.description}
                          </p>
                          <div className="space-y-3">
                            <Textarea
                              placeholder="Write your solution here..."
                              value={submissionText}
                              onChange={(e) => setSubmissionText(e.target.value)}
                              className="bg-card border-border text-foreground placeholder:text-muted-foreground min-h-32"
                            />
                            <Button
                              onClick={() => handleSubmitAssignment(assignment.id)}
                              disabled={submitting || !submissionText.trim()}
                              className="w-full"
                            >
                              {submitting ? 'Submitting...' : 'Submit Assignment'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <Button
                    onClick={() => handleLessonChange(currentLessonIndex - 1)}
                    disabled={currentLessonIndex === 0}
                    variant="outline"
                    className="gap-2"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Previous
                  </Button>

                  <span className="text-sm text-muted-foreground">
                    Lesson {currentLessonIndex + 1} of {lessons.length}
                  </span>

                  <Button
                    onClick={() => handleLessonChange(currentLessonIndex + 1)}
                    disabled={currentLessonIndex === lessons.length - 1}
                    className="gap-2"
                  >
                    Next
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
