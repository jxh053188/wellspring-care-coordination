import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface CreateCareTeamDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCareTeamCreated: () => void;
}

interface FormData {
    name: string;
    description: string;
    care_recipient_name: string;
}

export const CreateCareTeamDialog = ({ open, onOpenChange, onCareTeamCreated }: CreateCareTeamDialogProps) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        name: '',
        description: '',
        care_recipient_name: '',
    });

    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            care_recipient_name: '',
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user || !formData.name.trim() || !formData.care_recipient_name.trim()) {
            toast({
                title: "Validation Error",
                description: "Please fill in all required fields",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        try {
            console.log('Creating care team for user:', user.id);

            // First get the user's profile ID
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            console.log('Profile data for care team creation:', profile, 'Error:', profileError);

            if (profileError || !profile) {
                console.error('Profile query failed:', profileError);
                throw new Error('Could not find user profile');
            }

            // Create a care team using the profile ID
            const { data: careTeam, error: teamError } = await supabase
                .from('care_teams')
                .insert({
                    name: formData.name.trim(),
                    description: formData.description.trim() || null,
                    care_recipient_name: formData.care_recipient_name.trim(),
                    created_by: profile.id,
                })
                .select()
                .single();

            console.log('Care team creation result:', { careTeam, teamError });

            if (teamError) {
                console.error('Team creation error details:', teamError);
                throw teamError;
            }

            // Then add the user as an admin member using their profile ID
            const { error: memberError } = await supabase
                .from('care_team_members')
                .insert({
                    care_team_id: careTeam.id,
                    user_id: profile.id,
                    role: 'admin',
                });

            console.log('Team membership creation result:', { memberError });

            if (memberError) {
                console.error('Member creation error details:', memberError);
                throw memberError;
            }

            toast({
                title: "Success",
                description: `Care team "${formData.name}" created successfully!`,
            });

            // Reset form and close dialog
            resetForm();
            onOpenChange(false);

            // Refresh the care teams
            onCareTeamCreated();
        } catch (error: any) {
            console.error('Error creating care team:', error);
            toast({
                title: "Error",
                description: `Failed to create care team: ${error.message || 'Unknown error'}`,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        resetForm();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Care Team</DialogTitle>
                    <DialogDescription>
                        Set up a new care team to coordinate care for your loved one with family, friends, and professionals.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Team Name *</Label>
                        <Input
                            id="name"
                            placeholder="e.g., Mom's Care Team"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="care_recipient_name">Care Recipient *</Label>
                        <Input
                            id="care_recipient_name"
                            placeholder="e.g., Mom, Dad, John"
                            value={formData.care_recipient_name}
                            onChange={(e) => handleInputChange('care_recipient_name', e.target.value)}
                            disabled={loading}
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            The person who will be receiving care
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            placeholder="Brief description of the care team's purpose..."
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            disabled={loading}
                            rows={3}
                        />
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !formData.name.trim() || !formData.care_recipient_name.trim()}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Care Team
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
