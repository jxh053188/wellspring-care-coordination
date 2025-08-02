import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
    Plus,
    Stethoscope,
    Heart,
    Brain,
    Eye,
    UserCheck,
    Phone,
    Mail,
    MapPin,
    MoreVertical,
    Edit,
    Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AddProviderDialog } from './AddProviderDialog';

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

interface MedicalProvidersProps {
    careTeamId: string;
}

export const MedicalProviders = ({ careTeamId }: MedicalProvidersProps) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [providers, setProviders] = useState<MedicalProvider[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [editingProvider, setEditingProvider] = useState<MedicalProvider | null>(null);

    const fetchProviders = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('medical_providers')
                .select('*')
                .eq('care_team_id', careTeamId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProviders(data || []);
        } catch (error) {
            console.error('Error fetching providers:', error);
            toast({
                title: "Error",
                description: "Failed to load medical providers",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [careTeamId, toast]);

    useEffect(() => {
        fetchProviders();
    }, [fetchProviders]);

    const handleDeleteProvider = async (providerId: string) => {
        try {
            const { error } = await supabase
                .from('medical_providers')
                .delete()
                .eq('id', providerId);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Medical provider removed successfully",
            });

            fetchProviders();
        } catch (error) {
            console.error('Error deleting provider:', error);
            toast({
                title: "Error",
                description: "Failed to remove medical provider",
                variant: "destructive",
            });
        }
    };

    const getProviderIcon = (type: string) => {
        switch (type) {
            case 'doctor':
                return <Stethoscope className="h-4 w-4" />;
            case 'nurse':
                return <Heart className="h-4 w-4" />;
            case 'therapist':
                return <Brain className="h-4 w-4" />;
            case 'specialist':
                return <Eye className="h-4 w-4" />;
            default:
                return <UserCheck className="h-4 w-4" />;
        }
    };

    const getProviderTypeColor = (type: string) => {
        switch (type) {
            case 'doctor':
                return 'bg-blue-100 text-blue-800';
            case 'nurse':
                return 'bg-green-100 text-green-800';
            case 'therapist':
                return 'bg-purple-100 text-purple-800';
            case 'specialist':
                return 'bg-orange-100 text-orange-800';
            case 'home_health_aide':
                return 'bg-teal-100 text-teal-800';
            case 'pharmacist':
                return 'bg-yellow-100 text-yellow-800';
            case 'dentist':
                return 'bg-pink-100 text-pink-800';
            case 'optometrist':
                return 'bg-indigo-100 text-indigo-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatProviderType = (type: string) => {
        //Capitalize first letter and replace underscores with spaces
        return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
    };

    const formatGoogleMapsLink = (address: string | null) => {
        if (!address) return '';
        const formattedAddress = address.replace(/ /g, '+').replace(/[^a-zA-Z0-9+]/g, '');
        return `https://www.google.com/maps/search/?api=1&query=${formattedAddress}`;
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Medical Providers</CardTitle>
                    <CardDescription>Loading providers...</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Medical Providers</CardTitle>
                            <CardDescription>
                                Doctors, nurses, therapists, and other healthcare professionals involved in care
                            </CardDescription>
                        </div>
                        <Button onClick={() => setShowAddDialog(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Provider
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {providers.length === 0 ? (
                        <div className="text-center py-8">
                            <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h4 className="text-lg font-semibold mb-2">No Medical Providers</h4>
                            <p className="text-muted-foreground mb-4">
                                Add doctors, nurses, therapists, and other healthcare providers to keep track of your care team.
                            </p>
                            <Button onClick={() => setShowAddDialog(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add First Provider
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {providers.map((provider) => (
                                <Card key={provider.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="pt-6">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                                                    {getProviderIcon(provider.provider_type)}
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-sm">{provider.name}</h4>
                                                    <Badge variant="secondary" className={`text-xs ${getProviderTypeColor(provider.provider_type)}`}>
                                                        {formatProviderType(provider.provider_type)}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onClick={() => setEditingProvider(provider)}>
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteProvider(provider.id)}
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Remove
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <div className="space-y-2">
                                            {provider.specialty && (
                                                <p className="text-xs text-muted-foreground font-medium">
                                                    {provider.specialty}
                                                </p>
                                            )}

                                            {provider.practice_name && (
                                                <p className="text-xs text-muted-foreground">
                                                    {provider.practice_name}
                                                </p>
                                            )}

                                            {provider.address && (
                                                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                                    <MapPin className="h-3 w-3" />
                                                    <a href={formatGoogleMapsLink(provider.address)} target="_blank" rel="noopener noreferrer"><span className="text-blue-600">{provider.address}</span></a>
                                                </div>
                                            )}

                                            {provider.phone && (
                                                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                                    <Phone className="h-3 w-3" />
                                                    <a href={`tel:${provider.phone}`}><span className="text-blue-600">{provider.phone}</span></a>
                                                </div>
                                            )}

                                            {provider.email && (
                                                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                                    <Mail className="h-3 w-3" />
                                                    <a href={`mailto:${provider.email}`}><span className="text-blue-600">{provider.email}</span></a>
                                                </div>
                                            )}

                                            {provider.notes && (
                                                <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                                                    {provider.notes}
                                                </p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <AddProviderDialog
                open={showAddDialog || !!editingProvider}
                onOpenChange={(open) => {
                    if (!open) {
                        setShowAddDialog(false);
                        setEditingProvider(null);
                    }
                }}
                careTeamId={careTeamId}
                provider={editingProvider}
                onSuccess={() => {
                    fetchProviders();
                    setShowAddDialog(false);
                    setEditingProvider(null);
                }}
            />
        </>
    );
};
