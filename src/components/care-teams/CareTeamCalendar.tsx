import { useEffect, useRef, useState, useCallback } from 'react';
import Calendar from '@toast-ui/calendar';
import '@toast-ui/calendar/dist/toastui-calendar.min.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { AddEventDialog } from './AddEventDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CalendarEvent {
    id: string;
    calendarId: string;
    title: string;
    category: string;
    dueDateClass: string;
    start: Date;
    end: Date;
    backgroundColor?: string;
    borderColor?: string;
    color?: string;
}

type CalendarType = 'medication' | 'appointment' | 'care' | 'task';

interface CareTeamCalendarProps {
    careTeamId: string;
    careTeamName: string;
}

export function CareTeamCalendar({ careTeamId, careTeamName }: CareTeamCalendarProps) {
    const calendarRef = useRef<HTMLDivElement>(null);
    const calendarInstance = useRef<Calendar | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewType, setViewType] = useState<'month' | 'week' | 'day'>('month');
    const [showAddEventDialog, setShowAddEventDialog] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const { toast } = useToast();

    // Sample events for demonstration - moved outside useEffect to avoid dependency warning
    const getSampleEvents = (): CalendarEvent[] => [
        {
            id: '1',
            calendarId: 'medication',
            title: 'Morning Medication',
            category: 'time',
            dueDateClass: '',
            start: new Date(2025, 7, 2, 9, 0), // August 2, 2025, 9:00 AM
            end: new Date(2025, 7, 2, 9, 30),   // August 2, 2025, 9:30 AM
            backgroundColor: '#03bd9e',
            borderColor: '#03bd9e',
            color: '#ffffff'
        },
        {
            id: '2',
            calendarId: 'appointment',
            title: 'Doctor Appointment',
            category: 'time',
            dueDateClass: '',
            start: new Date(2025, 7, 5, 14, 0), // August 5, 2025, 2:00 PM
            end: new Date(2025, 7, 5, 15, 0),   // August 5, 2025, 3:00 PM
            backgroundColor: '#00a9ff',
            borderColor: '#00a9ff',
            color: '#ffffff'
        },
        {
            id: '3',
            calendarId: 'care',
            title: 'Physical Therapy',
            category: 'time',
            dueDateClass: '',
            start: new Date(2025, 7, 7, 10, 0), // August 7, 2025, 10:00 AM
            end: new Date(2025, 7, 7, 11, 0),   // August 7, 2025, 11:00 AM
            backgroundColor: '#ff6b6b',
            borderColor: '#ff6b6b',
            color: '#ffffff'
        },
        {
            id: '4',
            calendarId: 'task',
            title: 'Medication Refill Due',
            category: 'allday',
            dueDateClass: '',
            start: new Date(2025, 7, 10), // August 10, 2025
            end: new Date(2025, 7, 10),   // August 10, 2025
            backgroundColor: '#ffa726',
            borderColor: '#ffa726',
            color: '#ffffff'
        }
    ];

    // Load events from database
    const loadEvents = useCallback(async () => {
        try {
            const { data: calendarEvents, error } = await supabase
                .from('calendar_events')
                .select('*')
                .eq('care_team_id', careTeamId)
                .order('start_date', { ascending: true });

            if (error) {
                console.error('Error loading events:', error);
                toast({
                    title: "Error",
                    description: "Failed to load calendar events.",
                    variant: "destructive",
                });
                return;
            }

            // Convert database events to calendar format
            const formattedEvents: CalendarEvent[] = calendarEvents?.map(event => ({
                id: event.id,
                calendarId: event.calendar_type,
                title: event.title,
                category: event.category,
                dueDateClass: '',
                start: new Date(event.start_date),
                end: new Date(event.end_date),
                backgroundColor: getCalendarTypeColor(event.calendar_type as CalendarType),
                borderColor: getCalendarTypeColor(event.calendar_type as CalendarType),
                color: '#ffffff'
            })) || [];

            setEvents(formattedEvents);
        } catch (error) {
            console.error('Error loading events:', error);
            toast({
                title: "Error",
                description: "Failed to load calendar events.",
                variant: "destructive",
            });
        }
    }, [careTeamId, toast]);

    // Get color for calendar type
    const getCalendarTypeColor = (type: CalendarType) => {
        switch (type) {
            case 'medication': return '#03bd9e';
            case 'appointment': return '#00a9ff';
            case 'care': return '#ff6b6b';
            case 'task': return '#ffa726';
            default: return '#6b7280';
        }
    };

    // Handle event creation
    const handleEventAdded = () => {
        loadEvents(); // Reload events after adding a new one
    };

    useEffect(() => {
        if (!calendarRef.current) return;

        // Initialize the calendar
        calendarInstance.current = new Calendar(calendarRef.current, {
            defaultView: viewType,
            useCreationPopup: true,
            useDetailPopup: true,
            usageStatistics: false,
            week: {
                showTimezoneCollapseButton: false,
                timezonesCollapsed: false,
                eventView: true,
                taskView: true,
            },
            month: {
                visibleWeeksCount: 0,
                workweek: false,
                showTimezoneCollapseButton: false,
                timezonesCollapsed: false,
            },
            calendars: [
                {
                    id: 'medication',
                    name: 'Medications',
                    backgroundColor: '#03bd9e',
                    borderColor: '#03bd9e',
                    dragBackgroundColor: '#03bd9e',
                },
                {
                    id: 'appointment',
                    name: 'Appointments',
                    backgroundColor: '#00a9ff',
                    borderColor: '#00a9ff',
                    dragBackgroundColor: '#00a9ff',
                },
                {
                    id: 'care',
                    name: 'Care Activities',
                    backgroundColor: '#ff6b6b',
                    borderColor: '#ff6b6b',
                    dragBackgroundColor: '#ff6b6b',
                },
                {
                    id: 'task',
                    name: 'Tasks & Reminders',
                    backgroundColor: '#ffa726',
                    borderColor: '#ffa726',
                    dragBackgroundColor: '#ffa726',
                }
            ],
            template: {
                time(event: { title: string }) {
                    return `<span style="color: white;">${event.title}</span>`;
                },
                allday(event: { title: string }) {
                    return `<span style="color: white;">${event.title}</span>`;
                },
            },
        });

        // Load events from database
        loadEvents();

        // Set the current date
        calendarInstance.current.setDate(currentDate);

        // Event listeners
        calendarInstance.current.on('selectDateTime', (event: unknown) => {
            console.log('Select datetime:', event);
            // Open add event dialog with selected date
            const eventData = event as { start: string };
            setSelectedDate(new Date(eventData.start));
            setShowAddEventDialog(true);
        });

        calendarInstance.current.on('beforeCreateEvent', (event: unknown) => {
            console.log('Before create event:', event);
            // Prevent default creation and open our custom dialog
            const eventData = event as { start: string; guide: { clearGuideElement: () => void } };
            eventData.guide.clearGuideElement();
            setSelectedDate(new Date(eventData.start));
            setShowAddEventDialog(true);
            return false; // Prevent default event creation
        });

        return () => {
            if (calendarInstance.current) {
                calendarInstance.current.destroy();
            }
        };
    }, [viewType, currentDate, careTeamId, loadEvents]);

    // Load events when events state changes
    useEffect(() => {
        if (calendarInstance.current && events.length >= 0) {
            calendarInstance.current.clear();
            calendarInstance.current.createEvents(events);
        }
    }, [events]);

    const handleViewChange = (newView: 'month' | 'week' | 'day') => {
        setViewType(newView);
        if (calendarInstance.current) {
            calendarInstance.current.changeView(newView);
        }
    };

    const handleNavigation = (direction: 'prev' | 'next') => {
        if (!calendarInstance.current) return;

        if (direction === 'next') {
            calendarInstance.current.next();
        } else {
            calendarInstance.current.prev();
        }

        // Update current date state
        const newDate = calendarInstance.current.getDate();
        setCurrentDate(new Date(newDate));
    };

    const handleToday = () => {
        const today = new Date();
        setCurrentDate(today);
        if (calendarInstance.current) {
            calendarInstance.current.today();
        }
    };

    const formatCurrentDate = () => {
        if (viewType === 'month') {
            return currentDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long'
            });
        } else if (viewType === 'week') {
            // Calculate week range
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);

            return `${startOfWeek.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            })} - ${endOfWeek.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            })}`;
        } else {
            return currentDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* Calendar Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Care Team Calendar</CardTitle>
                            <CardDescription>
                                Schedule and track appointments, medications, and care activities for {careTeamName}
                            </CardDescription>
                        </div>
                        <Button onClick={() => setShowAddEventDialog(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Event
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            {/* Calendar Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleNavigation('prev')}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleToday}
                        >
                            Today
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleNavigation('next')}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <h2 className="text-xl font-semibold">{formatCurrentDate()}</h2>
                </div>

                <div className="flex items-center space-x-2">
                    <Button
                        variant={viewType === 'month' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleViewChange('month')}
                    >
                        Month
                    </Button>
                    <Button
                        variant={viewType === 'week' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleViewChange('week')}
                    >
                        Week
                    </Button>
                    <Button
                        variant={viewType === 'day' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleViewChange('day')}
                    >
                        Day
                    </Button>
                </div>
            </div>

            {/* Calendar Legend */}
            <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                    <Badge className="bg-[#03bd9e] text-white">
                        Medications
                    </Badge>
                </div>
                <div className="flex items-center space-x-2">
                    <Badge className="bg-[#00a9ff] text-white">
                        Appointments
                    </Badge>
                </div>
                <div className="flex items-center space-x-2">
                    <Badge className="bg-[#ff6b6b] text-white">
                        Care Activities
                    </Badge>
                </div>
                <div className="flex items-center space-x-2">
                    <Badge className="bg-[#ffa726] text-white">
                        Tasks & Reminders
                    </Badge>
                </div>
            </div>

            {/* Calendar Container */}
            <Card>
                <CardContent className="p-0">
                    <div
                        ref={calendarRef}
                        style={{ height: '600px' }}
                        className="w-full"
                    />
                </CardContent>
            </Card>

            {/* Add Event Dialog */}
            <AddEventDialog
                open={showAddEventDialog}
                onOpenChange={setShowAddEventDialog}
                careTeamId={careTeamId}
                onEventAdded={handleEventAdded}
                initialDate={selectedDate}
            />
        </div>
    );
}
