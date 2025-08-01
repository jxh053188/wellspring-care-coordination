import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
    ArrowLeft,
    Users,
    Settings,
    Heart,
    Calendar as CalendarIcon,
    MessageSquare,
    Activity,
    Plus,
    UserPlus,
    Edit,
    Mail,
    Trash2,
    MoreVertical
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { InviteMemberDialog } from '@/components/care-teams/InviteMemberDialog';
import { EditTeamDialog } from '@/components/care-teams/EditTeamDialog';
import { CareTeamCalendar } from '@/components/care-teams/CareTeamCalendar';

interface Profile {
    id: string;
    display_name: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    avatar_url: string | null;
}

interface CareTeamMember {
    id: string;
    role: string;
    joined_at: string;
    profiles: Profile;
}

interface CareTeam {
    id: string;
    name: string;
    description: string;
    care_recipient_name: string;
    created_at: string;
    updated_at: string;
    care_team_members: CareTeamMember[];
}

interface PendingInvitation {
    id: string;
    email: string;
    role: string;
    first_name: string | null;
    last_name: string | null;
    invited_at: string;
    status: string;
}

const CareTeamDetails = () => {
    const { teamId } = useParams<{ teamId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();

    const [careTeam, setCareTeam] = useState<CareTeam | null>(null);
    const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
    const [medications, setMedications] = useState<{ id: string; name: string; }[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<{ id: string; title: string; start_date: string; }[]>([]);
    const [medicationLogs, setMedicationLogs] = useState<any[]>([]);
    const [recentVitals, setRecentVitals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [showInviteDialog, setShowInviteDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState<CareTeamMember | null>(null); const fetchCareTeamDetails = useCallback(async () => {
        try {
            // Get user's profile first
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user!.id)
                .single();

            if (profileError || !profile) {
                console.error('Profile query failed:', profileError);
                toast({
                    title: "Error",
                    description: "Could not find user profile",
                    variant: "destructive",
                });
                return;
            }

            // Fetch care team details
            const { data: teamData, error: teamError } = await supabase
                .from('care_teams')
                .select('*')
                .eq('id', teamId)
                .single();

            if (teamError || !teamData) {
                console.error('Failed to fetch care team:', teamError);
                toast({
                    title: "Error",
                    description: "Failed to load care team details",
                    variant: "destructive",
                });
                navigate('/dashboard');
                return;
            }

            // Fetch care team members separately
            const { data: membersData, error: membersError } = await supabase
                .from('care_team_members')
                .select('id, role, joined_at, user_id')
                .eq('care_team_id', teamId);

            if (membersError) {
                console.error('Failed to fetch members:', membersError);
                toast({
                    title: "Error",
                    description: "Failed to load team members",
                    variant: "destructive",
                });
                return;
            }

            // Fetch profile details for each member
            const memberProfiles = await Promise.all(
                (membersData || []).map(async (member) => {
                    const { data: profileData, error: profileError } = await supabase
                        .from('profiles')
                        .select('id, display_name, first_name, last_name, phone, avatar_url')
                        .eq('id', member.user_id)
                        .single();

                    return {
                        id: member.id,
                        role: member.role,
                        joined_at: member.joined_at,
                        profiles: profileData || {
                            id: member.user_id,
                            display_name: 'Unknown User',
                            first_name: '',
                            last_name: '',
                            phone: null,
                            avatar_url: null,
                        }
                    };
                })
            );

            // Combine the data
            const combinedTeamData: CareTeam = {
                ...teamData,
                care_team_members: memberProfiles
            };

            console.log('Combined team data:', combinedTeamData);
            setCareTeam(combinedTeamData);
        } catch (error) {
            console.error('Error fetching care team details:', error);
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [teamId, user, toast, navigate]);

    const fetchPendingInvitations = useCallback(async () => {
        if (!teamId) return;

        try {
            const { data: invitations, error } = await supabase
                .from('pending_invitations')
                .select('id, email, role, first_name, last_name, invited_at, status')
                .eq('care_team_id', teamId)
                .eq('status', 'pending')
                .order('invited_at', { ascending: false });

            if (error) {
                console.error('Failed to fetch pending invitations:', error);
                return;
            }

            setPendingInvitations(invitations || []);
        } catch (error) {
            console.error('Error fetching pending invitations:', error);
        }
    }, [teamId]);

    const fetchMedications = useCallback(async () => {
        if (!teamId) return;

        try {
            const { data: medsData, error } = await supabase
                .from('medications')
                .select('id, name, is_active')
                .eq('care_team_id', teamId)
                .order('name');

            if (error) {
                console.error('Failed to fetch medications:', error);
                return;
            }

            // Filter to only show active medications for the overview cards
            const activeMeds = (medsData || []).filter(med => med.is_active);
            setMedications(activeMeds);
        } catch (error) {
            console.error('Error fetching medications:', error);
        }
    }, [teamId]);

    const fetchUpcomingEvents = useCallback(async () => {
        if (!teamId) return;

        try {
            const now = new Date();
            const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

            const { data: eventsData, error } = await supabase
                .from('calendar_events')
                .select('id, title, start_date')
                .eq('care_team_id', teamId)
                .gte('start_date', now.toISOString())
                .lte('start_date', oneWeekFromNow.toISOString())
                .order('start_date', { ascending: true })
                .limit(5);

            if (error) {
                console.error('Failed to fetch upcoming events:', error);
                return;
            }

            setUpcomingEvents(eventsData || []);
        } catch (error) {
            console.error('Error fetching upcoming events:', error);
        }
    }, [teamId]);

    const fetchMedicationLogs = useCallback(async () => {
        if (!teamId) return;

        try {
            const { data: logs, error } = await supabase
                .from('medication_logs')
                .select(`
                    *,
                    medications!inner (name, care_team_id),
                    administered_by_profile:profiles!administered_by (first_name, last_name)
                `)
                .eq('medications.care_team_id', teamId)
                .order('administered_at', { ascending: false })
                .limit(5);

            if (error) {
                console.error('Failed to fetch medication logs:', error);
                return;
            }

            setMedicationLogs(logs || []);
        } catch (error) {
            console.error('Error fetching medication logs:', error);
        }
    }, [teamId]);

    const fetchRecentVitals = useCallback(async () => {
        if (!teamId) return;

        try {
            const { data: vitals, error } = await supabase
                .from('health_vitals')
                .select(`
                    *,
                    profiles (first_name, last_name)
                `)
                .eq('care_team_id', teamId)
                .order('recorded_at', { ascending: false })
                .limit(5);

            if (error) {
                console.error('Failed to fetch recent vitals:', error);
                return;
            }

            setRecentVitals(vitals || []);
        } catch (error) {
            console.error('Error fetching recent vitals:', error);
        }
    }, [teamId]);

    useEffect(() => {
        if (teamId && user) {
            fetchCareTeamDetails();
            fetchPendingInvitations();
            fetchMedications();
            fetchUpcomingEvents();
            fetchMedicationLogs();
            fetchRecentVitals();
        }
    }, [teamId, user, fetchCareTeamDetails, fetchPendingInvitations, fetchMedications, fetchUpcomingEvents, fetchMedicationLogs, fetchRecentVitals]);

    const handleMemberInvited = () => {
        // Refresh the care team data and pending invitations
        fetchCareTeamDetails();
        fetchPendingInvitations();
        fetchMedications();
        fetchUpcomingEvents();
        fetchMedicationLogs();
        fetchRecentVitals();
    };

    const handleTeamUpdated = () => {
        // Refresh the care team data to show updated information
        fetchCareTeamDetails();
        fetchMedications();
        fetchUpcomingEvents();
        fetchMedicationLogs();
        fetchRecentVitals();
    };

    const handleRemoveMember = async (member: CareTeamMember) => {
        try {
            // Get the user_id from the profile first
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('user_id')
                .eq('id', member.profiles.id)
                .single();

            if (profileError || !profileData) {
                throw new Error(`Failed to get user data: ${profileError?.message}`);
            }

            // Delete from care_team_members
            const { error: memberError } = await supabase
                .from('care_team_members')
                .delete()
                .eq('id', member.id);

            if (memberError) {
                throw new Error(`Failed to remove member: ${memberError.message}`);
            }

            // Call the database function to clean up pending invitations
            if (careTeam) {
                const { error: cleanupError } = await supabase
                    .rpc('cleanup_user_invitations', {
                        p_user_id: profileData.user_id,
                        p_care_team_id: careTeam.id
                    } as { p_user_id: string; p_care_team_id: string });

                // Don't throw an error if invitation cleanup fails, just log it
                if (cleanupError) {
                    console.warn('Failed to clean up pending invitations:', cleanupError);
                }
            }

            toast({
                title: "Member Removed",
                description: `${member.profiles.display_name || member.profiles.first_name || 'Member'} has been removed from the care team and can be invited again if needed.`,
            });

            // Refresh the data
            fetchCareTeamDetails();
            fetchPendingInvitations();
            setMemberToRemove(null);

        } catch (error) {
            console.error('Error removing member:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to remove member. Please try again.",
                variant: "destructive",
            });
        }
    }; const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-primary text-primary-foreground';
            case 'family': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'professional': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'friend': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'caregiver': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
            default: return 'bg-secondary text-secondary-foreground';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading care team details...</p>
                </div>
            </div>
        );
    }

    if (!careTeam) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Care Team Not Found</h2>
                    <p className="text-muted-foreground mb-4">The care team you're looking for doesn't exist or you don't have access to it.</p>
                    <Button onClick={() => navigate('/dashboard')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
            {/* Header */}
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate('/dashboard')}
                                className="gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Dashboard
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-primary">{careTeam.name}</h1>
                                <p className="text-sm text-muted-foreground">
                                    Caring for {careTeam.care_recipient_name}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="members">Team Members</TabsTrigger>
                        <TabsTrigger value="health">Health & Care</TabsTrigger>
                        <TabsTrigger value="calendar">Calendar</TabsTrigger>
                        <TabsTrigger value="messages">Messages</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        {/* Quick Stats */}
                        <div className="grid gap-4 md:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{careTeam.care_team_members.length}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Active Medications</CardTitle>
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{medications.length}</div>
                                    <p className="text-xs text-muted-foreground">
                                        {medications.length === 1 ? 'medication' : 'medications'} active
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{upcomingEvents.length}</div>
                                    <p className="text-xs text-muted-foreground">
                                        Next 7 days
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Recent Messages</CardTitle>
                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">0</div>
                                    <p className="text-xs text-muted-foreground">Coming soon</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Team Information */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Team Information</CardTitle>
                                        <CardDescription>Basic details about this care team</CardDescription>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Team
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Team Name</label>
                                    <p className="text-sm">{careTeam.name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Care Recipient</label>
                                    <p className="text-sm">{careTeam.care_recipient_name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                                    <p className="text-sm">{careTeam.description || 'No description provided'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                                    <p className="text-sm">{formatDate(careTeam.created_at)}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="members" className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">Team Members</h3>
                                <p className="text-sm text-muted-foreground">
                                    Manage who has access to this care team
                                    {pendingInvitations.length > 0 && (
                                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                            {pendingInvitations.length} pending invitation{pendingInvitations.length > 1 ? 's' : ''}
                                        </span>
                                    )}
                                </p>
                            </div>
                            <Button onClick={() => setShowInviteDialog(true)}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Invite Member
                            </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {careTeam.care_team_members.map((member) => (
                                <Card key={member.id}>
                                    <CardContent className="pt-6">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                                                <Users className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm font-medium leading-none">
                                                    {member.profiles.display_name ||
                                                        `${member.profiles.first_name} ${member.profiles.last_name}`.trim() ||
                                                        'Unknown User'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Joined {formatDate(member.joined_at)}
                                                </p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Badge
                                                    variant="secondary"
                                                    className={getRoleColor(member.role)}
                                                >
                                                    {member.role}
                                                </Badge>
                                                {user && member.profiles.id !== user.id && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() => setMemberToRemove(member)}
                                                                className="text-red-600 hover:text-red-700"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Remove Member
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </div>
                                        </div>
                                        {member.profiles.phone && (
                                            <div className="mt-3 pt-3 border-t">
                                                <p className="text-xs text-muted-foreground">
                                                    {member.profiles.phone}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Pending Invitations */}
                        {pendingInvitations.length > 0 && (
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-md font-semibold">Pending Invitations</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Invitations sent but not yet accepted
                                    </p>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {pendingInvitations.map((invitation) => (
                                        <Card key={invitation.id} className="border-dashed">
                                            <CardContent className="pt-6">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                                                        <Mail className="h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <p className="text-sm font-medium leading-none">
                                                            {invitation.first_name && invitation.last_name
                                                                ? `${invitation.first_name} ${invitation.last_name}`
                                                                : invitation.email}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {invitation.email}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Invited {formatDate(invitation.invited_at)}
                                                        </p>
                                                    </div>
                                                    <Badge
                                                        variant="outline"
                                                        className={getRoleColor(invitation.role)}
                                                    >
                                                        {invitation.role}
                                                    </Badge>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="health" className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">Health & Care Management</h3>
                                <p className="text-sm text-muted-foreground">
                                    Track medications, health vitals, and care activities
                                </p>
                            </div>
                            <Button onClick={() => navigate(`/health?teamId=${teamId}`)}>
                                <Heart className="h-4 w-4 mr-2" />
                                Go to Health Dashboard
                            </Button>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Recent Medication Logs</CardTitle>
                                    <CardDescription>Latest medication administration records</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {medicationLogs.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">
                                            No medication logs yet. Use the Health Dashboard to log medication administration.
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {medicationLogs.map((log: any) => (
                                                <div key={log.id} className="flex justify-between items-start border-b pb-2 last:border-b-0">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium">{log.medications?.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {log.dose_amount} {log.dose_unit} • {format(new Date(log.administered_at), 'MMM d, h:mm a')}
                                                        </p>
                                                        {log.administered_by_profile && (
                                                            <p className="text-xs text-muted-foreground">
                                                                by {log.administered_by_profile.first_name} {log.administered_by_profile.last_name}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {medicationLogs.length >= 5 && (
                                                <p className="text-xs text-muted-foreground text-center pt-2">
                                                    Showing recent 5 entries
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Recent Vitals</CardTitle>
                                    <CardDescription>Latest vital signs and measurements</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {recentVitals.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">
                                            No vitals recorded yet. Use the Health Dashboard to track vitals.
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {recentVitals.map((vital: any) => (
                                                <div key={vital.id} className="flex justify-between items-start border-b pb-2 last:border-b-0">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium">{vital.vital_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {vital.value} {vital.unit} • {format(new Date(vital.recorded_at), 'MMM d, h:mm a')}
                                                        </p>
                                                        {vital.profiles && (
                                                            <p className="text-xs text-muted-foreground">
                                                                by {vital.profiles.first_name} {vital.profiles.last_name}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {recentVitals.length >= 5 && (
                                                <p className="text-xs text-muted-foreground text-center pt-2">
                                                    Showing recent 5 entries
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="calendar" className="space-y-6">
                        <CareTeamCalendar
                            careTeamId={careTeam.id}
                            careTeamName={careTeam.name}
                        />
                    </TabsContent>

                    <TabsContent value="messages" className="space-y-6">
                        <div className="text-center py-12">
                            <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Secure Messaging Coming Soon</h3>
                            <p className="text-muted-foreground">
                                Communicate securely with your care team members.
                            </p>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>

            {/* Invite Member Dialog */}
            {careTeam && (
                <InviteMemberDialog
                    open={showInviteDialog}
                    onOpenChange={setShowInviteDialog}
                    careTeamId={careTeam.id}
                    onMemberInvited={handleMemberInvited}
                />
            )}

            {/* Edit Team Dialog */}
            {careTeam && (
                <EditTeamDialog
                    open={showEditDialog}
                    onOpenChange={setShowEditDialog}
                    careTeam={careTeam}
                    onTeamUpdated={handleTeamUpdated}
                />
            )}

            {/* Remove Member Confirmation Dialog */}
            <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove{' '}
                            <strong>
                                {memberToRemove?.profiles.display_name ||
                                    `${memberToRemove?.profiles.first_name} ${memberToRemove?.profiles.last_name}`.trim() ||
                                    'this member'}
                            </strong>{' '}
                            from the care team? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => memberToRemove && handleRemoveMember(memberToRemove)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Remove Member
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default CareTeamDetails;
