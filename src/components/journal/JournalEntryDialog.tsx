import React, { useState, useEffect } from 'react';
import { EditorState, convertToRaw, convertFromRaw } from 'draft-js';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, X, Plus, EyeOff, Eye } from 'lucide-react';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';

interface JournalPrompt {
    id: string;
    prompt: string;
    category: string;
}

interface JournalEntry {
    id?: string;
    title?: string;
    content_json: Json;
    content_text?: string;
    prompt_id?: string;
    mood_rating?: number;
    tags?: string[];
}

interface JournalEntryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entry?: JournalEntry | null;
    onSave: () => void;
}

const JournalEntryDialog: React.FC<JournalEntryDialogProps> = ({
    open,
    onOpenChange,
    entry,
    onSave,
}) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [prompts, setPrompts] = useState<JournalPrompt[]>([]);
    const [currentPrompt, setCurrentPrompt] = useState<JournalPrompt | null>(null);
    const [showPrompt, setShowPrompt] = useState(true);
    const [title, setTitle] = useState('');
    const [editorState, setEditorState] = useState(() => EditorState.createEmpty());
    const [moodRating, setMoodRating] = useState<number | null>(null);
    const [tags, setTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState('');

    // Load prompts when dialog opens
    useEffect(() => {
        const fetchPrompts = async () => {
            try {
                const { data, error } = await supabase
                    .from('journal_prompt')
                    .select('*')
                    .eq('is_active', true);

                if (error) throw error;
                setPrompts(data || []);
                return data || [];
            } catch (error) {
                console.error('Error fetching prompts:', error);
                toast({
                    title: "Error",
                    description: "Failed to load journal prompts",
                    variant: "destructive",
                });
                return [];
            }
        };

        const loadPromptById = async (promptId: string) => {
            try {
                const { data, error } = await supabase
                    .from('journal_prompt')
                    .select('*')
                    .eq('id', promptId)
                    .single();

                if (error) throw error;
                setCurrentPrompt(data);
            } catch (error) {
                console.error('Error loading prompt:', error);
            }
        };

        const getRandomPrompt = (promptsList: JournalPrompt[]) => {
            if (promptsList.length > 0) {
                const randomIndex = Math.floor(Math.random() * promptsList.length);
                setCurrentPrompt(promptsList[randomIndex]);
            }
        };

        if (open) {
            fetchPrompts().then((promptsList) => {
                if (entry) {
                    // Editing existing entry
                    setTitle(entry.title || '');
                    if (entry.content_json) {
                        try {
                            if (typeof entry.content_json === 'object' && entry.content_json !== null && !Array.isArray(entry.content_json)) {
                                const contentState = convertFromRaw(entry.content_json as Record<string, unknown>);
                                setEditorState(EditorState.createWithContent(contentState));
                            } else {
                                setEditorState(EditorState.createEmpty());
                            }
                        } catch (error) {
                            console.error('Error loading journal content:', error);
                            setEditorState(EditorState.createEmpty());
                        }
                    }
                    setMoodRating(entry.mood_rating);
                    setTags(entry.tags || []);
                    if (entry.prompt_id) {
                        // Load the prompt for this entry
                        loadPromptById(entry.prompt_id);
                    }
                } else {
                    // Creating new entry
                    resetForm();
                    getRandomPrompt(promptsList);
                }
            });
        }
    }, [open, entry, toast]);

    const fetchPrompts = async () => {
        try {
            const { data, error } = await supabase
                .from('journal_prompt')
                .select('*')
                .eq('is_active', true);

            if (error) throw error;
            setPrompts(data || []);
        } catch (error) {
            console.error('Error fetching prompts:', error);
            toast({
                title: "Error",
                description: "Failed to load journal prompts",
                variant: "destructive",
            });
        }
    };

    const loadPromptById = async (promptId: string) => {
        try {
            const { data, error } = await supabase
                .from('journal_prompt')
                .select('*')
                .eq('id', promptId)
                .single();

            if (error) throw error;
            setCurrentPrompt(data);
        } catch (error) {
            console.error('Error loading prompt:', error);
        }
    };

    const getRandomPrompt = () => {
        if (prompts.length > 0) {
            const randomIndex = Math.floor(Math.random() * prompts.length);
            setCurrentPrompt(prompts[randomIndex]);
        }
    };

    const resetForm = () => {
        setTitle('');
        setEditorState(EditorState.createEmpty());
        setMoodRating(null);
        setTags([]);
        setNewTag('');
        setCurrentPrompt(null);
        setShowPrompt(true);
    };

    const togglePromptVisibility = () => {
        if (showPrompt) {
            setCurrentPrompt(null);
            setShowPrompt(false);
        } else {
            setShowPrompt(true);
            getRandomPrompt();
        }
    };

    const addTag = () => {
        if (newTag.trim() && !tags.includes(newTag.trim())) {
            setTags([...tags, newTag.trim()]);
            setNewTag('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const getContentText = (editorState: EditorState): string => {
        return editorState.getCurrentContent().getPlainText();
    };

    const handleSave = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const contentRaw = convertToRaw(editorState.getCurrentContent());
            const contentText = getContentText(editorState);

            const journalEntry = {
                user_id: user.id,
                title: title.trim() || null,
                content_json: contentRaw,
                content_text: contentText,
                prompt_id: showPrompt && currentPrompt ? currentPrompt.id : null,
                mood_rating: moodRating,
                tags: tags.length > 0 ? tags : null,
                is_private: true,
            };

            if (entry?.id) {
                // Update existing entry
                const { error } = await supabase
                    .from('journal_entry')
                    .update(journalEntry)
                    .eq('id', entry.id);

                if (error) throw error;

                toast({
                    title: "Success",
                    description: "Journal entry updated successfully",
                });
            } else {
                // Create new entry
                const { error } = await supabase
                    .from('journal_entry')
                    .insert([journalEntry]);

                if (error) throw error;

                toast({
                    title: "Success",
                    description: "Journal entry saved successfully",
                });
            }

            onSave();
            onOpenChange(false);
        } catch (error) {
            console.error('Error saving journal entry:', error);
            toast({
                title: "Error",
                description: "Failed to save journal entry",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {entry ? 'Edit Journal Entry' : 'New Journal Entry'}
                    </DialogTitle>
                    <DialogDescription>
                        Express your thoughts and feelings in your private journal.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Prompt Section */}
                    <div>
                        {showPrompt && currentPrompt ? (
                            <div className="p-4 bg-muted rounded-lg">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h4 className="font-medium text-sm text-muted-foreground mb-2">
                                            Writing Prompt
                                        </h4>
                                        <p className="text-foreground">{currentPrompt.prompt}</p>
                                        <Badge variant="secondary" className="mt-2">
                                            {currentPrompt.category}
                                        </Badge>
                                    </div>
                                    {!entry && (
                                        <div className="flex gap-2 ml-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={getRandomPrompt}
                                                title="Get new prompt"
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={togglePromptVisibility}
                                                title="Hide prompt and write freely"
                                            >
                                                <EyeOff className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : !entry && (
                            <div className="flex justify-center">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={togglePromptVisibility}
                                    className="gap-2"
                                >
                                    <Eye className="h-4 w-4" />
                                    Show writing prompt
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Title (optional)</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Give your entry a title..."
                        />
                    </div>

                    {/* Rich Text Editor */}
                    <div className="space-y-2">
                        <Label>Your thoughts</Label>
                        <RichTextEditor
                            editorState={editorState}
                            onChange={setEditorState}
                            placeholder="Start writing your thoughts..."
                            className="min-h-[300px]"
                        />
                    </div>

                    {/* Mood Rating */}
                    <div className="space-y-2">
                        <Label>How are you feeling? (1-10)</Label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                                <Button
                                    key={rating}
                                    type="button"
                                    variant={moodRating === rating ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setMoodRating(rating)}
                                    className="w-10 h-10"
                                >
                                    {rating}
                                </Button>
                            ))}
                            {moodRating && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setMoodRating(null)}
                                >
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                        <Label>Tags</Label>
                        <div className="flex gap-2 items-center">
                            <Input
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                placeholder="Add a tag..."
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addTag();
                                    }
                                }}
                            />
                            <Button type="button" variant="outline" size="sm" onClick={addTag}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        {tags.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                                {tags.map((tag, index) => (
                                    <Badge key={index} variant="secondary" className="gap-1">
                                        {tag}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeTag(tag)}
                                            className="h-4 w-4 p-0 hover:bg-transparent"
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleSave} disabled={loading}>
                        {loading ? 'Saving...' : 'Save Entry'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default JournalEntryDialog;
