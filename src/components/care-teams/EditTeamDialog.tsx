import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Edit, Loader2, Save } from 'lucide-react';

interface EditTeamDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    careTeam: {
        id: string;
        name: string;
        description: string;
        care_recipient_name: string;
    };
    onTeamUpdated: () => void;
}

export function EditTeamDialog({
    open,
    onOpenChange,
    careTeam,
    onTeamUpdated,
}: EditTeamDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: careTeam.name,
        description: careTeam.description || '',
        care_recipient_name: careTeam.care_recipient_name,
    });

    // Update form data when careTeam changes
    useEffect(() => {
        setFormData({
            name: careTeam.name,
            description: careTeam.description || '',
            care_recipient_name: careTeam.care_recipient_name,
        });
    }, [careTeam]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !formData.name.trim() || !formData.care_recipient_name.trim()) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('care_teams')
                .update({
                    name: formData.name.trim(),
                    description: formData.description.trim() || null,
                    care_recipient_name: formData.care_recipient_name.trim(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', careTeam.id);

            if (error) {
                throw new Error(`Failed to update care team: ${error.message}`);
            }

            toast({
                title: "Team Updated Successfully",
                description: "Your care team information has been updated.",
            });

            onOpenChange(false);
            onTeamUpdated();

        } catch (error) {
            console.error('Error updating care team:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to update care team. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Edit className="h-5 w-5" />
                        Edit Care Team
                    </DialogTitle>
                    <DialogDescription>
                        Update the basic information for your care team.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="teamName">Team Name *</Label>
                        <Input
                            id="teamName"
                            placeholder="e.g., Mom's Care Team"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="careRecipient">Care Recipient *</Label>
                        <Input
                            id="careRecipient"
                            placeholder="e.g., Margaret Smith"
                            value={formData.care_recipient_name}
                            onChange={(e) => handleInputChange('care_recipient_name', e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            placeholder="Brief description of the care team..."
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
