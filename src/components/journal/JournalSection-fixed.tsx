import React, { useState, useEffect, useCallback } from 'react';
import { convertFromRaw } from 'draft-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Plus, Edit3, Trash2, Calendar, Heart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import JournalEntryDialog from './JournalEntryDialog';
import { formatDistanceToNow } from 'date-fns';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface JournalEntry {
    id: string;
    title?: string;
    content_json: any;
    content_text?: string;
    prompt_id?: string;
    mood_rating?: number;
    tags?: string[];
    created_at: string;
    updated_at: string;
    journal_prompt?: {
        prompt: string;
        category: string;
    };
}

const JournalSection: React.FC = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
    const [deleteEntry, setDeleteEntry] = useState<JournalEntry | null>(null);

    const fetchEntries = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('journal_entry')
                .select(`
          *,
          journal_prompt (
            prompt,
            category
          )
        `)
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false })
                .limit(5); // Show last 5 entries

            if (error) throw error;
            setEntries(data as JournalEntry[] || []);
        } catch (error) {
            console.error('Error fetching journal entries:', error);
            toast({
                title: "Error",
                description: "Failed to load journal entries",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [user?.id, toast]);

    useEffect(() => {
        if (user) {
            fetchEntries();
        }
    }, [user, fetchEntries]);

    const handleNewEntry = () => {
        setEditingEntry(null);
        setShowDialog(true);
    };

    const handleEditEntry = (entry: JournalEntry) => {
        setEditingEntry(entry);
        setShowDialog(true);
    };

    const handleDeleteEntry = async () => {
        if (!deleteEntry) return;

        try {
            const { error } = await supabase
                .from('journal_entry')
                .delete()
                .eq('id', deleteEntry.id);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Journal entry deleted successfully",
            });

            fetchEntries();
            setDeleteEntry(null);
        } catch (error) {
            console.error('Error deleting journal entry:', error);
            toast({
                title: "Error",
                description: "Failed to delete journal entry",
                variant: "destructive",
            });
        }
    };

    const getPreviewText = (contentJson: any, maxLength: number = 200): string => {
        try {
            const contentState = convertFromRaw(contentJson);
            const text = contentState.getPlainText();
            return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
        } catch (error) {
            return 'Unable to preview content';
        }
    };

    const getMoodEmoji = (rating?: number) => {
        if (!rating) return null;
        if (rating <= 3) return '😔';
        if (rating <= 5) return '😐';
        if (rating <= 7) return '🙂';
        if (rating <= 9) return '😊';
        return '😄';
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Journal
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5" />
                                Journal
                            </CardTitle>
                            <CardDescription>
                                Your private space for reflection and thoughts
                            </CardDescription>
                        </div>
                        <Button onClick={handleNewEntry} className="gap-2">
                            <Plus className="h-4 w-4" />
                            New Entry
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {entries.length === 0 ? (
                        <div className="text-center py-8">
                            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Start Your Journal</h3>
                            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                                Begin your journey of self-reflection and mindfulness. Write about your thoughts,
                                feelings, and experiences in your private journal.
                            </p>
                            <Button onClick={handleNewEntry} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Write Your First Entry
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {entries.map((entry) => (
                                <div
                                    key={entry.id}
                                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            {entry.title && (
                                                <h4 className="font-semibold text-lg mb-1">{entry.title}</h4>
                                            )}
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                <span>
                                                    {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                                                </span>
                                                {entry.mood_rating && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1">
                                                            <Heart className="h-4 w-4" />
                                                            {getMoodEmoji(entry.mood_rating)} {entry.mood_rating}/10
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEditEntry(entry)}
                                            >
                                                <Edit3 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setDeleteEntry(entry)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {entry.journal_prompt && (
                                        <div className="mb-3 p-2 bg-muted rounded text-sm">
                                            <span className="font-medium">Prompt: </span>
                                            {entry.journal_prompt.prompt}
                                        </div>
                                    )}

                                    <p className="text-foreground mb-3">
                                        {getPreviewText(entry.content_json)}
                                    </p>

                                    {entry.tags && entry.tags.length > 0 && (
                                        <div className="flex gap-2 flex-wrap">
                                            {entry.tags.map((tag, index) => (
                                                <Badge key={index} variant="secondary" className="text-xs">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {entries.length >= 5 && (
                                <div className="text-center pt-4">
                                    <Button variant="outline" onClick={() => {/* TODO: Navigate to full journal view */ }}>
                                        View All Entries
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Journal Entry Dialog */}
            <JournalEntryDialog
                open={showDialog}
                onOpenChange={setShowDialog}
                entry={editingEntry}
                onSave={fetchEntries}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteEntry} onOpenChange={() => setDeleteEntry(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Journal Entry</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this journal entry? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteEntry}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default JournalSection;
