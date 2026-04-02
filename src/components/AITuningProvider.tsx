"use client";

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Target, Zap, TrendingUp, Settings, Plus, Edit, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getAnalytics } from '@/lib/analytics';

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: 'character' | 'script' | 'scene' | 'dialogue' | 'style';
  prompt: string;
  examples: string[];
  tags: string[];
  performance: {
    successRate: number;
    avgQuality: number;
    usageCount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface FewShotExample {
  id: string;
  input: string;
  output: string;
  quality: number;
  tags: string[];
  category: string;
}

interface AITuningContextType {
  templates: PromptTemplate[];
  examples: FewShotExample[];
  isTuningMode: boolean;
  setIsTuningMode: (mode: boolean) => void;
  createTemplate: (template: Omit<PromptTemplate, 'id' | 'performance' | 'createdAt' | 'updatedAt'>) => PromptTemplate;
  updateTemplate: (id: string, updates: Partial<PromptTemplate>) => void;
  deleteTemplate: (id: string) => void;
  addExample: (example: Omit<FewShotExample, 'id'>) => FewShotExample;
  enhancePrompt: (basePrompt: string, category: string, tags?: string[]) => string;
  recordUsage: (templateId: string, success: boolean, quality: number) => void;
}

const AITuningContext = createContext<AITuningContextType | undefined>(undefined);

interface AITuningProviderProps {
  children: React.ReactNode;
}

const DEFAULT_TEMPLATES: Omit<PromptTemplate, 'performance' | 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'character-detailed',
    name: 'Detailed Character Creation',
    description: 'Creates rich, nuanced characters with detailed personalities and backgrounds',
    category: 'character',
    prompt: `Create a detailed character profile for a video production. Include:
- Physical appearance and mannerisms
- Personality traits and motivations
- Background story and relationships
- Speaking style and catchphrases
- Visual style preferences

Character concept: {concept}
Style: {style}
Target audience: {audience}`,
    examples: [
      'A wise-cracking detective in a noir film',
      'A shy librarian who discovers superpowers',
      'A charismatic tech entrepreneur in a startup drama',
    ],
    tags: ['detailed', 'personality', 'background', 'visual'],
  },
  {
    id: 'script-engaging',
    name: 'Engaging Script Writing',
    description: 'Writes compelling scripts with natural dialogue and pacing',
    category: 'script',
    prompt: `Write an engaging script scene with:
- Natural, character-driven dialogue
- Clear scene descriptions
- Emotional beats and character development
- Visual storytelling elements
- Pacing appropriate for video

Genre: {genre}
Characters: {characters}
Scene objective: {objective}
Length: {length} minutes`,
    examples: [
      'A tense confrontation between rivals',
      'A heartfelt confession scene',
      'A comedic misunderstanding resolution',
    ],
    tags: ['dialogue', 'pacing', 'emotional', 'visual'],
  },
  {
    id: 'scene-cinematic',
    name: 'Cinematic Scene Generation',
    description: 'Generates visually stunning scenes with cinematic composition',
    category: 'scene',
    prompt: `Generate a cinematic scene description including:
- Detailed visual composition and lighting
- Camera angles and movement
- Color palette and mood
- Atmospheric elements
- Technical specifications

Scene type: {type}
Mood: {mood}
Setting: {setting}
Time of day: {time}`,
    examples: [
      'A dramatic sunset over a city skyline',
      'An intimate conversation in a dimly lit room',
      'An action sequence in a crowded marketplace',
    ],
    tags: ['cinematic', 'visual', 'lighting', 'composition'],
  },
];

