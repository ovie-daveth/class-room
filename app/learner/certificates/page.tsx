'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Award, Download, Share2 } from 'lucide-react';
import Link from 'next/link';

interface Certificate {
  id: string;
  course_id: string;
  course: {
    title: string;
    language: string;
  };
  issued_at: string;
  certificate_url: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const loadCertificates = async () => {
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

        // Load certificates
        const { data: certificatesData } = await supabase
          .from('certificates')
          .select(`
            *,
            course:courses(id, title, language)
          `)
          .eq('user_id', session.user.id)
          .order('issued_at', { ascending: false });

        if (certificatesData) setCertificates(certificatesData);
      } catch (err) {
        console.error('Error loading certificates:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCertificates();
  }, [router, supabase]);

  const generateCertificate = async (courseId: string, courseName: string) => {
    // Create a simple certificate using HTML canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Inner border
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

    // Title
    ctx.font = 'bold 64px Arial';
    ctx.fillStyle = '#6366f1';
    ctx.textAlign = 'center';
    ctx.fillText('Certificate of Completion', canvas.width / 2, 120);

    // Divider line
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(150, 160);
    ctx.lineTo(canvas.width - 150, 160);
    ctx.stroke();

    // Congratulations text
    ctx.font = 'italic 32px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('This is to certify that', canvas.width / 2, 240);

    // Student name
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#6366f1';
    ctx.fillText(profile?.full_name || 'Student', canvas.width / 2, 330);

    // Course text
    ctx.font = '28px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('has successfully completed the course', canvas.width / 2, 400);

    // Course name
    ctx.font = 'bold 40px Arial';
    ctx.fillStyle = '#6366f1';
    ctx.fillText(courseName, canvas.width / 2, 480);

    // Date
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    ctx.font = '20px Arial';
    ctx.fillStyle = '#999999';
    ctx.fillText(`Issued on ${today}`, canvas.width / 2, 580);

    // Certificate ID
    ctx.font = '14px Arial';
    ctx.fillStyle = '#666666';
    ctx.fillText(
      `Certificate ID: ${Math.random().toString(36).substring(2, 15)}`,
      canvas.width / 2,
      630
    );

    // Download the certificate
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `Certificate-${courseName.replace(/\s+/g, '-')}.png`;
    link.click();
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
              Your Certificates
            </h1>
            <p className="text-muted-foreground mt-1">
              Showcase your accomplishments
            </p>
          </div>
          <Link href="/learner/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {certificates.length === 0 ? (
          <div className="text-center py-20">
            <Award className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-50" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              No Certificates Yet
            </h2>
            <p className="text-muted-foreground mb-8">
              Complete courses to earn certificates. Keep learning!
            </p>
            <Link href="/learner/dashboard">
              <Button className="gap-2">
                Explore Courses
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert: any) => (
              <div
                key={cert.id}
                className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <Award className="w-10 h-10 text-primary" />
                  <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded">
                    {cert.course.language}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {cert.course.title}
                </h3>

                <p className="text-sm text-muted-foreground mb-6">
                  Issued on{' '}
                  {new Date(cert.issued_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>

                <div className="flex gap-2">
                  <Button
                    onClick={() =>
                      generateCertificate(cert.course_id, cert.course.title)
                    }
                    className="flex-1 gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 bg-transparent"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* How to Earn Certificates */}
        {certificates.length === 0 && (
          <div className="mt-16 bg-card border border-border rounded-lg p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              How to Earn Certificates
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold">1</span>
                </div>
                <h3 className="font-semibold text-foreground">Enroll in a Course</h3>
                <p className="text-sm text-muted-foreground">
                  Choose a course that interests you and start learning with structured lessons.
                </p>
              </div>

              <div className="space-y-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold">2</span>
                </div>
                <h3 className="font-semibold text-foreground">Complete Lessons</h3>
                <p className="text-sm text-muted-foreground">
                  Work through all lessons and submit assignments to progress through the course.
                </p>
              </div>

              <div className="space-y-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold">3</span>
                </div>
                <h3 className="font-semibold text-foreground">Earn Certificate</h3>
                <p className="text-sm text-muted-foreground">
                  Upon completion, receive a digital certificate to showcase your achievement.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
