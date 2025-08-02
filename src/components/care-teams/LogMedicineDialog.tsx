import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Pill, Loader2 } from 'lucide-react';

interface Medication {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    instructions: string | null;
}

interface LogMedicineDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    careTeamId: string;
    onMedicationLogged: () => void;
}

export const LogMedicineDialog = ({ open, onOpenChange, careTeamId, onMedicationLogged }: LogMedicineDialogProps) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [medications, setMedications] = useState<Medication[]>([]);
    const [loadingMedications, setLoadingMedications] = useState(false);
    const [formData, setFormData] = useState({
        medicationId: '',
        doseAmount: '',
        doseUnit: '',
        notes: '',
        administeredAt: new Date().toISOString().slice(0, 16), // Current date/time in YYYY-MM-DDTHH:MM format
    });

    const fetchMedications = useCallback(async () => {
        setLoadingMedications(true);
        try {
            const { data, error } = await supabase
                .from('medications')
                .select('id, name, dosage, frequency, instructions')
                .eq('care_team_id', careTeamId)
                .eq('is_active', true)
                .order('name');

            if (error) throw error;
            setMedications(data || []);
        } catch (error) {
            console.error('Error fetching medications:', error);
            toast({
                title: "Error",
                description: "Failed to load medications",
                variant: "destructive",
            });
        } finally {
            setLoadingMedications(false);
        }
    }, [careTeamId, toast]);

    // Fetch medications when dialog opens
    useEffect(() => {
        if (open && careTeamId) {
            fetchMedications();
        }
    }, [open, careTeamId, fetchMedications]);

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            setFormData({
                medicationId: '',
                doseAmount: '',
                doseUnit: '',
                notes: '',
                administeredAt: new Date().toISOString().slice(0, 16),
            });
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.medicationId || !formData.doseAmount || !formData.doseUnit) {
            toast({
                title: "Error",
                description: "Please fill in all required fields",
                variant: "destructive",
            });
            return;
        }

        await submitMedicationLog(formData);
    };

    const selectedMedication = medications.find(med => med.id === formData.medicationId);

    // Auto-populate fields when medication is selected
    useEffect(() => {
        if (selectedMedication) {
            // Extract dose and unit from dosage string (e.g., "10 mg" -> dose: "10", unit: "mg")
            const dosageParts = selectedMedication.dosage.match(/^(\d+(?:\.\d+)?)\s*(.+)$/);
            if (dosageParts) {
                setFormData(prev => ({
                    ...prev,
                    doseAmount: dosageParts[1],
                    doseUnit: dosageParts[2],
                }));
            }
        }
    }, [selectedMedication]);

    const handleQuickLog = async () => {
        if (!selectedMedication) return;

        // Auto-populate with standard dosage
        const dosageParts = selectedMedication.dosage.match(/^(\d+(?:\.\d+)?)\s*(.+)$/);
        if (dosageParts) {
            setFormData(prev => ({
                ...prev,
                doseAmount: dosageParts[1],
                doseUnit: dosageParts[2],
                notes: 'Quick log - standard dose',
            }));

            // Automatically submit
            const quickFormData = {
                medicationId: selectedMedication.id,
                doseAmount: dosageParts[1],
                doseUnit: dosageParts[2],
                notes: 'Quick log - standard dose',
                administeredAt: new Date().toISOString().slice(0, 16),
            };

            await submitMedicationLog(quickFormData);
        }
    };

    const submitMedicationLog = async (logData: typeof formData) => {
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

            // Create medication log entry
            const { error: logError } = await supabase
                .from('medication_logs')
                .insert({
                    medication_id: logData.medicationId,
                    dose_amount: parseFloat(logData.doseAmount),
                    dose_unit: logData.doseUnit,
                    administered_at: new Date(logData.administeredAt).toISOString(),
                    administered_by: profile.id,
                    notes: logData.notes.trim() || null,
                });

            if (logError) throw logError;

            toast({
                title: "Medication Logged",
                description: "The medication administration has been recorded successfully.",
            });

            onMedicationLogged();
            onOpenChange(false);
        } catch (error) {
            console.error('Error logging medication:', error);
            toast({
                title: "Error",
                description: "Failed to log medication. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Pill className="h-5 w-5 text-[#03bd9e]" />
                        Log Medication
                    </DialogTitle>
                    <DialogDescription>
                        Record when a medication was administered.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Medication Selection */}
                    <div>
                        <Label htmlFor="medication">Medication *</Label>
                        {loadingMedications ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="ml-2 text-sm text-muted-foreground">Loading medications...</span>
                            </div>
                        ) : medications.length === 0 ? (
                            <div className="text-sm text-muted-foreground py-4">
                                No active medications found. Add medications first in the Health Dashboard.
                            </div>
                        ) : (
                            <Select
                                value={formData.medicationId}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, medicationId: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select medication" />
                                </SelectTrigger>
                                <SelectContent>
                                    {medications.map((med) => (
                                        <SelectItem key={med.id} value={med.id}>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{med.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {med.dosage} • {med.frequency.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        {selectedMedication?.instructions && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Instructions: {selectedMedication.instructions}
                            </p>
                        )}
                        {selectedMedication && (
                            <div className="mt-3 pt-3 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleQuickLog}
                                    disabled={loading}
                                    className="w-full bg-[#03bd9e]/10 border-[#03bd9e] text-[#03bd9e] hover:bg-[#03bd9e]/20"
                                >
                                    <Pill className="h-4 w-4 mr-2" />
                                    Quick Log - Standard Dose ({selectedMedication.dosage})
                                </Button>
                                <p className="text-xs text-muted-foreground text-center mt-1">
                                    Or fill in custom details below
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Dose Information */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="doseAmount">Dose Amount *</Label>
                            <Input
                                id="doseAmount"
                                type="number"
                                step="0.01"
                                placeholder="1"
                                value={formData.doseAmount}
                                onChange={(e) => setFormData(prev => ({ ...prev, doseAmount: e.target.value }))}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="doseUnit">Unit *</Label>
                            <Select
                                value={formData.doseUnit}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, doseUnit: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="tablet">tablet(s)</SelectItem>
                                    <SelectItem value="capsule">capsule(s)</SelectItem>
                                    <SelectItem value="ml">ml</SelectItem>
                                    <SelectItem value="mg">mg</SelectItem>
                                    <SelectItem value="tsp">tsp</SelectItem>
                                    <SelectItem value="tbsp">tbsp</SelectItem>
                                    <SelectItem value="drop">drop(s)</SelectItem>
                                    <SelectItem value="puff">puff(s)</SelectItem>
                                    <SelectItem value="patch">patch</SelectItem>
                                    <SelectItem value="injection">injection</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Administration Time */}
                    <div>
                        <Label htmlFor="administeredAt">Administration Time *</Label>
                        <Input
                            id="administeredAt"
                            type="datetime-local"
                            value={formData.administeredAt}
                            onChange={(e) => setFormData(prev => ({ ...prev, administeredAt: e.target.value }))}
                            required
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="Any additional notes about the administration..."
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
                            disabled={loading || medications.length === 0}
                            className="bg-[#03bd9e] hover:bg-[#03bd9e]/90"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Logging...
                                </>
                            ) : (
                                'Log Medication'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
