'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { BookOpen, Award, TrendingUp, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface Enrollment {
  course_id: string;
  course: {
    id: string;
    title: string;
    language: string;
  };
  progress: number;
  enrolled_at: string;
}

interface Submission {
  id: string;
  assignment: {
    title: string;
  };
  status: string;
  submitted_at: string;
}

export default function ProgressPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    totalProgress: 0,
    totalSubmissions: 0,
  });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth/signin');
          return;
        }

        // Load enrollments with course data
        const { data: enrollmentsData } = await supabase
          .from('enrollments')
          .select(`
            *,
            course:courses(id, title, language)
          `)
          .eq('user_id', session.user.id);

        if (enrollmentsData) {
          setEnrollments(enrollmentsData);

          const completed = enrollmentsData.filter(
            (e: any) => e.progress === 100
          ).length;
          const avgProgress = Math.round(
            enrollmentsData.reduce((sum: number, e: any) => sum + e.progress, 0) /
              enrollmentsData.length
          );

          setStats({
            totalCourses: enrollmentsData.length,
            completedCourses: completed,
            totalProgress: avgProgress || 0,
            totalSubmissions: 0,
          });
        }

        // Load submissions
        const { data: submissionsData } = await supabase
          .from('submissions')
          .select(`
            *,
            assignment:assignments(title)
          `)
          .eq('user_id', session.user.id)
          .order('submitted_at', { ascending: false })
          .limit(10);

        if (submissionsData) {
          setSubmissions(submissionsData);
          setStats((prev) => ({
            ...prev,
            totalSubmissions: submissionsData.length,
          }));
        }
      } catch (err) {
        console.error('Error loading progress:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const chartData = enrollments.map((enrollment: any) => ({
    name: enrollment.course.title.substring(0, 10),
    progress: enrollment.progress,
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Your Progress</h1>
            <p className="text-muted-foreground mt-1">
              Track your learning journey
            </p>
          </div>
          <Link href="/learner/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Courses Enrolled</p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.totalCourses}
                </p>
              </div>
              <BookOpen className="w-10 h-10 text-primary/20" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  Courses Completed
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.completedCourses}
                </p>
              </div>
              <Award className="w-10 h-10 text-primary/20" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  Average Progress
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.totalProgress}%
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-primary/20" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  Assignments Done
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.totalSubmissions}
                </p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-primary/20" />
            </div>
          </div>
        </div>

        {/* Charts */}
        {enrollments.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {/* Progress by Course */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">
                Progress by Course
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" stroke="var(--color-muted-foreground)" />
                  <YAxis stroke="var(--color-muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      color: 'var(--color-foreground)',
                    }}
                  />
                  <Bar dataKey="progress" fill="var(--color-primary)" radius={8} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Enrollment Timeline */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">
                Enrolled Courses
              </h2>
              <div className="space-y-4">
                {enrollments.map((enrollment: any) => (
                  <div key={enrollment.course_id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {enrollment.course.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {enrollment.course.language}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-primary">
                        {enrollment.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${enrollment.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Submissions */}
        {submissions.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-bold text-foreground mb-6">
              Recent Submissions
            </h2>
            <div className="space-y-3">
              {submissions.map((submission: any) => (
                <div
                  key={submission.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {submission.assignment.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(submission.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      submission.status === 'completed'
                        ? 'bg-primary/10 text-primary'
                        : submission.status === 'pending'
                          ? 'bg-yellow-500/10 text-yellow-500'
                          : 'bg-destructive/10 text-destructive'
                    }`}
                  >
                    {submission.status.charAt(0).toUpperCase() +
                      submission.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {enrollments.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">
              You haven't enrolled in any courses yet
            </p>
            <Link href="/learner/dashboard">
              <Button>Explore Courses</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
