// filepath: src/components/PublishingPanel.tsx
"use client";

import { useState, useEffect } from 'react';
import { Send, Copy, AlertCircle, CheckCircle, Link as LinkIcon, ExternalLink, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { checkConnectionStatus, disconnectPlatform, SocialPlatform } from '@/app/actions/socialMediaActions';

interface PublishTarget {
  id: string;
  platform: SocialPlatform;
  name: string;
  enabled: boolean;
  status: 'idle' | 'uploading' | 'success' | 'error';
  url?: string;
  connected: boolean;
  username?: string;
}

export function PublishingPanel() {
  const [targets, setTargets] = useState<PublishTarget[]>([
    { id: 'youtube', platform: 'youtube', name: 'YouTube', enabled: true, status: 'idle', connected: false },
    { id: 'tiktok', platform: 'tiktok', name: 'TikTok', enabled: true, status: 'idle', connected: false },
    { id: 'instagram', platform: 'instagram', name: 'Instagram', enabled: false, status: 'idle', connected: false },
    { id: 'linkedin', platform: 'linkedin', name: 'LinkedIn', enabled: false, status: 'idle', connected: false },
    { id: 'twitter', platform: 'twitter', name: 'Twitter/X', enabled: false, status: 'idle', connected: false },
  ]);

  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [title, setTitle] = useState('My Awesome Video');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('AI, Creator, Video');
  const [scheduleTime, setScheduleTime] = useState<string | null>(null);

  useEffect(() => {
    refreshStatus();
  }, []);

  const refreshStatus = async () => {
    setIsLoadingStatus(true);
    const statusMap = await checkConnectionStatus();
    setTargets(prev => prev.map(t => ({
      ...t,
      connected: statusMap[t.platform]?.connected || false,
      username: statusMap[t.platform]?.username
    })));
    setIsLoadingStatus(false);
  };

  const handleConnect = (platform: SocialPlatform) => {
    // Redirect to our OAuth initiation route
    window.location.href = `/api/auth/${platform}`;
  };

  const handleDisconnect = async (platform: SocialPlatform) => {
    if (confirm(`Disconnect ${platform}?`)) {
      await disconnectPlatform(platform);
      refreshStatus();
    }
  };

  const toggleTarget = (id: string) => {
    setTargets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t))
    );
  };

  const publishVideo = async () => {
    const enabledTargets = targets.filter(t => t.enabled);
    const unconnected = enabledTargets.filter(t => !t.connected);

    if (unconnected.length > 0) {
      alert(`Please connect your ${unconnected.map(t => t.name).join(', ')} account(s) first.`);
      return;
    }

    setIsPublishing(true);

    // Get video from storage (placeholder logic for now)
    const videoData = { buffer: Buffer.from([]) };

    // Simulate/Execute publishing
    for (const target of enabledTargets) {
      setTargets((prev) =>
        prev.map((t) => t.id === target.id ? { ...t, status: 'uploading' } : t)
      );

      // In a real scenario, we'd call the server actions here
      // const res = await uploadToYoutube(...) etc.

      await new Promise(r => setTimeout(r, 2000)); // Simulate work

      setTargets((prev) =>
        prev.map((t) =>
          t.id === target.id
            ? { ...t, status: 'success', url: `https://${target.platform}.com/watch?v=diovid-${Math.random().toString(36).substr(2, 9)}` }
            : t
        )
      );
    }

    setIsPublishing(false);
  };

  return (
    <div className="w-full space-y-6 bg-surface/30 p-6 rounded-2xl border border-border/30 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold flex items-center gap-2">
          <Send size={20} className="text-primary" />
          Social Publishing
        </h2>
        <button
          onClick={refreshStatus}
          disabled={isLoadingStatus}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={isLoadingStatus ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
        {/* Left: Metadata Form */}
        <div className="space-y-4">
          <div className="space-y-4 p-4 rounded-xl bg-black/20 border border-white/5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 mb-1.5 block">Video Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                className="w-full px-4 py-2.5 bg-surface/50 border border-border/30 rounded-xl text-sm focus:border-primary/50 outline-none transition-all font-medium"
                placeholder="Enter a catchy title..."
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 mb-1.5 block">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={5000}
                rows={4}
                className="w-full px-4 py-2.5 bg-surface/50 border border-border/30 rounded-xl text-sm focus:border-primary/50 outline-none transition-all resize-none"
                placeholder="Tell your viewers about this video..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 mb-1.5 block">Tags</label>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface/50 border border-border/30 rounded-xl text-sm focus:border-primary/50 outline-none transition-all"
                  placeholder="comma, separated"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 mb-1.5 block">Schedule</label>
                <input
                  type="datetime-local"
                  value={scheduleTime || ''}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface/50 border border-border/30 rounded-xl text-sm focus:border-primary/50 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <button
            onClick={publishVideo}
            disabled={isPublishing || !targets.some((t) => t.enabled)}
            className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold transition-all flex items-center justify-center gap-3 shadow-glow-primary text-white"
          >
            {isPublishing ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Publishing to Multi-stream...
              </>
            ) : (
              <>
                <Send size={18} />
                Launch to Platforms
              </>
            )}
          </button>
        </div>

        {/* Right: Platform Targets */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/40 px-1">Targets & Accounts</h3>
          <div className="space-y-2">
            {targets.map((target) => (
              <div
                key={target.id}
                className={`p-3 rounded-xl border-2 transition-all ${target.enabled
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-white/5 bg-white/2 hover:border-white/10'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleTarget(target.id)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${target.enabled ? 'bg-primary text-white' : 'bg-white/5 text-foreground/30'
                        }`}
                    >
                      {/* Simulated platform icons */}
                      <span className="font-bold text-xs">{target.platform.charAt(0).toUpperCase()}</span>
                    </button>
                    <div>
                      <p className={`text-sm font-bold ${target.enabled ? 'text-foreground' : 'text-foreground/40'}`}>{target.name}</p>
                      {target.connected ? (
                        <p className="text-[10px] text-success flex items-center gap-1 font-medium">
                          <CheckCircle size={10} /> {target.username || 'Connected'}
                        </p>
                      ) : (
                        <p className="text-[10px] text-foreground/30 font-medium">Not linked</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {target.connected ? (
                      <button
                        onClick={() => handleDisconnect(target.platform)}
                        className="p-2 text-foreground/20 hover:text-error transition-colors"
                        title="Disconnect"
                      >
                        <LinkIcon size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(target.platform)}
                        className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-md hover:bg-primary/20 transition-all flex items-center gap-1"
                      >
                        Link <ExternalLink size={10} />
                      </button>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {target.status === 'success' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="mt-3 pt-3 border-t border-white/5"
                    >
                      <a
                        href={target.url}
                        target="_blank"
                        className="text-[10px] text-primary flex items-center gap-2 hover:underline bg-primary/5 p-2 rounded-lg"
                      >
                        <Copy size={12} /> View Published Clip
                        <ExternalLink size={10} className="ml-auto" />
                      </a>
                    </motion.div>
                  )}
                  {target.status === 'uploading' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="mt-3"
                    >
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary"
                          initial={{ width: '0%' }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 3 }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Warning if nothing selected */}
      {!targets.some(t => t.enabled) && (
        <div className="flex items-center gap-2 text-accent text-[10px] font-bold uppercase tracking-widest bg-accent/10 p-3 rounded-lg border border-accent/20">
          <AlertCircle size={14} />
          Select at least one platform to publish
        </div>
      )}
    </div>
  );
}

export default PublishingPanel;
