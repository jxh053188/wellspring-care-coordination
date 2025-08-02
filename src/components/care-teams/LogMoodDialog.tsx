import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Brain, Smile, Frown, Meh, Battery, Moon, Zap } from 'lucide-react';

interface LogMoodDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    careTeamId: string;
    onMoodLogged: () => void;
}

const LogMoodDialog = ({ open, onOpenChange, careTeamId, onMoodLogged }: LogMoodDialogProps) => {
    const { user } = useAuth();
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [moodLevel, setMoodLevel] = useState([5]);
    const [moodType, setMoodType] = useState<'happy' | 'sad' | 'anxious' | 'angry' | 'calm' | 'stressed' | 'excited' | 'tired' | 'confused' | 'content'>('content');
    const [energyLevel, setEnergyLevel] = useState([5]);
    const [sleepQuality, setSleepQuality] = useState([5]);
    const [stressLevel, setStressLevel] = useState([5]);
    const [painLevel, setPainLevel] = useState([1]);
    const [notes, setNotes] = useState('');

    const resetForm = () => {
        setMoodLevel([5]);
        setMoodType('content');
        setEnergyLevel([5]);
        setSleepQuality([5]);
        setStressLevel([5]);
        setPainLevel([1]);
        setNotes('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);

        try {
            // First, get the user's profile ID
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (profileError || !profile) {
                throw new Error('Could not find user profile');
            }

            const moodData = {
                care_team_id: careTeamId,
                logged_by: profile.id, // Use profile ID, not user ID
                mood_level: moodLevel[0],
                mood_type: moodType,
                energy_level: energyLevel[0],
                sleep_quality: sleepQuality[0],
                stress_level: stressLevel[0],
                pain_level: painLevel[0],
                notes: notes.trim() || null,
            };

            const { error } = await supabase
                .from('mood_logs')
                .insert(moodData);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Mood logged successfully",
            });

            resetForm();
            onMoodLogged();
        } catch (error) {
            console.error('Error logging mood:', error);
            toast({
                title: "Error",
                description: "Failed to log mood. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            resetForm();
        }
        onOpenChange(newOpen);
    };

    const getMoodIcon = (mood: string) => {
        switch (mood) {
            case 'happy':
            case 'excited':
            case 'content':
                return <Smile className="h-4 w-4" />;
            case 'sad':
            case 'tired':
                return <Frown className="h-4 w-4" />;
            default:
                return <Meh className="h-4 w-4" />;
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-[#9c27b0]" />
                        Log Mood & Mental State
                    </DialogTitle>
                    <DialogDescription>
                        Record your current mood and mental well-being
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Overall Mood: {moodLevel[0]}/10</Label>
                            <Slider
                                value={moodLevel}
                                onValueChange={setMoodLevel}
                                max={10}
                                min={1}
                                step={1}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Very Poor</span>
                                <span>Excellent</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="moodType">Mood Type</Label>
                            <Select value={moodType} onValueChange={(value: typeof moodType) => setMoodType(value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="happy">😊 Happy</SelectItem>
                                    <SelectItem value="content">😌 Content</SelectItem>
                                    <SelectItem value="calm">😇 Calm</SelectItem>
                                    <SelectItem value="excited">🤗 Excited</SelectItem>
                                    <SelectItem value="sad">😢 Sad</SelectItem>
                                    <SelectItem value="anxious">😰 Anxious</SelectItem>
                                    <SelectItem value="stressed">😤 Stressed</SelectItem>
                                    <SelectItem value="angry">😠 Angry</SelectItem>
                                    <SelectItem value="tired">😴 Tired</SelectItem>
                                    <SelectItem value="confused">😕 Confused</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <Label className="text-sm font-medium flex items-center gap-2">
                                <Battery className="h-4 w-4" />
                                Energy: {energyLevel[0]}/10
                            </Label>
                            <Slider
                                value={energyLevel}
                                onValueChange={setEnergyLevel}
                                max={10}
                                min={1}
                                step={1}
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-medium flex items-center gap-2">
                                <Moon className="h-4 w-4" />
                                Sleep: {sleepQuality[0]}/10
                            </Label>
                            <Slider
                                value={sleepQuality}
                                onValueChange={setSleepQuality}
                                max={10}
                                min={1}
                                step={1}
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <Label className="text-sm font-medium flex items-center gap-2">
                                <Zap className="h-4 w-4" />
                                Stress: {stressLevel[0]}/10
                            </Label>
                            <Slider
                                value={stressLevel}
                                onValueChange={setStressLevel}
                                max={10}
                                min={1}
                                step={1}
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Pain: {painLevel[0]}/10</Label>
                            <Slider
                                value={painLevel}
                                onValueChange={setPainLevel}
                                max={10}
                                min={1}
                                step={1}
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Optional notes about your mood or any specific details..."
                            rows={3}
                        />
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="flex-1">
                            {loading ? 'Logging...' : 'Log Mood'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export { LogMoodDialog };
