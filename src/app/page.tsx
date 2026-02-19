import Link from 'next/link';
import { Sparkles, Play, Video, Terminal, Layers, Zap, Film, Wand2 } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col items-center bg-gradient-to-b from-background via-background to-surface">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/15 rounded-full blur-[150px] animate-float" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-secondary/15 rounded-full blur-[140px] animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px]" />
      </div>

      {/* Hero Section - Fully Responsive */}
      <section className="relative pt-16 sm:pt-20 md:pt-24 lg:pt-32 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full glass mb-6 sm:mb-8 border border-primary/20 animate-pulse-glow">
          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary animate-spin" style={{ animationDuration: '3s' }} />
          <span className="text-xs sm:text-sm font-bold text-primary uppercase tracking-widest">Powered by Gemini 1.5 Pro</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold tracking-tight mb-6 sm:mb-8 leading-[1.1] text-balance px-2">
          One Photo.<br />
          <span className="gradient-text inline-block mt-1 sm:mt-2">Unlimited Stories.</span>
        </h1>

        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-foreground/70 max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-4xl mb-8 sm:mb-10 md:mb-12 leading-relaxed font-light px-4">
          The first AI Creative Director that turns a single photo into a fully orchestrated digital persona. Script, scenes, and actions—all in one fluid multimodal stream.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto px-4 sm:px-0 mb-12 sm:mb-14 md:mb-16">
          <Link href="/director" className="button-premium flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 group text-base sm:text-lg min-h-[48px] touch-manipulation">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Start Directing</span>
            <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white group-hover:translate-x-1 transition-transform" />
          </Link>
          <button className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 active:scale-95 transition-all font-semibold flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg backdrop-blur-sm min-h-[48px] touch-manipulation">
            <Video className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Watch Demo</span>
          </button>
        </div>

        {/* Trust Indicators - Responsive */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 mb-12 sm:mb-16 md:mb-20 opacity-60 px-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="font-mono">AI-Powered</span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="font-mono">Multimodal</span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Film className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="font-mono">Production-Ready</span>
          </div>
        </div>

        {/* Feature Preview - Responsive Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 w-full auto-rows-fr px-4 sm:px-0">
          {/* Large Feature Card */}
          <div className="sm:col-span-2 lg:col-span-4 lg:row-span-2 glass-intense p-6 sm:p-8 flex flex-col justify-between group hover:border-primary/30 transition-all overflow-hidden relative min-h-[280px] sm:min-h-[320px]">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/20 flex items-center justify-center mb-4 sm:mb-6 border border-primary/40 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                <Terminal className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              </div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 tracking-tight">Interleaved Direction</h3>
              <p className="text-foreground/60 text-sm sm:text-base lg:text-lg leading-relaxed max-w-full">
                Gemini generates script, visuals, and cues in a single cohesive flow. Experience true multimodal storytelling where every element works in perfect harmony.
              </p>
            </div>
            <div className="relative z-10 mt-6 sm:mt-8 flex flex-wrap gap-2 sm:gap-3">
              <div className="px-2 sm:px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-[10px] sm:text-xs font-mono">AI-Powered</div>
              <div className="px-2 sm:px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent text-[10px] sm:text-xs font-mono">Real-time</div>
            </div>
          </div>

          {/* Medium Feature Card */}
          <div className="sm:col-span-1 lg:col-span-2 lg:row-span-1 glass p-5 sm:p-6 flex flex-col group hover:bg-white/[0.08] transition-all overflow-hidden relative min-h-[200px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl group-hover:scale-150 transition-transform" />
            <div className="relative z-10">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-secondary/20 flex items-center justify-center mb-3 sm:mb-4 border border-secondary/30 group-hover:scale-110 transition-transform">
                <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-secondary" />
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-2 sm:mb-3">Persona Extraction</h3>
              <p className="text-foreground/50 text-xs sm:text-sm leading-relaxed">Extract character essence from any photo with AI precision.</p>
            </div>
          </div>

          {/* Medium Feature Card */}
          <div className="sm:col-span-1 lg:col-span-2 lg:row-span-1 glass p-5 sm:p-6 flex flex-col group hover:bg-white/[0.08] transition-all min-h-[200px]">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-3 sm:mb-4 border border-accent/30 group-hover:scale-110 transition-transform">
              <Video className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
            </div>
            <h3 className="text-base sm:text-lg font-bold mb-2 sm:mb-3">Production Ready</h3>
            <p className="text-foreground/50 text-xs sm:text-sm leading-relaxed">Export stunning videos optimized for any platform instantly.</p>
          </div>

          {/* Small Feature Cards - Stack on mobile */}
          <div className="sm:col-span-1 lg:col-span-2 glass p-4 sm:p-6 flex items-center gap-3 sm:gap-4 group hover:bg-white/[0.08] transition-all border-l-2 border-primary/30 min-h-[80px]">
            <Wand2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary shrink-0" />
            <div>
              <h4 className="font-bold mb-0.5 sm:mb-1 text-sm sm:text-base">AI Co-Writing</h4>
              <p className="text-foreground/50 text-[10px] sm:text-xs">Script assistant at your fingertips</p>
            </div>
          </div>

          <div className="sm:col-span-1 lg:col-span-2 glass p-4 sm:p-6 flex items-center gap-3 sm:gap-4 group hover:bg-white/[0.08] transition-all border-l-2 border-secondary/30 min-h-[80px]">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-secondary shrink-0" />
            <div>
              <h4 className="font-bold mb-0.5 sm:mb-1 text-sm sm:text-base">Multi-Character</h4>
              <p className="text-foreground/50 text-[10px] sm:text-xs">Orchestrate complex scenes effortlessly</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer / CTA - Responsive */}
      <footer className="w-full py-8 sm:py-10 md:py-12 px-4 sm:px-6 border-t border-border/30 mt-auto relative">
        <div className="absolute inset-0 bg-gradient-to-t from-surface/50 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-base sm:text-lg">
                D
              </div>
              <span className="font-display font-bold text-lg sm:text-xl tracking-tight">
                DIOVID<span className="text-primary">.</span>
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm text-foreground/50">
              <Link href="/director" className="hover:text-primary transition-colors touch-manipulation min-h-[44px] flex items-center">Director</Link>
              <Link href="#features" className="hover:text-primary transition-colors touch-manipulation min-h-[44px] flex items-center">Features</Link>
              <Link href="#pricing" className="hover:text-primary transition-colors touch-manipulation min-h-[44px] flex items-center">Pricing</Link>
              <span className="hidden sm:block">•</span>
              <p className="text-center">© 2026 Diovid AI. Built for Creative Storytellers.</p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
