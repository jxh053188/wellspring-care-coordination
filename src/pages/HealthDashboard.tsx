import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
    Pill,
    Heart,
    Plus,
    Calendar,
    Activity,
    AlertTriangle,
    Download
} from 'lucide-react';
import { MedicationsTab } from '@/components/health/MedicationsTab';
import { VitalsTab } from '@/components/health/VitalsTab';
import { AllergiesTab } from '@/components/health/AllergiesTab';
import { ExportDataDialog } from '@/components/health/ExportDataDialog';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type Medication = Database['public']['Tables']['medications']['Row'];

interface CareTeam {
    id: string;
    name: string;
    care_recipient_name: string;
}

interface RecentActivity {
    id: string;
    type: 'medication' | 'vitals' | 'allergy';
    description: string;
    timestamp: string;
    user_name: string;
}

const HealthDashboard = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [searchParams] = useSearchParams();
    const teamIdFromUrl = searchParams.get('teamId');

    const [careTeams, setCareTeams] = useState<CareTeam[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<string | null>(teamIdFromUrl);
    const [medications, setMedications] = useState<Medication[]>([]);
    const [vitalsCount, setVitalsCount] = useState(0);
    const [allergiesCount, setAllergiesCount] = useState(0);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCareTeams = useCallback(async () => {
        try {
            console.log('Fetching care teams for user:', user?.id);

            // First, get the user's profile ID
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user!.id)
                .single();

            console.log('Profile data:', profileData, 'Error:', profileError);

            if (profileError || !profileData) {
                console.error('Failed to find user profile');
                setCareTeams([]);
                setLoading(false);
                return;
            }

            // Get care team memberships using the profile ID
            const { data: memberData, error: memberError } = await supabase
                .from('care_team_members')
                .select('care_team_id, role')
                .eq('user_id', profileData.id);

            console.log('Member data:', memberData, 'Error:', memberError);

            if (memberError) {
                console.error('Member query failed:', memberError);
                setCareTeams([]);
                setLoading(false);
                return;
            }

            if (!memberData || memberData.length === 0) {
                console.log('No memberships found');
                setCareTeams([]);
                setLoading(false);
                return;
            }

            // Now try to fetch the actual care teams
            const teamIds = memberData.map(m => m.care_team_id);
            const { data: teamsData, error: teamsError } = await supabase
                .from('care_teams')
                .select('*')
                .in('id', teamIds);

            console.log('Teams data:', teamsData, 'Error:', teamsError);

            if (teamsError) throw teamsError;

            const teams = (teamsData || []).map(team => ({
                id: team.id,
                name: team.name,
                care_recipient_name: team.care_recipient_name,
            })); setCareTeams(teams);
            if (teams.length > 0 && !selectedTeam) {
                setSelectedTeam(teams[0].id);
            }
        } catch (error) {
            console.error('Error fetching care teams:', error);
            toast({
                title: "Error",
                description: `Failed to load care teams: ${error.message}`,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [user, selectedTeam, toast]);

    const fetchHealthData = useCallback(async () => {
        if (!selectedTeam) return;

        try {
            // Fetch active medications
            const { data: medsData, error: medsError } = await supabase
                .from('medications')
                .select('*')
                .eq('care_team_id', selectedTeam)
                .eq('is_active', true)
                .order('name');

            if (medsError) throw medsError;
            setMedications(medsData || []);

            // Fetch vitals count from the last week
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            const { count: vitalsCount, error: vitalsError } = await supabase
                .from('health_vitals')
                .select('*', { count: 'exact', head: true })
                .eq('care_team_id', selectedTeam)
                .gte('recorded_at', oneWeekAgo.toISOString());

            if (vitalsError) throw vitalsError;
            setVitalsCount(vitalsCount || 0);

            // Fetch allergies count
            const { count: allergiesCount, error: allergiesError } = await supabase
                .from('allergies')
                .select('*', { count: 'exact', head: true })
                .eq('care_team_id', selectedTeam);

            if (allergiesError) throw allergiesError;
            setAllergiesCount(allergiesCount || 0);

            // TODO: Fetch recent activity from medication logs, vitals, etc.
            setRecentActivity([]);
        } catch (error) {
            console.error('Error fetching health data:', error);
        }
    }, [selectedTeam]);

    const createTestCareTeam = useCallback(async () => {
        console.log('Creating test care team for user:', user?.id);

        try {
            // First, get the user's profile ID
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user!.id)
                .single();

            if (profileError || !profileData) {
                throw new Error('Could not find your profile');
            }

            // First create a care team
            console.log('Attempting to create care team...');
            const { data: careTeam, error: teamError } = await supabase
                .from('care_teams')
                .insert({
                    name: 'My Family Care Team',
                    description: 'Primary care coordination for our family',
                    care_recipient_name: 'Mom',
                    created_by: profileData.id,
                })
                .select()
                .single();

            console.log('Care team creation result:', { careTeam, teamError });

            if (teamError) {
                console.error('Team creation error details:', teamError);
                throw teamError;
            }

            // Then add the user as an admin member
            console.log('Attempting to create team membership...');
            const { error: memberError } = await supabase
                .from('care_team_members')
                .insert({
                    care_team_id: careTeam.id,
                    user_id: profileData.id,
                    role: 'admin',
                });

            console.log('Team membership creation result:', { memberError });

            if (memberError) {
                console.error('Member creation error details:', memberError);
                throw memberError;
            }

            toast({
                title: "Success",
                description: "Test care team created successfully",
            });

            // Refresh the care teams
            fetchCareTeams();
        } catch (error) {
            console.error('Error creating test care team:', error);
            toast({
                title: "Error",
                description: `Failed to create test care team: ${error.message || 'Unknown error'}`,
                variant: "destructive",
            });
        }
    }, [user, fetchCareTeams, toast]);

    useEffect(() => {
        if (user) {
            fetchCareTeams();
        }
    }, [user, fetchCareTeams]);

    useEffect(() => {
        if (selectedTeam) {
            fetchHealthData();
        }
    }, [selectedTeam, fetchHealthData]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading health dashboard...</p>
                </div>
            </div>
        );
    }

    if (careTeams.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center py-12">
                        <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                        <h2 className="text-2xl font-semibold mb-4">No Care Teams Found</h2>
                        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                            You need to be part of a care team to access health tracking features.
                        </p>
                        <Button onClick={createTestCareTeam}>Join or Create a Care Team</Button>
                    </div>
                </div>
            </div>
        );
    }

    const selectedTeamData = careTeams.find(t => t.id === selectedTeam);

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
            {/* Header */}
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Heart className="h-6 w-6 text-primary" />
                                <h1 className="text-2xl font-bold text-primary">Health Dashboard</h1>
                            </div>
                            {careTeams.length > 1 && (
                                <select
                                    value={selectedTeam || ''}
                                    onChange={(e) => setSelectedTeam(e.target.value)}
                                    className="bg-background border border-border rounded-md px-3 py-1 text-sm"
                                >
                                    {careTeams.map((team) => (
                                        <option key={team.id} value={team.id}>
                                            {team.name} - {team.care_recipient_name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <ExportDataDialog
                            careTeamId={selectedTeam!}
                            careRecipientName={selectedTeamData.care_recipient_name}
                        />
                    </div>
                    {selectedTeamData && (
                        <p className="text-sm text-muted-foreground mt-2">
                            Managing health for {selectedTeamData.care_recipient_name}
                        </p>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-6">
                {/* Quick Stats */}
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Medications</CardTitle>
                            <Pill className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{medications.length}</div>
                            <p className="text-xs text-muted-foreground">Currently active</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Vitals Logged</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{vitalsCount}</div>
                            <p className="text-xs text-muted-foreground">This week</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Allergies</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{allergiesCount}</div>
                            <p className="text-xs text-muted-foreground">Total recorded</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Tabs */}
                <Tabs defaultValue="medications" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="medications">Medications</TabsTrigger>
                        <TabsTrigger value="vitals">Health & Vitals</TabsTrigger>
                        <TabsTrigger value="allergies">Allergies</TabsTrigger>
                    </TabsList>

                    <TabsContent value="medications">
                        <MedicationsTab
                            careTeamId={selectedTeam!}
                            medications={medications}
                            onMedicationsChange={fetchHealthData}
                        />
                    </TabsContent>

                    <TabsContent value="vitals">
                        <VitalsTab careTeamId={selectedTeam!} onVitalsChange={fetchHealthData} />
                    </TabsContent>

                    <TabsContent value="allergies">
                        <AllergiesTab careTeamId={selectedTeam!} onAllergiesChange={fetchHealthData} />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};

export default HealthDashboard;
