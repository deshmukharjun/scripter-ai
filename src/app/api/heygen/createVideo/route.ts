import { NextRequest, NextResponse } from 'next/server';
import { cleanScriptForHeyGen } from '@/lib/scriptUtils';

// HeyGen API Base URL - V2 API
// Documentation: https://docs.heygen.com
const HEYGEN_API_BASE = 'https://api.heygen.com/v2';

export async function POST(request: NextRequest) {
  try {
    const { script, avatarId, voiceId, videoTitle } = await request.json();

    if (!script || typeof script !== 'string' || script.trim().length === 0) {
      return NextResponse.json(
        { error: 'Script is required' },
        { status: 400 }
      );
    }

    if (!process.env.HEYGEN_API_KEY) {
      return NextResponse.json(
        { error: 'HeyGen API key not configured. Please add HEYGEN_API_KEY to your environment variables.' },
        { status: 500 }
      );
    }

    // Default avatar and voice if not provided
    // You can get these from the listAvatars and listVoices endpoints
    const defaultAvatarId = '32dbf2775e394a51a96c75e5aadeeb86'; // Popular public avatar
    const defaultVoiceId = 'bf6c84a338974305a21c51edcaa77ec0'; // Default English voice

    // Clean the script to remove brackets and special markers for HeyGen
    const cleanedScript = cleanScriptForHeyGen(script);

    // Create video request - Using V2 API format
    // Documentation: https://docs.heygen.com/reference/create-avatar-video-v2
    const requestBody: any = {
      video_inputs: [
        {
          character: {
            type: 'avatar',
            avatar_id: avatarId || defaultAvatarId,
          },
          voice: {
            type: 'text',
            input_text: cleanedScript,
            voice_id: voiceId || defaultVoiceId,
          },
        },
      ],
      dimension: {
        width: 1280,
        height: 720,
      },
    };

    // Add optional fields
    if (videoTitle) {
      requestBody.title = videoTitle;
    }

    const createVideoResponse = await fetch(`${HEYGEN_API_BASE}/video/generate`, {
      method: 'POST',
      headers: {
        'X-Api-Key': process.env.HEYGEN_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!createVideoResponse.ok) {
      const errorText = await createVideoResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || createVideoResponse.statusText };
      }
      
      console.error('HeyGen API error details:', {
        status: createVideoResponse.status,
        statusText: createVideoResponse.statusText,
        url: `${HEYGEN_API_BASE}/video/generate`,
        error: errorData,
        requestBody: {
          video_inputs: [{ character: { type: 'avatar' }, voice: { type: 'text', input_text: cleanedScript.substring(0, 50) + '...' } }]
        }
      });
      
      return NextResponse.json(
        { 
          error: errorData.message || errorData.error || `HeyGen API error: ${createVideoResponse.statusText}`,
          details: errorData,
          status: createVideoResponse.status,
          hint: 'Please verify the API endpoint and request format in HeyGen documentation'
        },
        { status: createVideoResponse.status }
      );
    }

    const videoData = await createVideoResponse.json();
    
    // Return video data along with cleaned script for storage
    return NextResponse.json({
      ...videoData,
      cleanedScript, // Include cleaned script in response
    });
  } catch (error: any) {
    console.error('Error creating HeyGen video:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create video' },
      { status: 500 }
    );
  }
}

