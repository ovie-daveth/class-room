'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ChevronLeft,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
} from 'lucide-react';
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
  language: string;
  level: string;
}

export default function InstructorCoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const [course, setCourse] = useState<CourseData | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'lessons' | 'assignments'>('lessons');
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [lessonForm, setLessonForm] = useState({ title: '', content: '' });
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    lesson_id: '',
  });
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

        if (courseData) {
          if (courseData.instructor_id !== session.user.id) {
            router.push('/instructor/dashboard');
            return;
          }
          setCourse(courseData);
        }

        // Load lessons
        const { data: lessonsData } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', courseId)
          .order('order', { ascending: true });

        if (lessonsData) setLessons(lessonsData);

        // Load assignments
        const { data: assignmentsData } = await supabase
          .from('assignments')
          .select('*')
          .in(
            'lesson_id',
            lessonsData?.map((l) => l.id) || []
          );

        if (assignmentsData) setAssignments(assignmentsData);
      } catch (err) {
        console.error('Error loading course:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [courseId, router, supabase]);

  const handleSaveLesson = async () => {
    if (!lessonForm.title || !lessonForm.content) return;

    try {
      if (editingLessonId) {
        // Update lesson
        const { error } = await supabase
          .from('lessons')
          .update(lessonForm)
          .eq('id', editingLessonId);

        if (error) throw error;

        setLessons(
          lessons.map((l) =>
            l.id === editingLessonId ? { ...l, ...lessonForm } : l
          )
        );
      } else {
        // Create new lesson
        const { data: newLesson, error } = await supabase
          .from('lessons')
          .insert([
            {
              ...lessonForm,
              course_id: courseId,
              order: lessons.length + 1,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        setLessons([...lessons, newLesson]);
      }

      setLessonForm({ title: '', content: '' });
      setEditingLessonId(null);
      setShowLessonForm(false);
    } catch (err) {
      console.error('Error saving lesson:', err);
      alert('Error saving lesson');
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;

    try {
      await supabase.from('lessons').delete().eq('id', lessonId);
      setLessons(lessons.filter((l) => l.id !== lessonId));
    } catch (err) {
      console.error('Error deleting lesson:', err);
      alert('Error deleting lesson');
    }
  };

  const handleSaveAssignment = async () => {
    if (!assignmentForm.title || !assignmentForm.description || !assignmentForm.lesson_id) return;

    try {
      const { data: newAssignment, error } = await supabase
        .from('assignments')
        .insert([assignmentForm])
        .select()
        .single();

      if (error) throw error;

      setAssignments([...assignments, newAssignment]);
      setAssignmentForm({ title: '', description: '', lesson_id: '' });
      setShowAssignmentForm(false);
    } catch (err) {
      console.error('Error saving assignment:', err);
      alert('Error saving assignment');
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    try {
      await supabase.from('assignments').delete().eq('id', assignmentId);
      setAssignments(assignments.filter((a) => a.id !== assignmentId));
    } catch (err) {
      console.error('Error deleting assignment:', err);
      alert('Error deleting assignment');
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
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/instructor/dashboard">
            <Button variant="ghost" className="gap-2 mb-4">
              <ChevronLeft className="w-5 h-5" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">{course?.title}</h1>
          <p className="text-muted-foreground mt-1">{course?.description}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-border">
          <button
            onClick={() => setActiveTab('lessons')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'lessons'
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent'
            }`}
          >
            Lessons ({lessons.length})
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'assignments'
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent'
            }`}
          >
            Assignments ({assignments.length})
          </button>
        </div>

        {/* Lessons Tab */}
        {activeTab === 'lessons' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">
                Course Lessons
              </h2>
              <Button
                onClick={() => {
                  setEditingLessonId(null);
                  setLessonForm({ title: '', content: '' });
                  setShowLessonForm(true);
                }}
                className="gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Lesson
              </Button>
            </div>

            {showLessonForm && (
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  {editingLessonId ? 'Edit Lesson' : 'New Lesson'}
                </h3>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Title
                  </label>
                  <Input
                    type="text"
                    placeholder="Lesson title"
                    value={lessonForm.title}
                    onChange={(e) =>
                      setLessonForm({ ...lessonForm, title: e.target.value })
                    }
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Content
                  </label>
                  <Textarea
                    placeholder="Lesson content..."
                    value={lessonForm.content}
                    onChange={(e) =>
                      setLessonForm({ ...lessonForm, content: e.target.value })
                    }
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground min-h-64"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleSaveLesson}
                    className="gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Save Lesson
                  </Button>
                  <Button
                    onClick={() => {
                      setShowLessonForm(false);
                      setEditingLessonId(null);
                      setLessonForm({ title: '', content: '' });
                    }}
                    variant="outline"
                    className="gap-2"
                  >
                    <X className="w-5 h-5" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className="bg-card border border-border rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {index + 1}. {lesson.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {lesson.content}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setEditingLessonId(lesson.id);
                        setLessonForm(lesson);
                        setShowLessonForm(true);
                      }}
                      size="sm"
                      variant="outline"
                      className="gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteLesson(lesson.id)}
                      size="sm"
                      variant="outline"
                      className="gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">
                Course Assignments
              </h2>
              <Button
                onClick={() => {
                  setAssignmentForm({
                    title: '',
                    description: '',
                    lesson_id: lessons[0]?.id || '',
                  });
                  setShowAssignmentForm(true);
                }}
                className="gap-2"
                disabled={lessons.length === 0}
              >
                <Plus className="w-5 h-5" />
                Add Assignment
              </Button>
            </div>

            {lessons.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Create lessons first to add assignments
                </p>
              </div>
            )}

            {showAssignmentForm && lessons.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  New Assignment
                </h3>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Lesson
                  </label>
                  <select
                    value={assignmentForm.lesson_id}
                    onChange={(e) =>
                      setAssignmentForm({
                        ...assignmentForm,
                        lesson_id: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                  >
                    {lessons.map((lesson) => (
                      <option key={lesson.id} value={lesson.id}>
                        {lesson.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Title
                  </label>
                  <Input
                    type="text"
                    placeholder="Assignment title"
                    value={assignmentForm.title}
                    onChange={(e) =>
                      setAssignmentForm({
                        ...assignmentForm,
                        title: e.target.value,
                      })
                    }
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description
                  </label>
                  <Textarea
                    placeholder="Assignment description..."
                    value={assignmentForm.description}
                    onChange={(e) =>
                      setAssignmentForm({
                        ...assignmentForm,
                        description: e.target.value,
                      })
                    }
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground min-h-24"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleSaveAssignment}
                    className="gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Save Assignment
                  </Button>
                  <Button
                    onClick={() => {
                      setShowAssignmentForm(false);
                      setAssignmentForm({
                        title: '',
                        description: '',
                        lesson_id: '',
                      });
                    }}
                    variant="outline"
                    className="gap-2"
                  >
                    <X className="w-5 h-5" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {assignments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No assignments yet. Create your first assignment.
                  </p>
                </div>
              ) : (
                assignments.map((assignment) => {
                  const lesson = lessons.find((l) => l.id === assignment.lesson_id);
                  return (
                    <div
                      key={assignment.id}
                      className="bg-card border border-border rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-foreground">
                          {assignment.title}
                        </h3>
                        <Button
                          onClick={() => handleDeleteAssignment(assignment.id)}
                          size="sm"
                          variant="outline"
                          className="gap-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {assignment.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Lesson: {lesson?.title}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
