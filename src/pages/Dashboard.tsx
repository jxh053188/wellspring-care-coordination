import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Heart, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  display_name: string;
  first_name: string;
  last_name: string;
}

interface CareTeam {
  id: string;
  name: string;
  description: string;
  care_recipient_name: string;
  created_at: string;
  care_team_members: {
    role: string;
    profiles: Profile;
  }[];
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [careTeams, setCareTeams] = useState<CareTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchCareTeams();
    }
  }, [user]);

  const fetchCareTeams = async () => {
    try {
      // For now, just show empty state since we need to set up proper relationships
      setCareTeams([]);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-primary text-primary-foreground';
      case 'family': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'professional': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'friend': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'caregiver': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-primary">Wellspring</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.user_metadata?.first_name || user?.email}
            </span>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {careTeams.length === 0 ? (
          // Empty state
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-6">
              <Users className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">Welcome to Wellspring</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Start by creating your first care team to coordinate care for your loved one with family, friends, and professionals.
            </p>
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Create Your First Care Team
            </Button>
          </div>
        ) : (
          // Care teams list
          <div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold">Your Care Teams</h2>
                <p className="text-muted-foreground">
                  Coordinate care and stay connected with your loved ones
                </p>
              </div>
              <Button className="gap-2">
                <Plus className="h-5 w-5" />
                New Care Team
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {careTeams.map((team) => (
                <Card key={team.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                        <CardDescription>
                          Caring for {team.care_recipient_name}
                        </CardDescription>
                      </div>
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {team.description && (
                      <p className="text-sm text-muted-foreground mb-4">{team.description}</p>
                    )}
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Team Members</span>
                      </div>
                      
                      <div className="space-y-2">
                        {team.care_team_members.map((member, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm">
                              {member.profiles.display_name || 
                               `${member.profiles.first_name} ${member.profiles.last_name}`.trim()}
                            </span>
                            <Badge 
                              variant="secondary" 
                              className={getRoleColor(member.role)}
                            >
                              {member.role}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;