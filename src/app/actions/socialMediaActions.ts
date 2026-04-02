'use server';

import { supabase } from '@/lib/supabase';

export type SocialPlatform = 'youtube' | 'tiktok' | 'instagram' | 'linkedin' | 'twitter';

interface TokenStatus {
    connected: boolean;
    username?: string;
}

export async function checkConnectionStatus(): Promise<Record<SocialPlatform, TokenStatus>> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return {
            youtube: { connected: false },
            tiktok: { connected: false },
            instagram: { connected: false },
            linkedin: { connected: false },
            twitter: { connected: false },
        };

        const { data: tokens, error } = await supabase
            .from('user_tokens')
            .select('platform, metadata')
            .eq('user_id', user.id);

        if (error) throw error;

        const status: Record<SocialPlatform, TokenStatus> = {
            youtube: { connected: false },
            tiktok: { connected: false },
            instagram: { connected: false },
            linkedin: { connected: false },
            twitter: { connected: false },
        };

        tokens?.forEach((t: any) => {
            if (t.platform in status) {
                status[t.platform as SocialPlatform] = {
                    connected: true,
                    username: t.metadata?.username || 'Connected Account'
                };
            }
        });

        return status;
    } catch (error) {
        console.error('[SOCIAL ACTIONS] Check failed:', error);
        return {
            youtube: { connected: false },
            tiktok: { connected: false },
            instagram: { connected: false },
            linkedin: { connected: false },
            twitter: { connected: false },
        };
    }
}

export async function disconnectPlatform(platform: SocialPlatform) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated' };

        const { error } = await supabase
            .from('user_tokens')
            .delete()
            .eq('user_id', user.id)
            .eq('platform', platform);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('[SOCIAL ACTIONS] Disconnect failed:', error);
        return { error: 'Failed to disconnect' };
    }
}
