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
    AlertTriangle,
    Plus,
    Edit2,
    Trash2,
    Shield,
    AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Allergy {
    id: string;
    allergen: string;
    severity: string | null;
    reaction: string | null;
    notes: string | null;
    created_at: string;
    created_by: string;
    updated_at: string;
}

interface AllergiesTabProps {
    careTeamId: string;
    onAllergiesChange?: () => void;
}

export const AllergiesTab = ({ careTeamId, onAllergiesChange }: AllergiesTabProps) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [allergies, setAllergies] = useState<Allergy[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingAllergy, setEditingAllergy] = useState<Allergy | null>(null);
    const [formData, setFormData] = useState({
        allergen: '',
        severity: '',
        reaction: '',
        notes: '',
    });

    useEffect(() => {
        fetchAllergies();
    }, [careTeamId]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchAllergies = async () => {
        try {
            const { data, error } = await supabase
                .from('allergies')
                .select('*')
                .eq('care_team_id', careTeamId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAllergies(data || []);
        } catch (error) {
            console.error('Error fetching allergies:', error);
            toast({
                title: "Error",
                description: "Failed to load allergies",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddAllergy = async () => {
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
                .from('allergies')
                .insert({
                    ...formData,
                    care_team_id: careTeamId,
                    created_by: currentProfile.id,
                });

            if (error) throw error;

            toast({
                title: "Success",
                description: "Allergy added successfully",
            });

            setShowAddDialog(false);
            resetForm();
            fetchAllergies();
            onAllergiesChange?.();
        } catch (error) {
            console.error('Error adding allergy:', error);
            toast({
                title: "Error",
                description: "Failed to add allergy",
                variant: "destructive",
            });
        }
    };

    const handleUpdateAllergy = async () => {
        if (!editingAllergy) return;

        try {
            const { error } = await supabase
                .from('allergies')
                .update({
                    allergen: formData.allergen,
                    severity: formData.severity,
                    reaction: formData.reaction,
                    notes: formData.notes,
                })
                .eq('id', editingAllergy.id);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Allergy updated successfully",
            });

            setShowEditDialog(false);
            setEditingAllergy(null);
            resetForm();
            fetchAllergies();
            onAllergiesChange?.();
        } catch (error) {
            console.error('Error updating allergy:', error);
            toast({
                title: "Error",
                description: "Failed to update allergy",
                variant: "destructive",
            });
        }
    };

    const handleDeleteAllergy = async (allergyId: string) => {
        try {
            const { error } = await supabase
                .from('allergies')
                .delete()
                .eq('id', allergyId);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Allergy removed successfully",
            });

            fetchAllergies();
            onAllergiesChange?.();
        } catch (error) {
            console.error('Error deleting allergy:', error);
            toast({
                title: "Error",
                description: "Failed to remove allergy",
                variant: "destructive",
            });
        }
    };

    const resetForm = () => {
        setFormData({
            allergen: '',
            severity: '',
            reaction: '',
            notes: '',
        });
    };

    const openEditDialog = (allergy: Allergy) => {
        setEditingAllergy(allergy);
        setFormData({
            allergen: allergy.allergen,
            severity: allergy.severity || '',
            reaction: allergy.reaction || '',
            notes: allergy.notes || '',
        });
        setShowEditDialog(true);
    };

    const getSeverityColor = (severity: string | null) => {
        switch (severity) {
            case 'severe': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'moderate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'mild': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            default: return 'bg-secondary text-secondary-foreground';
        }
    };

    const getSeverityIcon = (severity: string | null) => {
        switch (severity) {
            case 'severe': return <AlertTriangle className="h-4 w-4 text-red-500" />;
            case 'moderate': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
            case 'mild': return <Shield className="h-4 w-4 text-green-500" />;
            default: return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold">Allergy Management</h3>
                    <p className="text-sm text-muted-foreground">
                        Track known allergies and reactions for safety
                    </p>
                </div>
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Allergy
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add New Allergy</DialogTitle>
                            <DialogDescription>
                                Record a known allergen and its details for safety reference.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="allergen">Allergen *</Label>
                                <Input
                                    id="allergen"
                                    value={formData.allergen}
                                    onChange={(e) => setFormData(prev => ({ ...prev, allergen: e.target.value }))}
                                    placeholder="e.g., Penicillin, Peanuts, Latex"
                                />
                            </div>
                            <div>
                                <Label htmlFor="severity">Severity</Label>
                                <Select
                                    value={formData.severity}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select severity" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="mild">Mild</SelectItem>
                                        <SelectItem value="moderate">Moderate</SelectItem>
                                        <SelectItem value="severe">Severe</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="reaction">Reaction</Label>
                                <Input
                                    id="reaction"
                                    value={formData.reaction}
                                    onChange={(e) => setFormData(prev => ({ ...prev, reaction: e.target.value }))}
                                    placeholder="e.g., Hives, Swelling, Difficulty breathing"
                                />
                            </div>
                            <div>
                                <Label htmlFor="notes">Additional Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Any additional information about this allergy..."
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => {
                                setShowAddDialog(false);
                                resetForm();
                            }}>
                                Cancel
                            </Button>
                            <Button onClick={handleAddAllergy} disabled={!formData.allergen}>
                                Add Allergy
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Emergency Warning */}
            {allergies.some(a => a.severity === 'severe') && (
                <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <CardTitle className="text-red-800 dark:text-red-200">
                                Severe Allergies Alert
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                            This person has severe allergies. Make sure all caregivers and medical professionals are aware.
                        </p>
                        <div className="space-y-1">
                            {allergies
                                .filter(a => a.severity === 'severe')
                                .map(allergy => (
                                    <Badge key={allergy.id} variant="destructive" className="mr-2">
                                        {allergy.allergen}
                                    </Badge>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Allergies List */}
            <div>
                {allergies.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center py-8">
                                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h4 className="text-lg font-semibold mb-2">No Allergies Recorded</h4>
                                <p className="text-muted-foreground mb-4">
                                    Add known allergies to keep everyone informed and safe.
                                </p>
                                <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add First Allergy
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {allergies.map((allergy) => (
                            <Card key={allergy.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            {getSeverityIcon(allergy.severity)}
                                            <div>
                                                <CardTitle className="text-lg">{allergy.allergen}</CardTitle>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {allergy.severity && (
                                                        <Badge className={getSeverityColor(allergy.severity)}>
                                                            {allergy.severity}
                                                        </Badge>
                                                    )}
                                                    <span className="text-xs text-muted-foreground">
                                                        Added {format(new Date(allergy.created_at), 'MMM d, yyyy')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => openEditDialog(allergy)}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button size="sm" variant="ghost">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Remove Allergy</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to remove {allergy.allergen} from the allergy list? This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteAllergy(allergy.id)}>
                                                            Remove
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                </CardHeader>
                                {(allergy.reaction || allergy.notes) && (
                                    <CardContent className="pt-0">
                                        {allergy.reaction && (
                                            <div className="mb-2">
                                                <span className="text-sm font-medium">Reaction: </span>
                                                <span className="text-sm text-muted-foreground">{allergy.reaction}</span>
                                            </div>
                                        )}
                                        {allergy.notes && (
                                            <div>
                                                <span className="text-sm font-medium">Notes: </span>
                                                <span className="text-sm text-muted-foreground">{allergy.notes}</span>
                                            </div>
                                        )}
                                    </CardContent>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Allergy</DialogTitle>
                        <DialogDescription>
                            Update the allergy information.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="edit_allergen">Allergen *</Label>
                            <Input
                                id="edit_allergen"
                                value={formData.allergen}
                                onChange={(e) => setFormData(prev => ({ ...prev, allergen: e.target.value }))}
                                placeholder="e.g., Penicillin, Peanuts, Latex"
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit_severity">Severity</Label>
                            <Select
                                value={formData.severity}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select severity" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="mild">Mild</SelectItem>
                                    <SelectItem value="moderate">Moderate</SelectItem>
                                    <SelectItem value="severe">Severe</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="edit_reaction">Reaction</Label>
                            <Input
                                id="edit_reaction"
                                value={formData.reaction}
                                onChange={(e) => setFormData(prev => ({ ...prev, reaction: e.target.value }))}
                                placeholder="e.g., Hives, Swelling, Difficulty breathing"
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit_notes">Additional Notes</Label>
                            <Textarea
                                id="edit_notes"
                                value={formData.notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Any additional information about this allergy..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setShowEditDialog(false);
                            setEditingAllergy(null);
                            resetForm();
                        }}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateAllergy} disabled={!formData.allergen}>
                            Update Allergy
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
