"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Users, AlertCircle, Check } from 'lucide-react';

interface ReviewComment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  resolved: boolean;
  replies: ReviewComment[];
}

interface CollaborationReviewProps {
  onComment?: (comment: string, timestamp: string) => void;
}

const DEFAULT_COMMENTS: ReviewComment[] = [
  {
    id: '1',
    author: 'Sarah',
    text: 'Great character animation! Could we adjust the eye blink rate in scene 3?',
    timestamp: '2 hours ago',
    resolved: false,
    replies: [
      {
        id: '1-1',
        author: 'You',
        text: 'Sure, I\'ll adjust that. Will update the animation contract.',
        timestamp: '1 hour ago',
        resolved: false,
        replies: [],
      },
    ],
  },
  {
    id: '2',
    author: 'Marcus',
    text: 'Audio levels need to be normalized. Currently too quiet in the intro.',
    timestamp: '3 hours ago',
    resolved: true,
    replies: [],
  },
];

export default function CollaborationReview({ onComment }: CollaborationReviewProps) {
  const [comments, setComments] = useState<ReviewComment[]>(DEFAULT_COMMENTS);
  const [newComment, setNewComment] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set(['1']));

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment: ReviewComment = {
      id: `${Date.now()}`,
      author: 'You',
      text: newComment,
      timestamp: 'just now',
      resolved: false,
      replies: [],
    };

    setComments([...comments, comment]);
    setNewComment('');
    onComment?.(newComment, 'just now');
  };

  const toggleResolved = (id: string) => {
    setComments(comments.map(c => 
      c.id === id ? { ...c, resolved: !c.resolved } : c
    ));
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedComments(newExpanded);
  };

  const unresolved = comments.filter(c => !c.resolved);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
          <MessageSquare size={20} className="text-primary" />
          Collaboration & Review
        </h3>
        <p className="text-sm text-foreground/60">Team feedback and review comments</p>
      </div>

      {/* Team Status */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-primary" />
            <span className="text-sm font-medium">Active Reviewers</span>
          </div>
          <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">3 online</span>
        </div>
        <div className="flex gap-2">
          {['Sarah', 'Marcus', 'Alex'].map(name => (
            <div key={name} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-foreground/60">{name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Issue Summary */}
      {unresolved.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-500">
                {unresolved.length} unresolved feedback item{unresolved.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-yellow-500/70 mt-1">
                Please address these before publishing
              </p>
            </div>
          </div>
        </div>
      )}

      {/* New Comment */}
      <div className="bg-white/5 rounded-lg p-4 space-y-3 border border-white/10">
        <label className="text-xs font-semibold text-foreground/60 uppercase tracking-widest">Add Comment</label>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Share feedback or suggestions..."
          className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-xs outline-none focus:border-primary/60 resize-none h-20"
        />
        <button
          onClick={handleAddComment}
          disabled={!newComment.trim()}
          className="w-full px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Post Comment
        </button>
      </div>

      {/* Comments Thread */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-foreground/40 uppercase tracking-widest">
          Comments ({comments.length})
        </p>

        {comments.map(comment => (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-lg border transition-all ${
              comment.resolved
                ? 'bg-white/3 border-white/5 opacity-60'
                : 'bg-white/5 border-white/10'
            }`}
          >
            {/* Main Comment */}
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{comment.author}</span>
                    <span className="text-xs text-foreground/40">{comment.timestamp}</span>
                  </div>
                  <p className="text-sm mt-2 text-foreground/90">{comment.text}</p>
                </div>
                <button
                  onClick={() => toggleResolved(comment.id)}
                  className={`p-2 rounded transition-all flex-shrink-0 ${
                    comment.resolved
                      ? 'bg-success/20 text-success'
                      : 'bg-white/5 text-foreground/40 hover:bg-white/10'
                  }`}
                  title={comment.resolved ? 'Mark as unresolved' : 'Mark as resolved'}
                >
                  <Check size={16} />
                </button>
              </div>

              {comment.replies.length > 0 && (
                <button
                  onClick={() => toggleExpanded(comment.id)}
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  {expandedComments.has(comment.id) ? '▼' : '▶'} {comment.replies.length} repl
{comment.replies.length !== 1 ? 'ies' : 'y'}
                </button>
              )}
            </div>

            {/* Replies */}
            {expandedComments.has(comment.id) && comment.replies.length > 0 && (
              <div className="border-t border-white/10 p-4 space-y-3 bg-white/2">
                {comment.replies.map(reply => (
                  <div key={reply.id} className="ml-4 pl-4 border-l border-white/10 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{reply.author}</span>
                      <span className="text-xs text-foreground/40">{reply.timestamp}</span>
                    </div>
                    <p className="text-sm text-foreground/80">{reply.text}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
