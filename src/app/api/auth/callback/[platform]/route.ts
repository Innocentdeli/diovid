"use client";

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const TOKEN_ENDPOINTS: Record<string, string> = {
    youtube: 'https://oauth2.googleapis.com/token',
    tiktok: 'https://open.tiktokapis.com/v2/oauth/token/',
    instagram: 'https://api.instagram.com/oauth/access_token',
    linkedin: 'https://www.linkedin.com/oauth/v2/accessToken',
    twitter: 'https://api.twitter.com/2/oauth2/token',
};

const CLIENT_SECRETS: Record<string, string> = {
    youtube: process.env.YOUTUBE_CLIENT_SECRET || '',
    tiktok: process.env.TIKTOK_CLIENT_SECRET || '',
    instagram: process.env.INSTAGRAM_APP_SECRET || '',
    linkedin: process.env.LINKEDIN_CLIENT_SECRET || '',
    twitter: process.env.TWITTER_CLIENT_SECRET || '',
};

const CLIENT_IDS: Record<string, string> = {
    youtube: process.env.YOUTUBE_CLIENT_ID || '',
    tiktok: process.env.TIKTOK_CLIENT_KEY || '',
    instagram: process.env.INSTAGRAM_APP_ID || '',
    linkedin: process.env.LINKEDIN_CLIENT_ID || '',
    twitter: process.env.TWITTER_CLIENT_ID || '',
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ platform: string }> }
) {
    const { platform } = await params;
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const stateStr = searchParams.get('state');

    if (!code || !stateStr) {
        return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
    }

    const { userId } = JSON.parse(decodeURIComponent(stateStr));
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback/${platform}`;

    try {
        const tokenEndpoint = TOKEN_ENDPOINTS[platform];
        const body = new URLSearchParams({
            client_id: CLIENT_IDS[platform],
            client_secret: CLIENT_SECRETS[platform],
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
        });

        if (platform === 'twitter') {
            body.append('code_verifier', 'challenge');
        }

        const response = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body,
        });

        const tokens = await response.json();

        if (!response.ok) {
            console.error(`Token exchange failed for ${platform}:`, tokens);
            return NextResponse.json({ error: 'Token exchange failed', details: tokens }, { status: 500 });
        }

        // Store tokens in Supabase
        const { error } = await supabase.from('user_tokens').upsert({
            user_id: userId,
            platform,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,platform' });

        if (error) throw error;

        // Redirect back to director page
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/director?connected=${platform}`);

    } catch (error) {
        console.error('OAuth Callback Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
