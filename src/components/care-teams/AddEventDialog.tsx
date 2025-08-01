import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Clock, Loader2 } from 'lucide-react';

interface AddEventDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    careTeamId: string;
    onEventAdded: () => void;
    initialDate?: Date;
}

type CalendarType = 'medication' | 'appointment' | 'care' | 'task';

export function AddEventDialog({
    open,
    onOpenChange,
    careTeamId,
    onEventAdded,
    initialDate
}: AddEventDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const getInitialDates = () => {
        if (initialDate) {
            const start = new Date(initialDate);
            const end = new Date(start.getTime() + 30 * 60 * 1000); // 30 minutes later
            return {
                startDate: start.toISOString().slice(0, 16),
                endDate: end.toISOString().slice(0, 16)
            };
        }
        return {
            startDate: '',
            endDate: ''
        };
    };

    const { startDate: initialStartDate, endDate: initialEndDate } = getInitialDates();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        calendarType: 'appointment' as CalendarType,
        startDate: initialStartDate,
        endDate: initialEndDate,
        allDay: false,
        location: '',
        reminderMinutes: 15,
    });

    // Update form data when initialDate changes
    useEffect(() => {
        if (initialDate) {
            const start = new Date(initialDate);
            const end = new Date(start.getTime() + 30 * 60 * 1000); // 30 minutes later
            const startDate = start.toISOString().slice(0, 16);
            const endDate = end.toISOString().slice(0, 16);

            setFormData(prev => ({
                ...prev,
                startDate,
                endDate
            }));
        }
    }, [initialDate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !formData.title || !formData.startDate || !formData.endDate) return;

        setLoading(true);
        try {
            // Get the current user's profile
            const { data: currentProfile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (profileError || !currentProfile) {
                throw new Error('Could not find your profile');
            }

            // Validate dates
            const startDate = new Date(formData.startDate);
            const endDate = new Date(formData.endDate);

            if (endDate <= startDate) {
                throw new Error('End date must be after start date');
            }

            // Create the calendar event
            const { error: eventError } = await supabase
                .from('calendar_events')
                .insert({
                    care_team_id: careTeamId,
                    title: formData.title,
                    description: formData.description || null,
                    category: formData.allDay ? 'allday' : 'time',
                    calendar_type: formData.calendarType,
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString(),
                    all_day: formData.allDay,
                    location: formData.location || null,
                    reminder_minutes: formData.reminderMinutes,
                    created_by: currentProfile.id,
                });

            if (eventError) {
                throw new Error(`Failed to create event: ${eventError.message}`);
            }

            toast({
                title: "Event Created Successfully",
                description: `${formData.title} has been added to the calendar.`,
            });

            // Reset form and close dialog
            setFormData({
                title: '',
                description: '',
                calendarType: 'appointment',
                startDate: '',
                endDate: '',
                allDay: false,
                location: '',
                reminderMinutes: 15,
            });
            onOpenChange(false);
            onEventAdded();

        } catch (error) {
            console.error('Error creating event:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to create event. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };

            // Auto-adjust end date when start date changes
            if (field === 'startDate' && value && (!prev.endDate || new Date(prev.endDate) <= new Date(value))) {
                const startDate = new Date(value);
                const endDate = new Date(startDate.getTime() + (prev.allDay ? 0 : 30 * 60 * 1000)); // 30 minutes later for timed events
                newData.endDate = endDate.toISOString().slice(0, 16);
            }

            return newData;
        });
    };

    const handleAllDayChange = (allDay: boolean) => {
        setFormData(prev => {
            const newData = { ...prev, allDay };

            // Adjust time format for all-day events
            if (allDay && prev.startDate) {
                const startDate = new Date(prev.startDate);
                const endDate = new Date(prev.startDate);
                newData.startDate = startDate.toISOString().slice(0, 10); // YYYY-MM-DD format
                newData.endDate = endDate.toISOString().slice(0, 10);
            } else if (!allDay && prev.startDate) {
                const startDate = new Date(prev.startDate);
                const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // 30 minutes later
                newData.startDate = startDate.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM format
                newData.endDate = endDate.toISOString().slice(0, 16);
            }

            return newData;
        });
    };

    const getCalendarTypeColor = (type: CalendarType) => {
        switch (type) {
            case 'medication': return 'bg-[#03bd9e] text-white';
            case 'appointment': return 'bg-[#00a9ff] text-white';
            case 'care': return 'bg-[#ff6b6b] text-white';
            case 'task': return 'bg-[#ffa726] text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Calendar Event</DialogTitle>
                    <DialogDescription>
                        Create a new event for your care team calendar.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Event Title *</Label>
                        <Input
                            id="title"
                            type="text"
                            placeholder="Enter event title"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Enter event description (optional)"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                        />
                    </div>

                    {/* Calendar Type */}
                    <div className="space-y-2">
                        <Label htmlFor="calendarType">Event Type</Label>
                        <Select
                            value={formData.calendarType}
                            onValueChange={(value: CalendarType) =>
                                setFormData(prev => ({ ...prev, calendarType: value }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="medication">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-3 h-3 rounded-full bg-[#03bd9e]"></div>
                                        <span>Medication</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="appointment">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-3 h-3 rounded-full bg-[#00a9ff]"></div>
                                        <span>Appointment</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="care">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-3 h-3 rounded-full bg-[#ff6b6b]"></div>
                                        <span>Care Activity</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="task">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-3 h-3 rounded-full bg-[#ffa726]"></div>
                                        <span>Task & Reminder</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* All Day Toggle */}
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="allDay"
                            checked={formData.allDay}
                            onCheckedChange={handleAllDayChange}
                        />
                        <Label htmlFor="allDay">All day event</Label>
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startDate">
                                Start {formData.allDay ? 'Date' : 'Date & Time'} *
                            </Label>
                            <Input
                                id="startDate"
                                type={formData.allDay ? 'date' : 'datetime-local'}
                                value={formData.startDate}
                                onChange={(e) => handleDateChange('startDate', e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endDate">
                                End {formData.allDay ? 'Date' : 'Date & Time'} *
                            </Label>
                            <Input
                                id="endDate"
                                type={formData.allDay ? 'date' : 'datetime-local'}
                                value={formData.endDate}
                                onChange={(e) => handleDateChange('endDate', e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                            id="location"
                            type="text"
                            placeholder="Enter location (optional)"
                            value={formData.location}
                            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        />
                    </div>

                    {/* Reminder */}
                    {!formData.allDay && (
                        <div className="space-y-2">
                            <Label htmlFor="reminder">Reminder</Label>
                            <Select
                                value={formData.reminderMinutes.toString()}
                                onValueChange={(value) =>
                                    setFormData(prev => ({ ...prev, reminderMinutes: parseInt(value) }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">No reminder</SelectItem>
                                    <SelectItem value="5">5 minutes before</SelectItem>
                                    <SelectItem value="15">15 minutes before</SelectItem>
                                    <SelectItem value="30">30 minutes before</SelectItem>
                                    <SelectItem value="60">1 hour before</SelectItem>
                                    <SelectItem value="1440">1 day before</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Create Event
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
