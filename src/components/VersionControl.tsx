"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Plus, ChevronDown, Trash2, RotateCcw } from 'lucide-react';

interface VersionControlProps {
  onCommit?: (message: string, branch: string) => void;
  onBranch?: (branchName: string) => void;
}

interface Version {
  id: string;
  timestamp: string;
  message: string;
  author: string;
  changes: string[];
}

const DEFAULT_VERSIONS: Version[] = [
  {
    id: '1',
    timestamp: '2 hours ago',
    message: 'Initial project setup with cast and script',
    author: 'You',
    changes: ['Added 3 characters', 'Written initial script', 'Set audio tracks'],
  },
];

export default function VersionControl({ onCommit, onBranch }: VersionControlProps) {
  const [versions, setVersions] = useState<Version[]>(DEFAULT_VERSIONS);
  const [currentBranch, setCurrentBranch] = useState('main');
  const [branches, setBranches] = useState(['main', 'editing', 'audio-pass']);
  const [commitMessage, setCommitMessage] = useState('');
  const [newBranchName, setNewBranchName] = useState('');
  const [showNewBranch, setShowNewBranch] = useState(false);

  const handleCommit = () => {
    if (!commitMessage.trim()) return;

    const newVersion: Version = {
      id: `${Date.now()}`,
      timestamp: 'just now',
      message: commitMessage,
      author: 'You',
      changes: ['Frame updates', 'Effect adjustments'],
    };

    setVersions([newVersion, ...versions]);
    setCommitMessage('');
    onCommit?.(commitMessage, currentBranch);
  };

  const createBranch = () => {
    if (!newBranchName.trim()) return;

    if (!branches.includes(newBranchName)) {
      setBranches([...branches, newBranchName]);
      onBranch?.(newBranchName);
    }

    setNewBranchName('');
    setShowNewBranch(false);
  };

  const deleteBranch = (branch: string) => {
    if (branch !== 'main') {
      setBranches(branches.filter(b => b !== branch));
    }
  };

  const switchBranch = (branch: string) => {
    setCurrentBranch(branch);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
          <GitBranch size={20} className="text-primary" />
          Version Control & Branching
        </h3>
        <p className="text-sm text-foreground/60">Track changes and manage project versions</p>
      </div>

      {/* Current Branch */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-foreground/40 uppercase tracking-widest">Current Branch</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          <span className="text-lg font-semibold">{currentBranch}</span>
        </div>
      </div>

      {/* Branches */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-foreground/40 uppercase tracking-widest">Branches</label>
          <button
            onClick={() => setShowNewBranch(!showNewBranch)}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            <Plus size={16} className="text-primary" />
          </button>
        </div>

        {showNewBranch && (
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="feature/color-grading"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              className="flex-1 px-3 py-2 rounded bg-white/5 border border-white/10 text-xs outline-none focus:border-primary/60"
            />
            <button
              onClick={createBranch}
              className="px-3 py-2 rounded bg-primary text-white text-xs font-semibold hover:bg-primary/90"
            >
              Create
            </button>
          </div>
        )}

        <div className="space-y-2">
          {branches.map(branch => (
            <motion.div
              key={branch}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center justify-between p-3 rounded-lg transition-all cursor-pointer ${
                currentBranch === branch
                  ? 'bg-primary/20 border border-primary/40'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
              }`}
              onClick={() => switchBranch(branch)}
            >
              <div className="flex items-center gap-2">
                <GitBranch size={14} className="text-primary/60" />
                <span className="text-sm font-medium">{branch}</span>
              </div>
              {branch !== 'main' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteBranch(branch);
                  }}
                  className="p-1 rounded hover:bg-error/20 transition-colors"
                >
                  <Trash2 size={14} className="text-error/60 hover:text-error" />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Commit */}
      <div className="bg-white/5 rounded-lg p-4 space-y-3 border border-white/10">
        <label className="text-xs font-semibold text-foreground/40 uppercase tracking-widest">Create Commit</label>
        <textarea
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder="Describe your changes... (e.g., 'Added color grading and adjusted audio levels')"
          className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-xs outline-none focus:border-primary/60 resize-none h-24"
        />
        <button
          onClick={handleCommit}
          disabled={!commitMessage.trim()}
          className="w-full px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-glow-primary"
        >
          Commit Changes
        </button>
      </div>

      {/* History */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-foreground/40 uppercase tracking-widest">Version History ({currentBranch})</label>
        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
          {versions.map(version => (
            <motion.div
              key={version.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-lg p-3 border border-white/10 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium">{version.message}</p>
                  <p className="text-xs text-foreground/40 mt-1">
                    by {version.author} • {version.timestamp}
                  </p>
                </div>
              </div>
              {version.changes.length > 0 && (
                <div className="text-xs text-foreground/50 space-y-1">
                  {version.changes.map((change, i) => (
                    <div key={i} className="ml-2">• {change}</div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