export function AITuningProvider({ children }: AITuningProviderProps) {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [examples, setExamples] = useState<FewShotExample[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<PromptTemplate | null>(null);
  const [isTuningMode, setIsTuningMode] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    overallSuccess: 0,
    avgQuality: 0,
    totalGenerations: 0,
  });

  const analytics = getAnalytics();

  // Load templates and examples
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load from localStorage or API
        const savedTemplates = localStorage.getItem('ai-templates');
        const savedExamples = localStorage.getItem('ai-examples');

        if (savedTemplates) {
          const parsed = JSON.parse(savedTemplates);
          setTemplates(parsed.map((t: any) => ({
            ...t,
            createdAt: new Date(t.createdAt),
            updatedAt: new Date(t.updatedAt),
          })));
        } else {
          // Initialize with defaults
          const now = new Date();
          const defaultTemplates = DEFAULT_TEMPLATES.map(t => ({
            ...t,
            performance: { successRate: 0.85, avgQuality: 4.2, usageCount: 0 },
            createdAt: now,
            updatedAt: now,
          }));
          setTemplates(defaultTemplates);
          localStorage.setItem('ai-templates', JSON.stringify(defaultTemplates));
        }

        if (savedExamples) {
          setExamples(JSON.parse(savedExamples));
        }
      } catch (error) {
        console.error('Failed to load AI tuning data:', error);
      }
    };

    loadData();
  }, []);

  // Save data when changed
  useEffect(() => {
    if (templates.length > 0) {
      localStorage.setItem('ai-templates', JSON.stringify(templates));
    }
  }, [templates]);

  useEffect(() => {
    if (examples.length > 0) {
      localStorage.setItem('ai-examples', JSON.stringify(examples));
    }
  }, [examples]);

  // Calculate performance metrics
  useEffect(() => {
    if (templates.length > 0) {
      const totalUsage = templates.reduce((sum, t) => sum + t.performance.usageCount, 0);
      const weightedSuccess = templates.reduce((sum, t) =>
        sum + (t.performance.successRate * t.performance.usageCount), 0);
      const weightedQuality = templates.reduce((sum, t) =>
        sum + (t.performance.avgQuality * t.performance.usageCount), 0);

      setPerformanceMetrics({
        overallSuccess: totalUsage > 0 ? weightedSuccess / totalUsage : 0,
        avgQuality: totalUsage > 0 ? weightedQuality / totalUsage : 0,
        totalGenerations: totalUsage,
      });
    }
  }, [templates]);

  const createTemplate = useCallback((template: Omit<PromptTemplate, 'id' | 'performance' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date();
    const newTemplate: PromptTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      performance: { successRate: 0, avgQuality: 0, usageCount: 0 },
      createdAt: now,
      updatedAt: now,
    };

    setTemplates(prev => [...prev, newTemplate]);
    analytics.trackInteraction('ai_tuning', 'create_template', {
      category: template.category,
      tags: template.tags,
    });

    return newTemplate;
  }, [analytics]);

  const updateTemplate = useCallback((id: string, updates: Partial<PromptTemplate>) => {
    setTemplates(prev => prev.map(t =>
      t.id === id
        ? { ...t, ...updates, updatedAt: new Date() }
        : t
    ));
    analytics.trackInteraction('ai_tuning', 'update_template', { templateId: id });
  }, [analytics]);

  const deleteTemplate = useCallback((id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    analytics.trackInteraction('ai_tuning', 'delete_template', { templateId: id });
  }, [analytics]);

  const addExample = useCallback((example: Omit<FewShotExample, 'id'>) => {
    const newExample: FewShotExample = {
      ...example,
      id: `example-${Date.now()}`,
    };

    setExamples(prev => [...prev, newExample]);
    analytics.trackInteraction('ai_tuning', 'add_example', {
      category: example.category,
      quality: example.quality,
    });

    return newExample;
  }, [analytics]);

  const updateExample = useCallback((id: string, updates: Partial<FewShotExample>) => {
    setExamples(prev => prev.map(e =>
      e.id === id ? { ...e, ...updates } : e
    ));
    analytics.trackInteraction('ai_tuning', 'update_example', { exampleId: id });
  }, [analytics]);

  const deleteExample = useCallback((id: string) => {
    setExamples(prev => prev.filter(e => e.id !== id));
    analytics.trackInteraction('ai_tuning', 'delete_example', { exampleId: id });
  }, [analytics]);

  const recordUsage = useCallback((templateId: string, success: boolean, quality: number) => {
    setTemplates(prev => prev.map(t => {
      if (t.id === templateId) {
        const newUsageCount = t.performance.usageCount + 1;
        const newSuccessRate = ((t.performance.successRate * t.performance.usageCount) + (success ? 1 : 0)) / newUsageCount;
        const newAvgQuality = ((t.performance.avgQuality * t.performance.usageCount) + quality) / newUsageCount;

        return {
          ...t,
          performance: {
            successRate: newSuccessRate,
            avgQuality: newAvgQuality,
            usageCount: newUsageCount,
          },
          updatedAt: new Date(),
        };
      }
      return t;
    }));

    analytics.trackInteraction('ai_tuning', 'record_usage', {
      templateId,
      success,
      quality,
    });
  }, [analytics]);

  const getBestTemplate = useCallback((category: string, tags: string[] = []) => {
    const categoryTemplates = templates.filter(t => t.category === category);

    if (categoryTemplates.length === 0) return null;

    // Score templates based on performance and tag matching
    const scored = categoryTemplates.map(t => {
      let score = t.performance.avgQuality * 0.6 + t.performance.successRate * 0.4;

      // Boost score for tag matches
      const tagMatches = tags.filter(tag => t.tags.includes(tag)).length;
      score += tagMatches * 0.1;

      return { template: t, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.template || null;
  }, [templates]);

  const getRelevantExamples = useCallback((category: string, tags: string[] = [], limit = 5) => {
    const relevant = examples
      .filter(e => e.category === category)
      .map(e => {
        // Calculate relevance score
        const tagMatches = tags.filter(tag => e.tags.includes(tag)).length;
        const quality = e.quality;
        const score = (tagMatches * 0.4) + (quality * 0.6);

        return { example: e, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.example);

    return relevant;
  }, [examples]);

  const enhancePrompt = useCallback((basePrompt: string, category: string, tags: string[] = []) => {
    const bestTemplate = getBestTemplate(category, tags);
    const relevantExamples = getRelevantExamples(category, tags, 3);

    let enhancedPrompt = basePrompt;

    // Add template structure if available
    if (bestTemplate) {
      enhancedPrompt = bestTemplate.prompt.replace(/\{[^}]+\}/g, (match) => {
        const key = match.slice(1, -1);
        // Try to fill in variables from context
        return `{${key}}`;
      });
    }

    // Add few-shot examples
    if (relevantExamples.length > 0) {
      enhancedPrompt += '\n\nExamples:\n';
      relevantExamples.forEach((example, index) => {
        enhancedPrompt += `\nExample ${index + 1}:\nInput: ${example.input}\nOutput: ${example.output}\n`;
      });
    }

    // Add quality instructions
    enhancedPrompt += '\n\nQuality Guidelines:\n';
    enhancedPrompt += '- Ensure output matches the requested style and tone\n';
    enhancedPrompt += '- Include specific, actionable details\n';
    enhancedPrompt += '- Maintain consistency with established characters/scenes\n';
    enhancedPrompt += '- Focus on visual and emotional impact\n';

    return enhancedPrompt;
  }, [getBestTemplate, getRelevantExamples]);

  const value: AITuningContextType = {
    templates,
    examples,
    isTuningMode,
    setIsTuningMode,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    addExample,
    enhancePrompt,
    recordUsage,
  };

  return (
    <AITuningContext.Provider value={value}>
      <>
        {children}

        {/* AI Tuning Panel */}
        <AnimatePresence>
          {isTuningMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setIsTuningMode(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-surface rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-white/10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 sm:p-6 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                      <h2 className="text-lg sm:text-xl font-semibold">AI Fine-Tuning</h2>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => setIsTuningMode(false)}
                    >
                      ×
                    </Button>
                  </div>

                  {/* Performance Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mt-4">
                    <div className="bg-surface/50 rounded-lg p-3 border border-white/5">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-success" />
                        <span className="text-sm font-medium">Success Rate</span>
                      </div>
                      <div className="text-2xl font-bold text-success">
                        {Math.round(performanceMetrics.overallSuccess * 100)}%
                      </div>
                    </div>

                    <div className="bg-surface/50 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-warning" />
                        <span className="text-sm font-medium">Avg Quality</span>
                      </div>
                      <div className="text-2xl font-bold text-warning">
                        {performanceMetrics.avgQuality.toFixed(1)}
                      </div>
                    </div>

                    <div className="bg-surface/50 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">Total Uses</span>
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        {performanceMetrics.totalGenerations}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-200px)] custom-scrollbar">
                  {/* Templates Section */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Prompt Templates</h3>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          // Create new template
                          const newTemplate = createTemplate({
                            name: 'New Template',
                            description: 'Description',
                            category: 'character',
                            prompt: 'Enter your prompt here...',
                            examples: [],
                            tags: [],
                          });
                          setActiveTemplate(newTemplate);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        New Template
                      </Button>
                    </div>

                    <div className="grid gap-4">
                      {templates.map((template) => (
                        <motion.div
                          key={template.id}
                          className="border border-border rounded-lg p-4 hover:bg-surface/50 transition-colors"
                          whileHover={{ scale: 1.01 }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">{template.name}</h4>
                                <Badge variant="neutral">{template.category}</Badge>
                                <div className="flex items-center gap-1 text-sm text-foreground/60">
                                  <TrendingUp className="w-3 h-3" />
                                  {template.performance.usageCount} uses
                                </div>
                              </div>
                              <p className="text-sm sm:text-base text-foreground/70 mb-2 leading-relaxed">
                                {template.description}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {template.tags.map((tag) => (
                                  <Badge key={tag} variant="neutral" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setActiveTemplate(template)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteTemplate(template.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Examples Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Few-Shot Examples</h3>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          addExample({
                            input: 'Example input',
                            output: 'Example output',
                            quality: 5,
                            tags: [],
                            category: 'character',
                          });
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Example
                      </Button>
                    </div>

                    <div className="grid gap-4">
                      {examples.slice(0, 10).map((example) => (
                        <div key={example.id} className="border border-border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant="neutral">{example.category}</Badge>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-warning" />
                              <span className="text-sm">{example.quality}/5</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <div className="text-sm font-medium text-foreground/70">Input:</div>
                              <div className="text-sm bg-surface/50 rounded p-2 mt-1">
                                {example.input}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-foreground/70">Output:</div>
                              <div className="text-sm bg-surface/50 rounded p-2 mt-1">
                                {example.output}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1 mt-2">
                            {example.tags.map((tag) => (
                              <Badge key={tag} variant="neutral" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Tuning Button */}
        <motion.button
          className="fixed bottom-24 lg:bottom-6 right-6 z-50 bg-primary/20 hover:bg-primary/30 text-primary rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shadow-lg hover:shadow-glow-primary transition-all border border-primary/30 backdrop-blur-xl"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsTuningMode(!isTuningMode)}
        >
          <Brain className="w-5 h-5 sm:w-6 sm:h-6" />
        </motion.button>
      </>
    </AITuningContext.Provider>
  );
}

// Hook for AI tuning functionality
export function useAITuning() {
  const context = useContext(AITuningContext);
  if (context === undefined) {
    throw new Error('useAITuning must be used within an AITuningProvider');
  }
  return context;
}