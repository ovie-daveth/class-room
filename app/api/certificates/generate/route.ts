import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, courseId } = await request.json();

    if (!userId || !courseId) {
      return NextResponse.json(
        { error: 'Missing userId or courseId' },
        { status: 400 }
      );
    }

    // Check if enrollment exists and is complete
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    if (enrollment.progress !== 100) {
      return NextResponse.json(
        { error: 'Course not completed' },
        { status: 400 }
      );
    }

    // Check if certificate already exists
    const { data: existingCert } = await supabase
      .from('certificates')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (existingCert) {
      return NextResponse.json(
        { certificate: existingCert },
        { status: 200 }
      );
    }

    // Create certificate
    const { data: certificate, error: certError } = await supabase
      .from('certificates')
      .insert([
        {
          user_id: userId,
          course_id: courseId,
          issued_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (certError) {
      return NextResponse.json(
        { error: 'Failed to create certificate' },
        { status: 500 }
      );
    }

    return NextResponse.json({ certificate }, { status: 200 });
  } catch (error) {
    console.error('Certificate generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
