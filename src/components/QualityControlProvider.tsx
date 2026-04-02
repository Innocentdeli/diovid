"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, ThumbsUp, ThumbsDown, MessageSquare, RefreshCw, Shield, Eye, Target } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getAnalytics } from '@/lib/analytics';

interface QualityCheck {
  id: string;
  type: 'content' | 'technical' | 'accessibility' | 'performance';
  category: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'passed' | 'failed' | 'warning';
  details?: string;
  suggestions?: string[];
  autoFixable?: boolean;
}

interface UserFeedback {
  id: string;
  type: 'rating' | 'comment' | 'bug_report' | 'feature_request';
  contentId: string;
  rating?: number;
  comment?: string;
  category?: string;
  timestamp: Date;
  userId?: string;
  resolved?: boolean;
}

interface QualityMetrics {
  contentQuality: number;
  technicalScore: number;
  accessibilityScore: number;
  performanceScore: number;
  userSatisfaction: number;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
}

interface QualityControlProviderProps {
  children: React.ReactNode;
  contentId?: string;
}

const QUALITY_CHECKS: Omit<QualityCheck, 'id' | 'status'>[] = [
  // Content Quality
  {
    type: 'content',
    category: 'script',
    title: 'Script Readability',
    description: 'Checks if the script is clear and engaging',
    severity: 'medium',
    suggestions: ['Use shorter sentences', 'Add dialogue variety', 'Include character descriptions'],
  },
  {
    type: 'content',
    category: 'characters',
    title: 'Character Consistency',
    description: 'Ensures characters have consistent traits and development',
    severity: 'high',
    suggestions: ['Define character arcs', 'Maintain consistent personalities', 'Show character growth'],
  },
  {
    type: 'content',
    category: 'scenes',
    title: 'Scene Flow',
    description: 'Analyzes the logical flow between scenes',
    severity: 'medium',
    suggestions: ['Add transition scenes', 'Ensure temporal consistency', 'Build narrative tension'],
  },

  // Technical Quality
  {
    type: 'technical',
    category: 'video',
    title: 'Video Resolution',
    description: 'Checks if video meets minimum resolution requirements',
    severity: 'high',
    suggestions: ['Use HD resolution (1920x1080)', 'Ensure consistent frame rate', 'Check aspect ratio'],
    autoFixable: true,
  },
  {
    type: 'technical',
    category: 'audio',
    title: 'Audio Quality',
    description: 'Validates audio clarity and synchronization',
    severity: 'high',
    suggestions: ['Ensure clear dialogue', 'Balance audio levels', 'Check lip sync timing'],
  },

  // Accessibility
  {
    type: 'accessibility',
    category: 'captions',
    title: 'Caption Accuracy',
    description: 'Verifies captions match spoken content',
    severity: 'critical',
    suggestions: ['Review auto-generated captions', 'Add speaker identification', 'Include sound descriptions'],
  },
  {
    type: 'accessibility',
    category: 'contrast',
    title: 'Color Contrast',
    description: 'Ensures text is readable against backgrounds',
    severity: 'medium',
    suggestions: ['Use high contrast colors', 'Add text shadows', 'Test on different displays'],
    autoFixable: true,
  },

  // Performance
  {
    type: 'performance',
    category: 'loading',
    title: 'Load Times',
    description: 'Checks if content loads within acceptable time limits',
    severity: 'medium',
    suggestions: ['Optimize video compression', 'Use progressive loading', 'Cache static assets'],
  },
];

