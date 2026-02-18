"use client";

import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, Heading1, Heading2, Sparkles, Wand2, Type } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TiptapEditorProps {
    content: string;
    onChange: (content: string) => void;
    onAiAction: (instruction: 'rewrite' | 'continue' | 'improve' | 'scriptify' | 'global_scriptify', selectedText?: string) => void;
    isAiProcessing?: boolean;
    currentlyProcessing?: 'rewrite' | 'continue' | 'improve' | 'scriptify' | 'global_scriptify' | null;
    role?: 'story' | 'script';
}

export default function TiptapEditor({ content, onChange, onAiAction, isAiProcessing, currentlyProcessing, role = 'story' }: TiptapEditorProps) {
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
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px] p-4 text-foreground/90 leading-relaxed font-serif',
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
        <div className="rounded-xl border border-white/10 bg-black/20 overflow-hidden flex flex-col h-full shadow-inner">
            {/* Toolbar */}
            <div className="border-b border-white/5 bg-white/5 p-1.5 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md flex-wrap gap-y-2">
                <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap">
                    <button
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={cn("p-1.5 rounded hover:bg-white/10 transition-colors", editor.isActive('bold') && "text-primary bg-primary/10")}
                        title="Bold"
                    >
                        <Bold size={16} />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={cn("p-1.5 rounded hover:bg-white/10 transition-colors", editor.isActive('italic') && "text-primary bg-primary/10")}
                        title="Italic"
                    >
                        <Italic size={16} />
                    </button>
                    <div className="w-px h-5 bg-white/10 mx-1" />
                    <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className={cn("p-1.5 rounded hover:bg-white/10 transition-colors", editor.isActive('heading', { level: 1 }) && "text-primary bg-primary/10")}
                        title="Heading 1"
                    >
                        <Heading1 size={16} />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={cn("p-1.5 rounded hover:bg-white/10 transition-colors", editor.isActive('heading', { level: 2 }) && "text-primary bg-primary/10")}
                        title="Heading 2"
                    >
                        <Heading2 size={16} />
                    </button>
                    <div className="w-px h-5 bg-white/10 mx-1" />
                    <button
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={cn("p-1.5 rounded hover:bg-white/10 transition-colors", editor.isActive('bulletList') && "text-primary bg-primary/10")}
                        title="Bullet List"
                    >
                        <List size={16} />
                    </button>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                    {editor.state.selection.empty ? (
                        <div className="flex items-center gap-1">
                            {role === 'story' ? (
                                <>
                                    <button
                                        onClick={() => onAiAction('global_scriptify')}
                                        disabled={isAiProcessing}
                                        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-[10px] sm:text-xs font-bold transition-all disabled:opacity-50 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]"
                                        title="Transform entire document to script"
                                    >
                                        <Wand2 size={12} className={cn(currentlyProcessing === 'global_scriptify' && "animate-spin")} />
                                        <span>Global Scriptify</span>
                                    </button>
                                    <button
                                        onClick={() => onAiAction('continue')}
                                        disabled={isAiProcessing}
                                        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 text-[10px] sm:text-xs font-bold transition-all disabled:opacity-50"
                                    >
                                        <Sparkles size={12} className={cn(currentlyProcessing === 'continue' && "animate-spin")} />
                                        <span>Continue Writing</span>
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => onAiAction('continue')}
                                    disabled={isAiProcessing}
                                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 text-[10px] sm:text-xs font-bold transition-all disabled:opacity-50"
                                >
                                    <Sparkles size={12} className={cn(currentlyProcessing === 'continue' && "animate-spin")} />
                                    <span>Extend Script</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-1">
                            {role === 'story' && (
                                <button
                                    onClick={() => onAiAction('scriptify', editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to))}
                                    disabled={isAiProcessing}
                                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 text-[10px] sm:text-xs font-bold transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                                >
                                    <Sparkles size={12} className={cn(currentlyProcessing === 'scriptify' && "animate-spin")} /> <span>Scriptify</span>
                                </button>
                            )}
                            <button
                                onClick={() => onAiAction('improve', editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to))}
                                disabled={isAiProcessing}
                                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-secondary/20 text-secondary hover:bg-secondary/30 text-[10px] sm:text-xs font-bold transition-all disabled:opacity-50"
                            >
                                <Wand2 size={12} className={cn(currentlyProcessing === 'improve' && "animate-spin")} /> <span className="hidden sm:inline">Improve Selection</span><span className="sm:hidden">Improve</span>
                            </button>
                            <button
                                onClick={() => onAiAction('rewrite', editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to))}
                                disabled={isAiProcessing}
                                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 text-[10px] sm:text-xs font-bold transition-all disabled:opacity-50"
                            >
                                <Type size={12} className={cn(currentlyProcessing === 'rewrite' && "animate-spin")} /> <span>Rewrite</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <EditorContent editor={editor} />
            </div>

            {/* Footer Info */}
            <div className="p-2 border-t border-white/5 flex justify-between items-center text-[10px] text-foreground/30 font-mono uppercase tracking-widest">
                <span>Characters: {editor.storage.characterCount?.characters() || 0}</span>
                {isAiProcessing && <span className="text-primary animate-pulse flex items-center gap-1"><Sparkles size={10} /> AI is thinking...</span>}
            </div>
        </div>
    );
}
