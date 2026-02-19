"use client";

import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, Heading1, Heading2, Sparkles, Wand2, Type, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TiptapEditorProps {
    content: string;
    onChange: (content: string) => void;
    onAiAction: (instruction: 'rewrite' | 'continue' | 'improve' | 'scriptify' | 'global_scriptify', selectedText?: string) => void;
    isAiProcessing?: boolean;
    currentlyProcessing?: 'rewrite' | 'continue' | 'improve' | 'scriptify' | 'global_scriptify' | null;
    role?: 'story' | 'script';
    className?: string;
}

export default function TiptapEditor({ content, onChange, onAiAction, isAiProcessing, currentlyProcessing, role = 'story', className }: TiptapEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                hardBreak: false, // Handle it ourselves or let Shift+Enter be intercepted
            }),
            Placeholder.configure({
                placeholder: 'Start writing your script here... Use [CHARACTER NAME]: for dialogue. Press Shift+Enter to Auto-Scriptify.',
            }),
        ],
        content: content,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-invert prose-lg max-w-none focus:outline-none min-h-full p-4 sm:p-6 text-foreground/90 leading-relaxed text-sm sm:text-base',
            },
            handleKeyDown: (view, event) => {
                if (event.key === 'Enter' && event.shiftKey) {
                    event.preventDefault();
                    // Get current paragraph text
                    const { from, to } = view.state.selection;
                    const text = view.state.doc.textBetween(from, to, ' ');

                    // If selection is empty, try to get the current line/paragraph
                    if (!text) {
                        const $pos = view.state.selection.$from;
                        const start = $pos.start();
                        const end = $pos.end();
                        const currentText = view.state.doc.textBetween(start, end, ' ');
                        if (currentText.trim()) {
                            onAiAction('scriptify', currentText);
                            return true;
                        }
                    } else {
                        onAiAction('scriptify', text);
                        return true;
                    }
                }
                return false;
            },
        },
    });

    // Synchronize editor content with external state
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content, { emitUpdate: false });
        }
    }, [content, editor]);

    if (!editor) return null;

    return (
        <div className={cn("rounded-lg sm:rounded-xl border-2 border-border/30 bg-gradient-to-br from-surface/50 to-background/50 overflow-hidden flex flex-col shadow-lg backdrop-blur-sm", className)}>
            {/* Toolbar - Responsive */}
            <div className="border-b-2 border-border/30 bg-gradient-to-r from-surface/80 to-background/80 p-1.5 sm:p-2 flex items-center justify-between sticky top-0 z-20 backdrop-blur-xl flex-wrap gap-1 sm:gap-y-2">
                <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap">
                    <button
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={cn(
                            "p-1.5 sm:p-2 rounded-lg transition-all active:scale-95 touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center",
                            editor.isActive('bold')
                                ? "text-primary bg-primary/20 border border-primary/40 shadow-sm"
                                : "text-foreground/60 hover:bg-white/10 hover:text-foreground"
                        )}
                        title="Bold"
                    >
                        <Bold size={14} className="sm:w-4 sm:h-4" />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={cn(
                            "p-1.5 sm:p-2 rounded-lg transition-all active:scale-95 touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center",
                            editor.isActive('italic')
                                ? "text-primary bg-primary/20 border border-primary/40 shadow-sm"
                                : "text-foreground/60 hover:bg-white/10 hover:text-foreground"
                        )}
                        title="Italic"
                    >
                        <Italic size={14} className="sm:w-4 sm:h-4" />
                    </button>
                    <div className="w-px h-5 sm:h-6 bg-border/50 mx-1 sm:mx-2" />
                    <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className={cn(
                            "p-1.5 sm:p-2 rounded-lg transition-all active:scale-95 touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center",
                            editor.isActive('heading', { level: 1 })
                                ? "text-primary bg-primary/20 border border-primary/40 shadow-sm"
                                : "text-foreground/60 hover:bg-white/10 hover:text-foreground"
                        )}
                        title="Heading 1"
                    >
                        <Heading1 size={14} className="sm:w-4 sm:h-4" />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={cn(
                            "p-1.5 sm:p-2 rounded-lg transition-all active:scale-95 touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center",
                            editor.isActive('heading', { level: 2 })
                                ? "text-primary bg-primary/20 border border-primary/40 shadow-sm"
                                : "text-foreground/60 hover:bg-white/10 hover:text-foreground"
                        )}
                        title="Heading 2"
                    >
                        <Heading2 size={14} className="sm:w-4 sm:h-4" />
                    </button>
                    <div className="w-px h-5 sm:h-6 bg-border/50 mx-1 sm:mx-2" />
                    <button
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={cn(
                            "p-1.5 sm:p-2 rounded-lg transition-all active:scale-95 touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center",
                            editor.isActive('bulletList')
                                ? "text-primary bg-primary/20 border border-primary/40 shadow-sm"
                                : "text-foreground/60 hover:bg-white/10 hover:text-foreground"
                        )}
                        title="Bullet List"
                    >
                        <List size={14} className="sm:w-4 sm:h-4" />
                    </button>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                    {editor.state.selection.empty ? (
                        <div className="flex items-center gap-1 sm:gap-2">
                            {role === 'story' ? (
                                <>
                                    <button
                                        onClick={() => onAiAction('global_scriptify')}
                                        disabled={isAiProcessing}
                                        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-gradient-to-r from-primary to-accent text-white hover:shadow-glow-primary text-[10px] sm:text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-primary/30 touch-manipulation min-h-[36px]"
                                        title="Transform entire document to script"
                                    >
                                        <Wand2 size={12} className={cn("sm:w-[14px] sm:h-[14px]", currentlyProcessing === 'global_scriptify' && "animate-spin")} />
                                        <span className="hidden md:inline">Global Scriptify</span>
                                        <span className="md:hidden">Scriptify</span>
                                    </button>
                                    <button
                                        onClick={() => onAiAction('continue')}
                                        disabled={isAiProcessing}
                                        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 active:scale-95 text-[10px] sm:text-xs font-bold transition-all disabled:opacity-50 border border-primary/30 touch-manipulation min-h-[36px]"
                                    >
                                        <Sparkles size={12} className={cn("sm:w-[14px] sm:h-[14px]", currentlyProcessing === 'continue' && "animate-spin")} />
                                        <span>Continue</span>
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => onAiAction('continue')}
                                    disabled={isAiProcessing}
                                    className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 active:scale-95 text-[10px] sm:text-xs font-bold transition-all disabled:opacity-50 border border-primary/30 touch-manipulation min-h-[36px]"
                                >
                                    <Sparkles size={12} className={cn("sm:w-[14px] sm:h-[14px]", currentlyProcessing === 'continue' && "animate-spin")} />
                                    <span>Extend</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                            {role === 'story' && (
                                <button
                                    onClick={() => onAiAction('scriptify', editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to))}
                                    disabled={isAiProcessing}
                                    className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white hover:shadow-glow-primary text-[10px] sm:text-xs font-bold transition-all disabled:opacity-50 border border-primary/40 touch-manipulation min-h-[36px]"
                                >
                                    <Zap size={12} className={cn("sm:w-[14px] sm:h-[14px]", currentlyProcessing === 'scriptify' && "animate-spin")} />
                                    <span>Scriptify</span>
                                </button>
                            )}
                            <button
                                onClick={() => onAiAction('improve', editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to))}
                                disabled={isAiProcessing}
                                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-secondary/20 text-secondary hover:bg-secondary/30 active:scale-95 text-[10px] sm:text-xs font-bold transition-all disabled:opacity-50 border border-secondary/30 touch-manipulation min-h-[36px]"
                            >
                                <Wand2 size={12} className={cn("sm:w-[14px] sm:h-[14px]", currentlyProcessing === 'improve' && "animate-spin")} />
                                <span className="hidden md:inline">Improve</span>
                                <span className="md:hidden">+</span>
                            </button>
                            <button
                                onClick={() => onAiAction('rewrite', editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to))}
                                disabled={isAiProcessing}
                                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-white/10 text-foreground/80 hover:bg-white/20 active:scale-95 text-[10px] sm:text-xs font-bold transition-all disabled:opacity-50 border border-white/20 touch-manipulation min-h-[36px]"
                            >
                                <Type size={12} className={cn("sm:w-[14px] sm:h-[14px]", currentlyProcessing === 'rewrite' && "animate-spin")} />
                                <span className="hidden md:inline">Rewrite</span>
                                <span className="md:hidden">↻</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar h-full min-h-0">
                <EditorContent editor={editor} className="h-full" />
            </div>

            {/* Footer Info - Responsive */}
            <div className="p-2 sm:p-3 border-t-2 border-border/30 bg-gradient-to-r from-surface/60 to-background/60 flex justify-between items-center text-[9px] sm:text-[10px] font-mono uppercase tracking-widest backdrop-blur-sm">
                <span className="text-foreground/50">
                    <span className="text-foreground/70 font-bold">{editor.getText().length}</span>
                    <span className="hidden sm:inline"> chars</span>
                </span>
                {isAiProcessing && (
                    <span className="text-primary animate-pulse flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 py-1 rounded-lg bg-primary/10 border border-primary/30">
                        <Sparkles size={10} className="sm:w-3 sm:h-3 animate-spin" />
                        <span className="hidden sm:inline">AI thinking...</span>
                        <span className="sm:hidden">AI...</span>
                    </span>
                )}
            </div>
        </div>
    );
}
