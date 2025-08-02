import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
    Apple,
    Droplets,
    Plus,
    Calendar,
    Trash2,
    Clock,
    User
} from 'lucide-react';
import { format } from 'date-fns';

interface NutritionLog {
    id: string;
    log_type: 'food' | 'water';
    food_name?: string;
    portion_size?: string;
    calories?: number;
    meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    water_amount_ml?: number;
    notes?: string;
    logged_at: string;
    logged_by: string;
    profiles: {
        display_name: string;
    };
}

interface NutritionTabProps {
    careTeamId: string;
    onNutritionChange: () => void;
}

const NutritionTab = ({ careTeamId, onNutritionChange }: NutritionTabProps) => {
    const { user } = useAuth();
    const { toast } = useToast();

    const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [logType, setLogType] = useState<'food' | 'water'>('food');

    const [formData, setFormData] = useState({
        food_name: '',
        portion_size: '',
        calories: '',
        meal_type: 'breakfast',
        water_amount_ml: '',
        notes: '',
        logged_at: new Date().toISOString().slice(0, 16),
    });

    const fetchNutritionLogs = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('nutrition_logs')
                .select(`
                    *,
                    profiles!logged_by (
                        display_name
                    )
                `)
                .eq('care_team_id', careTeamId)
                .order('logged_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setNutritionLogs(data || []);
        } catch (error) {
            console.error('Error fetching nutrition logs:', error);
            toast({
                title: "Error",
                description: "Failed to load nutrition logs",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [careTeamId, toast]);

    useEffect(() => {
        fetchNutritionLogs();
    }, [fetchNutritionLogs]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (logType === 'food' && !formData.food_name.trim()) {
            toast({
                title: "Error",
                description: "Please enter a food name",
                variant: "destructive",
            });
            return;
        }

        if (logType === 'water' && !formData.water_amount_ml) {
            toast({
                title: "Error",
                description: "Please enter water amount",
                variant: "destructive",
            });
            return;
        }

        try {
            // Get user's profile ID
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user!.id)
                .single();

            if (profileError) throw profileError;

            const logData = {
                care_team_id: careTeamId,
                logged_by: profile.id,
                log_type: logType,
                logged_at: formData.logged_at,
                notes: formData.notes.trim() || null,
                ...(logType === 'food' ? {
                    food_name: formData.food_name.trim(),
                    portion_size: formData.portion_size.trim() || null,
                    calories: formData.calories ? parseInt(formData.calories) : null,
                    meal_type: formData.meal_type,
                } : {
                    water_amount_ml: parseInt(formData.water_amount_ml),
                }),
            };

            const { error } = await supabase
                .from('nutrition_logs')
                .insert(logData);

            if (error) throw error;

            toast({
                title: "Success",
                description: `${logType === 'food' ? 'Food' : 'Water'} log added successfully`,
            });

            setFormData({
                food_name: '',
                portion_size: '',
                calories: '',
                meal_type: 'breakfast',
                water_amount_ml: '',
                notes: '',
                logged_at: new Date().toISOString().slice(0, 16),
            });
            setShowAddDialog(false);
            fetchNutritionLogs();
            onNutritionChange();
        } catch (error) {
            console.error('Error adding nutrition log:', error);
            toast({
                title: "Error",
                description: "Failed to add nutrition log",
                variant: "destructive",
            });
        }
    };

    const deleteLog = async (logId: string) => {
        try {
            const { error } = await supabase
                .from('nutrition_logs')
                .delete()
                .eq('id', logId);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Nutrition log deleted successfully",
            });

            fetchNutritionLogs();
            onNutritionChange();
        } catch (error) {
            console.error('Error deleting nutrition log:', error);
            toast({
                title: "Error",
                description: "Failed to delete nutrition log",
                variant: "destructive",
            });
        }
    };

    const getMealTypeColor = (mealType: string) => {
        switch (mealType) {
            case 'breakfast': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'lunch': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'dinner': return 'bg-red-100 text-red-800 border-red-200';
            case 'snack': return 'bg-purple-100 text-purple-800 border-purple-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">Nutrition & Hydration</h3>
                    <p className="text-sm text-muted-foreground">Track food intake and water consumption</p>
                </div>
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Log Entry
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Add Nutrition Log</DialogTitle>
                            <DialogDescription>
                                Record food intake or water consumption
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    type="button"
                                    variant={logType === 'food' ? 'default' : 'outline'}
                                    onClick={() => setLogType('food')}
                                    className="flex items-center gap-2"
                                >
                                    <Apple className="h-4 w-4" />
                                    Food
                                </Button>
                                <Button
                                    type="button"
                                    variant={logType === 'water' ? 'default' : 'outline'}
                                    onClick={() => setLogType('water')}
                                    className="flex items-center gap-2"
                                >
                                    <Droplets className="h-4 w-4" />
                                    Water
                                </Button>
                            </div>

                            <div>
                                <Label htmlFor="logged_at">Date & Time</Label>
                                <Input
                                    id="logged_at"
                                    type="datetime-local"
                                    value={formData.logged_at}
                                    onChange={(e) => setFormData(prev => ({ ...prev, logged_at: e.target.value }))}
                                    required
                                />
                            </div>

                            {logType === 'food' ? (
                                <>
                                    <div>
                                        <Label htmlFor="food_name">Food Name *</Label>
                                        <Input
                                            id="food_name"
                                            value={formData.food_name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, food_name: e.target.value }))}
                                            placeholder="e.g., Grilled chicken breast"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="meal_type">Meal Type</Label>
                                            <Select value={formData.meal_type} onValueChange={(value) => setFormData(prev => ({ ...prev, meal_type: value }))}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="breakfast">Breakfast</SelectItem>
                                                    <SelectItem value="lunch">Lunch</SelectItem>
                                                    <SelectItem value="dinner">Dinner</SelectItem>
                                                    <SelectItem value="snack">Snack</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label htmlFor="portion_size">Portion Size</Label>
                                            <Input
                                                id="portion_size"
                                                value={formData.portion_size}
                                                onChange={(e) => setFormData(prev => ({ ...prev, portion_size: e.target.value }))}
                                                placeholder="e.g., 1 cup, 100g"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="calories">Calories (optional)</Label>
                                        <Input
                                            id="calories"
                                            type="number"
                                            value={formData.calories}
                                            onChange={(e) => setFormData(prev => ({ ...prev, calories: e.target.value }))}
                                            placeholder="e.g., 250"
                                            min="0"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <Label htmlFor="water_amount_ml">Water Amount (ml) *</Label>
                                    <Input
                                        id="water_amount_ml"
                                        type="number"
                                        value={formData.water_amount_ml}
                                        onChange={(e) => setFormData(prev => ({ ...prev, water_amount_ml: e.target.value }))}
                                        placeholder="e.g., 250"
                                        min="1"
                                        required
                                    />
                                </div>
                            )}

                            <div>
                                <Label htmlFor="notes">Notes (optional)</Label>
                                <Textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Any additional details..."
                                    rows={3}
                                />
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">Add Log</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4">
                {nutritionLogs.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-8">
                            <Apple className="h-12 w-12 text-muted-foreground mb-4" />
                            <h4 className="text-lg font-medium mb-2">No nutrition logs yet</h4>
                            <p className="text-muted-foreground text-center mb-4">
                                Start tracking food intake and water consumption
                            </p>
                            <Button onClick={() => setShowAddDialog(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add First Entry
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    nutritionLogs.map((log) => (
                        <Card key={log.id}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            {log.log_type === 'food' ? (
                                                <Apple className="h-4 w-4 text-green-600" />
                                            ) : (
                                                <Droplets className="h-4 w-4 text-blue-600" />
                                            )}
                                            <span className="font-medium">
                                                {log.log_type === 'food' ? log.food_name : `${log.water_amount_ml}ml Water`}
                                            </span>
                                            {log.meal_type && (
                                                <Badge variant="outline" className={getMealTypeColor(log.meal_type)}>
                                                    {log.meal_type}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="text-sm text-muted-foreground space-y-1">
                                            {log.log_type === 'food' && (
                                                <>
                                                    {log.portion_size && <div>Portion: {log.portion_size}</div>}
                                                    {log.calories && <div>Calories: {log.calories}</div>}
                                                </>
                                            )}

                                            <div className="flex items-center gap-4">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {format(new Date(log.logged_at), 'MMM d, yyyy h:mm a')}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    {log.profiles.display_name}
                                                </span>
                                            </div>

                                            {log.notes && (
                                                <div className="mt-2 p-2 bg-muted rounded text-sm">
                                                    {log.notes}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteLog(log.id)}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export { NutritionTab };
