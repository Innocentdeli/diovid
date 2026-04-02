'use server';

interface TikTokUploadParams {
  accessToken: string;
  title: string;
  description: string;
  tags: string[];
  videoBuffer: Buffer;
  filename: string;
  visibility?: 'PUBLIC_TO_EVERYONE' | 'FOLLOWER_OF_CREATOR' | 'PRIVATE';
}

export async function uploadToTikTok({
  accessToken,
  title,
  description,
  tags,
  videoBuffer,
  filename,
  visibility = 'PUBLIC_TO_EVERYONE',
}: TikTokUploadParams): Promise<{ videoId: string; url: string } | { error: string }> {
  try {
    // TODO: Implement TikTok OAuth 2.0 flow
    // 1. Get video upload URL from TikTok API
    // 2. Upload video chunk to TikTok's CDN
    // 3. Publish video with metadata
    // 4. Return video ID and URL

    // Reference: https://developer.tiktok.com/doc/video-upload-api

    const formData = new FormData();
    formData.append('video_file', new Blob([videoBuffer as any]), filename);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('tags', tags.join(','));
    formData.append('visibility', visibility);

    // Placeholder - requires TikTok API implementation
    console.log('TikTok upload: Placeholder API call');

    return {
      error: 'TikTok API integration coming soon. Visit TikTok\'s developer dashboard to enable video upload.'
    };
  } catch (error) {
    console.error('TikTok upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { error: `TikTok upload failed: ${errorMessage}` };
  }
}

export async function getTikTokAuthUrl(): Promise<string> {
  // TODO: Implement TikTok OAuth 2.0 authorization URL generation
  // Reference: https://developer.tiktok.com/doc/login-kit

  const clientId = process.env.TIKTOK_CLIENT_ID;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI;
  const scope = 'video.upload,user.info.basic';

  return `https://www.tiktok.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=random_state_string`;
}

export async function exchangeTikTokAuthCode(code: string): Promise<{ accessToken: string } | { error: string }> {
  try {
    // TODO: Implement TikTok OAuth token exchange
    const response = await fetch('https://open.tiktokapis.com/v1/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.TIKTOK_CLIENT_ID || '',
        client_secret: process.env.TIKTOK_CLIENT_SECRET || '',
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.TIKTOK_REDIRECT_URI || '',
      }).toString(),
    });

    if (!response.ok) {
      return { error: `TikTok auth failed: ${response.statusText}` };
    }

    const data = await response.json();
    return { accessToken: data.access_token };
  } catch (error) {
    console.error('TikTok OAuth error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { error: `TikTok auth failed: ${errorMessage}` };
  }
}

export async function getTikTokUserInfo(accessToken: string): Promise<{ username: string; avatarUrl: string } | { error: string }> {
  try {
    // TODO: Implement TikTok user info retrieval
    const response = await fetch('https://open.tiktokapis.com/v1/user/info/', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return { error: `Failed to get TikTok user info: ${response.statusText}` };
    }

    const data = await response.json();
    return {
      username: data.data.user.display_name,
      avatarUrl: data.data.user.avatar_url,
    };
  } catch (error) {
    console.error('Get TikTok user info error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { error: `Failed to get user info: ${errorMessage}` };
  }
}
