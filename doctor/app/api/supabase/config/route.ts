import { NextResponse } from 'next/server';
import { getSupabaseConfig, clearSupabaseCache } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  const config = getSupabaseConfig();
  return NextResponse.json({
    success: true,
    data: {
      project_id: config.projectId || '',
      url: config.url || '',
      has_anon_key: Boolean(config.anonKey && config.anonKey.length > 5),
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { project_id = '', anon_key = '', url = '' } = body;

    let targetUrl = url.trim();
    const targetProject = project_id.trim();
    const targetKey = anon_key.trim();

    if (targetProject && !targetUrl) {
      targetUrl = `https://${targetProject}.supabase.co`;
    }

    // Set process.env using dynamic key names to prevent Next.js SWC static AST string replacement
    const env = process.env as Record<string, string | undefined>;
    const kProjectId = 'NEXT_PUBLIC_' + 'SUPABASE_PROJECT_ID';
    const kAnonKey = 'NEXT_PUBLIC_' + 'SUPABASE_ANON_KEY';
    const kUrl = 'NEXT_PUBLIC_' + 'SUPABASE_URL';

    if (targetProject) {
      env.SUPABASE_PROJECT_ID = targetProject;
      env[kProjectId] = targetProject;
    }
    if (targetKey) {
      env.SUPABASE_ANON_KEY = targetKey;
      env[kAnonKey] = targetKey;
    }
    if (targetUrl) {
      env.SUPABASE_URL = targetUrl;
      env[kUrl] = targetUrl;
    }

    // Reset client cache
    clearSupabaseCache();

    // Persist to .env and .env.local
    const envLines = [
      `SUPABASE_PROJECT_ID=${targetProject}`,
      `SUPABASE_ANON_KEY=${targetKey}`,
      `SUPABASE_URL=${targetUrl}`,
      `NEXT_PUBLIC_SUPABASE_PROJECT_ID=${targetProject}`,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY=${targetKey}`,
      `NEXT_PUBLIC_SUPABASE_URL=${targetUrl}`,
    ].join('\n');

    try {
      const envPath = path.join(process.cwd(), '.env');
      fs.writeFileSync(envPath, envLines, 'utf-8');
      const envLocalPath = path.join(process.cwd(), '.env.local');
      fs.writeFileSync(envLocalPath, envLines, 'utf-8');
    } catch (e) {
      console.warn('Could not persist to .env:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase configuration saved successfully!',
      data: {
        project_id: targetProject,
        url: targetUrl,
        has_anon_key: Boolean(targetKey),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
