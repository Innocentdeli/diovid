"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, Users, FileText, Play, Download, Sparkles, Mic } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useDirectorStore } from '@/stores/directorStore';
import { getAnalytics } from '@/lib/analytics';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  required: boolean;
  completed: boolean;
  component: React.ComponentType<any>;
}

interface WorkflowProviderProps {
  children: React.ReactNode;
}

const WORKFLOW_STEPS: Omit<WorkflowStep, 'completed'>[] = [
  {
    id: 'characters',
    title: 'Create Characters',
    description: 'Define your story characters with photos and personalities',
    icon: Users,
    required: true,
    component: () => <div>Character creation component</div>,
  },
  {
    id: 'script',
    title: 'Write Script',
    description: 'Craft your story or script with AI assistance',
    icon: FileText,
    required: true,
    component: () => <div>Script writing component</div>,
  },
  {
    id: 'audio',
    title: 'Produce Audio',
    description: 'Record voices and create music for your scenes',
    icon: Mic,
    required: false,
    component: () => <div>Audio production component</div>,
  },
  {
    id: 'preview',
    title: 'Preview & Edit',
    description: 'Review generated scenes and make adjustments',
    icon: Play,
    required: false,
    component: () => <div>Preview component</div>,
  },
  {
    id: 'generate',
    title: 'Generate Video',
    description: 'Produce your final video with all scenes',
    icon: Sparkles,
    required: true,
    component: () => <div>Video generation component</div>,
  },
  {
    id: 'export',
    title: 'Export & Share',
    description: 'Download and share your completed video',
    icon: Download,
    required: false,
    component: () => <div>Export component</div>,
  },
];

export function WorkflowProvider({ children }: WorkflowProviderProps) {
  const {
    activeStep: currentStep,
    setActiveStep: setCurrentStep,
    characters,
    scriptHtml,
    orchestration,
  } = useDirectorStore();
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isLinearMode, setIsLinearMode] = useState(true);

  const analytics = getAnalytics();

  // Auto-update completed steps based on state
  useEffect(() => {
    const newCompleted = new Set(completedSteps);

    // Characters step
    if (characters.some(c => c.name.trim())) {
      newCompleted.add('characters');
    } else {
      newCompleted.delete('characters');
    }

    // Script step
    if (scriptHtml.trim()) {
      newCompleted.add('script');
    } else {
      newCompleted.delete('script');
    }

    // Audio step (optional - completed if user has moved past script)
    if (currentStep > 1) {
      newCompleted.add('audio');
    } else {
      newCompleted.delete('audio');
    }

    // Preview step (optional)
    if (orchestration?.scenes && orchestration.scenes.length > 0) {
      newCompleted.add('preview');
    }

    // Generate step
    if (orchestration?.scenes && orchestration.scenes.every((s: any) => s.videoUrl)) {
      newCompleted.add('generate');
    } else {
      newCompleted.delete('generate');
    }

    setCompletedSteps(newCompleted);
  }, [characters, scriptHtml, orchestration]);

  const steps: WorkflowStep[] = WORKFLOW_STEPS.map(step => ({
    ...step,
    completed: completedSteps.has(step.id),
  }));

  const canProceedToStep = (stepIndex: number): boolean => {
    if (!isLinearMode) return true;

    // Check if all previous required steps are completed
    for (let i = 0; i < stepIndex; i++) {
      const step = steps[i];
      if (step.required && !step.completed) {
        return false;
      }
    }
    return true;
  };

  const handleStepClick = (stepIndex: number) => {
    if (canProceedToStep(stepIndex)) {
      setCurrentStep(stepIndex);
      analytics.trackInteraction('workflow_step', 'click', {
        stepId: steps[stepIndex].id,
        stepIndex,
      });
    }
  };

  const handleNext = () => {
    const nextStep = currentStep + 1;
    if (nextStep < steps.length && canProceedToStep(nextStep)) {
      setCurrentStep(nextStep);
      analytics.trackInteraction('workflow_navigation', 'next', {
        fromStep: steps[currentStep].id,
        toStep: steps[nextStep].id,
      });
    }
  };

  const handlePrevious = () => {
    const prevStep = Math.max(0, currentStep - 1);
    setCurrentStep(prevStep);
    analytics.trackInteraction('workflow_navigation', 'previous', {
      fromStep: steps[currentStep].id,
      toStep: steps[prevStep].id,
    });
  };

  const toggleMode = () => {
    setIsLinearMode(!isLinearMode);
    analytics.trackInteraction('workflow_mode', 'toggle', {
      newMode: isLinearMode ? 'free' : 'linear',
    });
  };

  const progress = (completedSteps.size / steps.filter(s => s.required).length) * 100;

  return (
    <div className="min-h-screen flex">
      {/* Workflow Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="hidden lg:flex w-80 bg-surface/95 backdrop-blur-sm border-r border-border flex flex-col"
      >
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link href="/" aria-label="Go to homepage" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-display font-bold text-lg shadow-lg">
              D
            </div>
            <span className="font-display font-bold text-lg tracking-tight">Diovid</span>
          </Link>
        </div>
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Production Workflow</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMode}
              className="text-xs"
            >
              {isLinearMode ? 'Free Mode' : 'Guided Mode'}
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-surface/50 rounded-full h-2">
              <motion.div
                className="bg-primary h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="flex-1 p-4 space-y-2">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isAccessible = canProceedToStep(index);
            const isCompleted = step.completed;

            return (
              <motion.button
                key={step.id}
                onClick={() => handleStepClick(index)}
                disabled={!isAccessible}
                className={`w-full p-4 rounded-lg text-left transition-all ${isActive
                  ? 'bg-primary/10 border-primary border'
                  : isCompleted
                    ? 'bg-success/10 border-success/30 border'
                    : isAccessible
                      ? 'hover:bg-surface/50 border-border border'
                      : 'opacity-50 cursor-not-allowed border-border/50 border'
                  }`}
                whileHover={isAccessible ? { scale: 1.02 } : {}}
                whileTap={isAccessible ? { scale: 0.98 } : {}}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${isCompleted
                    ? 'bg-success/20 text-success'
                    : isActive
                      ? 'bg-primary/20 text-primary'
                      : 'bg-surface/50 text-foreground/60'
                    }`}>
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-medium truncate ${isActive ? 'text-primary' : 'text-foreground'
                        }`}>
                        {step.title}
                      </h3>
                      {step.required && (
                        <Badge variant="neutral" className="text-xs px-1 py-0">
                          Required
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-foreground/70 mt-1">
                      {step.description}
                    </p>
                  </div>

                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 bg-primary rounded-full"
                    />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={currentStep === steps.length - 1 || !canProceedToStep(currentStep + 1)}
              className="flex-1"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Hook for workflow state
export function useWorkflow() {
  const [currentStep, setCurrentStep] = useState(0);
  const analytics = getAnalytics();

  return {
    currentStep,
    setCurrentStep: (step: number) => {
      setCurrentStep(step);
      analytics.trackInteraction('workflow_step_change', 'programmatic', { step });
    },
    nextStep: () => setCurrentStep(prev => prev + 1),
    prevStep: () => setCurrentStep(prev => Math.max(0, prev - 1)),
  };
}