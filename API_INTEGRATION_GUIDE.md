# API Integration Guide for Diovid

This document outlines the setup required to activate all backend integrations for video production features.

## Table of Contents
1. [YouTube API](#youtube-api)
2. [TikTok API](#tiktok-api)
3. [Instagram Graph API](#instagram-graph-api)
4. [LinkedIn API](#linkedin-api)
5. [Twitter API v2](#twitter-api-v2)
6. [Google Cloud Speech-to-Text](#google-cloud-speech-to-text)
7. [Google Cloud Vision (Optional)](#google-cloud-vision)
8. [FFmpeg Setup](#ffmpeg-setup)
9. [Music Libraries](#music-libraries)

---

## YouTube API

### Setup Steps
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project: "Diovid"
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/youtube/callback`
   - `http://localhost:3001/api/auth/youtube/callback`
   - `https://yourdomain.com/api/auth/youtube/callback`

### Environment Variables
```env
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/youtube/callback
GOOGLE_API_KEY=your_api_key
GOOGLE_CLOUD_PROJECT_ID=your_project_id
```

### Features Enabled
- Video upload to YouTube
- Metadata management (title, description, tags)
- Privacy settings (public, unlisted, private)
- Scheduled publishing

### Implementation Status
- ✅ Server action created: `src/app/actions/youtubeUpload.ts`
- ⏳ API integration: Requires `google-auth-library` package
- ⏳ Frontend UI: PublishingPanel component ready

### Package Requirements
```bash
npm install googleapis google-auth-library
```

---

## TikTok API

### Setup Steps
1. Go to [TikTok Developer Portal](https://developer.tiktok.com/)
2. Create app: "Diovid"
3. Request "Video Upload" capability
4. Get Client ID and Client Secret
5. Set redirect URI:
   - `http://localhost:3001/api/auth/tiktok/callback`

### Environment Variables
```env
TIKTOK_CLIENT_ID=your_client_id
TIKTOK_CLIENT_SECRET=your_client_secret
TIKTOK_REDIRECT_URI=http://localhost:3001/api/auth/tiktok/callback
```

### Features Enabled
- Video upload (supports 9:16 aspect ratio natively)
- Metadata: title, description, tags
- Visibility control: PUBLIC_TO_EVERYONE, FOLLOWER_ONLY, PRIVATE

### Implementation Status
- ✅ Server action created: `src/app/actions/tiktokUpload.ts`
- ⏳ OAuth implementation: Pending Tik-Tok approval
- ⏳ Frontend UI: PublishingPanel component ready

### Important Notes
- TikTok requires business account verification
- Video upload API requires partnership approval
- Alternative: Use official TikTok Creator tools for now

---

## Instagram Graph API

### Setup Steps
1. Go to [Meta Developers](https://developers.facebook.com/)
2. Create app: "Diovid"
3. Add Instagram Basic Display & Graph API
4. Get Instagram Business Account ID
5. Add redirect URI:
   - `http://localhost:3001/api/auth/instagram/callback`

### Environment Variables
```env
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_app_secret
INSTAGRAM_REDIRECT_URI=http://localhost:3001/api/auth/instagram/callback
INSTAGRAM_USER_ID=your_instagram_user_id
```

### Features Enabled
- Upload Reels (9:16 vertical video)
- Metadata: caption with hashtags
- Automatic crossposting

### Implementation Status
- ✅ Server action created: `src/app/actions/socialMediaUpload.ts`
- ⏳ API integration: Requires `axios` for media uploads
- ⏳ Frontend UI: PublishingPanel component ready

### Important Notes
- Requires Instagram Business Account (free upgrade)
- Commercial Account approval may be needed

---

## LinkedIn API

### Setup Steps
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Create app: "Diovid"
3. Request access to "Share on LinkedIn" API
4. Add redirect URI:
   - `http://localhost:3001/api/auth/linkedin/callback`

### Environment Variables
```env
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3001/api/auth/linkedin/callback
```

### Features Enabled
- Video upload
- Share with description
- Visibility: PUBLIC, CONNECTIONS_ONLY

### Implementation Status
- ✅ Server action created: `src/app/actions/socialMediaUpload.ts`
- ⏳ API integration: Requires OAuth implementation
- ⏳ Frontend UI: PublishingPanel component ready

---

## Twitter API v2

### Setup Steps
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create project: "Diovid"
3. Create app with OAuth 2.0 support
4. Enable "User context OAuth"
5. Add callback URL:
   - `http://localhost:3001/api/auth/twitter/callback`

### Environment Variables
```env
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret
TWITTER_REDIRECT_URI=http://localhost:3001/api/auth/twitter/callback
TWITTER_BEARER_TOKEN=your_bearer_token
```

### Features Enabled
- Video/GIF upload
- Tweet composition with hashtags
- Automatic media attachment

### Implementation Status
- ✅ Server action created: `src/app/actions/socialMediaUpload.ts`
- ⏳ API integration: Requires OAuth v2 implementation
- ⏳ Frontend UI: PublishingPanel component ready

### Important Notes
- Requires Elevated access level
- Video size limit: 15MB max
- Duration limit: Depends on file size/bitrate

---

## Google Cloud Speech-to-Text

### Setup Steps
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Speech-to-Text API
3. Create Service Account
4. Download JSON key file
5. Convert to environment variable

### Environment Variables
```env
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_CLOUD_KEY_FILE=/path/to/service-account-key.json
# OR encode as base64
GOOGLE_CLOUD_CREDENTIALS=base64_encoded_json_key
```

### Features Enabled
- Real-time transcription
- Multi-language support (en-US, es-ES, fr-FR, etc.)
- Speaker diarization (identify who's speaking)
- Auto-punctuation
- Custom vocabulary

### Implementation Status
- ✅ Server action created: `src/app/actions/speechToText.ts`
- ⏳ API integration: Requires `@google-cloud/speech` package
- ⏳ Frontend UI: AutoSubtitles component ready

### Package Requirements
```bash
npm install @google-cloud/speech
```

### Pricing
- **Free tier**: 60 minutes/month
- **Paid**: $0.024–$0.032 per 15 seconds
- **Bulk**: Volume discounts available

---

## Google Cloud Vision (Optional)

For future features like:
- Scene detection from video frames
- Text extraction from graphics (OCR)
- Face detection and recognition
- Logo detection

### Setup
Enable Vision API in Google Cloud Console

---

## FFmpeg Setup

### Why FFmpeg?
- Extract video metadata (duration, FPS, codec, etc.)
- Extract keyframes for thumbnails
- Transcode videos for different platforms
- Extract audio from video for transcription

### Installation

#### Option 1: Docker (Recommended)
```bash
# Create Dockerfile
FROM node:18-alpine
RUN apk add --no-cache ffmpeg

# In docker-compose.yml
services:
  app:
    build: .
    environment:
      - FFMPEG_PATH=/usr/bin/ffmpeg
```

#### Option 2: System Installation
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg

# Windows
choco install ffmpeg
```

#### Option 3: NPM Package
```bash
npm install fluent-ffmpeg
# Also requires system FFmpeg installation
```

#### Option 4: FFmpeg.wasm (Browser-based)
```bash
npm install @ffmpeg/ffmpeg @ffmpeg/util

# In client component:
import { FFmpeg } from '@ffmpeg/ffmpeg';

const ffmpeg = new FFmpeg();
await ffmpeg.load();
```

### Environment Variables
```env
FFMPEG_PATH=/usr/bin/ffmpeg
FFPROBE_PATH=/usr/bin/ffprobe
```

### Implementation Status
- ✅ Server action skeleton created: `src/app/actions/videoAnalysis.ts`
- ⏳ FFmpeg.wasm integration: Client-side frame extraction
- ⏳ ffprobe integration: Server-side metadata extraction

---

## Music Libraries

### Option 1: Epidemic Sound (Recommended)

**Pricing**: $9.99/month (unlimited downloads)

#### Setup
1. Go to [Epidemic Sound Developers](https://www.epidemicsound.com/api/)
2. Apply for API access
3. Get API credentials

#### Environment Variables
```env
EPIDEMIC_SOUND_API_KEY=your_api_key
EPIDEMIC_SOUND_CLIENT_ID=your_client_id
```

#### Features
- 50,000+ tracks
- Mood-based search
- Commercial license included
- Attribution required

### Option 2: Artlist

**Pricing**: $14.99/month (unlimited downloads)

#### Setup
1. Go to [Artlist API](https://artlist.io/developers)
2. Request API access
3. Get API credentials

#### Environment Variables
```env
ARTLIST_API_KEY=your_api_key
```

#### Features
- 300,000+ tracks
- Mood and genre filtering
- Commercial license
- SFX library included

### Option 3: Free Alternatives

#### Pexels Music
- Free, high-quality tracks
- API available
- No attribution required

#### Pixabay Music
- Free tracks
- Great for background music
- Simple API

#### Free Music Archive
- Free Creative Commons music
- Large catalog
- Good for indie creators

### Implementation Status
- ✅ Server action created: `src/app/actions/musicLibrary.ts`
- ⏳ Epidemic Sound integration: Pending API setup
- ⏳ Artlist integration: Pending API setup
- ⏳ Frontend UI: MusicLibrary component ready

### Package Requirements
```bash
npm install axios
```

---

## Next Steps

### Priority 1: YouTube API (Week 1)
- [ ] Set up OAuth credentials
- [ ] Implement YouTube auth callback
- [ ] Test video upload
- [ ] Add error handling

### Priority 2: Video Analysis (Week 1-2)
- [ ] Install FFmpeg
- [ ] Set up ffprobe integration
- [ ] Implement frame extraction
- [ ] Test with sample video

### Priority 3: Speech-to-Text (Week 2)
- [ ] Set up Google Cloud project
- [ ] Configure service account
- [ ] Test transcription
- [ ] Implement subtitle export

### Priority 4: TikTok & Instagram (Week 3)
- [ ] Apply for TikTok API access
- [ ] Set up Instagram Graph API
- [ ] Implement platform detection
- [ ] Test uploads

### Priority 5: Music Library (Week 3-4)
- [ ] Choose music provider
- [ ] Set up API credentials
- [ ] Implement music search
- [ ] Add playback preview

### Optional Enhancements
- [ ] Advanced video editing
- [ ] AI-powered video enhancement
- [ ] Live streaming support
- [ ] Automated subtitle refinement
- [ ] Custom branding overlays

---

## Troubleshooting

### YouTube Upload Fails
- Check OAuth token expiration
- Verify video file format (MP4 recommended)
- Check file size (max 128GB per API docs)
- Verify quota limits in Cloud Console

### Speech-to-Text No Results
- Ensure audio sample rate is 16000 Hz
- Check language code matches audio language
- Verify authentication with service account
- Check quota limits

### FFmpeg Commands Hang
- Ensure FFmpeg is installed and in PATH
- Check file permissions
- Monitor system resources (CPU, RAM)
- Add timeouts to prevent hanging

### Music API Rate Limits
- Implement caching strategy
- Use pagination for large result sets
- Cache popular moods/genres
- Consider redis for session caching

---

## Security Notes

⚠️ **Never commit API keys to git**

Use environment variables and `.env.local` (gitignored)

Rotate credentials regularly:
- YouTube: Re-authorize annually
- Google Cloud: Refresh service account keys
- API Keys: Regenerate monthly

Restrict API scopes to minimum required permissions.

---

## Monitoring & Debugging

### Enable Debug Logging
```env
DEBUG=diovid:*
VERBOSE_LOGGING=true
```

### API Cost Tracking
- YouTube: Free (quota-based)
- Speech-to-Text: ~$0.024 per 15 sec
- Vision: ~$1.50 per 1000 images
- Music APIs: Monthly subscription

### Performance Metrics
Monitor in Google Cloud Console:
- API request latency
- Error rates
- Quota usage
- Daily active users

---

## Support Resources

- [YouTube Data API Docs](https://developers.google.com/youtube/v3)
- [TikTok Open Platform](https://developer.tiktok.com/)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
- [LinkedIn API](https://docs.microsoft.com/en-us/linkedin/marketing/)
- [Twitter API v2](https://developer.twitter.com/en/docs/twitter-api)
- [Google Cloud Speech-to-Text](https://cloud.google.com/speech-to-text/docs)
- [FFmpeg Documentation](https://ffmpeg.org/)
