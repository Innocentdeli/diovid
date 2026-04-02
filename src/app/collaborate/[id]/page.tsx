"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, Lock, Loader2, AlertCircle, Edit, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CollaboratorInfo {
    id: string;
    name: string;
    email: string;
    role: 'owner' | 'editor' | 'viewer';
    isOnline: boolean;
    lastSeen: Date;
}

interface ProjectSummary {
    id: string;
    name: string;
    owner_id: string;
}

export default function CollaboratePage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params?.id as string;

    const [status, setStatus] = useState<'loading' | 'auth' | 'checking' | 'joined' | 'denied' | 'error'>('loading');
    const [project, setProject] = useState<ProjectSummary | null>(null);
    const [currentUser, setCurrentUser] = useState<CollaboratorInfo | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<CollaboratorInfo[]>([]);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!projectId) {
            setStatus('error');
            setErrorMessage('Invalid collaboration link.');
            return;
        }

        (async () => {
            // 1. Check auth session
            const { data: { session } } = await supabase.auth.getSession();

            if (!session?.user) {
                setStatus('auth');
                return;
            }

            const user = session.user;
            setStatus('checking');

            // 2. Load the project
            const { data: proj, error: projError } = await supabase
                .from('projects')
                .select('id, name, user_id')
                .eq('id', projectId)
                .single();

            if (projError || !proj) {
                setStatus('error');
                setErrorMessage('This project does not exist or has been deleted.');
                return;
            }

            setProject({ id: proj.id, name: proj.name, owner_id: proj.user_id });

            // 3. Determine role
            let role: 'owner' | 'editor' | 'viewer' = 'viewer';

            if (proj.user_id === user.id) {
                role = 'owner';
            } else {
                // Check invitations table
                const { data: invite } = await supabase
                    .from('project_invitations')
                    .select('role, status')
                    .eq('project_id', projectId)
                    .eq('invited_email', user.email)
                    .single();

                if (invite) {
                    role = invite.role as 'editor' | 'viewer';
                    // Mark invite as accepted
                    await supabase
                        .from('project_invitations')
                        .update({ status: 'accepted' })
                        .eq('project_id', projectId)
                        .eq('invited_email', user.email);
                }
                // If no invite, they still join as viewer (public share link)
            }

            const me: CollaboratorInfo = {
                id: user.id,
                name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
                email: user.email || '',
                role,
                isOnline: true,
                lastSeen: new Date(),
            };
            setCurrentUser(me);

            // 4. Join Realtime presence channel
            const channel = supabase.channel(`project:${projectId}`, {
                config: { presence: { key: user.id } },
            });

            channel.on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState<{ name: string; role: string }>();
                const users: CollaboratorInfo[] = Object.entries(state).map(([id, presences]) => {
                    const p = presences[0];
                    return {
                        id,
                        name: p.name || 'Anonymous',
                        email: '',
                        role: (p.role as CollaboratorInfo['role']) || 'viewer',
                        isOnline: true,
                        lastSeen: new Date(),
                    };
                });
                setOnlineUsers(users);
            });

            await channel.subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({ name: me.name, role: me.role });
                }
            });

            setStatus('joined');

            return () => { channel.unsubscribe(); };
        })();
    }, [projectId]);

    if (status === 'loading' || status === 'checking') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-3">
                    <Loader2 size={32} className="animate-spin mx-auto text-primary" />
                    <p className="text-foreground/60 text-sm">
                        {status === 'loading' ? 'Loading...' : 'Verifying access...'}
                    </p>
                </div>
            </div>
        );
    }

    if (status === 'auth') {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-background border border-border/30 rounded-2xl p-8 text-center space-y-5"
                >
                    <Lock size={40} className="mx-auto text-primary/60" />
                    <div>
                        <h1 className="text-xl font-bold mb-2">Sign in to Collaborate</h1>
                        <p className="text-sm text-foreground/60">You need to be signed in to join this collaboration session.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.push(`/auth/signin?redirect=/collaborate/${projectId}`)}
                            className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 rounded-lg font-semibold text-sm transition-all"
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => router.push(`/auth/signup?redirect=/collaborate/${projectId}`)}
                            className="flex-1 px-4 py-2.5 bg-surface/60 border border-border/30 hover:border-primary/50 rounded-lg font-semibold text-sm transition-all"
                        >
                            Create Account
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (status === 'error' || status === 'denied') {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-background border border-red-500/30 rounded-2xl p-8 text-center space-y-4"
                >
                    <AlertCircle size={40} className="mx-auto text-red-400" />
                    <div>
                        <h1 className="text-xl font-bold mb-2">Access Denied</h1>
                        <p className="text-sm text-foreground/60">{errorMessage || 'You do not have permission to access this project.'}</p>
                    </div>
                    <button
                        onClick={() => router.push('/director')}
                        className="px-6 py-2.5 bg-primary hover:bg-primary/90 rounded-lg font-semibold text-sm transition-all"
                    >
                        Go to Director
                    </button>
                </motion.div>
            </div>
        );
    }

    // status === 'joined'
    return (
        <div className="min-h-screen bg-background">
            {/* Top Bar */}
            <div className="border-b border-border/30 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Users size={20} className="text-primary" />
                    <div>
                        <h1 className="font-bold text-sm">{project?.name}</h1>
                        <p className="text-xs text-foreground/40">
                            {currentUser?.role === 'viewer' ? (
                                <span className="flex items-center gap-1"><Eye size={10} /> View-only</span>
                            ) : (
                                <span className="flex items-center gap-1"><Edit size={10} /> Editor</span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Online Users */}
                <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                        {onlineUsers.slice(0, 5).map(u => (
                            <div
                                key={u.id}
                                title={`${u.name} (${u.role})`}
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-secondary/40 border-2 border-background flex items-center justify-center text-xs font-bold cursor-default"
                            >
                                {u.name.charAt(0).toUpperCase()}
                            </div>
                        ))}
                    </div>
                    {onlineUsers.length > 5 && (
                        <span className="text-xs text-foreground/50">+{onlineUsers.length - 5}</span>
                    )}
                    <span className="text-xs text-green-400 ml-2">● {onlineUsers.length} online</span>
                </div>

                <button
                    onClick={() => router.push(`/director?projectId=${projectId}`)}
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-background rounded-lg text-sm font-semibold transition-all"
                >
                    Open in Director
                </button>
            </div>

            {/* Main Content */}
            <div className="flex items-center justify-center min-h-[80vh] p-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-5 max-w-lg"
                >
                    <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                        <Users size={36} className="text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold mb-2">You&apos;re connected!</h2>
                        <p className="text-foreground/60">
                            You&apos;ve joined <strong>{project?.name}</strong> as a <strong>{currentUser?.role}</strong>.
                            Click &quot;Open in Director&quot; above to start collaborating in real time.
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3">
                        {onlineUsers.map(u => (
                            <div key={u.id} className="flex items-center gap-2 px-3 py-1.5 bg-surface/60 border border-border/30 rounded-full text-sm">
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/40 to-secondary/40 flex items-center justify-center text-[10px] font-bold">
                                    {u.name.charAt(0).toUpperCase()}
                                </div>
                                <span>{u.name}</span>
                                <span className="text-[10px] text-foreground/40">{u.role}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
