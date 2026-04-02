"use client";

import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, MessageCircle, Share2, Lock, Unlock, Eye, Edit, Crown, Clock, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getAnalytics } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';

interface CollaborationContextType {
  openPanel: () => void;
  onlineCount: number;
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

export function useCollaboration() {
  const ctx = useContext(CollaborationContext);
  return ctx;
}

interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
  isOnline: boolean;
  lastSeen: Date;
  currentActivity?: string;
}

interface Comment {
  id: string;
  contentId: string;
  authorId: string;
  authorName: string;
  text: string;
  timestamp: Date;
  resolved: boolean;
  replies: Comment[];
}

interface CollaborationProviderProps {
  children: React.ReactNode;
  contentId?: string; // project ID — used as the Realtime channel name
  currentUser?: Collaborator;
}

const PERMISSIONS = {
  owner: { canEdit: true, canInvite: true, canRemove: true, canChangePermissions: true, canDelete: true },
  editor: { canEdit: true, canInvite: false, canRemove: false, canChangePermissions: false, canDelete: false },
  viewer: { canEdit: false, canInvite: false, canRemove: false, canChangePermissions: false, canDelete: false },
};

export function CollaborationProvider({ children, contentId, currentUser }: CollaborationProviderProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>(currentUser ? [currentUser] : []);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('viewer');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [newComment, setNewComment] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const analytics = getAnalytics();

  // Build share URL
  useEffect(() => {
    if (contentId) {
      setShareUrl(`${window.location.origin}/collaborate/${contentId}`);
    }
  }, [contentId]);

  // Supabase Realtime Broadcast + Presence
  useEffect(() => {
    if (!contentId || !currentUser) return;

    // Load existing comments from Supabase
    supabase
      .from('project_comments')
      .select('*')
      .eq('project_id', contentId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) {
          setComments(data.map(row => ({
            id: row.id,
            contentId: row.project_id,
            authorId: row.author_id,
            authorName: row.author_name || 'Unknown',
            text: row.text,
            timestamp: new Date(row.created_at),
            resolved: row.resolved || false,
            replies: [],
          })));
        }
      });

    // Set up Realtime channel
    const channel = supabase.channel(`project:${contentId}`, {
      config: { presence: { key: currentUser.id } },
    });

    // Track presence (online users)
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const onlineIds = new Set(Object.keys(state));
      setCollaborators(prev =>
        prev.map(c => ({ ...c, isOnline: onlineIds.has(c.id) }))
      );
    });

    // Broadcast: new comment
    channel.on('broadcast', { event: 'new_comment' }, ({ payload }) => {
      setComments(prev => {
        if (prev.find(c => c.id === payload.id)) return prev;
        return [...prev, payload as Comment];
      });
    });

    // Broadcast: comment resolved
    channel.on('broadcast', { event: 'resolve_comment' }, ({ payload }) => {
      setComments(prev => prev.map(c => c.id === payload.id ? { ...c, resolved: true } : c));
    });

    // Broadcast: new collaborator joined
    channel.on('broadcast', { event: 'collaborator_join' }, ({ payload }) => {
      setCollaborators(prev => {
        if (prev.find(c => c.id === payload.id)) return prev;
        return [...prev, payload as Collaborator];
      });
    });

    channel
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: currentUser.id,
            name: currentUser.name,
            role: currentUser.role,
            online_at: new Date().toISOString(),
          });

          // Announce join
          await channel.send({
            type: 'broadcast',
            event: 'collaborator_join',
            payload: { ...currentUser, isOnline: true, lastSeen: new Date() },
          });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [contentId, currentUser]);

  // Online/offline
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // Invite collaborator
  const inviteCollaborator = useCallback(async () => {
    if (!inviteEmail.trim() || !currentUser || !contentId) return;
    setInviteStatus('sending');

    try {
      const { error } = await supabase.from('project_invitations').insert({
        project_id: contentId,
        invited_by: currentUser.id,
        invited_email: inviteEmail.trim(),
        role: inviteRole,
        share_url: shareUrl,
        status: 'pending',
      });

      if (error) throw error;

      setInviteStatus('sent');
      setInviteEmail('');
      setTimeout(() => setInviteStatus('idle'), 3000);
      analytics.trackInteraction('collaboration', 'invite_sent', { role: inviteRole });
    } catch {
      setInviteStatus('error');
      setTimeout(() => setInviteStatus('idle'), 3000);
    }
  }, [inviteEmail, inviteRole, currentUser, contentId, shareUrl, analytics]);

  // Add comment
  const addComment = useCallback(async () => {
    if (!newComment.trim() || !currentUser || !contentId) return;

    const comment: Comment = {
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      contentId,
      authorId: currentUser.id,
      authorName: currentUser.name,
      text: newComment.trim(),
      timestamp: new Date(),
      resolved: false,
      replies: [],
    };

    // Optimistic update
    setComments(prev => [...prev, comment]);
    setNewComment('');

    // Persist to Supabase
    await supabase.from('project_comments').insert({
      id: comment.id,
      project_id: contentId,
      author_id: currentUser.id,
      author_name: currentUser.name,
      text: comment.text,
      resolved: false,
    });

    // Broadcast to peers
    await channelRef.current?.send({
      type: 'broadcast',
      event: 'new_comment',
      payload: comment,
    });
  }, [newComment, currentUser, contentId]);

  const resolveComment = useCallback(async (commentId: string) => {
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, resolved: true } : c));
    await supabase.from('project_comments').update({ resolved: true }).eq('id', commentId);
    await channelRef.current?.send({ type: 'broadcast', event: 'resolve_comment', payload: { id: commentId } });
  }, []);

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onlineCount = collaborators.filter(c => c.isOnline).length;

  return (
    <CollaborationContext.Provider value={{ openPanel: () => setShowPanel(true), onlineCount }}>
      <>
        {children}

        {/* Panel */}
        <AnimatePresence>
          {showPanel && (
            <motion.div
              initial={{ opacity: 0, x: 320 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 320 }}
              className="fixed right-0 top-0 h-full w-[360px] bg-background border-l border-border/30 shadow-2xl z-40 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border/30">
                <h2 className="font-bold text-base flex items-center gap-2">
                  <Users size={18} /> Collaboration
                </h2>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
                    {isOnline ? '● Online' : '○ Offline'}
                  </span>
                  <button onClick={() => setShowPanel(false)} className="p-1 hover:text-foreground/60">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {/* Share Link */}
                {contentId && (
                  <section>
                    <p className="text-xs text-foreground/50 mb-2 font-semibold uppercase tracking-wide">Share Link</p>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={shareUrl}
                        className="flex-1 text-xs bg-surface/50 border border-border/30 rounded-lg px-3 py-2 truncate"
                      />
                      <button
                        onClick={copyShareUrl}
                        className="px-3 py-2 bg-primary/20 hover:bg-primary/30 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                      >
                        {copied ? <><Check size={12} /> Copied</> : <><Share2 size={12} /> Copy</>}
                      </button>
                    </div>
                  </section>
                )}

                {/* Online Users */}
                <section>
                  <p className="text-xs text-foreground/50 mb-2 font-semibold uppercase tracking-wide">
                    Participants ({collaborators.length})
                  </p>
                  <div className="space-y-2">
                    {collaborators.map(c => (
                      <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg bg-surface/40">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-secondary/40 flex items-center justify-center text-xs font-bold">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background ${c.isOnline ? 'bg-green-400' : 'bg-foreground/30'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{c.name}</p>
                          <p className="text-xs text-foreground/40">{c.role}</p>
                        </div>
                        {c.role === 'owner' && <Crown size={12} className="text-yellow-400 flex-shrink-0" />}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Invite */}
                {currentUser && PERMISSIONS[currentUser.role].canInvite && (
                  <section>
                    <p className="text-xs text-foreground/50 mb-2 font-semibold uppercase tracking-wide">Invite</p>
                    <div className="space-y-2">
                      <input
                        type="email"
                        placeholder="colleague@company.com"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && inviteCollaborator()}
                        className="w-full bg-surface/50 border border-border/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                      />
                      <div className="flex gap-2">
                        <select
                          value={inviteRole}
                          onChange={e => setInviteRole(e.target.value as 'editor' | 'viewer')}
                          className="flex-1 bg-surface/50 border border-border/30 rounded-lg px-3 py-2 text-sm focus:outline-none"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                        </select>
                        <button
                          onClick={inviteCollaborator}
                          disabled={!inviteEmail.trim() || inviteStatus === 'sending'}
                          className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5"
                        >
                          {inviteStatus === 'sending' ? (
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : inviteStatus === 'sent' ? (
                            <><Check size={12} /> Sent!</>
                          ) : (
                            <><UserPlus size={12} /> Invite</>
                          )}
                        </button>
                      </div>
                      {inviteStatus === 'error' && (
                        <p className="text-xs text-red-400">Failed to send invitation. Try again.</p>
                      )}
                    </div>
                  </section>
                )}

                {/* Comments */}
                <section>
                  <p className="text-xs text-foreground/50 mb-2 font-semibold uppercase tracking-wide">
                    Comments ({comments.filter(c => !c.resolved).length} open)
                  </p>
                  <div className="space-y-2 max-h-[240px] overflow-y-auto mb-3">
                    {comments.length === 0 && (
                      <p className="text-xs text-foreground/30 text-center py-4">No comments yet</p>
                    )}
                    {comments.map(c => (
                      <div key={c.id} className={`p-3 rounded-lg text-sm ${c.resolved ? 'opacity-50 bg-surface/20' : 'bg-surface/50 border border-border/20'}`}>
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <p className="font-semibold text-xs text-primary/80">{c.authorName}</p>
                            <p className="mt-0.5 text-foreground/80">{c.text}</p>
                          </div>
                          {!c.resolved && currentUser && (
                            <button onClick={() => resolveComment(c.id)} className="p-1 hover:text-green-400 transition-colors flex-shrink-0" title="Resolve">
                              <Check size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addComment()}
                      className="flex-1 bg-surface/50 border border-border/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                    />
                    <button
                      onClick={addComment}
                      disabled={!newComment.trim()}
                      className="px-3 py-2 bg-primary/20 hover:bg-primary/30 disabled:opacity-50 rounded-lg transition-all"
                    >
                      <MessageCircle size={14} />
                    </button>
                  </div>
                </section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    </CollaborationContext.Provider>
  );
}

export default CollaborationProvider;