import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format as formatDate, subDays, subWeeks, subMonths } from 'date-fns';

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

            // Calculate date range
            switch (dateRange) {
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
                    .eq('medications.care_team_id', careTeamId);

                if (startDate) {
                    query.gte('administered_at', startDate.toISOString());
                }

                const { data: logs, error: logsError } = await query;
                if (logsError) throw logsError;
                data.medicationLogs = logs;
            }

            // Fetch vitals
            if (exportOptions.vitals) {
                const query = supabase
                    .from('health_vitals')
                    .select(`
            *,
            profiles (display_name, first_name, last_name)
          `)
                    .eq('care_team_id', careTeamId);

                if (startDate) {
                    query.gte('recorded_at', startDate.toISOString());
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
            csvContent += 'Medication Log\n';
            csvContent += 'Date,Time,Medication,Dosage,Given By,Notes\n';
            data.medicationLogs.forEach((log: any) => {
                const dateTime = new Date(log.administered_at);
                const givenBy = log.administered_by_profile?.display_name || `${log.administered_by_profile?.first_name} ${log.administered_by_profile?.last_name}`.trim();
                csvContent += `"${formatDate(dateTime, 'MM/dd/yyyy')}","${formatDate(dateTime, 'h:mm a')}","${log.medications?.name || ''}","${log.dose_amount || ''}","${givenBy}","${log.notes || ''}"\n`;
            });
            csvContent += '\n';
        }

        // Add vitals
        if (data.vitals && data.vitals.length > 0) {
            csvContent += 'Health Vitals\n';
            csvContent += 'Date,Time,Weight,Blood Pressure,Heart Rate,Temperature,Blood Sugar,Oxygen Saturation,Recorded By,Notes\n';
            data.vitals.forEach((vital: any) => {
                const dateTime = new Date(vital.recorded_at);
                const recordedBy = vital.profiles?.display_name || `${vital.profiles?.first_name} ${vital.profiles?.last_name}`.trim();
                const bp = vital.blood_pressure_systolic && vital.blood_pressure_diastolic
                    ? `${vital.blood_pressure_systolic}/${vital.blood_pressure_diastolic}`
                    : '';
                const weight = vital.weight ? `${vital.weight} ${vital.weight_unit}` : '';
                const temp = vital.temperature ? `${vital.temperature}°${vital.temperature_unit}` : '';

                csvContent += `"${formatDate(dateTime, 'MM/dd/yyyy')}","${formatDate(dateTime, 'h:mm a')}","${weight}","${bp}","${vital.heart_rate || ''}","${temp}","${vital.blood_sugar || ''}","${vital.oxygen_saturation || ''}","${recordedBy}","${vital.notes || ''}"\n`;
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
            htmlContent += '<tr><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Instructions</th><th>Doctor</th></tr>';
            data.medications.forEach((med: any) => {
                htmlContent += `<tr>
          <td>${med.name}</td>
          <td>${med.dosage || ''}</td>
          <td>${med.frequency || ''}</td>
          <td>${med.instructions || ''}</td>
          <td>${med.prescribing_doctor || ''}</td>
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
                        Choose what data to export and in what format for appointments or sharing.
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
                                <Label htmlFor="medication-logs">Medication History</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="vitals"
                                    checked={exportOptions.vitals}
                                    onCheckedChange={(checked) =>
                                        setExportOptions(prev => ({ ...prev, vitals: checked as boolean }))
                                    }
                                />
                                <Label htmlFor="vitals">Health Vitals</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="allergies"
                                    checked={exportOptions.allergies}
                                    onCheckedChange={(checked) =>
                                        setExportOptions(prev => ({ ...prev, allergies: checked as boolean }))
                                    }
                                />
                                <Label htmlFor="allergies">Allergies</Label>
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
                                <SelectItem value="all">All Time</SelectItem>
                                <SelectItem value="week">Last Week</SelectItem>
                                <SelectItem value="month">Last Month</SelectItem>
                                <SelectItem value="3months">Last 3 Months</SelectItem>
                                <SelectItem value="6months">Last 6 Months</SelectItem>
                                <SelectItem value="year">Last Year</SelectItem>
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
