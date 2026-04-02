'use server';

// Instagram Graph API
interface InstagramUploadParams {
  accessToken: string;
  title: string;
  description: string;
  tags: string[];
  videoBuffer: Buffer;
  filename: string;
  caption?: string;
}

export async function uploadToInstagram({
  accessToken,
  title,
  description,
  tags,
  videoBuffer,
  filename,
  caption,
}: InstagramUploadParams): Promise<{ mediaId: string; url: string } | { error: string }> {
  try {
    // TODO: Implement Instagram Graph API integration
    // 1. Get Instagram Business Account ID
    // 2. Upload video to Instagram
    // 3. Publish Reel with metadata
    // 4. Return media ID and URL

    // Reference: https://developers.facebook.com/docs/instagram-api/guides/content-publishing

    const instagramUserId = process.env.INSTAGRAM_USER_ID;
    
    if (!instagramUserId) {
      return { error: 'Instagram user ID not configured' };
    }

    // Step 1: Create media container
    const containerResponse = await fetch(
      `https://graph.instagram.com/v18.0/${instagramUserId}/media`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          media_type: 'REELS',
          video_url: `data:video/mp4;base64,${videoBuffer.toString('base64')}`,
          caption: caption || `${title}\n\n${description}\n${tags.map(t => `#${t}`).join(' ')}`,
          access_token: accessToken,
        }),
      }
    );

    if (!containerResponse.ok) {
      return { error: `Instagram container creation failed: ${containerResponse.statusText}` };
    }

    const containerData = await containerResponse.json();
    const mediaId = containerData.id;

    // Step 2: Publish media
    const publishResponse = await fetch(
      `https://graph.instagram.com/v18.0/${instagramUserId}/media_publish`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creation_id: mediaId,
          access_token: accessToken,
        }),
      }
    );

    if (!publishResponse.ok) {
      return { error: `Instagram publish failed: ${publishResponse.statusText}` };
    }

    return {
      mediaId,
      url: `https://instagram.com/reels/${mediaId}`,
    };
  } catch (error) {
    console.error('Instagram upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { error: `Instagram upload failed: ${errorMessage}` };
  }
}

export async function getInstagramAuthUrl(): Promise<string> {
  // TODO: Implement Instagram OAuth 2.0 authorization
  const clientId = process.env.INSTAGRAM_APP_ID;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

  return `https://api.instagram.com/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=instagram_business_basic,instagram_business_content_publish&response_type=code`;
}

// LinkedIn Share API
interface LinkedInUploadParams {
  accessToken: string;
  title: string;
  description: string;
  videoBuffer: Buffer;
  visibility?: 'PUBLIC' | 'CONNECTIONS_ONLY';
}

export async function uploadToLinkedIn({
  accessToken,
  title,
  description,
  videoBuffer,
  visibility = 'PUBLIC',
}: LinkedInUploadParams): Promise<{ postId: string; url: string } | { error: string }> {
  try {
    // TODO: Implement LinkedIn Share API integration
    // 1. Get upload URL for video
    // 2. Upload video to LinkedIn CDN
    // 3. Share video with metadata
    // 4. Return post ID and URL

    // Reference: https://docs.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/share-api

    // Step 1: Get upload URL
    const uploadUrlResponse = await fetch(
      'https://api.linkedin.com/v2/assets?action=getUploadUrl',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:video'],
            owner: 'urn:li:person:ME',
            serviceRelationships: [
              {
                relationshipType: 'OWNER',
                identifier: 'urn:li:userGeneratedContent',
              },
            ],
          },
        }),
      }
    );

    if (!uploadUrlResponse.ok) {
      return { error: `LinkedIn upload URL creation failed: ${uploadUrlResponse.statusText}` };
    }

    const uploadData = await uploadUrlResponse.json();
    const uploadUrl = uploadData.value.uploadMechanism['com.linkedin.digitalmedia:uploadUrl'];
    const assetId = uploadData.value.asset;

    // Step 2: Upload video
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: videoBuffer as any,
    });

    if (!uploadResponse.ok) {
      return { error: `LinkedIn video upload failed: ${uploadResponse.statusText}` };
    }

    // Step 3: Share video
    const shareResponse = await fetch(
      'https://api.linkedin.com/v2/ugcPosts',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          author: 'urn:li:person:ME',
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.Share': {
              media: [
                {
                  media: assetId,
                  status: 'READY',
                },
              ],
              commentary: {
                text: `${title}\n\n${description}`,
              },
            },
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': visibility,
          },
        }),
      }
    );

    if (!shareResponse.ok) {
      return { error: `LinkedIn post creation failed: ${shareResponse.statusText}` };
    }

    const shareData = await shareResponse.json();
    const postId = shareData.id;

    return {
      postId,
      url: `https://linkedin.com/feed/update/${postId}`,
    };
  } catch (error) {
    console.error('LinkedIn upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { error: `LinkedIn upload failed: ${errorMessage}` };
  }
}

// Twitter API v2
interface TwitterUploadParams {
  accessToken: string;
  title: string;
  description: string;
  tags: string[];
  videoBuffer: Buffer;
}

export async function uploadToTwitter({
  accessToken,
  title,
  description,
  tags,
  videoBuffer,
}: TwitterUploadParams): Promise<{ tweetId: string; url: string } | { error: string }> {
  try {
    // TODO: Implement Twitter API v2 integration
    // 1. Upload video media to Twitter
    // 2. Create tweet with video
    // 3. Return tweet ID and URL

    // Reference: https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/integrate/media-upload

    // Step 1: Upload media
    const mediaResponse = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: (() => {
        const formData = new FormData();
        formData.append('media_data', Buffer.from(videoBuffer).toString('base64'));
        formData.append('media_category', 'TWEET_GIF');
        return formData;
      })(),
    });

    if (!mediaResponse.ok) {
      return { error: `Twitter media upload failed: ${mediaResponse.statusText}` };
    }

    const mediaData = await mediaResponse.json();
    const mediaId = mediaData.media_id_string;

    // Step 2: Create tweet
    const tweetResponse = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: `${title}\n\n${description}\n${tags.map(t => `#${t}`).join(' ')}`,
        media: {
          media_ids: [mediaId],
          tagged_media_ids: [mediaId],
        },
      }),
    });

    if (!tweetResponse.ok) {
      return { error: `Twitter tweet creation failed: ${tweetResponse.statusText}` };
    }

    const tweetData = await tweetResponse.json();
    const tweetId = tweetData.data.id;

    return {
      tweetId,
      url: `https://twitter.com/i/web/status/${tweetId}`,
    };
  } catch (error) {
    console.error('Twitter upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { error: `Twitter upload failed: ${errorMessage}` };
  }
}
