import Link from 'next/link';
import { Sparkles, Play, Video, Terminal, Layers } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col items-center">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary/80 uppercase tracking-widest">Powered by Gemini 1.5 Pro</span>
        </div>

        <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-8 leading-tight">
          One Photo.<br />
          <span className="gradient-text">Unlimited Stories.</span>
        </h1>

        <p className="text-lg md:text-xl text-foreground/60 max-w-2xl mb-12 leading-relaxed">
          The first AI Creative Director that turns a single photo into a fully orchestrated digital persona. Script, scenes, and actions—all in one fluid multimodal stream.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 mb-20">
          <Link href="/director" className="button-premium flex items-center gap-2 group">
            Start Directing
            <Play className="w-4 h-4 fill-white group-hover:translate-x-1 transition-transform" />
          </Link>
          <button className="px-8 py-3 rounded-xl border border-border bg-white/5 hover:bg-white/10 transition-colors font-semibold flex items-center gap-2">
            Watch Demo
            <Video className="w-4 h-4" />
          </button>
        </div>

        {/* Feature Preview Mosaic */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          <div className="glass p-8 flex flex-col items-center text-center group hover:bg-white/[0.05] transition-colors">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-6 border border-primary/30 group-hover:scale-110 transition-transform">
              <Terminal className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-4">Interleaved Direction</h3>
            <p className="text-foreground/50">Gemini generates script, visuals, and cues in a single cohesive flow.</p>
          </div>

          <div className="glass p-8 flex flex-col items-center text-center group hover:bg-white/[0.05] transition-colors overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-secondary/5" />
            <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center mb-6 border border-secondary/30 group-hover:scale-110 transition-transform relative z-10">
              <Layers className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="text-xl font-bold mb-4 relative z-10">Persona Extraction</h3>
            <p className="text-foreground/50 relative z-10">Upload any photo. Our engine extracts the character's soul and digital essence.</p>
          </div>

          <div className="glass p-8 flex flex-col items-center text-center group hover:bg-white/[0.05] transition-colors">
            <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-6 border border-accent/30 group-hover:scale-110 transition-transform">
              <Video className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-bold mb-4">Ready to Publish</h3>
            <p className="text-foreground/50">Export stunning videos optimized for YouTube, TikTok, and social media.</p>
          </div>
        </div>
      </section>

      {/* Footer / CTA */}
      <footer className="w-full py-10 px-6 border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center opacity-40 hover:opacity-100 transition-opacity">
          <span className="font-bold text-lg">DIOVID<span className="text-primary italic">.</span></span>
          <p className="text-sm mt-4 md:mt-0">© 2026 Diovid AI. Built for Creative Storytellers.</p>
        </div>
      </footer>
    </main>
  );
}
