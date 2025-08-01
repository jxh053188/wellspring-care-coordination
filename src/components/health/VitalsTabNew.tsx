import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface HealthVital {
    id: string;
    care_team_id: string;
    vital_type: string;
    value: number;
    unit: string;
    notes: string | null;
    recorded_by: string;
    recorded_at: string;
    created_at: string;
    profiles: {
        first_name: string | null;
        last_name: string | null;
    } | null;
}

interface VitalsTabProps {
    careTeamId: string;
}

const vitalTypes = [
    { value: 'weight', label: 'Weight', units: ['lbs', 'kg'] },
    { value: 'blood_pressure', label: 'Blood Pressure', units: ['mmHg'] },
    { value: 'heart_rate', label: 'Heart Rate', units: ['bpm'] },
    { value: 'temperature', label: 'Temperature', units: ['°F', '°C'] },
    { value: 'blood_sugar', label: 'Blood Sugar', units: ['mg/dL', 'mmol/L'] },
    { value: 'oxygen_saturation', label: 'Oxygen Saturation', units: ['%'] },
];

export const VitalsTab = ({ careTeamId }: VitalsTabProps) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [vitals, setVitals] = useState<HealthVital[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [formData, setFormData] = useState({
        vital_type: '',
        value: '',
        unit: '',
        notes: '',
    });

    useEffect(() => {
        fetchVitals();
    }, [careTeamId]);

    const fetchVitals = async () => {
        try {
            const { data, error } = await supabase
                .from('health_vitals')
                .select(`
                    *,
                    profiles (
                        first_name,
                        last_name
                    )
                `)
                .eq('care_team_id', careTeamId)
                .order('recorded_at', { ascending: false });

            if (error) throw error;
            setVitals((data as unknown as HealthVital[]) || []);
        } catch (error) {
            console.error('Error fetching vitals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddVital = async () => {
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

            if (!formData.vital_type || !formData.value) {
                toast({
                    title: "Error",
                    description: "Please select a vital type and enter a value",
                    variant: "destructive",
                });
                return;
            }

            const vitalData = {
                care_team_id: careTeamId,
                vital_type: formData.vital_type,
                value: parseFloat(formData.value),
                unit: formData.unit,
                notes: formData.notes || null,
                recorded_by: currentProfile.id,
            };

            const { error } = await supabase
                .from('health_vitals')
                .insert(vitalData);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Vital signs recorded successfully",
            });

            setShowAddDialog(false);
            setFormData({
                vital_type: '',
                value: '',
                unit: '',
                notes: '',
            });
            fetchVitals();
        } catch (error) {
            console.error('Error adding vitals:', error);
            toast({
                title: "Error",
                description: "Failed to record vital signs",
                variant: "destructive",
            });
        }
    };

    const getVitalTypeInfo = (vitalType: string) => {
        return vitalTypes.find(type => type.value === vitalType);
    };

    const selectedVitalType = getVitalTypeInfo(formData.vital_type);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold">Health Vitals</h3>
                        <p className="text-sm text-muted-foreground">Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold">Health Vitals</h3>
                    <p className="text-sm text-muted-foreground">
                        Track important health measurements and vital signs
                    </p>
                </div>
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Record Vitals
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Record Health Vitals</DialogTitle>
                            <DialogDescription>
                                Record new vital signs and health measurements.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="vital_type">Vital Type *</Label>
                                <Select
                                    value={formData.vital_type}
                                    onValueChange={(value) => setFormData(prev => ({
                                        ...prev,
                                        vital_type: value,
                                        unit: getVitalTypeInfo(value)?.units[0] || ''
                                    }))}
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
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="value">Value *</Label>
                                    <Input
                                        id="value"
                                        type="number"
                                        step="0.01"
                                        value={formData.value}
                                        onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                                        placeholder="Enter value"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="unit">Unit</Label>
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
                            <div>
                                <Label htmlFor="notes">Notes (optional)</Label>
                                <Textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Any additional notes..."
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                            <Button onClick={handleAddVital} disabled={!formData.vital_type || !formData.value}>
                                Record Vitals
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Vitals List */}
            <div className="grid gap-4">
                {vitals.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center py-8">
                                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h4 className="text-lg font-semibold mb-2">No Vitals Recorded</h4>
                                <p className="text-muted-foreground mb-4">
                                    Start tracking health vitals and measurements.
                                </p>
                                <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Record First Vitals
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    vitals.map((vital) => (
                        <Card key={vital.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">
                                            {getVitalTypeInfo(vital.vital_type)?.label || vital.vital_type}
                                        </CardTitle>
                                        <CardDescription>
                                            <span className="text-lg font-semibold text-foreground">
                                                {vital.value} {vital.unit}
                                            </span>
                                            <br />
                                            Recorded on {format(new Date(vital.recorded_at), 'MMM d, yyyy h:mm a')}
                                            {vital.profiles && (
                                                <span> by {vital.profiles.first_name} {vital.profiles.last_name}</span>
                                            )}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            {vital.notes && (
                                <CardContent className="pt-0">
                                    <div className="text-sm text-muted-foreground">
                                        <strong>Notes:</strong> {vital.notes}
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};
