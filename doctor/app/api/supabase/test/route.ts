import { NextResponse } from 'next/server';
import { testSupabaseConnection } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // ignore
    }

    const { url, anon_key } = body;
    const result = await testSupabaseConnection(url, anon_key);

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      configured: false,
      message: `Failed to test connection: ${err.message}`,
    });
  }
}
