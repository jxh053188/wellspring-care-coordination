import { useState } from 'react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Mail, Loader2 } from 'lucide-react';

interface InviteMemberDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    careTeamId: string;
    onMemberInvited: () => void;
}

type CareTeamRole = 'admin' | 'family' | 'friend' | 'professional' | 'caregiver';

export function InviteMemberDialog({
    open,
    onOpenChange,
    careTeamId,
    onMemberInvited,
}: InviteMemberDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        role: 'family' as CareTeamRole,
        personalMessage: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !formData.email) return;

        setLoading(true);
        try {
            // Get the current user's profile
            const { data: currentProfile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (profileError || !currentProfile) {
                throw new Error('Could not find your profile');
            }

            // First, check if a user with this email already exists
            const { data: existingUserData, error: userCheckError } = await supabase
                .rpc('get_user_by_email', { p_email: formData.email.toLowerCase() }) as {
                    data: { user_id: string; profile_id: string }[] | null;
                    error: Error | null;
                };

            if (userCheckError) {
                console.warn('Could not check existing users, proceeding with invitation:', userCheckError);
            }

            // If user exists and has a profile, try to add them directly to the care team
            if (existingUserData && existingUserData.length > 0) {
                const userData = existingUserData[0] as { user_id: string; profile_id: string };

                if (userData.user_id) {
                    // Check if they're already a member of this care team
                    const { data: existingMember, error: memberCheckError } = await supabase
                        .from('care_team_members')
                        .select('id')
                        .eq('care_team_id', careTeamId)
                        .eq('user_id', userData.user_id)
                        .single();

                    if (memberCheckError && memberCheckError.code !== 'PGRST116') {
                        throw new Error(`Failed to check existing membership: ${memberCheckError.message}`);
                    }

                    if (existingMember) {
                        toast({
                            title: "Already a Member",
                            description: "This person is already a member of this care team.",
                            variant: "destructive",
                        });
                        setLoading(false);
                        return;
                    }

                    // Add them directly to the care team
                    const { error: memberAddError } = await supabase
                        .from('care_team_members')
                        .insert({
                            care_team_id: careTeamId,
                            user_id: userData.user_id,
                            role: formData.role,
                            invited_by: currentProfile.id,
                        });

                    if (memberAddError) {
                        throw new Error(`Failed to add member: ${memberAddError.message}`);
                    }

                    toast({
                        title: "Member Added Successfully",
                        description: `${formData.firstName || formData.lastName || formData.email} has been added to the care team.`,
                    });

                    // Reset form and close dialog
                    setFormData({
                        email: '',
                        firstName: '',
                        lastName: '',
                        role: 'family',
                        personalMessage: '',
                    });
                    onOpenChange(false);
                    onMemberInvited();
                    setLoading(false);
                    return;
                }
            }

            // If user doesn't exist or we couldn't add them directly, create a pending invitation
            const { error: inviteError } = await supabase
                .from('pending_invitations')
                .insert({
                    care_team_id: careTeamId,
                    email: formData.email.toLowerCase(),
                    role: formData.role,
                    invited_by: currentProfile.id,
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    personal_message: formData.personalMessage,
                });

            if (inviteError) {
                // Check if this is a duplicate invitation
                if (inviteError.code === '23505') { // Unique constraint violation
                    toast({
                        title: "Invitation Already Sent",
                        description: "An invitation has already been sent to this email for this care team.",
                        variant: "destructive",
                    });
                    setLoading(false);
                    return;
                }
                throw new Error(`Failed to create invitation: ${inviteError.message}`);
            }

            toast({
                title: "Invitation Created Successfully",
                description: "The invitation has been recorded. Share the Wellspring signup link with the invited person and tell them to use the same email address to join your care team.",
            });

            // Reset form and close dialog
            setFormData({
                email: '',
                firstName: '',
                lastName: '',
                role: 'family',
                personalMessage: '',
            });
            onOpenChange(false);
            onMemberInvited();

        } catch (error) {
            console.error('Error inviting member:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to invite member. Please try again.",
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
                        <UserPlus className="h-5 w-5" />
                        Invite Team Member
                    </DialogTitle>
                    <DialogDescription>
                        Invite someone to join your care team. They'll receive an email invitation with instructions to access the team.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="member@example.com"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                                id="firstName"
                                placeholder="John"
                                value={formData.firstName}
                                onChange={(e) => handleInputChange('firstName', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                                id="lastName"
                                placeholder="Doe"
                                value={formData.lastName}
                                onChange={(e) => handleInputChange('lastName', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Role *</Label>
                        <Select value={formData.role} onValueChange={(value: CareTeamRole) => handleInputChange('role', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="family">Family Member</SelectItem>
                                <SelectItem value="friend">Friend</SelectItem>
                                <SelectItem value="professional">Healthcare Professional</SelectItem>
                                <SelectItem value="caregiver">Caregiver</SelectItem>
                                <SelectItem value="admin">Administrator</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="personalMessage">Personal Message (Optional)</Label>
                        <Textarea
                            id="personalMessage"
                            placeholder="Add a personal note to the invitation..."
                            value={formData.personalMessage}
                            onChange={(e) => handleInputChange('personalMessage', e.target.value)}
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
                                    Sending Invite...
                                </>
                            ) : (
                                <>
                                    <Mail className="h-4 w-4 mr-2" />
                                    Send Invitation
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
