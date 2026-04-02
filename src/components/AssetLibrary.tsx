"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Folder, Plus, Trash2, Download, Upload } from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  type: 'background' | 'character' | 'audio' | 'effect' | 'video';
  size: string;
  created: string;
  tags: string[];
}

const DEFAULT_ASSETS: Asset[] = [
  {
    id: '1',
    name: 'Studio Background',
    type: 'background',
    size: '2.4 MB',
    created: '2 days ago',
    tags: ['cinematic', 'indoor'],
  },
  {
    id: '2',
    name: 'Character - Alex',
    type: 'character',
    size: '1.8 MB',
    created: '3 days ago',
    tags: ['digital-human', 'portrait'],
  },
  {
    id: '3',
    name: 'Ambient Music Track',
    type: 'audio',
    size: '3.2 MB',
    created: '1 day ago',
    tags: ['background-music', 'electronic'],
  },
];

interface AssetLibraryProps {
  onUse?: (asset: Asset) => void;
}

export default function AssetLibrary({ onUse }: AssetLibraryProps) {
  const [assets, setAssets] = useState<Asset[]>(DEFAULT_ASSETS);
  const [filter, setFilter] = useState<'all' | Asset['type']>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  const filteredAssets = assets.filter(asset => {
    const matchesFilter = filter === 'all' || asset.type === filter;
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const deleteAsset = (id: string) => {
    setAssets(assets.filter(a => a.id !== id));
  };

  const getTypeColor = (type: Asset['type']) => {
    const colors = {
      background: 'text-blue-400',
      character: 'text-purple-400',
      audio: 'text-green-400',
      effect: 'text-yellow-400',
      video: 'text-red-400',
    };
    return colors[type];
  };

  const getTypeIcon = () => '📦';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
          <Folder size={20} className="text-primary" />
          Asset Library
        </h3>
        <p className="text-sm text-foreground/60">Organize and manage reusable project assets</p>
      </div>

      {/* Upload */}
      <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-primary/40 transition-colors cursor-pointer">
        <Upload size={24} className="mx-auto mb-2 text-primary/60" />
        <p className="text-sm font-medium">Import Asset</p>
        <p className="text-xs text-foreground/40 mt-1">Drag & drop or click to upload</p>
      </div>

      {/* Search & Filter */}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Search assets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-sm outline-none focus:border-primary/60"
        />

        <div className="flex gap-2 overflow-x-auto pb-2">
          {['all', 'background', 'character', 'audio', 'effect', 'video'].map(type => (
            <button
              key={type}
              onClick={() => setFilter(type as any)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                filter === type
                  ? 'bg-primary text-white'
                  : 'bg-white/5 text-foreground/60 hover:bg-white/10'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredAssets.map(asset => (
          <motion.div
            key={asset.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setSelectedAsset(asset.id)}
            className={`bg-white/5 rounded-lg p-4 border transition-all cursor-pointer ${
              selectedAsset === asset.id
                ? 'border-primary/40 bg-primary/10'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-start gap-3 flex-1">
                <span className="text-2xl">{getTypeIcon()}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{asset.name}</p>
                  <p className={`text-xs ${getTypeColor(asset.type)}`}>
                    {asset.type.charAt(0).toUpperCase() + asset.type.slice(1)}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteAsset(asset.id);
                }}
                className="p-1 rounded hover:bg-error/20 transition-colors"
              >
                <Trash2 size={14} className="text-error/60 hover:text-error" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-foreground/40">
              <div className="flex justify-between">
                <span>{asset.size}</span>
                <span>{asset.created}</span>
              </div>
            </div>

            {asset.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {asset.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-foreground/60"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {selectedAsset === asset.id && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onUse?.(asset);
                }}
                className="w-full mt-3 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all"
              >
                Use Asset
              </motion.button>
            )}
          </motion.div>
        ))}
      </div>

      {filteredAssets.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-foreground/40">No assets found</p>
        </div>
      )}

      {/* Stats */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-primary">{assets.length}</p>
          <p className="text-xs text-foreground/40 mt-1">Total Assets</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-primary">
            {new Set(assets.map(a => a.type)).size}
          </p>
          <p className="text-xs text-foreground/40 mt-1">Asset Types</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-primary">24 MB</p>
          <p className="text-xs text-foreground/40 mt-1">Storage Used</p>
        </div>
      </div>
    </div>
  );
}
