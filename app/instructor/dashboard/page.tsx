'use client';

import React from "react"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Users, BarChart3, Plus } from 'lucide-react';
import Link from 'next/link';

interface Course {
  id: string;
  title: string;
  description: string;
  language: string;
  level: string;
  lessons_count: number;
  enrollments_count: number;
}

interface UserProfile {
  id: string;
  full_name: string;
}

export default function InstructorDashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    language: 'Python',
    level: 'Beginner',
  });
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

        // Check if user is instructor
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileData?.role !== 'instructor') {
          router.push('/learner/dashboard');
          return;
        }

        setProfile(profileData);

        // Load instructor's courses
        const { data: coursesData } = await supabase
          .from('courses')
          .select('*')
          .eq('instructor_id', session.user.id);

        if (coursesData) {
          const coursesWithStats = await Promise.all(
            coursesData.map(async (course) => {
              const { count: enrollmentsCount } = await supabase
                .from('enrollments')
                .select('*', { count: 'exact', head: true })
                .eq('course_id', course.id);

              return {
                ...course,
                enrollments_count: enrollmentsCount || 0,
              };
            })
          );
          setCourses(coursesWithStats);
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router, supabase]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: newCourse, error } = await supabase
        .from('courses')
        .insert([
          {
            ...formData,
            instructor_id: session.user.id,
            created_at: new Date(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setCourses([
        ...courses,
        {
          ...newCourse,
          enrollments_count: 0,
        },
      ]);

      setFormData({ title: '', description: '', language: 'Python', level: 'Beginner' });
      setShowCreateModal(false);
    } catch (err) {
      console.error('Error creating course:', err);
      alert('Error creating course');
    } finally {
      setCreating(false);
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
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Instructor Portal
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome, {profile?.full_name}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowCreateModal(true)}
              className="gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Course
            </Button>
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
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Courses</p>
                <p className="text-3xl font-bold text-foreground">{courses.length}</p>
              </div>
              <BookOpen className="w-10 h-10 text-primary/20" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Enrollments</p>
                <p className="text-3xl font-bold text-foreground">
                  {courses.reduce((sum, c) => sum + c.enrollments_count, 0)}
                </p>
              </div>
              <Users className="w-10 h-10 text-primary/20" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Avg. Enrollments</p>
                <p className="text-3xl font-bold text-foreground">
                  {courses.length > 0
                    ? Math.round(
                        courses.reduce((sum, c) => sum + c.enrollments_count, 0) /
                          courses.length
                      )
                    : 0}
                </p>
              </div>
              <BarChart3 className="w-10 h-10 text-primary/20" />
            </div>
          </div>
        </div>

        {/* Courses */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Your Courses</h2>

          {courses.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">
                You haven't created any courses yet
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                Create Your First Course
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/instructor/course/${course.id}`}
                >
                  <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors cursor-pointer h-full">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded">
                        {course.language}
                      </span>
                      <span className="text-xs font-medium px-2 py-1 bg-muted text-muted-foreground rounded">
                        {course.level}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {course.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {course.lessons_count} lessons
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {course.enrollments_count} students
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Create New Course
            </h2>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Course Title
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Introduction to Python"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <Textarea
                  placeholder="Describe your course..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Language
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) =>
                      setFormData({ ...formData, language: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                  >
                    <option>Python</option>
                    <option>JavaScript</option>
                    <option>HTML</option>
                    <option>CSS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Level
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) =>
                      setFormData({ ...formData, level: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={creating}
                  className="flex-1"
                >
                  {creating ? 'Creating...' : 'Create Course'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
