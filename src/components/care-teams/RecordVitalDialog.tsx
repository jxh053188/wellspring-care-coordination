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
import { Stethoscope, Loader2 } from 'lucide-react';

interface RecordVitalDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    careTeamId: string;
    onVitalRecorded: () => void;
}

const vitalTypes = [
    { value: 'weight', label: 'Weight', units: ['lbs', 'kg'] },
    { value: 'blood_pressure', label: 'Blood Pressure', units: ['mmHg'] },
    { value: 'heart_rate', label: 'Heart Rate', units: ['bpm'] },
    { value: 'temperature', label: 'Temperature', units: ['°F', '°C'] },
    { value: 'blood_sugar', label: 'Blood Sugar', units: ['mg/dL', 'mmol/L'] },
    { value: 'oxygen_saturation', label: 'Oxygen Saturation', units: ['%'] },
];

export const RecordVitalDialog = ({ open, onOpenChange, careTeamId, onVitalRecorded }: RecordVitalDialogProps) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        vital_type: '',
        value: '',
        unit: '',
        notes: '',
    });

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            setFormData({
                vital_type: '',
                value: '',
                unit: '',
                notes: '',
            });
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.vital_type || !formData.value || !formData.unit) {
            toast({
                title: "Error",
                description: "Please select a vital type, enter a value, and select a unit",
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

            const vitalData = {
                care_team_id: careTeamId,
                vital_type: formData.vital_type,
                value: parseFloat(formData.value),
                unit: formData.unit,
                notes: formData.notes || null,
                recorded_by: profile.id,
            };

            const { error } = await supabase
                .from('health_vitals')
                .insert(vitalData);

            if (error) throw error;

            toast({
                title: "Vital Recorded",
                description: "The vital signs have been recorded successfully.",
            });

            onVitalRecorded();
            onOpenChange(false);
        } catch (error) {
            console.error('Error recording vital:', error);
            toast({
                title: "Error",
                description: "Failed to record vital signs. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const getVitalTypeInfo = (vitalType: string) => {
        return vitalTypes.find(type => type.value === vitalType);
    };

    const selectedVitalType = getVitalTypeInfo(formData.vital_type);

    const handleVitalTypeChange = (vitalType: string) => {
        const typeInfo = getVitalTypeInfo(vitalType);
        setFormData(prev => ({
            ...prev,
            vital_type: vitalType,
            unit: typeInfo?.units[0] || '', // Set default unit
        }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Stethoscope className="h-5 w-5 text-[#ff6b6b]" />
                        Record Vital Signs
                    </DialogTitle>
                    <DialogDescription>
                        Record vital signs and health measurements.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Vital Type Selection */}
                    <div>
                        <Label htmlFor="vital_type">Vital Type *</Label>
                        <Select 
                            value={formData.vital_type} 
                            onValueChange={handleVitalTypeChange}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select vital type" />
                            </SelectTrigger>
                            <SelectContent>
                                {vitalTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Value and Unit */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="value">Value *</Label>
                            <Input
                                id="value"
                                type="number"
                                step="0.1"
                                placeholder="Enter value"
                                value={formData.value}
                                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                                required
                            />
                            {formData.vital_type === 'blood_pressure' && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Enter as systolic/diastolic (e.g., 120/80)
                                </p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="unit">Unit *</Label>
                            <Select 
                                value={formData.unit} 
                                onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
                                disabled={!selectedVitalType}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                                <SelectContent>
                                    {selectedVitalType?.units.map((unit) => (
                                        <SelectItem key={unit} value={unit}>
                                            {unit}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="Any additional notes about this measurement..."
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={loading}
                            className="bg-[#ff6b6b] hover:bg-[#ff6b6b]/90"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Recording...
                                </>
                            ) : (
                                'Record Vital'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
