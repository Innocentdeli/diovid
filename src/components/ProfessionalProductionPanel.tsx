"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sliders, 
  Wand2, 
  Layers, 
  Users, 
  Zap, 
  FileIcon, 
  GitBranch, 
  Folder, 
  MessageSquare,
  ChevronDown,
  Edit3,
  Play,
  Film
} from 'lucide-react';
import ColorGrading from '@/components/ColorGrading';
import AudioEffects from '@/components/AudioEffects';
import AdvancedEffects from '@/components/AdvancedEffects';
import GreenScreen from '@/components/GreenScreen';
import FullBodyAnimation from '@/components/FullBodyAnimation';
import FormatConverter from '@/components/FormatConverter';
import VersionControl from '@/components/VersionControl';
import AssetLibrary from '@/components/AssetLibrary';
import CollaborationReview from '@/components/CollaborationReview';
import FrameEditor from '@/components/FrameEditor';
import BatchRendering from '@/components/BatchRendering';
import VFXCompositing from '@/components/VFXCompositing';

type ProductionPanelType = 
  | 'color-grading'
  | 'audio-effects'
  | 'advanced-effects'
  | 'green-screen'
  | 'full-body'
  | 'format-converter'
  | 'version-control'
  | 'asset-library'
  | 'collaboration'
  | 'frame-editor'
  | 'batch-rendering'
  | 'vfx-compositing';

const PRODUCTION_TOOLS = [
  { 
    id: 'color-grading', 
    label: 'Color Grading', 
    icon: Sliders, 
    category: 'Video Editing' 
  },
  { 
    id: 'audio-effects', 
    label: 'Audio Effects', 
    icon: Wand2, 
    category: 'Audio' 
  },
  { 
    id: 'advanced-effects', 
    label: 'Visual Effects', 
    icon: Zap, 
    category: 'Video Editing' 
  },
  { 
    id: 'green-screen', 
    label: 'Green Screen', 
    icon: Layers, 
    category: 'Video Editing' 
  },
  { 
    id: 'full-body', 
    label: 'Character Motion', 
    icon: Users, 
    category: 'Animation' 
  },
  { 
    id: 'format-converter', 
    label: 'Format Converter', 
    icon: FileIcon, 
    category: 'Quality Control' 
  },
  { 
    id: 'version-control', 
    label: 'Version Control', 
    icon: GitBranch, 
    category: 'Collaboration' 
  },
  { 
    id: 'asset-library', 
    label: 'Asset Library', 
    icon: Folder, 
    category: 'Collaboration' 
  },
  { 
    id: 'frame-editor', 
    label: 'Frame Editor', 
    icon: Edit3, 
    category: 'Video Editing' 
  },
  { 
    id: 'vfx-compositing', 
    label: 'VFX Compositing', 
    icon: Film, 
    category: 'Video Editing' 
  },
  { 
    id: 'batch-rendering', 
    label: 'Batch Rendering', 
    icon: Play, 
    category: 'Quality Control' 
  },
];

const CATEGORIES = ['Video Editing', 'Audio', 'Animation', 'Quality Control', 'Collaboration'];

interface ProfessionalProductionPanelProps {
  onExport?: () => void;
}

export default function ProfessionalProductionPanel({ onExport }: ProfessionalProductionPanelProps) {
  const [activePanel, setActivePanel] = useState<ProductionPanelType>('color-grading');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['Video Editing', 'Audio'])
  );

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const renderPanel = () => {
    switch (activePanel) {
      case 'color-grading':
        return <ColorGrading />;
      case 'audio-effects':
        return <AudioEffects />;
      case 'advanced-effects':
        return <AdvancedEffects />;
      case 'green-screen':
        return <GreenScreen />;
      case 'full-body':
        return <FullBodyAnimation />;
      case 'format-converter':
        return <FormatConverter />;
      case 'version-control':
        return <VersionControl />;
      case 'asset-library':
        return <AssetLibrary />;
      case 'collaboration':
        return <CollaborationReview />;
      case 'frame-editor':
        return <FrameEditor />;
      case 'batch-rendering':
        return <BatchRendering />;
      case 'vfx-compositing':
        return <VFXCompositing />;
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 h-full">
      {/* Sidebar */}
      <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/10 sticky top-0 bg-white/3">
          <h3 className="text-sm font-display font-bold">Professional Tools</h3>
          <p className="text-xs text-foreground/40 mt-1">{PRODUCTION_TOOLS.length} tools</p>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {CATEGORIES.map(category => {
            const tools = PRODUCTION_TOOLS.filter(t => t.category === category);
            const isExpanded = expandedCategories.has(category);

            return (
              <div key={category} className="border-b border-white/10 last:border-b-0">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left"
                >
                  <span className="text-xs font-semibold text-foreground/60 uppercase tracking-wider">
                    {category}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-white/2"
                    >
                      {tools.map(tool => {
                        const Icon = tool.icon;
                        const isActive = activePanel === tool.id;

                        return (
                          <button
                            key={tool.id}
                            onClick={() => setActivePanel(tool.id as ProductionPanelType)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all ${
                              isActive
                                ? 'bg-primary/20 text-primary border-l-2 border-primary'
                                : 'text-foreground/60 hover:bg-white/5 hover:text-foreground/80'
                            }`}
                          >
                            <Icon size={16} className="flex-shrink-0" />
                            <span className="text-xs font-medium">{tool.label}</span>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Panel */}
      <div className="bg-white/5 rounded-lg border border-white/10 p-6 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePanel}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderPanel()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
