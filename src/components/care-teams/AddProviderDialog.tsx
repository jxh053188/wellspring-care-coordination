import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface MedicalProvider {
    id: string;
    provider_type: string;
    name: string;
    specialty: string | null;
    practice_name: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    notes: string | null;
    created_at: string;
}

interface AddProviderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    careTeamId: string;
    provider?: MedicalProvider | null;
    onSuccess: () => void;
}

export const AddProviderDialog = ({ open, onOpenChange, careTeamId, provider, onSuccess }: AddProviderDialogProps) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        provider_type: '',
        name: '',
        specialty: '',
        practice_name: '',
        address: '',
        phone: '',
        email: '',
        notes: '',
    });

    const isEditing = !!provider;

    useEffect(() => {
        if (provider) {
            setFormData({
                provider_type: provider.provider_type,
                name: provider.name,
                specialty: provider.specialty || '',
                practice_name: provider.practice_name || '',
                address: provider.address || '',
                phone: provider.phone || '',
                email: provider.email || '',
                notes: provider.notes || '',
            });
        } else {
            setFormData({
                provider_type: '',
                name: '',
                specialty: '',
                practice_name: '',
                address: '',
                phone: '',
                email: '',
                notes: '',
            });
        }
    }, [provider, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.provider_type) {
            toast({
                title: "Error",
                description: "Please fill in the provider name and type",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            // Get user's profile ID
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user!.id)
                .single();

            if (profileError || !profile) {
                throw new Error('Could not find your profile');
            }

            const providerData = {
                care_team_id: careTeamId,
                provider_type: formData.provider_type,
                name: formData.name.trim(),
                specialty: formData.specialty.trim() || null,
                practice_name: formData.practice_name.trim() || null,
                address: formData.address.trim() || null,
                phone: formData.phone.trim() || null,
                email: formData.email.trim() || null,
                notes: formData.notes.trim() || null,
                created_by: profile.id,
            };

            let result;
            if (isEditing) {
                // For updates, exclude created_by field
                const { created_by, ...updateData } = providerData;
                result = await supabase
                    .from('medical_providers')
                    .update(updateData)
                    .eq('id', provider!.id);
            } else {
                result = await supabase
                    .from('medical_providers')
                    .insert(providerData);
            }

            if (result.error) throw result.error;

            toast({
                title: "Success",
                description: `Medical provider ${isEditing ? 'updated' : 'added'} successfully`,
            });

            onSuccess();
        } catch (error) {
            console.error('Error saving provider:', error);
            toast({
                title: "Error",
                description: `Failed to ${isEditing ? 'update' : 'add'} medical provider`,
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
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit Medical Provider' : 'Add Medical Provider'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update the medical provider information.'
                            : 'Add a new doctor, nurse, therapist, or other healthcare provider to your care team.'
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="name">Provider Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="Dr. Smith"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="provider_type">Provider Type *</Label>
                            <Select
                                value={formData.provider_type}
                                onValueChange={(value) => handleInputChange('provider_type', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="doctor">Doctor</SelectItem>
                                    <SelectItem value="nurse">Nurse</SelectItem>
                                    <SelectItem value="therapist">Therapist</SelectItem>
                                    <SelectItem value="specialist">Specialist</SelectItem>
                                    <SelectItem value="pharmacist">Pharmacist</SelectItem>
                                    <SelectItem value="dentist">Dentist</SelectItem>
                                    <SelectItem value="optometrist">Optometrist</SelectItem>
                                    <SelectItem value="psychiatrist">Psychiatrist</SelectItem>
                                    <SelectItem value="home_health_aide">Home Health Aide</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="specialty">Specialty</Label>
                            <Input
                                id="specialty"
                                value={formData.specialty}
                                onChange={(e) => handleInputChange('specialty', e.target.value)}
                                placeholder="Cardiologist, Physical Therapist, etc."
                            />
                        </div>
                        <div>
                            <Label htmlFor="practice_name">Practice/Hospital</Label>
                            <Input
                                id="practice_name"
                                value={formData.practice_name}
                                onChange={(e) => handleInputChange('practice_name', e.target.value)}
                                placeholder="General Hospital"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="address">Address</Label>
                        <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            placeholder="123 Main St, City, State 12345"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                placeholder="(555) 123-4567"
                                type="tel"
                            />
                        </div>
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                placeholder="doctor@example.com"
                                type="email"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            placeholder="Additional notes about this provider..."
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : (isEditing ? 'Update Provider' : 'Add Provider')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
