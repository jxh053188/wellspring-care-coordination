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
import {
    Activity,
    Plus,
    TrendingUp,
    TrendingDown,
    Minus,
    Heart,
    Thermometer,
    Weight,
    Droplets
} from 'lucide-react';
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
        display_name: string | null;
        first_name: string | null;
        last_name: string | null;
    } | null;
}

interface VitalsTabProps {
    careTeamId: string;
}

export const VitalsTab = ({ careTeamId }: VitalsTabProps) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [vitals, setVitals] = useState<HealthVital[]>([]);
    const [loading, setLoading] = useState(true);
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
            display_name,
            first_name,
            last_name
          )
        `)
                .eq('care_team_id', careTeamId)
                .order('recorded_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            setVitals(data || []);
        } catch (error) {
            console.error('Error fetching vitals:', error);
            toast({
                title: "Error",
                description: "Failed to load health vitals",
                variant: "destructive",
            });
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
    };

    const getTrend = (current: number, previous: number) => {
        if (current > previous) return 'up';
        if (current < previous) return 'down';
        return 'stable';
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'up': return <TrendingUp className="h-4 w-4 text-red-500" />;
            case 'down': return <TrendingDown className="h-4 w-4 text-green-500" />;
            default: return <Minus className="h-4 w-4 text-muted-foreground" />;
        }
    };

    const getVitalCards = () => {
        if (vitals.length < 2) return [];

        const latest = vitals[0];
        const previous = vitals[1];
        const cards = [];

        if (latest.weight && previous.weight) {
            const trend = getTrend(latest.weight, previous.weight);
            cards.push({
                title: 'Weight',
                value: `${latest.weight} ${latest.weight_unit}`,
                trend,
                icon: <Weight className="h-4 w-4" />,
            });
        }

        if (latest.blood_pressure_systolic && latest.blood_pressure_diastolic) {
            cards.push({
                title: 'Blood Pressure',
                value: `${latest.blood_pressure_systolic}/${latest.blood_pressure_diastolic}`,
                trend: 'stable',
                icon: <Heart className="h-4 w-4" />,
            });
        }

        if (latest.heart_rate && previous.heart_rate) {
            const trend = getTrend(latest.heart_rate, previous.heart_rate);
            cards.push({
                title: 'Heart Rate',
                value: `${latest.heart_rate} bpm`,
                trend,
                icon: <Activity className="h-4 w-4" />,
            });
        }

        if (latest.temperature) {
            cards.push({
                title: 'Temperature',
                value: `${latest.temperature}°${latest.temperature_unit}`,
                trend: 'stable',
                icon: <Thermometer className="h-4 w-4" />,
            });
        }

        if (latest.blood_sugar && previous.blood_sugar) {
            const trend = getTrend(latest.blood_sugar, previous.blood_sugar);
            cards.push({
                title: 'Blood Sugar',
                value: `${latest.blood_sugar} mg/dL`,
                trend,
                icon: <Droplets className="h-4 w-4" />,
            });
        }

        return cards;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const vitalCards = getVitalCards();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold">Health & Vitals Tracking</h3>
                    <p className="text-sm text-muted-foreground">
                        Record and monitor daily health measurements
                    </p>
                </div>
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Record Vitals
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Record Health Vitals</DialogTitle>
                            <DialogDescription>
                                Enter the health measurements you want to track. You don't need to fill in all fields.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="weight">Weight</Label>
                                    <Input
                                        id="weight"
                                        type="number"
                                        value={formData.weight}
                                        onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                                        placeholder="150"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="weight_unit">Unit</Label>
                                    <Select
                                        value={formData.weight_unit}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, weight_unit: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="lbs">lbs</SelectItem>
                                            <SelectItem value="kg">kg</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label className="text-sm font-medium">Blood Pressure</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input
                                        type="number"
                                        value={formData.blood_pressure_systolic}
                                        onChange={(e) => setFormData(prev => ({ ...prev, blood_pressure_systolic: e.target.value }))}
                                        placeholder="120 (systolic)"
                                    />
                                    <Input
                                        type="number"
                                        value={formData.blood_pressure_diastolic}
                                        onChange={(e) => setFormData(prev => ({ ...prev, blood_pressure_diastolic: e.target.value }))}
                                        placeholder="80 (diastolic)"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="heart_rate">Heart Rate (bpm)</Label>
                                <Input
                                    id="heart_rate"
                                    type="number"
                                    value={formData.heart_rate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, heart_rate: e.target.value }))}
                                    placeholder="72"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="temperature">Temperature</Label>
                                    <Input
                                        id="temperature"
                                        type="number"
                                        step="0.1"
                                        value={formData.temperature}
                                        onChange={(e) => setFormData(prev => ({ ...prev, temperature: e.target.value }))}
                                        placeholder="98.6"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="temp_unit">Unit</Label>
                                    <Select
                                        value={formData.temperature_unit}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, temperature_unit: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="F">°F</SelectItem>
                                            <SelectItem value="C">°C</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="blood_sugar">Blood Sugar (mg/dL)</Label>
                                <Input
                                    id="blood_sugar"
                                    type="number"
                                    value={formData.blood_sugar}
                                    onChange={(e) => setFormData(prev => ({ ...prev, blood_sugar: e.target.value }))}
                                    placeholder="100"
                                />
                            </div>

                            <div>
                                <Label htmlFor="oxygen_saturation">Oxygen Saturation (%)</Label>
                                <Input
                                    id="oxygen_saturation"
                                    type="number"
                                    value={formData.oxygen_saturation}
                                    onChange={(e) => setFormData(prev => ({ ...prev, oxygen_saturation: e.target.value }))}
                                    placeholder="98"
                                />
                            </div>

                            <div>
                                <Label htmlFor="notes">Notes (optional)</Label>
                                <Textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Any additional observations..."
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                            <Button onClick={handleAddVital}>
                                Record Vitals
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Latest Vitals Cards */}
            {vitalCards.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {vitalCards.map((card, index) => (
                        <Card key={index}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                                {card.icon}
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div className="text-2xl font-bold">{card.value}</div>
                                    {getTrendIcon(card.trend)}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Vitals History */}
            <div>
                <h4 className="text-md font-semibold mb-4">Recent Records</h4>
                {vitals.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center py-8">
                                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h4 className="text-lg font-semibold mb-2">No Vitals Recorded</h4>
                                <p className="text-muted-foreground mb-4">
                                    Start tracking health vitals to monitor wellbeing over time.
                                </p>
                                <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Record First Vitals
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {vitals.map((vital) => (
                            <Card key={vital.id}>
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-base">
                                                {format(new Date(vital.recorded_at), 'MMMM d, yyyy - h:mm a')}
                                            </CardTitle>
                                            <CardDescription>
                                                Recorded by {vital.profiles?.display_name ||
                                                    `${vital.profiles?.first_name} ${vital.profiles?.last_name}`.trim()}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                        {vital.weight && (
                                            <div className="flex items-center gap-2">
                                                <Weight className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">
                                                    Weight: {vital.weight} {vital.weight_unit}
                                                </span>
                                            </div>
                                        )}
                                        {vital.blood_pressure_systolic && vital.blood_pressure_diastolic && (
                                            <div className="flex items-center gap-2">
                                                <Heart className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">
                                                    BP: {vital.blood_pressure_systolic}/{vital.blood_pressure_diastolic}
                                                </span>
                                            </div>
                                        )}
                                        {vital.heart_rate && (
                                            <div className="flex items-center gap-2">
                                                <Activity className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">
                                                    HR: {vital.heart_rate} bpm
                                                </span>
                                            </div>
                                        )}
                                        {vital.temperature && (
                                            <div className="flex items-center gap-2">
                                                <Thermometer className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">
                                                    Temp: {vital.temperature}°{vital.temperature_unit}
                                                </span>
                                            </div>
                                        )}
                                        {vital.blood_sugar && (
                                            <div className="flex items-center gap-2">
                                                <Droplets className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">
                                                    Blood Sugar: {vital.blood_sugar} mg/dL
                                                </span>
                                            </div>
                                        )}
                                        {vital.oxygen_saturation && (
                                            <div className="flex items-center gap-2">
                                                <Activity className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">
                                                    O2 Sat: {vital.oxygen_saturation}%
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {vital.notes && (
                                        <div className="mt-3 pt-3 border-t">
                                            <p className="text-sm text-muted-foreground">
                                                <strong>Notes:</strong> {vital.notes}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
