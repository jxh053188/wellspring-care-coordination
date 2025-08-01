import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
    Pill,
    Plus,
    Edit2,
    Trash2,
    Clock,
    Check,
    AlertCircle,
    Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Medication {
    id: string;
    name: string;
    dosage: string | null;
    frequency: string | null;
    instructions: string | null;
    prescribing_doctor: string | null;
    pharmacy: string | null;
    start_date: string | null;
    end_date: string | null;
    is_active: boolean;
    created_at: string;
    created_by: string;
}

interface MedicationLog {
    id: string;
    medication_id: string;
    given_at: string;
    given_by: string;
    dosage_given: string | null;
    notes: string | null;
    profiles: {
        display_name: string | null;
        first_name: string | null;
        last_name: string | null;
    };
}

interface MedicationsTabProps {
    careTeamId: string;
    medications: Medication[];
    onMedicationsChange: () => void;
}

export const MedicationsTab = ({ careTeamId, medications, onMedicationsChange }: MedicationsTabProps) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showLogDialog, setShowLogDialog] = useState(false);
    const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
    const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        dosage: '',
        frequency: '',
        instructions: '',
        prescribing_doctor: '',
        pharmacy: '',
        start_date: '',
        end_date: '',
    });
    const [logFormData, setLogFormData] = useState({
        dosage_given: '',
        notes: '',
    });

    useEffect(() => {
        if (selectedMedication) {
            fetchMedicationLogs(selectedMedication.id);
        }
    }, [selectedMedication]);

    const fetchMedicationLogs = async (medicationId: string) => {
        try {
            const { data, error } = await supabase
                .from('medication_logs')
                .select(`
          *,
          profiles (
            display_name,
            first_name,
            last_name
          )
        `)
                .eq('medication_id', medicationId)
                .order('given_at', { ascending: false })
                .limit(10);

            if (error) throw error;
            setMedicationLogs(data || []);
        } catch (error) {
            console.error('Error fetching medication logs:', error);
        }
    };

    const handleAddMedication = async () => {
        try {
            const { error } = await supabase
                .from('medications')
                .insert({
                    ...formData,
                    care_team_id: careTeamId,
                    created_by: user!.id,
                    is_active: true,
                });

            if (error) throw error;

            toast({
                title: "Success",
                description: "Medication added successfully",
            });

            setShowAddDialog(false);
            setFormData({
                name: '',
                dosage: '',
                frequency: '',
                instructions: '',
                prescribing_doctor: '',
                pharmacy: '',
                start_date: '',
                end_date: '',
            });
            onMedicationsChange();
        } catch (error) {
            console.error('Error adding medication:', error);
            toast({
                title: "Error",
                description: "Failed to add medication",
                variant: "destructive",
            });
        }
    };

    const handleLogMedication = async () => {
        if (!selectedMedication) return;

        try {
            const { error } = await supabase
                .from('medication_logs')
                .insert({
                    medication_id: selectedMedication.id,
                    care_team_id: careTeamId,
                    given_by: user!.id,
                    given_at: new Date().toISOString(),
                    dosage_given: logFormData.dosage_given || selectedMedication.dosage,
                    notes: logFormData.notes,
                });

            if (error) throw error;

            toast({
                title: "Success",
                description: `${selectedMedication.name} dose logged`,
            });

            setShowLogDialog(false);
            setLogFormData({ dosage_given: '', notes: '' });
            if (selectedMedication) {
                fetchMedicationLogs(selectedMedication.id);
            }
        } catch (error) {
            console.error('Error logging medication:', error);
            toast({
                title: "Error",
                description: "Failed to log medication",
                variant: "destructive",
            });
        }
    };

    const handleQuickLog = async (medication: Medication) => {
        try {
            const { error } = await supabase
                .from('medication_logs')
                .insert({
                    medication_id: medication.id,
                    care_team_id: careTeamId,
                    given_by: user!.id,
                    given_at: new Date().toISOString(),
                    dosage_given: medication.dosage,
                    notes: 'Quick log',
                });

            if (error) throw error;

            toast({
                title: "Success",
                description: `${medication.name} dose logged`,
            });
        } catch (error) {
            console.error('Error logging medication:', error);
            toast({
                title: "Error",
                description: "Failed to log medication",
                variant: "destructive",
            });
        }
    };

    const handleDeactivateMedication = async (medicationId: string) => {
        try {
            const { error } = await supabase
                .from('medications')
                .update({ is_active: false })
                .eq('id', medicationId);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Medication deactivated",
            });

            onMedicationsChange();
        } catch (error) {
            console.error('Error deactivating medication:', error);
            toast({
                title: "Error",
                description: "Failed to deactivate medication",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold">Medication Management</h3>
                    <p className="text-sm text-muted-foreground">
                        Track medications, dosages, and log when doses are given
                    </p>
                </div>
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Medication
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add New Medication</DialogTitle>
                            <DialogDescription>
                                Add a new medication to track for your care recipient.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="name">Medication Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g., Lisinopril"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="dosage">Dosage</Label>
                                    <Input
                                        id="dosage"
                                        value={formData.dosage}
                                        onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                                        placeholder="e.g., 10mg"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="frequency">Frequency</Label>
                                    <Select
                                        value={formData.frequency}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select frequency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="once_daily">Once daily</SelectItem>
                                            <SelectItem value="twice_daily">Twice daily</SelectItem>
                                            <SelectItem value="three_times_daily">Three times daily</SelectItem>
                                            <SelectItem value="four_times_daily">Four times daily</SelectItem>
                                            <SelectItem value="as_needed">As needed</SelectItem>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                            <SelectItem value="custom">Custom</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="instructions">Instructions</Label>
                                <Textarea
                                    id="instructions"
                                    value={formData.instructions}
                                    onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                                    placeholder="e.g., Take with food in the morning"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="prescribing_doctor">Prescribing Doctor</Label>
                                    <Input
                                        id="prescribing_doctor"
                                        value={formData.prescribing_doctor}
                                        onChange={(e) => setFormData(prev => ({ ...prev, prescribing_doctor: e.target.value }))}
                                        placeholder="Dr. Smith"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="pharmacy">Pharmacy</Label>
                                    <Input
                                        id="pharmacy"
                                        value={formData.pharmacy}
                                        onChange={(e) => setFormData(prev => ({ ...prev, pharmacy: e.target.value }))}
                                        placeholder="CVS Pharmacy"
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                            <Button onClick={handleAddMedication} disabled={!formData.name}>
                                Add Medication
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Medications List */}
            <div className="grid gap-4">
                {medications.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center py-8">
                                <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h4 className="text-lg font-semibold mb-2">No Medications Added</h4>
                                <p className="text-muted-foreground mb-4">
                                    Start by adding the first medication to track.
                                </p>
                                <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add First Medication
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    medications.map((medication) => (
                        <Card key={medication.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg">{medication.name}</CardTitle>
                                        <CardDescription className="space-y-1">
                                            {medication.dosage && <div>Dosage: {medication.dosage}</div>}
                                            {medication.frequency && <div>Frequency: {medication.frequency.replace('_', ' ')}</div>}
                                            {medication.instructions && <div>Instructions: {medication.instructions}</div>}
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => handleQuickLog(medication)}
                                            className="gap-2"
                                        >
                                            <Check className="h-4 w-4" />
                                            Quick Log
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setSelectedMedication(medication);
                                                setShowLogDialog(true);
                                            }}
                                            className="gap-2"
                                        >
                                            <Clock className="h-4 w-4" />
                                            Detailed Log
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button size="sm" variant="ghost">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Deactivate Medication</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to deactivate {medication.name}? This will hide it from the active medications list but preserve the medication history.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeactivateMedication(medication.id)}>
                                                        Deactivate
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            </CardHeader>
                            {medication.prescribing_doctor && (
                                <CardContent className="pt-0">
                                    <div className="flex gap-4 text-sm text-muted-foreground">
                                        <span>Prescribed by: {medication.prescribing_doctor}</span>
                                        {medication.pharmacy && <span>Pharmacy: {medication.pharmacy}</span>}
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    ))
                )}
            </div>

            {/* Detailed Log Dialog */}
            <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Log Medication</DialogTitle>
                        <DialogDescription>
                            {selectedMedication && `Log a dose of ${selectedMedication.name}`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="dosage_given">Dosage Given</Label>
                            <Input
                                id="dosage_given"
                                value={logFormData.dosage_given}
                                onChange={(e) => setLogFormData(prev => ({ ...prev, dosage_given: e.target.value }))}
                                placeholder={selectedMedication?.dosage || "Enter dosage"}
                            />
                        </div>
                        <div>
                            <Label htmlFor="log_notes">Notes (optional)</Label>
                            <Textarea
                                id="log_notes"
                                value={logFormData.notes}
                                onChange={(e) => setLogFormData(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Any additional notes about this dose..."
                            />
                        </div>
                        {selectedMedication && medicationLogs.length > 0 && (
                            <div>
                                <Label className="text-sm font-medium">Recent Logs</Label>
                                <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                                    {medicationLogs.slice(0, 3).map((log) => (
                                        <div key={log.id} className="text-xs bg-muted p-2 rounded">
                                            <div className="flex justify-between">
                                                <span>{format(new Date(log.given_at), 'MMM d, h:mm a')}</span>
                                                <span>{log.dosage_given}</span>
                                            </div>
                                            <div className="text-muted-foreground">
                                                By {log.profiles?.display_name ||
                                                    `${log.profiles?.first_name} ${log.profiles?.last_name}`.trim()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowLogDialog(false)}>Cancel</Button>
                        <Button onClick={handleLogMedication}>
                            Log Dose
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
