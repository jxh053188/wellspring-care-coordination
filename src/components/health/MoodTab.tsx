import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import {
    Brain,
    Heart,
    Plus,
    Clock,
    User,
    Trash2,
    Smile,
    Frown,
    Meh,
    Battery,
    Moon,
    Zap
} from 'lucide-react';
import { format } from 'date-fns';

interface MoodLog {
    id: string;
    mood_level: number;
    mood_type: 'happy' | 'sad' | 'anxious' | 'angry' | 'calm' | 'stressed' | 'excited' | 'tired' | 'confused' | 'content';
    energy_level?: number;
    sleep_quality?: number;
    stress_level?: number;
    pain_level?: number;
    notes?: string;
    logged_at: string;
    logged_by: string;
    profiles: {
        display_name: string;
    };
}

interface MoodTabProps {
    careTeamId: string;
    onMoodChange: () => void;
}

const MoodTab = ({ careTeamId, onMoodChange }: MoodTabProps) => {
    const { user } = useAuth();
    const { toast } = useToast();

    const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddDialog, setShowAddDialog] = useState(false);

    const [formData, setFormData] = useState({
        mood_level: [5],
        mood_type: 'content',
        energy_level: [5],
        sleep_quality: [5],
        stress_level: [5],
        pain_level: [0],
        notes: '',
        logged_at: new Date().toISOString().slice(0, 16),
    });

    const moodTypes = [
        { value: 'happy', label: 'Happy', icon: '😊', color: 'bg-green-100 text-green-800' },
        { value: 'content', label: 'Content', icon: '😌', color: 'bg-blue-100 text-blue-800' },
        { value: 'calm', label: 'Calm', icon: '😊', color: 'bg-teal-100 text-teal-800' },
        { value: 'excited', label: 'Excited', icon: '🤩', color: 'bg-yellow-100 text-yellow-800' },
        { value: 'tired', label: 'Tired', icon: '😴', color: 'bg-gray-100 text-gray-800' },
        { value: 'sad', label: 'Sad', icon: '😢', color: 'bg-blue-100 text-blue-800' },
        { value: 'anxious', label: 'Anxious', icon: '😰', color: 'bg-orange-100 text-orange-800' },
        { value: 'stressed', label: 'Stressed', icon: '😤', color: 'bg-red-100 text-red-800' },
        { value: 'angry', label: 'Angry', icon: '😠', color: 'bg-red-100 text-red-800' },
        { value: 'confused', label: 'Confused', icon: '😕', color: 'bg-purple-100 text-purple-800' },
    ];

    const fetchMoodLogs = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('mood_logs')
                .select(`
                    *,
                    profiles!logged_by (
                        display_name
                    )
                `)
                .eq('care_team_id', careTeamId)
                .order('logged_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setMoodLogs(data || []);
        } catch (error) {
            console.error('Error fetching mood logs:', error);
            toast({
                title: "Error",
                description: "Failed to load mood logs",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [careTeamId, toast]);

    useEffect(() => {
        fetchMoodLogs();
    }, [fetchMoodLogs]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Get user's profile ID
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user!.id)
                .single();

            if (profileError) throw profileError;

            const logData = {
                care_team_id: careTeamId,
                logged_by: profile.id,
                mood_level: formData.mood_level[0],
                mood_type: formData.mood_type,
                energy_level: formData.energy_level[0],
                sleep_quality: formData.sleep_quality[0],
                stress_level: formData.stress_level[0],
                pain_level: formData.pain_level[0],
                notes: formData.notes.trim() || null,
                logged_at: formData.logged_at,
            };

            const { error } = await supabase
                .from('mood_logs')
                .insert(logData);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Mood log added successfully",
            });

            // Reset form
            setFormData({
                mood_level: [5],
                mood_type: 'content',
                energy_level: [5],
                sleep_quality: [5],
                stress_level: [5],
                pain_level: [0],
                notes: '',
                logged_at: new Date().toISOString().slice(0, 16),
            });
            setShowAddDialog(false);
            fetchMoodLogs();
            onMoodChange();
        } catch (error) {
            console.error('Error adding mood log:', error);
            toast({
                title: "Error",
                description: "Failed to add mood log",
                variant: "destructive",
            });
        }
    };

    const deleteLog = async (logId: string) => {
        try {
            const { error } = await supabase
                .from('mood_logs')
                .delete()
                .eq('id', logId);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Mood log deleted successfully",
            });

            fetchMoodLogs();
            onMoodChange();
        } catch (error) {
            console.error('Error deleting mood log:', error);
            toast({
                title: "Error",
                description: "Failed to delete mood log",
                variant: "destructive",
            });
        }
    };

    const getMoodIcon = (moodType: string) => {
        const mood = moodTypes.find(m => m.value === moodType);
        return mood?.icon || '😐';
    };

    const getMoodColor = (moodType: string) => {
        const mood = moodTypes.find(m => m.value === moodType);
        return mood?.color || 'bg-gray-100 text-gray-800';
    };

    const getScaleColor = (value: number, max: number = 10) => {
        const percentage = value / max;
        if (percentage <= 0.3) return 'text-green-600';
        if (percentage <= 0.6) return 'text-yellow-600';
        return 'text-red-600';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">Mood & Mental State</h3>
                    <p className="text-sm text-muted-foreground">Track emotional well-being and mental health indicators</p>
                </div>
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Log Mood
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Add Mood Log</DialogTitle>
                            <DialogDescription>
                                Record your current mood and mental state
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <Label htmlFor="logged_at">Date & Time</Label>
                                <Input
                                    id="logged_at"
                                    type="datetime-local"
                                    value={formData.logged_at}
                                    onChange={(e) => setFormData(prev => ({ ...prev, logged_at: e.target.value }))}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="mood_type">Mood Type</Label>
                                <Select value={formData.mood_type} onValueChange={(value) => setFormData(prev => ({ ...prev, mood_type: value }))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {moodTypes.map((mood) => (
                                            <SelectItem key={mood.value} value={mood.value}>
                                                <span className="flex items-center gap-2">
                                                    <span>{mood.icon}</span>
                                                    {mood.label}
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Overall Mood Level: {formData.mood_level[0]}/10</Label>
                                <div className="mt-2">
                                    <Slider
                                        value={formData.mood_level}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, mood_level: value }))}
                                        max={10}
                                        min={1}
                                        step={1}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                        <span>Very Low</span>
                                        <span>High</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Energy Level: {formData.energy_level[0]}/10</Label>
                                    <div className="mt-2">
                                        <Slider
                                            value={formData.energy_level}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, energy_level: value }))}
                                            max={10}
                                            min={1}
                                            step={1}
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                            <span>Exhausted</span>
                                            <span>Energetic</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <Label>Sleep Quality: {formData.sleep_quality[0]}/10</Label>
                                    <div className="mt-2">
                                        <Slider
                                            value={formData.sleep_quality}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, sleep_quality: value }))}
                                            max={10}
                                            min={1}
                                            step={1}
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                            <span>Poor</span>
                                            <span>Excellent</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Stress Level: {formData.stress_level[0]}/10</Label>
                                    <div className="mt-2">
                                        <Slider
                                            value={formData.stress_level}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, stress_level: value }))}
                                            max={10}
                                            min={1}
                                            step={1}
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                            <span>Relaxed</span>
                                            <span>Very Stressed</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <Label>Pain Level: {formData.pain_level[0]}/10</Label>
                                    <div className="mt-2">
                                        <Slider
                                            value={formData.pain_level}
                                            onValueChange={(value) => setFormData(prev => ({ ...prev, pain_level: value }))}
                                            max={10}
                                            min={0}
                                            step={1}
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                            <span>No Pain</span>
                                            <span>Severe Pain</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="notes">Notes (optional)</Label>
                                <Textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Any additional thoughts or context..."
                                    rows={3}
                                />
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">Add Mood Log</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4">
                {moodLogs.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-8">
                            <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                            <h4 className="text-lg font-medium mb-2">No mood logs yet</h4>
                            <p className="text-muted-foreground text-center mb-4">
                                Start tracking your emotional well-being and mental state
                            </p>
                            <Button onClick={() => setShowAddDialog(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add First Entry
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    moodLogs.map((log) => (
                        <Card key={log.id}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-2xl">{getMoodIcon(log.mood_type)}</span>
                                            <div>
                                                <Badge variant="outline" className={getMoodColor(log.mood_type)}>
                                                    {log.mood_type}
                                                </Badge>
                                                <div className="text-sm text-muted-foreground">
                                                    Overall mood: {log.mood_level}/10
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                            <div className="flex items-center gap-1 text-sm">
                                                <Battery className="h-3 w-3" />
                                                <span>Energy: </span>
                                                <span className={getScaleColor(log.energy_level || 5)}>
                                                    {log.energy_level}/10
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-sm">
                                                <Moon className="h-3 w-3" />
                                                <span>Sleep: </span>
                                                <span className={getScaleColor(log.sleep_quality || 5)}>
                                                    {log.sleep_quality}/10
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-sm">
                                                <Zap className="h-3 w-3" />
                                                <span>Stress: </span>
                                                <span className={getScaleColor(log.stress_level || 5)}>
                                                    {log.stress_level}/10
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-sm">
                                                <Heart className="h-3 w-3" />
                                                <span>Pain: </span>
                                                <span className={getScaleColor(log.pain_level || 0)}>
                                                    {log.pain_level}/10
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-sm text-muted-foreground space-y-1">
                                            <div className="flex items-center gap-4">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {format(new Date(log.logged_at), 'MMM d, yyyy h:mm a')}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    {log.profiles.user_name}
                                                </span>
                                            </div>

                                            {log.notes && (
                                                <div className="mt-2 p-2 bg-muted rounded text-sm">
                                                    {log.notes}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteLog(log.id)}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export { MoodTab };
