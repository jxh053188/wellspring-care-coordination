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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Pill,
    Plus,
    Edit2,
    Trash2,
    Clock,
    Check,
    AlertCircle,
    Calendar,
    Eye,
    ArrowLeft
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
    administered_by: string;
    administered_at: string;
    dose_amount: number | null;
    dose_unit: string | null;
    notes: string | null;
    created_at: string;
    profiles: {
        display_name: string | null;
        first_name: string | null;
        last_name: string | null;
    } | null;
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
    const [showTableView, setShowTableView] = useState(false);
    const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
    const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);
    const [showActiveOnly, setShowActiveOnly] = useState(true);
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
        dose_amount: '',
        dose_unit: '',
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
                .order('administered_at', { ascending: false })
                .limit(50); // Increased limit for table view

            if (error) throw error;
            setMedicationLogs((data as unknown as MedicationLog[]) || []);
        } catch (error) {
            console.error('Error fetching medication logs:', error);
        }
    };

    const handleAddMedication = async () => {
        try {
            // Get the current user's profile ID
            const { data: currentProfile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user!.id)
                .single();

            if (profileError || !currentProfile) {
                throw new Error('Could not find your profile');
            }

            // Prepare the medication data, converting empty strings to null for optional fields
            const medicationData = {
                name: formData.name,
                dosage: formData.dosage || null,
                frequency: formData.frequency || null,
                instructions: formData.instructions || null,
                prescribing_doctor: formData.prescribing_doctor || null,
                pharmacy: formData.pharmacy || null,
                start_date: formData.start_date || null,
                end_date: formData.end_date || null,
                care_team_id: careTeamId,
                created_by: currentProfile.id,
                is_active: true,
            };

            const { error } = await supabase
                .from('medications')
                .insert(medicationData);

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
        if (!selectedMedication || !user) return;

        try {
            // Get the current user's profile ID
            const { data: currentProfile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (profileError || !currentProfile) {
                throw new Error('Could not find your profile');
            }

            const { error } = await supabase
                .from('medication_logs')
                .insert({
                    medication_id: selectedMedication.id,
                    administered_by: currentProfile.id,
                    administered_at: new Date().toISOString(),
                    dose_amount: logFormData.dose_amount ? parseFloat(logFormData.dose_amount) : null,
                    dose_unit: logFormData.dose_unit || null,
                    notes: logFormData.notes || null,
                });

            if (error) throw error;

            toast({
                title: "Success",
                description: `${selectedMedication.name} dose logged`,
            });

            setShowLogDialog(false);
            setLogFormData({ dose_amount: '', dose_unit: '', notes: '' });
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
            // Get the current user's profile ID
            const { data: currentProfile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user!.id)
                .single();

            if (profileError || !currentProfile) {
                throw new Error('Could not find your profile');
            }

            const { error } = await supabase
                .from('medication_logs')
                .insert({
                    medication_id: medication.id,
                    administered_by: currentProfile.id,
                    administered_at: new Date().toISOString(),
                    dose_amount: medication.dosage ? parseFloat(medication.dosage.replace(/[^\d.]/g, '')) || null : null,
                    dose_unit: medication.dosage?.replace(/[\d.]/g, '').trim() || null,
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

    const handleReactivateMedication = async (medicationId: string) => {
        try {
            const { error } = await supabase
                .from('medications')
                .update({ is_active: true })
                .eq('id', medicationId);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Medication reactivated",
            });

            onMedicationsChange();
        } catch (error) {
            console.error('Error reactivating medication:', error);
            toast({
                title: "Error",
                description: "Failed to reactivate medication",
                variant: "destructive",
            });
        }
    };

    const filteredMedications = medications.filter(med =>
        showActiveOnly ? med.is_active : !med.is_active
    );

    const handleViewLogs = (medication: Medication) => {
        setSelectedMedication(medication);
        fetchMedicationLogs(medication.id);
        setShowTableView(true);
    };

    if (showTableView && selectedMedication) {
        return (
            <div className="space-y-6">
                {/* Table View Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        onClick={() => setShowTableView(false)}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Medications
                    </Button>
                    <div>
                        <h3 className="text-lg font-semibold">Medication Logs: {selectedMedication.name}</h3>
                        <p className="text-sm text-muted-foreground">
                            {selectedMedication.dosage && `Dosage: ${selectedMedication.dosage}`}
                            {selectedMedication.dosage && selectedMedication.frequency && ' • '}
                            {selectedMedication.frequency && `Frequency: ${selectedMedication.frequency.replace('_', ' ')}`}
                        </p>
                    </div>
                </div>

                {/* Logs Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Administration History</CardTitle>
                        <CardDescription>
                            Complete log of when this medication was administered
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {medicationLogs.length === 0 ? (
                            <div className="text-center py-8">
                                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h4 className="text-lg font-semibold mb-2">No Logs Yet</h4>
                                <p className="text-muted-foreground">
                                    No doses have been logged for this medication yet.
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date & Time</TableHead>
                                        <TableHead>Dose</TableHead>
                                        <TableHead>Administered By</TableHead>
                                        <TableHead>Notes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {medicationLogs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell>
                                                {format(new Date(log.administered_at), 'MMM d, yyyy h:mm a')}
                                            </TableCell>
                                            <TableCell>
                                                {log.dose_amount && log.dose_unit
                                                    ? `${log.dose_amount} ${log.dose_unit}`
                                                    : log.dose_amount || 'Not specified'
                                                }
                                            </TableCell>
                                            <TableCell>
                                                {log.profiles?.display_name ||
                                                    `${log.profiles?.first_name || ''} ${log.profiles?.last_name || ''}`.trim() ||
                                                    'Unknown'
                                                }
                                            </TableCell>
                                            <TableCell className="max-w-xs">
                                                <span className="truncate block" title={log.notes || ''}>
                                                    {log.notes || '-'}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

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
                <div className="flex items-center gap-4">
                    {/* Filter Toggle */}
                    <div className="flex items-center gap-2">
                        <Label htmlFor="active-filter" className="text-sm">Show:</Label>
                        <Select
                            value={showActiveOnly ? "active" : "inactive"}
                            onValueChange={(value) => setShowActiveOnly(value === "active")}
                        >
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
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
            </div>

            {/* Medications List */}
            <div className="grid gap-4">
                {filteredMedications.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center py-8">
                                <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h4 className="text-lg font-semibold mb-2">
                                    {showActiveOnly ? 'No Active Medications' : 'No Inactive Medications'}
                                </h4>
                                <p className="text-muted-foreground mb-4">
                                    {showActiveOnly
                                        ? 'Start by adding the first medication to track.'
                                        : 'No medications have been deactivated yet.'
                                    }
                                </p>
                                {showActiveOnly && (
                                    <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                                        <Plus className="h-4 w-4" />
                                        Add First Medication
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    filteredMedications.map((medication) => (
                        <Card key={medication.id} className={`hover:shadow-md transition-shadow ${!medication.is_active ? 'bg-muted/30' : ''}`}>
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <CardTitle className="text-lg">{medication.name}</CardTitle>
                                            {!medication.is_active && (
                                                <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                                    Inactive
                                                </Badge>
                                            )}
                                        </div>
                                        <CardDescription>
                                            <span className="block">
                                                {medication.dosage && `Dosage: ${medication.dosage}`}
                                                {medication.dosage && medication.frequency && ' • '}
                                                {medication.frequency && `Frequency: ${medication.frequency.replace('_', ' ')}`}
                                            </span>
                                            {medication.instructions && (
                                                <span className="block mt-1">Instructions: {medication.instructions}</span>
                                            )}
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        {medication.is_active ? (
                                            <>
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
                                            </>
                                        ) : (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button size="sm" variant="outline" className="gap-2">
                                                        <Check className="h-4 w-4" />
                                                        Reactivate
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Reactivate Medication</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to reactivate {medication.name}? This will move it back to the active medications list.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleReactivateMedication(medication.id)}>
                                                            Reactivate
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleViewLogs(medication)}
                                            className="gap-2"
                                        >
                                            <Eye className="h-4 w-4" />
                                            View Logs
                                        </Button>
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
            </div >

            {/* Detailed Log Dialog */}
            < Dialog open={showLogDialog} onOpenChange={setShowLogDialog} >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Log Medication</DialogTitle>
                        <DialogDescription>
                            {selectedMedication && `Log a dose of ${selectedMedication.name}`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="dose_amount">Dose Amount</Label>
                                <Input
                                    id="dose_amount"
                                    value={logFormData.dose_amount}
                                    onChange={(e) => setLogFormData(prev => ({ ...prev, dose_amount: e.target.value }))}
                                    placeholder="10"
                                    type="number"
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <Label htmlFor="dose_unit">Dose Unit</Label>
                                <Input
                                    id="dose_unit"
                                    value={logFormData.dose_unit}
                                    onChange={(e) => setLogFormData(prev => ({ ...prev, dose_unit: e.target.value }))}
                                    placeholder="mg"
                                />
                            </div>
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
                                                <span>{format(new Date(log.administered_at), 'MMM d, h:mm a')}</span>
                                                <span>
                                                    {log.dose_amount && log.dose_unit
                                                        ? `${log.dose_amount} ${log.dose_unit}`
                                                        : log.dose_amount || 'No dose recorded'
                                                    }
                                                </span>
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
            </Dialog >
        </div >
    );
};
