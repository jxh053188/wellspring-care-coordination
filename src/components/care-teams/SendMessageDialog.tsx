import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Loader2, Send, AlertTriangle, Paperclip, X, FileText, Image } from 'lucide-react';

interface SendMessageDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    careTeamId: string;
    onMessageSent: () => void;
}

export const SendMessageDialog = ({ open, onOpenChange, careTeamId, onMessageSent }: SendMessageDialogProps) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        content: '',
        messageType: 'text' as 'text' | 'alert' | 'announcement' | 'update',
    });

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            setFormData({
                content: '',
                messageType: 'text',
            });
            setSelectedFile(null);
            setUploadingFile(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.content.trim()) {
            toast({
                title: "Error",
                description: "Please enter a message",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            // Get user's profile ID
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user!.id)
                .single();

            if (profileError || !profile) {
                throw new Error('Could not find your profile');
            }

            // Handle file upload if present
            let messageId = null;
            
            // Create message first
            const { data: messageData, error: messageError } = await supabase
                .from('messages')
                .insert({
                    care_team_id: careTeamId,
                    author_id: profile.id,
                    content: formData.content.trim(),
                    message_type: formData.messageType,
                })
                .select('id')
                .single();

            if (messageError) throw messageError;
            messageId = messageData.id;

            // Upload file if present
            if (selectedFile) {
                setUploadingFile(true);
                
                // Generate unique filename
                const fileExt = selectedFile.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `message-attachments/${fileName}`;

                // Upload file to Supabase storage
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('message-attachments')
                    .upload(filePath, selectedFile);

                if (uploadError) {
                    throw new Error(`Failed to upload file: ${uploadError.message}`);
                }

                // Determine file type
                const fileType = selectedFile.type.startsWith('image/') 
                    ? 'image' 
                    : selectedFile.type.includes('pdf') || selectedFile.type.includes('document')
                    ? 'document' 
                    : 'other';

                // Create attachment record
                const { error: attachmentError } = await supabase
                    .from('message_attachments')
                    .insert({
                        message_id: messageId,
                        file_name: selectedFile.name,
                        file_size: selectedFile.size,
                        file_type: fileType,
                        mime_type: selectedFile.type,
                        storage_path: filePath,
                        uploaded_by: profile.id,
                    });

                if (attachmentError) {
                    throw new Error(`Failed to save attachment: ${attachmentError.message}`);
                }

                setUploadingFile(false);
            }

            toast({
                title: "Message Sent",
                description: selectedFile 
                    ? "Your message and file have been sent to the care team."
                    : "Your message has been sent to the care team.",
            });

            // Reset form
            setFormData({ content: '', messageType: 'text' });
            setSelectedFile(null);
            setUploadingFile(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            
            onMessageSent();
            onOpenChange(false);
        } catch (error) {
            console.error('Error sending message:', error);
            toast({
                title: "Error",
                description: "Failed to send message. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Check file size (10MB limit)
            if (file.size > 10 * 1024 * 1024) {
                toast({
                    title: "File too large",
                    description: "Please select a file smaller than 10MB.",
                    variant: "destructive",
                });
                return;
            }
            setSelectedFile(file);
        }
    };

    const removeFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getMessageTypeColor = (type: string) => {
        switch (type) {
            case 'alert': return 'text-red-600';
            case 'announcement': return 'text-blue-600';
            case 'update': return 'text-green-600';
            case 'text': return 'text-gray-600';
            default: return 'text-gray-600';
        }
    };

    const getMessageTypeIcon = (type: string) => {
        switch (type) {
            case 'alert': return '🚨';
            case 'announcement': return '📢';
            case 'update': return '💚';
            case 'text': return '💬';
            default: return '💬';
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-[#00a9ff]" />
                        Send Message
                    </DialogTitle>
                    <DialogDescription>
                        Send a quick message to your care team members.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Message Type Selection */}
                    <div>
                        <Label htmlFor="messageType">Message Type</Label>
                        <Select 
                            value={formData.messageType} 
                            onValueChange={(value: 'text' | 'alert' | 'announcement' | 'update') => 
                                setFormData(prev => ({ ...prev, messageType: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="text">
                                    <span className="text-gray-600">� General Message</span>
                                </SelectItem>
                                <SelectItem value="announcement">
                                    <span className="text-blue-600">� Announcement</span>
                                </SelectItem>
                                <SelectItem value="update">
                                    <span className="text-green-600">💚 Health Update</span>
                                </SelectItem>
                                <SelectItem value="alert">
                                    <span className="text-red-600">🚨 Alert</span>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Message Content */}
                    <div>
                        <Label htmlFor="content">Message *</Label>
                        <Textarea
                            id="content"
                            placeholder="Type your message here..."
                            value={formData.content}
                            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                            rows={4}
                            required
                            className="resize-none"
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                            {formData.content.length}/1000 characters
                        </div>
                    </div>

                    {/* File Attachment */}
                    <div>
                        <Label>File Attachment (Optional)</Label>
                        <div className="space-y-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                onChange={handleFileSelect}
                                className="hidden"
                                accept="image/*,.pdf,.doc,.docx,.txt"
                            />
                            
                            {!selectedFile ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full"
                                >
                                    <Paperclip className="h-4 w-4 mr-2" />
                                    Attach File
                                </Button>
                            ) : (
                                <div className="flex items-center gap-2 p-2 border rounded-md bg-gray-50">
                                    {selectedFile.type.startsWith('image/') ? (
                                        <Image className="h-4 w-4 text-blue-600" />
                                    ) : (
                                        <FileText className="h-4 w-4 text-blue-600" />
                                    )}
                                    <span className="flex-1 text-sm truncate">{selectedFile.name}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={removeFile}
                                        className="h-6 w-6 p-0"
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Preview */}
                    {formData.content.trim() && (
                        <div className="border rounded-lg p-3 bg-muted/50">
                            <div className="text-xs text-muted-foreground mb-1">Preview:</div>
                            <div className="text-sm">
                                <span className={`font-medium ${getMessageTypeColor(formData.messageType)}`}>
                                    {getMessageTypeIcon(formData.messageType)} {formData.messageType.charAt(0).toUpperCase() + formData.messageType.slice(1)}
                                </span>
                                <p className="mt-1">{formData.content}</p>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={loading || uploadingFile || !formData.content.trim()}
                            className="bg-[#00a9ff] hover:bg-[#00a9ff]/90"
                        >
                            {loading || uploadingFile ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {uploadingFile ? 'Uploading...' : 'Sending...'}
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Send Message
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
