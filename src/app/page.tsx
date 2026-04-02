"use client";

import Link from 'next/link';
import { Sparkles, Play, Video, Zap, Film, Check, ChevronRight, Mic, Layout, Volume2, Users, Radio, Brain, Camera, Send, Headphones, Edit2, Shield, Target, Cpu, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { StatusIndicator } from '@/components/ui/StatusIndicator';

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveGalleryIndex((current) => (current + 1) % galleryItems.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const galleryItems = [
    {
      title: "Neon Nexus",
      category: "Cyberpunk Cinematic",
      url: "https://images.unsplash.com/photo-1533134486753-c833f0ed4866?q=80&w=2070",
      description: "Generative world-building with Vertex AI orchestration."
    },
    {
      title: "Bioluminescent Glade",
      category: "Sci-Fi Concept",
      url: "https://images.unsplash.com/photo-1543722530-d2c3201371e7?q=80&w=2074",
      description: "Atmospheric rendering via Imagen 3 at 8K resolution."
    },
    {
      title: "Gothic Archives",
      category: "Noir Horror",
      url: "https://images.unsplash.com/photo-1505672678657-cc7037095e60?q=80&w=2068",
      description: "Heavy shadows and moody orchestration for cinematic depth."
    }
  ];

  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col items-center bg-background scroll-smooth">
      {/* Modern Aurora Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay" />
        <div className="aurora-bg absolute inset-0" />
        <div className="absolute top-[-10%] left-[10%] w-[900px] h-[900px] bg-gradient-radial from-primary/15 to-transparent rounded-full blur-[120px] opacity-50 animate-float" />
        <div className="absolute bottom-[-15%] right-[15%] w-[700px] h-[700px] bg-gradient-radial from-secondary/12 to-transparent rounded-full blur-[100px] opacity-40 animate-float" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-accent/10 to-transparent rounded-full blur-[90px] opacity-30 animate-float" style={{ animationDelay: '5s' }} />
      </div>

      {/* Modern Terminal Header */}
      <header className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-[100] transition-all duration-700 w-[calc(100%-2rem)] max-w-7xl",
        isScrolled ? "top-6" : "top-4"
      )}>
        <nav className={cn(
          "flex items-center justify-between px-6 py-3 rounded-2xl border transition-all duration-500",
          isScrolled
            ? "bg-background/60 backdrop-blur-2xl border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            : "bg-transparent border-transparent"
        )}>
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center font-display font-black text-lg sm:text-xl shadow-glow-primary group-hover:scale-105 transition-transform duration-300">
              D
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg sm:text-xl tracking-tighter leading-none">
                DIOVID<span className="gradient-text italic">.</span>
              </span>
              <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-foreground-muted">System Active</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-10">
            {['Features', 'Process', 'Pricing'].map((item) => (
              <button
                key={item}
                onClick={() => scrollTo(item.toLowerCase())}
                className="text-[11px] font-mono uppercase tracking-widest text-foreground/40 hover:text-primary transition-all relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all group-hover:w-full" />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <StatusIndicator status="active" label="V4.0" pulse className="hidden sm:flex" size="sm" />
            <Link href="/director" className="button-premium px-6 py-2.5 text-xs sm:text-sm uppercase tracking-widest font-bold hover:scale-105 flex items-center whitespace-nowrap">
              Launch Console
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero: The Director's View */}
      <section className="relative pt-32 sm:pt-40 pb-16 px-4 max-w-7xl mx-auto flex flex-col items-center text-center z-10 w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 px-5 py-2.5 rounded-full glass-subtle mb-12 border border-white/5 hover:border-white/10 transition-all group cursor-default"
        >
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-background bg-surface overflow-hidden ring-2 ring-white/5 transition-transform group-hover:scale-110">
                <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" className="grayscale hover:grayscale-0 transition-all" />
              </div>
            ))}
          </div>
          <span className="text-[10px] sm:text-xs font-mono font-semibold text-foreground-muted uppercase tracking-widest">Joined by 2.4k Directors this week</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "circOut" }}
          className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-display font-black tracking-tight mb-10 leading-tight"
        >
          DIRECT <br />
          <span className="gradient-text-aurora italic">THE UNSEEN.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 1 }}
          className="text-lg sm:text-2xl text-foreground-muted max-w-5xl mb-16 font-light leading-relaxed tracking-normal"
        >
          The world's first multimodal AI orchestration dashboard. Turn static personas into cinematic sequences with <span className="text-primary-light">zero-lag</span> creative control.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-6 items-center"
        >
          <Link href="/director" className="button-premium px-10 py-5 text-base sm:text-lg group border-none shadow-xl hover:shadow-2xl flex items-center justify-center whitespace-nowrap">
            <Brain className="w-6 h-6 mr-3" />
            Initialize Console
            <Play className="w-5 h-5 ml-4 fill-current group-hover:translate-x-2 transition-transform duration-300" />
          </Link>
          <button
            onClick={() => scrollTo('features')}
            className="glass-intense px-10 py-5 text-xs sm:text-sm font-mono uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-4 rounded-2xl border border-white/10 hover:border-white/20 group"
          >
            <Video size={20} className="text-(--color-primary-light) group-hover:scale-110 transition-transform" />
            Watch Demo Reel
          </button>
        </motion.div>

        {/* Cinematic Preview Stage */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 1.2, ease: "circOut" }}
          className="mt-32 relative w-full aspect-[21/9] rounded-[2rem] overflow-hidden group/stage"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
          <div className="absolute inset-0 border border-white/10 rounded-[2rem] z-20 pointer-events-none shadow-2xl" />

          <AnimatePresence mode="wait">
            <motion.img
              key={activeGalleryIndex}
              src={galleryItems[activeGalleryIndex].url}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 1 }}
              className="w-full h-full object-cover opacity-60 grayscale group-hover/stage:grayscale-0 transition-all duration-1000"
              alt="Cinema Stage"
            />
          </AnimatePresence>

          {/* Modern Stage HUD */}
          <div className="absolute top-10 left-10 right-10 z-30 flex flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="glass-intense px-5 py-3 border-primary/30 flex items-center gap-3 rounded-xl">
                <Radio size={14} className="text-primary animate-pulse" />
                <span className="text-sm font-mono font-bold tracking-[0.25em] uppercase text-foreground">Visual Feed // LIVE</span>
              </div>
              {/* <div className="glass-subtle px-5 py-3 flex items-center gap-3 rounded-xl border border-white/5">
                <Cpu size={14} className="text-accent-glow" />
                <span className="text-sm font-mono tracking-[0.25em] uppercase text-foreground-muted">Gemini 2.0 Flash // Active</span>
              </div> */}
            </div>

            <div className="hidden sm:flex items-center gap-4">
              <div className="text-[10px] font-mono text-white/20 uppercase tracking-[0.4em]">8K // HDR // 120FPS</div>
              <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-glow-primary" />
            </div>
          </div>

          <div className="absolute bottom-10 right-10 z-30 flex gap-2">
            {galleryItems.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveGalleryIndex(i)}
                className={cn(
                  "w-12 h-1 bg-white/10 rounded-full transition-all duration-500",
                  activeGalleryIndex === i ? "bg-primary w-20 shadow-glow-primary" : "hover:bg-white/30"
                )}
              />
            ))}
          </div>

          <div className="absolute bottom-10 left-10 z-30 text-left w-[calc(100%-10rem)] max-w-7xl">
            <h3 className="text-4xl sm:text-7xl lg:text-8xl font-display font-black mb-6 tracking-tighter leading-none italic uppercase">
              {galleryItems[activeGalleryIndex].title}
            </h3>
            <div className="flex items-center gap-6 mb-8">
              <span className="w-16 h-px bg-primary" />
              <p className="text-sm sm:text-base font-mono text-primary-light uppercase tracking-[0.4em]">
                {galleryItems[activeGalleryIndex].category}
              </p>
            </div>
            <p className="text-base sm:text-2xl text-foreground-muted leading-relaxed font-light w-full max-w-5xl">
              {galleryItems[activeGalleryIndex].description}
            </p>
          </div>
        </motion.div>
      </section>

      {/* Modern Bento Grid: Orchestration Engine */}
      <section id="features" className="py-24 px-4 max-w-7xl mx-auto w-full relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-28 gap-8">
          <div className="max-w-4xl space-y-5">
            <div className="text-primary-light font-mono text-xs uppercase tracking-[0.45em] mb-4 flex items-center gap-3">
              <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
              Core Infrastructure
            </div>
            <h2 className="text-4xl sm:text-7xl font-display font-black tracking-tight leading-tight">Multimodal<br />Orchestration.</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 sm:gap-6 auto-rows-[280px]">
          {/* Enhanced Main Bento Block */}
          <div className="md:col-span-2 md:row-span-2 glass-intense p-12 flex flex-col justify-end relative overflow-hidden group border border-white/5 hover:border-white/10 transition-all duration-500 rounded-3xl">
            <div className="absolute top-0 right-0 p-10 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
              <Brain size={140} className="text-primary/8" />
            </div>
            <div className="absolute top-6 right-6">
              <div className="glass-subtle px-3 py-1.5 rounded-full flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span className="text-[9px] font-mono uppercase tracking-widest text-foreground-muted">Active</span>
              </div>
            </div>
            <div className="relative z-10 space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 border border-primary/25 flex items-center justify-center shadow-glow-primary group-hover:scale-110 transition-transform duration-500">
                <Sparkles className="text-primary-light" size={32} />
              </div>
              <h3 className="text-2xl font-display font-black mb-4 tracking-tight leading-tight">AI Persona Extraction</h3>
              <p className="text-foreground-muted leading-relaxed text-sm w-full">
                Convert a single portrait into a fully consistent 3D digital persona using advanced facial embedding and trait extraction.
              </p>
            </div>
          </div>

          <div className="md:col-span-2 glass-intense p-10 flex flex-col justify-center border border-white/5 hover:border-secondary/30 relative overflow-hidden group bg-gradient-to-br from-secondary/8 to-transparent rounded-3xl transition-all duration-500">
            <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
              <Mic size={200} className="text-secondary" />
            </div>
            <div className="flex items-start gap-7 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary/15 to-secondary-dark/15 border border-secondary/25 flex items-center justify-center shrink-0 shadow-glow-secondary group-hover:scale-110 transition-transform duration-500">
                <Volume2 className="text-secondary" size={24} />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-display font-bold tracking-tight">Multimodal STT</h3>
                <p className="text-sm text-foreground-muted leading-relaxed">Automatic speaker-labeled subtitles with word-level accuracy across <span className="text-secondary">50+ languages</span>.</p>
              </div>
            </div>
          </div>

          <div className="glass-intense p-10 flex flex-col justify-between border border-white/5 hover:border-accent/40 transition-all duration-500 rounded-3xl group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/15 to-accent-glow/15 border border-accent/25 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
              <Radio className="text-accent-glow" size={20} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-display font-bold tracking-tight">Live Sync</h3>
              <p className="text-xs text-foreground-muted leading-relaxed">Real-time broadcast & presence tracking for global creative sessions.</p>
            </div>
          </div>

          <div className="glass-intense p-10 flex flex-col justify-between border border-white/5 hover:border-primary/40 transition-all duration-500 rounded-3xl group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/15 to-primary-light/15 border border-primary/25 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
              <Headphones className="text-primary-light" size={20} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-display font-bold tracking-tight">Mood Matching</h3>
              <p className="text-xs text-foreground-muted leading-relaxed">20k+ tracks with AI-suggested scores for every scene.</p>
            </div>
          </div>

          <div className="md:col-span-2 glass-intense p-10 flex items-center gap-10 border border-white/5 hover:border-success/30 bg-gradient-to-br from-success/5 to-transparent rounded-3xl group transition-all duration-500">
            <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-surface-elevated to-background border border-white/10 flex items-center justify-center p-5 shadow-xl group-hover:scale-105 transition-transform duration-500">
              <div className="w-full h-1.5 bg-primary/20 rounded-full overflow-hidden">
                <motion.div
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="w-1/2 h-full bg-gradient-to-r from-primary to-accent shadow-glow-primary"
                />
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <h3 className="text-2xl font-display font-bold line-clamp-1 italic tracking-tight">OAuth Multi-Publishing</h3>
              <p className="text-sm text-foreground-muted leading-relaxed">One-click distribution to YouTube, TikTok, and Instagram with <span className="text-success">secure Vault logic</span>.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Process: The Blueprint */}
      <section id="process" className="py-24 px-4 max-w-7xl mx-auto w-full relative z-10">
        <div className="text-center mb-20 space-y-5">
          <div className="text-secondary font-mono text-xs uppercase tracking-[0.45em] mb-4 flex items-center gap-3 justify-center">
            <div className="w-1 h-1 rounded-full bg-secondary animate-pulse" />
            Workflow Architecture
          </div>
          <h2 className="text-4xl sm:text-7xl font-display font-black tracking-tighter leading-tight">Four Steps to Delivery.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-20">
          <Step
            num="01"
            title="Entity Extraction"
            desc="Gemini Vision identifies traits, vibe, and visual presentation style to anchor your character entity."
            icon={<Target size={24} />}
            color="primary"
          />
          <Step
            num="02"
            title="Co-Author Logic"
            desc="Draft dialogue with our Tiptap writer. The AI interleaved engine suggests blocking and subtext cues."
            icon={<Edit2 size={24} />}
            color="secondary"
          />
          <Step
            num="03"
            title="Scene Synthesis"
            desc="Synthesize background audio, character performance, and visuals into a single cohesive performance."
            icon={<Sparkles size={24} />}
            color="accent"
          />
          <Step
            num="04"
            title="Global Vault"
            desc="Connect platform endpoints via OAuth and launch your cinematic content to multiple channels."
            icon={<Send size={24} />}
            color="success"
          />
        </div>
      </section>

      {/* Pricing: Access levels */}
      <section id="pricing" className="py-24 px-4 max-w-7xl mx-auto w-full relative z-10 border-t border-white/5">
        <div className="text-center mb-24">
          <h2 className="text-4xl sm:text-6xl font-display font-black tracking-tight mb-6">Simple, Fair Pricing.</h2>
          <p className="text-foreground/40 font-mono text-xs uppercase tracking-[0.2em]">Start for free, scale as your production grows.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          <PriceCard
            tier="Free Tier"
            price="0"
            features={['3 Projects / mo', 'Standard Quality', 'Basic AI Assist', '1-Platform Publish']}
          />
          <PriceCard
            tier="Creator Pro"
            price="29"
            popular
            features={['Unlimited Projects', '4K Rendering', 'Advanced AI Writer', 'Multi-Platform Sync', 'No Watermark', 'Priority Support']}
          />
          <PriceCard
            tier="Studio Entity"
            price="99"
            features={['Everything in Pro', 'Team Collaboration', 'Custom Voice Models', 'Priority AI Rendering', 'API Access', 'SSO Support']}
          />
        </div>
      </section>

      {/* Dynamic CTA Footer Area */}
      <section className="py-24 px-4 max-w-screen-2xl mx-auto w-full relative z-10 border-t border-white/5">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 rounded-full blur-[120px] opacity-20 animate-pulse" />

        <div className="relative z-10 text-center space-y-12 max-w-5xl mx-auto overflow-visible">
          <h2 className="text-3xl sm:text-6xl md:text-7xl font-display font-black tracking-normal leading-tight italic uppercase">
            Ready to<br />
            <span className="gradient-text-aurora">Produce?</span>
          </h2>

          <div className="flex flex-col items-center gap-8">
            <Link href="/director" className="button-premium px-14 py-7 text-xl sm:text-2xl group border-none shadow-2xl hover:scale-105 transition-all duration-500 flex items-center">
              <Brain className="w-6 h-6 sm:w-8 sm:h-8 mr-4 animate-pulse text-white" />
              Bootstrap Console
              <ChevronRight className="ml-4 group-hover:translate-x-2 transition-transform" />
            </Link>

            <div className="flex items-center gap-4 text-foreground/30 font-mono text-[9px] uppercase tracking-[0.3em]">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Local System Ready // Global Sync Active
            </div>
          </div>
        </div>
      </section>

      {/* Final System Footer */}
      <footer className="w-full py-32 px-6 border-t border-white/5 relative bg-black/40 backdrop-blur-3xl z-40">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-20 mb-32">
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-display font-bold text-xl">D</div>
                <span className="font-display font-bold text-3xl tracking-tighter">DIOVID<span className="text-primary italic">.</span></span>
              </div>
              <p className="text-sm text-foreground/40 leading-relaxed font-light w-full">
                Empowering the next generation of storytellers with multimodal AI orchestration that bridges the gap between imagination and cinema.
              </p>
              <div className="flex gap-4">
                {['Twitter', 'TikTok', 'Discord'].map(s => (
                  <a key={s} href="#" className="p-2.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-mono uppercase tracking-widest hover:text-primary transition-colors">{s}</a>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-20">
              <div className="space-y-8">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">System</h4>
                <div className="flex flex-col gap-4 text-sm text-foreground/40 font-light">
                  <Link href="/director" className="hover:text-primary transition-colors">Director Console</Link>
                  <button onClick={() => scrollTo('features')} className="text-left hover:text-primary transition-colors">Infra Audit</button>
                  <button onClick={() => scrollTo('process')} className="text-left hover:text-primary transition-colors">Workflow Blueprint</button>
                  <a href="#" className="hover:text-primary transition-colors">API Docs</a>
                </div>
              </div>
              <div className="space-y-8">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary">Protocols</h4>
                <div className="flex flex-col gap-4 text-sm text-foreground/40 font-light">
                  <a href="#" className="hover:text-secondary transition-colors">Standard Operating</a>
                  <a href="#" className="hover:text-secondary transition-colors">Privacy Shield</a>
                  <a href="#" className="hover:text-secondary transition-colors">Neural Security</a>
                  <a href="#" className="hover:text-secondary transition-colors">Trust Center</a>
                </div>
              </div>
              <div className="hidden lg:block space-y-8">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-success">Resources</h4>
                <div className="flex flex-col gap-4 text-sm text-foreground/40 font-light">
                  <div className="glass p-4 border-white/5 space-y-2">
                    <div className="text-[9px] font-mono uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                      Cluster 01 Online
                    </div>
                    <p className="text-[10px] italic">99.9% Uptime SLA verified.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-[9px] font-mono uppercase tracking-[0.4em] text-foreground/20">
              © 2026 DIOVID AI — CORE v3.1.2026. ALL RIGHTS RESERVED.
            </div>
            <div className="flex gap-8 text-[9px] font-mono uppercase tracking-widest text-foreground/40">
              <a href="#" className="hover:text-white transition-colors">Status: OK</a>
              <a href="#" className="hover:text-white transition-colors">Region: GLOBAL-01</a>
              <a href="#" className="hover:text-white transition-colors">Latency: 12ms</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Step({ num, title, desc, icon, color }: { num: string, title: string, desc: string, icon: React.ReactNode, color: 'primary' | 'secondary' | 'accent' | 'success' }) {
  const colors = {
    primary: "text-primary border-primary/20 bg-primary/10",
    secondary: "text-secondary border-secondary/20 bg-secondary/10",
    accent: "text-accent border-accent/20 bg-accent/10",
    success: "text-success border-success/20 bg-success/10",
  };

  return (
    <div className="flex flex-col items-center md:items-start group max-w-screen-xl mx-auto">
      <div className="text-6xl sm:text-8xl font-display font-black text-white/[0.03] select-none group-hover:text-white/[0.07] transition-all duration-700 leading-none mb-6">
        {num}
      </div>
      <div className="flex-1 text-center md:text-left">
        <div className="inline-flex items-center gap-5 mb-4">
          <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border transition-transform duration-500 group-hover:scale-110", colors[color])}>
            {icon}
          </div>
          <h3 className="text-2xl font-display font-bold tracking-tight">{title}</h3>
        </div>
        <p className="text-sm text-foreground/40 leading-relaxed w-full font-light">{desc}</p>
      </div>
    </div>
  );
}

function PriceCard({ tier, price, features, popular }: { tier: string, price: string, features: string[], popular?: boolean }) {
  return (
    <div className={cn(
      "p-10 rounded-[2.5rem] border transition-all duration-700 relative flex flex-col",
      popular
        ? "bg-primary/[0.02] border-primary shadow-[0_0_80px_rgba(36,84,255,0.15)] scale-105 z-10"
        : "bg-white/[0.01] border-white/5 hover:border-white/20"
    )}>
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full bg-primary text-background font-black text-[10px] uppercase tracking-[0.3em]">
          Priority Access
        </div>
      )}
      <div className="mb-10">
        <h3 className="text-2xl font-display font-bold mb-1 tracking-tight">{tier}</h3>
        <div className="text-[10px] font-mono text-foreground/30 uppercase tracking-widest italic">Production Plan</div>
      </div>

      <div className="flex items-baseline gap-2 mb-10">
        <span className="text-3xl font-bold opacity-30">$</span>
        <span className="text-7xl font-display font-black tracking-tighter">{price}</span>
        <span className="text-foreground/20 text-sm font-mono uppercase tracking-widest">/ Month</span>
      </div>

      <div className="space-y-5 mb-12 flex-1">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-4 text-sm font-light">
            <div className="w-5 h-5 rounded-full border border-white/10 flex items-center justify-center shrink-0">
              <Check size={10} className="text-primary" />
            </div>
            <span className="text-foreground/60">{f}</span>
          </div>
        ))}
      </div>

      <button className={cn(
        "w-full py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all",
        popular
          ? "button-premium border-none"
          : "bg-white/5 hover:bg-white/10 border border-white/10"
      )}>
        Provision Account
      </button>
    </div>
  );
}

function Badge({ children, variant = 'primary', pulse }: { children: React.ReactNode, variant?: 'primary' | 'secondary' | 'accent', pulse?: boolean }) {
  const styles = {
    primary: "bg-primary/10 text-primary border-primary/30",
    secondary: "bg-secondary/10 text-secondary border-secondary/30",
    accent: "bg-accent/10 text-accent border-accent/30"
  };

  return (
    <div className={cn(
      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border flex items-center gap-1.5 backdrop-blur-md",
      styles[variant]
    )}>
      {pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
      {children}
    </div>
  );
}

