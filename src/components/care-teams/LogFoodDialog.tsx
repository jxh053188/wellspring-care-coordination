import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Apple, Droplets } from 'lucide-react';

interface LogFoodDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    careTeamId: string;
    onFoodLogged: () => void;
}

const LogFoodDialog = ({ open, onOpenChange, careTeamId, onFoodLogged }: LogFoodDialogProps) => {
    const { user } = useAuth();
    const { toast } = useToast();

    const [logType, setLogType] = useState<'food' | 'water'>('food');
    const [loading, setLoading] = useState(false);

    // Food fields
    const [foodName, setFoodName] = useState('');
    const [portionSize, setPortionSize] = useState('');
    const [calories, setCalories] = useState('');
    const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');

    // Water fields
    const [waterAmount, setWaterAmount] = useState('');

    // Common fields
    const [notes, setNotes] = useState('');

    const resetForm = () => {
        setFoodName('');
        setPortionSize('');
        setCalories('');
        setMealType('breakfast');
        setWaterAmount('');
        setNotes('');
        setLogType('food');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);

        try {
            // First, get the user's profile ID
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (profileError || !profile) {
                throw new Error('Could not find user profile');
            }

            const nutritionData = {
                care_team_id: careTeamId,
                logged_by: profile.id, // Use profile ID, not user ID
                log_type: logType,
                notes: notes.trim() || null,
                ...(logType === 'food' && {
                    food_name: foodName.trim(),
                    portion_size: portionSize.trim() || null,
                    calories: calories ? parseInt(calories) : null,
                    meal_type: mealType,
                }),
                ...(logType === 'water' && {
                    water_amount_ml: waterAmount ? parseInt(waterAmount) : null,
                }),
            };

            const { error } = await supabase
                .from('nutrition_logs')
                .insert(nutritionData);

            if (error) throw error;

            toast({
                title: "Success",
                description: `${logType === 'food' ? 'Food' : 'Water'} logged successfully`,
            });

            resetForm();
            onFoodLogged();
        } catch (error) {
            console.error('Error logging nutrition:', error);
            toast({
                title: "Error",
                description: `Failed to log ${logType}. Please try again.`,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            resetForm();
        }
        onOpenChange(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Apple className="h-5 w-5 text-[#4caf50]" />
                        Log Nutrition
                    </DialogTitle>
                    <DialogDescription>
                        Record food intake or water consumption
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Tabs value={logType} onValueChange={(value) => setLogType(value as 'food' | 'water')}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="food" className="flex items-center gap-2">
                                <Apple className="h-4 w-4" />
                                Food
                            </TabsTrigger>
                            <TabsTrigger value="water" className="flex items-center gap-2">
                                <Droplets className="h-4 w-4" />
                                Water
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="food" className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="foodName">Food Name *</Label>
                                <Input
                                    id="foodName"
                                    value={foodName}
                                    onChange={(e) => setFoodName(e.target.value)}
                                    placeholder="e.g., Apple, Chicken breast"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="mealType">Meal Type</Label>
                                    <Select value={mealType} onValueChange={(value: 'breakfast' | 'lunch' | 'dinner' | 'snack') => setMealType(value)}>
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

                                <div className="space-y-2">
                                    <Label htmlFor="calories">Calories</Label>
                                    <Input
                                        id="calories"
                                        type="number"
                                        value={calories}
                                        onChange={(e) => setCalories(e.target.value)}
                                        placeholder="Optional"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="portionSize">Portion Size</Label>
                                <Input
                                    id="portionSize"
                                    value={portionSize}
                                    onChange={(e) => setPortionSize(e.target.value)}
                                    placeholder="e.g., 1 medium, 100g, 1 cup"
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="water" className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="waterAmount">Amount (ml) *</Label>
                                <Input
                                    id="waterAmount"
                                    type="number"
                                    value={waterAmount}
                                    onChange={(e) => setWaterAmount(e.target.value)}
                                    placeholder="e.g., 250, 500"
                                    min="0"
                                    required
                                />
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Optional notes about the food/drink"
                            rows={2}
                        />
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="flex-1">
                            {loading ? 'Logging...' : `Log ${logType === 'food' ? 'Food' : 'Water'}`}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export { LogFoodDialog };
