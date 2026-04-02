"use client";

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const PLATFORMS: Record<string, { authUrl: string; scope: string; clientId: string; redirectUri: string }> = {
    youtube: {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        scope: 'https://www.googleapis.com/auth/youtube.upload',
        clientId: process.env.YOUTUBE_CLIENT_ID || '',
        redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback/youtube`,
    },
    tiktok: {
        authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
        scope: 'video.upload,user.info.basic',
        clientId: process.env.TIKTOK_CLIENT_KEY || '',
        redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback/tiktok`,
    },
    instagram: {
        authUrl: 'https://api.instagram.com/oauth/authorize',
        scope: 'instagram_business_basic,instagram_business_content_publish',
        clientId: process.env.INSTAGRAM_APP_ID || '',
        redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback/instagram`,
    },
    linkedin: {
        authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
        scope: 'w_member_social',
        clientId: process.env.LINKEDIN_CLIENT_ID || '',
        redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback/linkedin`,
    },
    twitter: {
        authUrl: 'https://twitter.com/i/oauth2/authorize',
        scope: 'tweet.read tweet.write users.read offline.access',
        clientId: process.env.TWITTER_CLIENT_ID || '',
        redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback/twitter`,
    },
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ platform: string }> }
) {
    const { platform } = await params;
    const config = PLATFORMS[platform];

    if (!config || !config.clientId) {
        return NextResponse.json(
            { error: `Platform ${platform} not configured or missing client ID` },
            { status: 400 }
        );
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const state = encodeURIComponent(JSON.stringify({ userId: session.user.id, platform }));

    let url = `${config.authUrl}?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&response_type=code&scope=${encodeURIComponent(config.scope)}&state=${state}`;

    // Platform specific additions
    if (platform === 'youtube') {
        url += '&access_type=offline&prompt=consent';
    } else if (platform === 'twitter') {
        url += '&code_challenge=challenge&code_challenge_method=plain';
    }

    return NextResponse.redirect(url);
}
