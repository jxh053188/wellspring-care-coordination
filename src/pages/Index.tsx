import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Heart, Shield, Users, Calendar } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Heart className="h-12 w-12 text-primary" />
          <h1 className="text-5xl font-bold text-primary">Wellspring</h1>
        </div>
        
        <h2 className="text-4xl font-bold mb-6 max-w-4xl mx-auto">
          Family caregiving coordination made simple
        </h2>
        
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Bring your care team together with secure messaging, health tracking, 
          shared calendars, and wellness tools designed to support both caregivers and care recipients.
        </p>
        
        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => navigate('/auth')} className="gap-2">
            Get Started
            <Heart className="h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
            Sign In
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">
          Everything you need to coordinate care
        </h3>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h4 className="text-xl font-semibold mb-2">Care Team Management</h4>
            <p className="text-muted-foreground">
              Role-based access and secure messaging to keep everyone informed and connected.
            </p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h4 className="text-xl font-semibold mb-2">Health & Medication Tracking</h4>
            <p className="text-muted-foreground">
              Comprehensive medication management, health logs, and data export for appointments.
            </p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <h4 className="text-xl font-semibold mb-2">Shared Calendar & Wellness</h4>
            <p className="text-muted-foreground">
              Multi-calendar sync, caregiver wellness tools, and mindfulness resources.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="bg-primary/5 rounded-2xl p-12">
          <h3 className="text-3xl font-bold mb-4">Ready to get started?</h3>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join families who are already using Wellspring to coordinate care and reduce the stress of caregiving.
          </p>
          <Button size="lg" onClick={() => navigate('/auth')} className="gap-2">
            Create Your Account
            <Heart className="h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