export function QualityControlProvider({ children, contentId }: QualityControlProviderProps) {
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);
  const [userFeedback, setUserFeedback] = useState<UserFeedback[]>([]);
  const [metrics, setMetrics] = useState<QualityMetrics>({
    contentQuality: 0,
    technicalScore: 0,
    accessibilityScore: 0,
    performanceScore: 0,
    userSatisfaction: 0,
    totalChecks: 0,
    passedChecks: 0,
    failedChecks: 0,
  });
  const [isValidating, setIsValidating] = useState(false);
  const [showQualityPanel, setShowQualityPanel] = useState(false);

  const analytics = getAnalytics();

  // Initialize quality checks
  useEffect(() => {
    const checks = QUALITY_CHECKS.map(check => ({
      ...check,
      id: `${check.type}-${check.category}-${Date.now()}`,
      status: 'pending' as const,
    }));
    setQualityChecks(checks);
  }, []);

  // Load user feedback
  useEffect(() => {
    if (contentId) {
      // Load feedback from storage or API
      const savedFeedback = localStorage.getItem(`feedback-${contentId}`);
      if (savedFeedback) {
        const parsed = JSON.parse(savedFeedback).map((f: any) => ({
          ...f,
          timestamp: new Date(f.timestamp),
        }));
        setUserFeedback(parsed);
      }
    }
  }, [contentId]);

  // Calculate metrics
  useEffect(() => {
    const totalChecks = qualityChecks.length;
    const passedChecks = qualityChecks.filter(c => c.status === 'passed').length;
    const failedChecks = qualityChecks.filter(c => c.status === 'failed').length;

    const contentChecks = qualityChecks.filter(c => c.type === 'content');
    const technicalChecks = qualityChecks.filter(c => c.type === 'technical');
    const accessibilityChecks = qualityChecks.filter(c => c.type === 'accessibility');
    const performanceChecks = qualityChecks.filter(c => c.type === 'performance');

    const calculateScore = (checks: QualityCheck[]) => {
      if (checks.length === 0) return 0;
      const passed = checks.filter(c => c.status === 'passed').length;
      return (passed / checks.length) * 100;
    };

    const userSatisfaction = userFeedback.length > 0
      ? userFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / userFeedback.length * 20
      : 0;

    setMetrics({
      contentQuality: calculateScore(contentChecks),
      technicalScore: calculateScore(technicalChecks),
      accessibilityScore: calculateScore(accessibilityChecks),
      performanceScore: calculateScore(performanceChecks),
      userSatisfaction,
      totalChecks,
      passedChecks,
      failedChecks,
    });
  }, [qualityChecks, userFeedback]);

  // AI-powered content validation
  const validateContent = useCallback(async () => {
    setIsValidating(true);

    try {
      analytics.trackInteraction('quality_control', 'validation_start', {
        contentId,
        checkCount: qualityChecks.length,
      });

      // Simulate AI validation process
      for (const check of qualityChecks) {
        // In a real implementation, this would call AI validation APIs
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock validation results
        const randomScore = Math.random();
        let status: QualityCheck['status'] = 'pending';

        if (check.severity === 'critical') {
          status = randomScore > 0.8 ? 'passed' : 'failed';
        } else if (check.severity === 'high') {
          status = randomScore > 0.6 ? 'passed' : 'failed';
        } else {
          status = randomScore > 0.4 ? 'passed' : randomScore > 0.2 ? 'warning' : 'failed';
        }

        setQualityChecks(prev => prev.map(c =>
          c.id === check.id
            ? {
                ...c,
                status,
                details: status === 'failed'
                  ? `Validation failed for ${check.title}`
                  : status === 'warning'
                  ? `Minor issues found in ${check.title}`
                  : `Successfully validated ${check.title}`,
              }
            : c
        ));
      }

      analytics.trackInteraction('quality_control', 'validation_complete', {
        success: true,
        passedChecks: qualityChecks.filter(c => c.status === 'passed').length,
        failedChecks: qualityChecks.filter(c => c.status === 'failed').length,
      });
    } catch (error) {
      console.error('Validation failed:', error);
      analytics.trackInteraction('quality_control', 'validation_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsValidating(false);
    }
  }, [qualityChecks, contentId, analytics]);

  // Auto-fix issues
  const autoFixIssues = useCallback(async () => {
    const fixableChecks = qualityChecks.filter(c => c.autoFixable && c.status === 'failed');

    if (fixableChecks.length === 0) return;

    analytics.trackInteraction('quality_control', 'auto_fix_start', {
      fixableCount: fixableChecks.length,
    });

    for (const check of fixableChecks) {
      // Simulate auto-fix process
      await new Promise(resolve => setTimeout(resolve, 1000));

      setQualityChecks(prev => prev.map(c =>
        c.id === check.id
          ? {
              ...c,
              status: 'passed',
              details: `Auto-fixed: ${check.title}`,
            }
          : c
      ));
    }

    analytics.trackInteraction('quality_control', 'auto_fix_complete', {
      fixedCount: fixableChecks.length,
    });
  }, [qualityChecks, analytics]);

  // Submit user feedback
  const submitFeedback = useCallback((feedback: Omit<UserFeedback, 'id' | 'timestamp'>) => {
    const newFeedback: UserFeedback = {
      ...feedback,
      id: `feedback-${Date.now()}`,
      timestamp: new Date(),
    };

    setUserFeedback(prev => [...prev, newFeedback]);

    // Save to storage
    if (contentId) {
      const existing = JSON.parse(localStorage.getItem(`feedback-${contentId}`) || '[]');
      localStorage.setItem(`feedback-${contentId}`, JSON.stringify([...existing, newFeedback]));
    }

    analytics.trackInteraction('quality_control', 'feedback_submitted', {
      type: feedback.type,
      rating: feedback.rating,
      hasComment: !!feedback.comment,
    });
  }, [contentId, analytics]);

  // Get overall quality score
  const getOverallScore = useCallback(() => {
    const weights = {
      content: 0.3,
      technical: 0.3,
      accessibility: 0.2,
      performance: 0.1,
      satisfaction: 0.1,
    };

    return (
      metrics.contentQuality * weights.content +
      metrics.technicalScore * weights.technical +
      metrics.accessibilityScore * weights.accessibility +
      metrics.performanceScore * weights.performance +
      metrics.userSatisfaction * weights.satisfaction
    );
  }, [metrics]);

  const overallScore = getOverallScore();

  return (
    <div className="relative">
      {children}

      {/* Quality Control Panel */}
      <AnimatePresence>
        {showQualityPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowQualityPanel(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface rounded-lg shadow-xl max-w-6xl w-full min-w-[800px] max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-semibold">Quality Control</h2>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setShowQualityPanel(false)}
                  >
                    ×
                  </Button>
                </div>

                {/* Overall Score */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-surface/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary">
                      {Math.round(overallScore)}%
                    </div>
                    <div className="text-sm text-foreground/70">Overall</div>
                  </div>

                  <div className="bg-surface/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-success">
                      {Math.round(metrics.contentQuality)}%
                    </div>
                    <div className="text-sm text-foreground/70">Content</div>
                  </div>

                  <div className="bg-surface/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-warning">
                      {Math.round(metrics.technicalScore)}%
                    </div>
                    <div className="text-sm text-foreground/70">Technical</div>
                  </div>

                  <div className="bg-surface/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-info">
                      {Math.round(metrics.accessibilityScore)}%
                    </div>
                    <div className="text-sm text-foreground/70">Accessibility</div>
                  </div>

                  <div className="bg-surface/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-secondary">
                      {Math.round(metrics.userSatisfaction)}%
                    </div>
                    <div className="text-sm text-foreground/70">Satisfaction</div>
                  </div>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {/* Actions */}
                <div className="flex gap-3 mb-6">
                  <Button
                    onClick={validateContent}
                    disabled={isValidating}
                    className="flex-1"
                  >
                    {isValidating ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4 mr-2" />
                    )}
                    {isValidating ? 'Validating...' : 'Run Validation'}
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={autoFixIssues}
                    disabled={qualityChecks.filter(c => c.autoFixable && c.status === 'failed').length === 0}
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Auto-Fix Issues
                  </Button>
                </div>

                {/* Quality Checks */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Quality Checks</h3>

                  {qualityChecks.map((check) => (
                    <motion.div
                      key={check.id}
                      className="border border-border rounded-lg p-4"
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            check.status === 'passed' ? 'bg-success/20 text-success' :
                            check.status === 'failed' ? 'bg-destructive/20 text-destructive' :
                            check.status === 'warning' ? 'bg-warning/20 text-warning' :
                            'bg-surface/50 text-foreground/60'
                          }`}>
                            {check.status === 'passed' && <CheckCircle className="w-4 h-4" />}
                            {check.status === 'failed' && <XCircle className="w-4 h-4" />}
                            {check.status === 'warning' && <AlertTriangle className="w-4 h-4" />}
                            {check.status === 'pending' && <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{check.title}</h4>
                              <Badge variant="neutral" className="text-xs">
                                {check.category}
                              </Badge>
                              <Badge
                                variant={
                                  check.severity === 'critical' ? 'warning' :
                                  check.severity === 'high' ? 'warning' :
                                  check.severity === 'medium' ? 'secondary' : 'neutral'
                                }
                                className="text-xs"
                              >
                                {check.severity}
                              </Badge>
                            </div>
                            <p className="text-sm text-foreground/70 mb-2">
                              {check.description}
                            </p>
                            {check.details && (
                              <p className="text-sm text-foreground/60 mb-2">
                                {check.details}
                              </p>
                            )}
                            {check.suggestions && check.status !== 'passed' && (
                              <div className="space-y-1">
                                <div className="text-sm font-medium text-foreground/70">
                                  Suggestions:
                                </div>
                                <ul className="text-sm text-foreground/60 list-disc list-inside">
                                  {check.suggestions.map((suggestion, index) => (
                                    <li key={index}>{suggestion}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>

                        {check.autoFixable && check.status === 'failed' && (
                          <Button
                              variant="secondary"
                            size="sm"
                            onClick={() => {
                              // Auto-fix this specific check
                              setQualityChecks(prev => prev.map(c =>
                                c.id === check.id
                                  ? { ...c, status: 'passed', details: `Auto-fixed: ${check.title}` }
                                  : c
                              ));
                            }}
                          >
                            Fix
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* User Feedback */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">User Feedback</h3>

                  <div className="space-y-4">
                    {/* Quick Feedback */}
                    <div className="bg-surface/50 rounded-lg p-4">
                      <h4 className="font-medium mb-3">Rate this content</h4>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <Button
                            key={rating}
                            variant="ghost"
                            size="sm"
                            onClick={() => submitFeedback({
                              type: 'rating',
                              contentId: contentId || 'unknown',
                              rating,
                            })}
                          >
                            {rating <= (userFeedback.find(f => f.type === 'rating')?.rating || 0) ? (
                              <ThumbsUp className="w-4 h-4 text-primary" />
                            ) : (
                              <ThumbsUp className="w-4 h-4" />
                            )}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Feedback List */}
                    {userFeedback.map((feedback) => (
                      <div key={feedback.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {feedback.type === 'rating' && <ThumbsUp className="w-4 h-4 text-primary" />}
                            {feedback.type === 'comment' && <MessageSquare className="w-4 h-4 text-info" />}
                            {feedback.type === 'bug_report' && <AlertTriangle className="w-4 h-4 text-destructive" />}
                            {feedback.type === 'feature_request' && <Target className="w-4 h-4 text-warning" />}

                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="neutral" className="text-xs">
                                  {feedback.type.replace('_', ' ')}
                                </Badge>
                                {feedback.rating && (
                                  <span className="text-sm text-foreground/60">
                                    Rating: {feedback.rating}/5
                                  </span>
                                )}
                              </div>
                              {feedback.comment && (
                                <p className="text-sm text-foreground/70">
                                  {feedback.comment}
                                </p>
                              )}
                              <div className="text-xs text-foreground/50 mt-2">
                                {feedback.timestamp.toLocaleDateString()}
                              </div>
                            </div>
                          </div>
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

      {/* Floating Quality Button */}
      <motion.button
        className="fixed bottom-6 left-6 z-40 bg-primary text-primary-foreground rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowQualityPanel(!showQualityPanel)}
      >
        <Shield className="w-6 h-6" />
      </motion.button>
    </div>
  );
}

// Hook for quality control functionality
export function useQualityControl() {
  const [isValidating, setIsValidating] = useState(false);
  const analytics = getAnalytics();

  const validateContent = useCallback(async (contentId: string) => {
    setIsValidating(true);
    analytics.trackInteraction('quality_hook', 'validation_start', { contentId });

    // Simulate validation
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsValidating(false);
    analytics.trackInteraction('quality_hook', 'validation_complete', { contentId });
  }, [analytics]);

  const submitFeedback = useCallback((feedback: Omit<UserFeedback, 'id' | 'timestamp'>) => {
    analytics.trackInteraction('quality_hook', 'feedback_submitted', {
      type: feedback.type,
      rating: feedback.rating,
    });
  }, [analytics]);

  return {
    isValidating,
    validateContent,
    submitFeedback,
  };
}