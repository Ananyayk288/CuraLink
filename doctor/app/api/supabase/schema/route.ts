import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const schemaPath = path.join(process.cwd(), 'supabase', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sqlContent = fs.readFileSync(schemaPath, 'utf-8');
      return new NextResponse(sqlContent, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }

    return NextResponse.json({ success: false, error: 'Schema file not found' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
