import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format as formatDate, subDays, subWeeks, subMonths, startOfDay, endOfDay } from 'date-fns';

interface ExportDataDialogProps {
    careTeamId: string;
    careRecipientName: string;
}

export const ExportDataDialog = ({ careTeamId, careRecipientName }: ExportDataDialogProps) => {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [exportOptions, setExportOptions] = useState({
        medications: true,
        medicationLogs: true,
        foodLogs: true,
        moodLogs: true,
        vitals: true,
        allergies: true,
    });
    const [dateRange, setDateRange] = useState('all');
    const [format, setFormat] = useState('pdf');
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            const data: any = {};
            const now = new Date();
            let startDate: Date | null = null;
            let endDate: Date | null = null;

            // Calculate date range
            switch (dateRange) {
                case 'today':
                    startDate = startOfDay(now);
                    endDate = endOfDay(now);
                    break;
                case 'yesterday':
                    startDate = startOfDay(subDays(now, 1));
                    endDate = endOfDay(subDays(now, 1));
                    break;
                case 'week':
                    startDate = subWeeks(now, 1);
                    break;
                case 'month':
                    startDate = subMonths(now, 1);
                    break;
                case '3months':
                    startDate = subMonths(now, 3);
                    break;
                case '6months':
                    startDate = subMonths(now, 6);
                    break;
                case 'year':
                    startDate = subMonths(now, 12);
                    break;
                default:
                    startDate = null; // All time
                    endDate = null;
            }

            // Fetch medications
            if (exportOptions.medications) {
                const query = supabase
                    .from('medications')
                    .select('*')
                    .eq('care_team_id', careTeamId);

                if (startDate) {
                    query.gte('created_at', startDate.toISOString());
                }

                const { data: medications, error: medsError } = await query;
                if (medsError) throw medsError;
                data.medications = medications;
            }

            // Fetch medication logs
            if (exportOptions.medicationLogs) {
                const query = supabase
                    .from('medication_logs')
                    .select(`
                        *,
                        medications!inner (name, care_team_id),
                        administered_by_profile:profiles!administered_by (display_name, first_name, last_name)
                    `)
                    .eq('medications.care_team_id', careTeamId)
                    .order('administered_at', { ascending: false });

                if (startDate) {
                    query.gte('administered_at', startDate.toISOString());
                }
                if (endDate) {
                    query.lte('administered_at', endDate.toISOString());
                }

                const { data: logs, error: logsError } = await query;
                if (logsError) throw logsError;
                data.medicationLogs = logs;
            }

            //fetch food logs
            if (exportOptions.foodLogs) {
                const query = supabase
                    .from('nutrition_logs')
                    .select('*')
                    .eq('care_team_id', careTeamId)
                    .order('created_at', { ascending: false });
                if (startDate) {
                    query.gte('created_at', startDate.toISOString());
                }
                if (endDate) {
                    query.lte('created_at', endDate.toISOString());
                }

                const { data: foodLogs, error: foodLogsError } = await query;
                if (foodLogsError) throw foodLogsError;
                data.foodLogs = foodLogs;
            }

            //fetch mood logs
            if (exportOptions.moodLogs) {
                const query = supabase
                    .from('mood_logs')
                    .select('*')
                    .eq('care_team_id', careTeamId)
                    .order('created_at', { ascending: false });
                if (startDate) {
                    query.gte('created_at', startDate.toISOString());
                }
                if (endDate) {
                    query.lte('created_at', endDate.toISOString());
                }

                const { data: moodLogs, error: moodLogsError } = await query;
                if (moodLogsError) throw moodLogsError;
                data.moodLogs = moodLogs;
            }

            // Fetch vitals
            if (exportOptions.vitals) {
                const query = supabase
                    .from('health_vitals')
                    .select(`
                        *,
                        recorded_by_profile:profiles!recorded_by (display_name, first_name, last_name)
                    `)
                    .eq('care_team_id', careTeamId)
                    .order('recorded_at', { ascending: false });

                if (startDate) {
                    query.gte('recorded_at', startDate.toISOString());
                }
                if (endDate) {
                    query.lte('recorded_at', endDate.toISOString());
                }

                const { data: vitals, error: vitalsError } = await query;
                if (vitalsError) throw vitalsError;
                data.vitals = vitals;
            }

            // Fetch allergies
            if (exportOptions.allergies) {
                const query = supabase
                    .from('allergies')
                    .select('*')
                    .eq('care_team_id', careTeamId);

                if (startDate) {
                    query.gte('created_at', startDate.toISOString());
                }

                const { data: allergies, error: allergiesError } = await query;
                if (allergiesError) throw allergiesError;
                data.allergies = allergies;
            }

            // Generate export based on format
            if (format === 'csv') {
                await generateCSVExport(data, careRecipientName);
            } else {
                await generatePDFExport(data, careRecipientName);
            }

            toast({
                title: "Success",
                description: `Health data exported successfully as ${format.toUpperCase()}`,
            });

            setOpen(false);
        } catch (error) {
            console.error('Error exporting data:', error);
            toast({
                title: "Error",
                description: "Failed to export health data",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const generateCSVExport = async (data: any, recipientName: string) => {
        let csvContent = '';

        // Add medications
        if (data.medications && data.medications.length > 0) {
            csvContent += `Medications for ${recipientName}\n`;
            csvContent += 'Name,Dosage,Frequency,Instructions,Prescribing Doctor,Pharmacy,Start Date,End Date,Active\n';
            data.medications.forEach((med: any) => {
                csvContent += `"${med.name}","${med.dosage || ''}","${med.frequency || ''}","${med.instructions || ''}","${med.prescribing_doctor || ''}","${med.pharmacy || ''}","${med.start_date || ''}","${med.end_date || ''}","${med.is_active}"\n`;
            });
            csvContent += '\n';
        }

        // Add medication logs
        if (data.medicationLogs && data.medicationLogs.length > 0) {
            csvContent += 'Medication Administration Log\n';
            csvContent += 'Date,Time,Medication,Dosage Given,Amount,Unit,Given By,Notes\n';
            data.medicationLogs.forEach((log: any) => {
                const dateTime = new Date(log.administered_at);
                const givenBy = log.administered_by_profile?.display_name || `${log.administered_by_profile?.first_name} ${log.administered_by_profile?.last_name}`.trim();
                csvContent += `"${formatDate(dateTime, 'MM/dd/yyyy')}","${formatDate(dateTime, 'h:mm a')}","${log.medications?.name || ''}","${log.dose_amount || ''} ${log.dose_unit || ''}","${log.dose_amount || ''}","${log.dose_unit || ''}","${givenBy}","${log.notes || ''}"\n`;
            });
            csvContent += '\n';
        }

        // Add vitals
        if (data.vitals && data.vitals.length > 0) {
            csvContent += 'Health Vitals & Measurements\n';
            csvContent += 'Date,Time,Vital Type,Value,Unit,Recorded By,Notes\n';
            data.vitals.forEach((vital: any) => {
                const dateTime = new Date(vital.recorded_at);
                const recordedBy = vital.recorded_by_profile?.display_name || `${vital.recorded_by_profile?.first_name} ${vital.recorded_by_profile?.last_name}`.trim();

                csvContent += `"${formatDate(dateTime, 'MM/dd/yyyy')}","${formatDate(dateTime, 'h:mm a')}","${vital.vital_type || ''}","${vital.value || ''}","${vital.unit || ''}","${recordedBy}","${vital.notes || ''}"\n`;
            });
            csvContent += '\n';
        }

        //add food logs
        if (data.foodLogs && data.foodLogs.length > 0) {
            csvContent += 'Food & Nutrition Logs\n';
            csvContent += 'Date,Time,Type,Food,Portion Size,Calories,Notes\n';
            data.foodLogs.forEach((log: any) => {
                const dateTime = new Date(log.created_at);
                csvContent += `"${formatDate(dateTime, 'MM/dd/yyyy')}","${formatDate(dateTime, 'h:mm a')}","${log.meal_type || ''}","${log.food_name || ''}","${log.portion_size || ''}","${log.calories || ''}","${log.notes || ''}"\n`;
            });
            csvContent += '\n';
        }

        //add mood logs
        if (data.moodLogs && data.moodLogs.length > 0) {
            csvContent += 'Mood & Mental Health Logs\n';
            csvContent += 'Date,Time,Mood,Mood Level,Energy Level,Sleep Quality,Stress Level,Pain Level,Notes\n';
            data.moodLogs.forEach((log: any) => {
                const dateTime = new Date(log.created_at);
                csvContent += `"${formatDate(dateTime, 'MM/dd/yyyy')}","${formatDate(dateTime, 'h:mm a')}","${log.mood_type || ''}","${log.mood_level || ''}","${log.energy_level || ''}","${log.sleep_quality || ''}","${log.stress_level || ''}","${log.pain_level || ''}","${log.notes || ''}"\n`;
            });
            csvContent += '\n';
        }


        // Add allergies
        if (data.allergies && data.allergies.length > 0) {
            csvContent += 'Allergies\n';
            csvContent += 'Allergen,Severity,Reaction,Notes\n';
            data.allergies.forEach((allergy: any) => {
                csvContent += `"${allergy.allergen}","${allergy.severity || ''}","${allergy.reaction || ''}","${allergy.notes || ''}"\n`;
            });
        }

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${recipientName}_health_data_${formatDate(new Date(), 'yyyy-MM-dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const generatePDFExport = async (data: any, recipientName: string) => {
        // For now, we'll create a simple HTML document that can be printed as PDF
        // In a real implementation, you'd use a library like jsPDF or Puppeteer
        let htmlContent = `
      <html>
        <head>
          <title>Health Report for ${recipientName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
            h2 { color: #555; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .severity-severe { color: #dc3545; font-weight: bold; }
            .severity-moderate { color: #ffc107; font-weight: bold; }
            .severity-mild { color: #28a745; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Health Report for ${recipientName}</h1>
          <p>Generated on: ${formatDate(new Date(), 'MMMM d, yyyy')}</p>
    `;

        // Add medications
        if (data.medications && data.medications.length > 0) {
            htmlContent += '<h2>Current Medications</h2><table>';
            htmlContent += '<tr><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Instructions</th><th>Doctor</th><th>Pharmacy</th></tr>';
            data.medications.forEach((med: any) => {
                htmlContent += `<tr>
                    <td>${med.name}</td>
                    <td>${med.dosage || ''}</td>
                    <td>${med.frequency || ''}</td>
                    <td>${med.instructions || ''}</td>
                    <td>${med.prescribing_doctor || ''}</td>
                    <td>${med.pharmacy || ''}</td>
                </tr>`;
            });
            htmlContent += '</table>';
        }

        // Add medication logs
        if (data.medicationLogs && data.medicationLogs.length > 0) {
            htmlContent += '<h2>Medication Administration History</h2><table>';
            htmlContent += '<tr><th>Date & Time</th><th>Medication</th><th>Dosage Given</th><th>Given By</th><th>Notes</th></tr>';
            data.medicationLogs.forEach((log: any) => {
                const dateTime = new Date(log.administered_at);
                const givenBy = log.administered_by_profile?.display_name || `${log.administered_by_profile?.first_name} ${log.administered_by_profile?.last_name}`.trim();
                const dosage = log.dose_amount && log.dose_unit ? `${log.dose_amount} ${log.dose_unit}` : (log.dose_amount || '');
                htmlContent += `<tr>
                    <td>${formatDate(dateTime, 'MM/dd/yyyy h:mm a')}</td>
                    <td>${log.medications?.name || ''}</td>
                    <td>${dosage}</td>
                    <td>${givenBy}</td>
                    <td>${log.notes || ''}</td>
                </tr>`;
            });
            htmlContent += '</table>';
        }

        // Add food logs
        if (data.foodLogs && data.foodLogs.length > 0) {
            htmlContent += '<h2>Food & Nutrition Logs</h2><table>';
            htmlContent += '<tr><th>Date & Time</th><th>Type</th><th>Food</th><th>Portion Size</th><th>Calories</th><th>Notes</th></tr>';
            data.foodLogs.forEach((log: any) => {
                const dateTime = new Date(log.created_at);
                htmlContent += `<tr>
                    <td>${formatDate(dateTime, 'MM/dd/yyyy h:mm a')}</td>
                    <td>${log.meal_type || ''}</td>
                    <td>${log.food_name || ''}</td>
                    <td>${log.portion_size || ''}</td>
                    <td>${log.calories || ''}</td>
                    <td>${log.notes || ''}</td>
                </tr>`;
            });
            htmlContent += '</table>';
        }

        // Add mood logs
        if (data.moodLogs && data.moodLogs.length > 0) {
            htmlContent += '<h2>Mood & Mental Health Logs</h2><table>';
            htmlContent += '<tr><th>Date & Time</th><th>Mood</th><th>Mood Level</th><th>Energy Level</th><th>Sleep Quality</th><th>Stress Level</th><th>Pain Level</th><th>Notes</th></tr>';
            data.moodLogs.forEach((log: any) => {
                const dateTime = new Date(log.created_at);
                htmlContent += `<tr>
                    <td>${formatDate(dateTime, 'MM/dd/yyyy h:mm a')}</td>
                    <td>${log.mood_type || ''}</td>
                    <td>${log.mood_level || ''}</td>
                    <td>${log.energy_level || ''}</td>
                    <td>${log.sleep_quality || ''}</td>
                    <td>${log.stress_level || ''}</td>
                    <td>${log.pain_level || ''}</td>
                    <td>${log.notes || ''}</td>
                </tr>`;
            });
            htmlContent += '</table>';
        }

        // Add vitals
        if (data.vitals && data.vitals.length > 0) {
            htmlContent += '<h2>Health Vitals & Measurements</h2><table>';
            htmlContent += '<tr><th>Date & Time</th><th>Vital Type</th><th>Value</th><th>Unit</th><th>Recorded By</th><th>Notes</th></tr>';
            data.vitals.forEach((vital: any) => {
                const dateTime = new Date(vital.recorded_at);
                const recordedBy = vital.recorded_by_profile?.display_name || `${vital.recorded_by_profile?.first_name} ${vital.recorded_by_profile?.last_name}`.trim();

                htmlContent += `<tr>
                    <td>${formatDate(dateTime, 'MM/dd/yyyy h:mm a')}</td>
                    <td>${vital.vital_type || ''}</td>
                    <td>${vital.value || ''}</td>
                    <td>${vital.unit || ''}</td>
                    <td>${recordedBy}</td>
                    <td>${vital.notes || ''}</td>
                </tr>`;
            });
            htmlContent += '</table>';
        }

        // Add allergies
        if (data.allergies && data.allergies.length > 0) {
            htmlContent += '<h2>Known Allergies</h2><table>';
            htmlContent += '<tr><th>Allergen</th><th>Severity</th><th>Reaction</th><th>Notes</th></tr>';
            data.allergies.forEach((allergy: any) => {
                const severityClass = allergy.severity ? `severity-${allergy.severity}` : '';
                htmlContent += `<tr>
          <td>${allergy.allergen}</td>
          <td class="${severityClass}">${allergy.severity || ''}</td>
          <td>${allergy.reaction || ''}</td>
          <td>${allergy.notes || ''}</td>
        </tr>`;
            });
            htmlContent += '</table>';
        }

        htmlContent += '</body></html>';

        // Open in new window for printing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export Data
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Export Health Data</DialogTitle>
                    <DialogDescription>
                        Export comprehensive health records including medications, vitals, and care history for appointments, sharing with providers, or personal records.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label className="text-sm font-medium">Data to Export</Label>
                        <div className="space-y-2 mt-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="medications"
                                    checked={exportOptions.medications}
                                    onCheckedChange={(checked) =>
                                        setExportOptions(prev => ({ ...prev, medications: checked as boolean }))
                                    }
                                />
                                <Label htmlFor="medications">Current Medications</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="medication-logs"
                                    checked={exportOptions.medicationLogs}
                                    onCheckedChange={(checked) =>
                                        setExportOptions(prev => ({ ...prev, medicationLogs: checked as boolean }))
                                    }
                                />
                                <Label htmlFor="medication-logs">Medication Administration History</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="vitals"
                                    checked={exportOptions.vitals}
                                    onCheckedChange={(checked) =>
                                        setExportOptions(prev => ({ ...prev, vitals: checked as boolean }))
                                    }
                                />
                                <Label htmlFor="vitals">Health Vitals & Measurements</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="food-logs"
                                    checked={exportOptions.foodLogs}
                                    onCheckedChange={(checked) =>
                                        setExportOptions(prev => ({ ...prev, foodLogs: checked as boolean }))
                                    }
                                />
                                <Label htmlFor="food-logs">Food & Nutrition Logs</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="mood-logs"
                                    checked={exportOptions.moodLogs}
                                    onCheckedChange={(checked) =>
                                        setExportOptions(prev => ({ ...prev, moodLogs: checked as boolean }))
                                    }
                                />
                                <Label htmlFor="mood-logs">Mood & Mental Health Logs</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="allergies"
                                    checked={exportOptions.allergies}
                                    onCheckedChange={(checked) =>
                                        setExportOptions(prev => ({ ...prev, allergies: checked as boolean }))
                                    }
                                />
                                <Label htmlFor="allergies">Known Allergies</Label>
                            </div>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="date-range">Date Range</Label>
                        <Select value={dateRange} onValueChange={setDateRange}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="today">Today Only</SelectItem>
                                <SelectItem value="yesterday">Yesterday Only</SelectItem>
                                <SelectItem value="week">Last 7 Days</SelectItem>
                                <SelectItem value="month">Last 30 Days</SelectItem>
                                <SelectItem value="3months">Last 3 Months</SelectItem>
                                <SelectItem value="6months">Last 6 Months</SelectItem>
                                <SelectItem value="year">Last Year</SelectItem>
                                <SelectItem value="all">All Time</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="format">Export Format</Label>
                        <Select value={format} onValueChange={setFormat}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pdf">PDF (Printable)</SelectItem>
                                <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleExport}
                        disabled={loading || (!exportOptions.medications && !exportOptions.medicationLogs && !exportOptions.vitals && !exportOptions.allergies)}
                        className="gap-2"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                            <FileText className="h-4 w-4" />
                        )}
                        Export
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
