"use client";

import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Smartphone, Tablet, Monitor, RotateCcw, ZoomIn, ZoomOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getAnalytics } from '@/lib/analytics';

interface MobileControlsProps {
  children: React.ReactNode;
  onZoom?: (scale: number) => void;
  onPan?: (x: number, y: number) => void;
}

interface TouchGesture {
  type: 'pinch' | 'pan' | 'tap' | 'double-tap';
  scale?: number;
  deltaX?: number;
  deltaY?: number;
  centerX?: number;
  centerY?: number;
}

export function MobileControls({ children, onZoom, onPan }: MobileControlsProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const [lastTap, setLastTap] = useState(0);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const analytics = getAnalytics();

  // Detect device type
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Touch gesture handling
  const handleTouchStart = (e: React.TouchEvent) => {
    const touches = e.touches;
    if (touches.length === 1) {
      const touch = touches[0];
      setTouchStart({
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touches = e.touches;

    if (touches.length === 2) {
      // Pinch gesture
      e.preventDefault();
      const touch1 = touches[0];
      const touch2 = touches[1];

      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );

      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;

      const newScale = Math.max(0.5, Math.min(3, distance / 200));
      setScale(newScale);
      onZoom?.(newScale);

      analytics.trackInteraction('mobile_gesture', 'pinch', {
        scale: newScale,
        centerX,
        centerY,
      });
    } else if (touches.length === 1 && touchStart) {
      // Pan gesture
      e.preventDefault();
      const touch = touches[0];
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = touch.clientY - touchStart.y;

      onPan?.(deltaX, deltaY);

      analytics.trackInteraction('mobile_gesture', 'pan', {
        deltaX,
        deltaY,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const now = Date.now();

    if (touchStart && now - touchStart.time < 300) {
      const deltaX = Math.abs(e.changedTouches[0].clientX - touchStart.x);
      const deltaY = Math.abs(e.changedTouches[0].clientY - touchStart.y);

      if (deltaX < 10 && deltaY < 10) {
        // Tap gesture
        if (now - lastTap < 300) {
          // Double tap
          handleDoubleTap();
        } else {
          // Single tap
          handleTap();
        }
        setLastTap(now);
      }
    }

    setTouchStart(null);
  };

  const handleTap = () => {
    analytics.trackInteraction('mobile_gesture', 'tap');
    // Toggle mobile menu on tap
    if (isMobile) {
      setShowMobileMenu(!showMobileMenu);
    }
  };

  const handleDoubleTap = () => {
    // Reset zoom on double tap
    setScale(1);
    onZoom?.(1);
    analytics.trackInteraction('mobile_gesture', 'double_tap', { action: 'reset_zoom' });
  };

  // Zoom controls
  const handleZoomIn = () => {
    const newScale = Math.min(3, scale + 0.25);
    setScale(newScale);
    onZoom?.(newScale);
    analytics.trackInteraction('mobile_control', 'zoom_in', { scale: newScale });
  };

  const handleZoomOut = () => {
    const newScale = Math.max(0.5, scale - 0.25);
    setScale(newScale);
    onZoom?.(newScale);
    analytics.trackInteraction('mobile_control', 'zoom_out', { scale: newScale });
  };

  const handleResetZoom = () => {
    setScale(1);
    onZoom?.(1);
    analytics.trackInteraction('mobile_control', 'reset_zoom');
  };

  // Fullscreen toggle
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
      analytics.trackInteraction('mobile_control', 'fullscreen_toggle', {
        enabled: !isFullscreen,
      });
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
    }
  };

  // PWA install prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      analytics.trackInteraction('pwa_install', 'prompt_response', { outcome });
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  if (!isMobile && !isTablet) {
    return <>{children}</>;
  }

  return (
    <div className="relative w-full h-full">
      {/* Touch overlay for gestures */}
      <div
        className="absolute inset-0 z-10"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
      />

      {/* Main content */}
      <motion.div
        style={{
          scale,
          transformOrigin: 'center center',
        }}
        className="w-full h-full"
      >
        {children}
      </motion.div>

      {/* Mobile controls overlay */}
      {(isMobile || isTablet) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 right-4 z-20"
        >
          {/* Zoom controls */}
          <div className="flex justify-center gap-2 mb-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleZoomOut}
              className="rounded-full w-12 h-12 p-0"
            >
              <ZoomOut className="w-5 h-5" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleResetZoom}
              className="rounded-full w-12 h-12 p-0"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleZoomIn}
              className="rounded-full w-12 h-12 p-0"
            >
              <ZoomIn className="w-5 h-5" />
            </Button>
          </div>

          {/* Device indicator and fullscreen */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 bg-surface/90 backdrop-blur-sm rounded-lg px-3 py-2">
              {isMobile ? (
                <Smartphone className="w-4 h-4" />
              ) : (
                <Tablet className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {isMobile ? 'Mobile' : 'Tablet'}
              </span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={toggleFullscreen}
                className="rounded-full w-10 h-10 p-0"
              >
                <Monitor className="w-4 h-4" />
              </Button>

              {showInstallPrompt && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleInstallPWA}
                  className="rounded-full"
                >
                  Install App
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {showMobileMenu && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMobileMenu(false)}
          >
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="absolute left-0 top-0 h-full w-80 bg-surface border-r border-border"
            >
              {/* Mobile menu content */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold">Menu</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="p-4 space-y-4">
                {/* Menu items would go here */}
                <div className="text-sm text-foreground/70">
                  Mobile menu content goes here
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Hook for mobile detection and capabilities
export function useMobileCapabilities() {
  const [capabilities, setCapabilities] = useState({
    isMobile: false,
    isTablet: false,
    hasTouch: false,
    supportsFullscreen: false,
    isPWA: false,
    orientation: 'portrait' as 'portrait' | 'landscape',
  });

  useEffect(() => {
    const updateCapabilities = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const hasTouch = 'ontouchstart' in window;
      const supportsFullscreen = !!document.documentElement.requestFullscreen;
      const isPWA = window.matchMedia('(display-mode: standalone)').matches;
      const orientation = height > width ? 'portrait' : 'landscape';

      setCapabilities({
        isMobile,
        isTablet,
        hasTouch,
        supportsFullscreen,
        isPWA,
        orientation,
      });
    };

    updateCapabilities();
    window.addEventListener('resize', updateCapabilities);
    window.addEventListener('orientationchange', updateCapabilities);

    return () => {
      window.removeEventListener('resize', updateCapabilities);
      window.removeEventListener('orientationchange', updateCapabilities);
    };
  }, []);

  return capabilities;
}