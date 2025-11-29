import { NextRequest, NextResponse } from 'next/server';

// This is a placeholder - videos will be saved from client-side
// We'll use this route if needed for server-side operations
export async function POST(request: NextRequest) {
  try {
    // Videos are saved directly from client-side using Firestore
    // This route can be used for additional server-side processing if needed
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in video save route:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process video' },
      { status: 500 }   
    );
  }
}

