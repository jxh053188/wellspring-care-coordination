import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    MessageSquare,
    Send,
    Paperclip,
    Image,
    FileText,
    Heart,
    ThumbsUp,
    MoreVertical,
    Pin,
    AlertTriangle,
    Reply,
    Download,
    Trash2,
    Edit
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';

interface MessageAttachment {
    id: string;
    file_name: string;
    file_size: number;
    file_type: string;
    mime_type: string;
    storage_path: string;
}

interface MessageReaction {
    id: string;
    reaction_type: string;
    user_id: string;
    profiles: {
        first_name: string;
        last_name: string;
    };
}

interface Message {
    id: string;
    content: string;
    message_type: string;
    parent_id: string | null;
    created_at: string;
    updated_at: string;
    is_pinned: boolean;
    is_urgent: boolean;
    author: {
        id: string;
        first_name: string;
        last_name: string;
        avatar_url: string | null;
    };
    attachments: MessageAttachment[];
    reactions: MessageReaction[];
    replies: Message[];
    reply_count: number;
}

interface MessagesProps {
    careTeamId: string;
    careTeamName: string;
}

export const Messages = ({ careTeamId, careTeamName }: MessagesProps) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [messageType, setMessageType] = useState<'message' | 'update' | 'alert' | 'announcement'>('message');
    const [replyTo, setReplyTo] = useState<Message | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [showFileDialog, setShowFileDialog] = useState(false);
    const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
    const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);

    const fetchMessages = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select(`
                    *,
                    author:profiles!author_id (
                        id,
                        first_name,
                        last_name,
                        avatar_url
                    ),
                    attachments:message_attachments (*),
                    reactions:message_reactions (
                        *,
                        profiles (first_name, last_name)
                    )
                `)
                .eq('care_team_id', careTeamId)
                .is('parent_id', null) // Only fetch top-level messages
                .order('is_pinned', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Fetch replies for each message
            const messagesWithReplies = await Promise.all(
                (data || []).map(async (message) => {
                    const { data: replies, error: repliesError } = await supabase
                        .from('messages')
                        .select(`
                            *,
                            author:profiles!author_id (
                                id,
                                first_name,
                                last_name,
                                avatar_url
                            ),
                            attachments:message_attachments (*),
                            reactions:message_reactions (
                                *,
                                profiles (first_name, last_name)
                            )
                        `)
                        .eq('parent_id', message.id)
                        .order('created_at', { ascending: true });

                    if (repliesError) {
                        console.error('Error fetching replies:', repliesError);
                        return { ...message, replies: [], reply_count: 0 };
                    }

                    // Ensure each reply conforms to Message type
                    const formattedReplies = (replies || []).map((reply: any) => ({
                        ...reply,
                        replies: [],
                        reply_count: 0
                    }));

                    return {
                        ...message,
                        replies: formattedReplies,
                        reply_count: formattedReplies.length
                    };
                })
            );

            setMessages(messagesWithReplies as Message[]);
        } catch (error) {
            console.error('Error fetching messages:', error);
            toast({
                title: "Error",
                description: "Failed to load messages",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [careTeamId, toast]);

    // Then use it in useEffect
    useEffect(() => {
        fetchMessages();

        // Set up real-time subscription
        const channel = supabase
            .channel(`messages:${careTeamId}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'messages', filter: `care_team_id=eq.${careTeamId}` },
                () => fetchMessages()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [careTeamId, fetchMessages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() && selectedFiles.length === 0) return;

        try {
            // Get current user's profile
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user!.id)
                .single();

            if (profileError || !profile) {
                throw new Error('Could not find your profile');
            }

            console.log('Sending message with profile:', profile.id);

            // Create the message
            const messageData = {
                care_team_id: careTeamId,
                author_id: profile.id,
                content: newMessage.trim() || '[Attachment]',
                message_type: messageType,
                parent_id: replyTo?.id || null,
                is_urgent: messageType === 'alert'
            };

            console.log('Creating message:', messageData);

            const { data: messageResult, error: messageError } = await supabase
                .from('messages')
                .insert(messageData)
                .select()
                .single();

            if (messageError) {
                console.error('Message creation error:', messageError);
                throw messageError;
            }

            console.log('Message created:', messageResult);

            // Upload attachments if any
            if (selectedFiles.length > 0 && messageResult) {
                console.log('Uploading attachments for message:', messageResult.id);
                await uploadAttachments(messageResult.id, selectedFiles);
            }

            // Clear form
            setNewMessage('');
            setSelectedFiles([]);
            setMessageType('message');
            setReplyTo(null);

            toast({
                title: "Success",
                description: "Message sent successfully",
            });

            // Refresh messages to show the new message
            await fetchMessages();
        } catch (error) {
            console.error('Error sending message:', error);
            toast({
                title: "Error",
                description: `Failed to send message: ${error.message || 'Unknown error'}`,
                variant: "destructive",
            });
        }
    };

    const uploadAttachments = async (messageId: string, files: File[]) => {
        console.log('Starting upload for files:', files.map(f => f.name));

        // First ensure user is authenticated
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
            console.error('User is not authenticated');
            toast({
                title: "Authentication Error",
                description: "You must be logged in to upload files",
                variant: "destructive",
            });
            return;
        }

        console.log('User is authenticated, proceeding with upload. Session:', session.session.access_token.slice(0, 10) + '...');
        console.log('User ID:', user?.id);

        // Enhanced diagnostics for RLS debugging
        console.log('--- DETAILED AUTHENTICATION DIAGNOSTICS ---');

        // Check user authentication details
        const { data: { user: authUser } } = await supabase.auth.getUser();
        console.log('Auth user details:', {
            id: authUser?.id,
            email: authUser?.email,
            app_metadata: authUser?.app_metadata,
            aud: authUser?.aud,
            role: authUser?.role
        });

        // Check bucket existence and settings
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        if (bucketsError) {
            console.error('Error listing buckets:', bucketsError);
        } else {
            const messageBucket = buckets.find(b => b.name === 'message-attachments');
            console.log('Bucket info:', messageBucket);

            // Try to list files in the bucket to test read access
            const { data: files, error: filesError } = await supabase.storage
                .from('message-attachments')
                .list();

            if (filesError) {
                console.error('Cannot list files in bucket (may be RLS restricted):', filesError);
            } else {
                console.log('Successfully listed files in bucket (read access works):', files?.length || 0, 'files');
            }
        }

        console.log('--- END DIAGNOSTICS ---');

        for (const file of files) {
            try {
                // Create a path that aligns with Supabase RLS expectations
                // Using auth.uid() as the first folder component is standard practice for Supabase RLS
                const fileExt = file.name.split('.').pop();
                const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                const timestamp = Date.now();
                // Use the actual auth user ID as the prefix - this is what RLS expects
                const { data: { user: authUser } } = await supabase.auth.getUser();
                const fileName = `${authUser.id}/${timestamp}-${sanitizedFileName}`;

                // Store this mapping so we can retrieve files later
                console.log(`File path mapping: message ${messageId} -> storage path ${fileName}`);

                console.log('Uploading file to path:', fileName);

                let uploadSuccessful = false;
                let uploadData = null;

                try {
                    // First attempt: Try with normal upload
                    console.log('--- DETAILED UPLOAD ATTEMPT ---');
                    console.log(`Uploading to bucket: message-attachments, path: ${fileName}`);
                    console.log('File details:', {
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        lastModified: new Date(file.lastModified).toISOString()
                    });

                    // Check if we can get the bucket URL (permissions check)
                    const { data: publicUrl } = supabase.storage.from('message-attachments').getPublicUrl('test.txt');
                    console.log('Public bucket URL:', publicUrl);

                    // Try getting the bucket policy
                    try {
                        // This is a direct attempt to see if permissions might be an issue
                        // Attempting upload with detailed logging
                        console.log('Attempting upload with full options...');
                        const uploadResult = await supabase.storage
                            .from('message-attachments')
                            .upload(fileName, file, {
                                contentType: file.type,
                                cacheControl: '3600',
                                upsert: true
                            });

                        console.log('Upload response received:', uploadResult);

                        if (uploadResult.error) {
                            console.error('Storage upload error details:', {
                                message: uploadResult.error.message,
                                name: uploadResult.error.name,
                                // Include the full error for debugging
                                fullError: JSON.stringify(uploadResult.error)
                            });

                            // If it's an RLS error, show a helpful message
                            if (uploadResult.error.message && uploadResult.error.message.includes('violates row-level security policy')) {
                                console.log('RLS policy violation detected. Current auth state:', !!session.session);

                                toast({
                                    title: "Storage Permission Error",
                                    description: "File upload is currently disabled due to storage permissions. The message will be saved without the attachment.",
                                    variant: "destructive",
                                    duration: 8000,
                                });
                                
                                // Continue without the file upload - just save the message
                                console.log('Continuing without file upload due to RLS policy issue');
                                return; // Skip the rest of the upload process for this file
                            } else {
                                throw uploadResult.error;
                            }
                        } else {
                            console.log('File upload succeeded with data:', uploadResult.data);
                            uploadSuccessful = true;
                            uploadData = uploadResult.data;
                        }
                    } catch (err) {
                        console.error('Exception during upload process:', err);
                    }

                    console.log('--- END UPLOAD ATTEMPT ---');
                } catch (uploadErr) {
                    console.error('Upload attempt failed:', uploadErr);
                    // Continue execution - we'll create a message record without the actual file
                }

                // Get user profile for uploaded_by field
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('user_id', user!.id)
                    .single();

                if (profileError || !profile) {
                    console.error('Profile fetch error:', profileError);
                    throw new Error('Could not find user profile');
                }

                console.log('User profile found:', profile.id);

                // Create attachment record based on upload success
                const attachmentData = {
                    message_id: messageId,
                    file_name: uploadSuccessful ? file.name : `[UPLOAD FAILED] ${file.name}`,
                    file_size: file.size,
                    file_type: file.type.startsWith('image/') ? 'image' : 'document',
                    mime_type: file.type,
                    storage_path: uploadSuccessful ? fileName : 'upload_failed',
                    uploaded_by: profile.id
                };

                console.log('Inserting attachment record:', attachmentData);

                const { data: attachmentResult, error: attachmentError } = await supabase
                    .from('message_attachments')
                    .insert(attachmentData)
                    .select()
                    .single();

                if (attachmentError) {
                    console.error('Attachment DB insert error:', attachmentError);

                    if (attachmentError.message && attachmentError.message.includes('foreign key constraint')) {
                        console.error('Foreign key error - might be an issue with the message_id or uploaded_by reference');
                    }

                    throw attachmentError;
                }

                console.log('Attachment record created:', attachmentResult);

            } catch (error) {
                console.error('Error uploading attachment:', error);
                toast({
                    title: "Warning",
                    description: `Failed to upload ${file.name}: ${error.message || 'Unknown error'}`,
                    variant: "destructive",
                });
            }
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        setSelectedFiles(prev => [...prev, ...files]);
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const toggleReaction = async (messageId: string, reactionType: string) => {
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user!.id)
                .single();

            if (!profile) return;

            // Check if user already reacted
            const { data: existingReaction } = await supabase
                .from('message_reactions')
                .select('id')
                .eq('message_id', messageId)
                .eq('user_id', profile.id)
                .eq('reaction_type', reactionType)
                .single();

            if (existingReaction) {
                // Remove reaction
                await supabase
                    .from('message_reactions')
                    .delete()
                    .eq('id', existingReaction.id);
            } else {
                // Add reaction
                await supabase
                    .from('message_reactions')
                    .insert({
                        message_id: messageId,
                        user_id: profile.id,
                        reaction_type: reactionType
                    });
            }

            fetchMessages();
        } catch (error) {
            console.error('Error toggling reaction:', error);
        }
    };

    const downloadAttachment = async (attachment: MessageAttachment) => {
        try {
            const { data, error } = await supabase.storage
                .from('message-attachments')
                .download(attachment.storage_path);

            if (error) throw error;

            const url = URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = attachment.file_name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading attachment:', error);
            toast({
                title: "Error",
                description: "Failed to download attachment",
                variant: "destructive",
            });
        }
    };

    const getAttachmentUrl = async (attachment: MessageAttachment) => {
        try {
            const { data, error } = await supabase.storage
                .from('message-attachments')
                .createSignedUrl(attachment.storage_path, 3600); // 1 hour expiry

            if (error) throw error;
            return data.signedUrl;
        } catch (error) {
            console.error('Error getting attachment URL:', error);
            return null;
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getMessageTypeColor = (type: string) => {
        switch (type) {
            case 'alert': return 'bg-red-100 text-red-800';
            case 'announcement': return 'bg-blue-100 text-blue-800';
            case 'update': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getMessageTypeIcon = (type: string) => {
        switch (type) {
            case 'alert': return <AlertTriangle className="h-3 w-3" />;
            case 'announcement': return <MessageSquare className="h-3 w-3" />;
            case 'update': return <Heart className="h-3 w-3" />;
            default: return <MessageSquare className="h-3 w-3" />;
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="text-center py-12">
                    <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Loading Messages...</h3>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with New Message Button */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold">Team Messages</h3>
                    <p className="text-sm text-muted-foreground">
                        Activity feed and communications for {careTeamName}
                    </p>
                </div>
                <Dialog open={showNewMessageDialog} onOpenChange={setShowNewMessageDialog}>
                    <DialogTrigger asChild>
                        <Button>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            New Message
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>
                                {replyTo ? `Reply to ${replyTo.author.first_name}` : 'New Message'}
                            </DialogTitle>
                            <DialogDescription>
                                {replyTo
                                    ? `Replying to: ${replyTo.content.slice(0, 100)}...`
                                    : `Send a message to the ${careTeamName} team`
                                }
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            {replyTo && (
                                <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                                    <strong>{replyTo.author.first_name}:</strong> {replyTo.content.slice(0, 150)}...
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="ml-2"
                                        onClick={() => setReplyTo(null)}
                                    >
                                        Cancel Reply
                                    </Button>
                                </div>
                            )}

                            <Select value={messageType} onValueChange={(value: 'message' | 'update' | 'alert' | 'announcement') => setMessageType(value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Message type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="message">Message</SelectItem>
                                    <SelectItem value="update">Update</SelectItem>
                                    <SelectItem value="alert">Alert</SelectItem>
                                    <SelectItem value="announcement">Announcement</SelectItem>
                                </SelectContent>
                            </Select>

                            <Textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your message..."
                                rows={4}
                            />

                            {/* File attachments */}
                            {selectedFiles.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Attachments:</p>
                                    {selectedFiles.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                                            <div className="flex items-center gap-2">
                                                {file.type.startsWith('image/') ?
                                                    <Image className="h-4 w-4" /> :
                                                    <FileText className="h-4 w-4" />
                                                }
                                                <span className="text-sm">{file.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    ({formatFileSize(file.size)})
                                                </span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeFile(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <DialogFooter className="gap-2">
                            <Button
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Paperclip className="h-4 w-4 mr-2" />
                                Attach File
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                hidden
                                onChange={handleFileSelect}
                                accept="image/*,.pdf,.doc,.docx,.txt"
                            />
                            <Button
                                onClick={() => {
                                    handleSendMessage();
                                    setShowNewMessageDialog(false);
                                }}
                                disabled={!newMessage.trim() && selectedFiles.length === 0}
                            >
                                <Send className="h-4 w-4 mr-2" />
                                Send Message
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Messages List - Front and Center */}
            <div className="space-y-4">
                {messages.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center py-12">
                                <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                <h4 className="text-lg font-semibold mb-2">No Messages Yet</h4>
                                <p className="text-muted-foreground mb-4">
                                    Start the conversation by sending the first message to your team.
                                </p>
                                <Button onClick={() => setShowNewMessageDialog(true)}>
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Send First Message
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    messages.map((message) => (
                        <MessageCard
                            key={message.id}
                            message={message}
                            onReply={(msg) => {
                                setReplyTo(msg);
                                setShowNewMessageDialog(true);
                            }}
                            onReaction={toggleReaction}
                            onDownload={downloadAttachment}
                            isExpanded={expandedMessage === message.id}
                            onToggleExpand={() => setExpandedMessage(
                                expandedMessage === message.id ? null : message.id
                            )}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

interface MessageCardProps {
    message: Message;
    onReply: (message: Message) => void;
    onReaction: (messageId: string, reactionType: string) => void;
    onDownload: (attachment: MessageAttachment) => void;
    isExpanded: boolean;
    onToggleExpand: () => void;
}

interface AttachmentPreviewProps {
    attachment: MessageAttachment;
    onDownload: (attachment: MessageAttachment) => void;
}

const AttachmentPreview = ({ attachment, onDownload }: AttachmentPreviewProps) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const loadImagePreview = useCallback(async () => {
        if (attachment.file_type === 'image' && !imageUrl) {
            setLoading(true);
            try {
                const { data, error } = await supabase.storage
                    .from('message-attachments')
                    .createSignedUrl(attachment.storage_path, 3600);

                if (error) throw error;
                setImageUrl(data.signedUrl);
            } catch (error) {
                console.error('Error loading image preview:', error);
            } finally {
                setLoading(false);
            }
        }
    }, [attachment.file_type, attachment.storage_path, imageUrl]);

    useEffect(() => {
        loadImagePreview();
    }, [attachment.id, loadImagePreview]);

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (attachment.file_type === 'image' && imageUrl) {
        return (
            <div className="space-y-2">
                <div className="relative group">
                    <img
                        src={imageUrl}
                        alt={attachment.file_name}
                        className="max-w-full max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => onDownload(attachment)}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                        <Download className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{attachment.file_name}</span>
                    <span>({formatFileSize(attachment.file_size)})</span>
                </div>
            </div>
        );
    }

    return (
        <div
            className="flex items-center justify-between bg-muted p-3 rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
            onClick={() => onDownload(attachment)}
        >
            <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded">
                    {attachment.file_type === 'image' ? (
                        loading ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                        ) : (
                            <Image className="h-4 w-4" />
                        )
                    ) : (
                        <FileText className="h-4 w-4" />
                    )}
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-medium">{attachment.file_name}</span>
                    <span className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.file_size)} • {attachment.mime_type}
                    </span>
                </div>
            </div>
            <Download className="h-4 w-4 text-muted-foreground" />
        </div>
    );
};

const MessageCard = ({ message, onReply, onReaction, onDownload, isExpanded, onToggleExpand }: MessageCardProps) => {
    const getMessageTypeColor = (type: string) => {
        switch (type) {
            case 'alert': return 'bg-red-100 text-red-800';
            case 'announcement': return 'bg-blue-100 text-blue-800';
            case 'update': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getMessageTypeIcon = (type: string) => {
        switch (type) {
            case 'alert': return <AlertTriangle className="h-3 w-3" />;
            case 'announcement': return <MessageSquare className="h-3 w-3" />;
            case 'update': return <Heart className="h-3 w-3" />;
            default: return <MessageSquare className="h-3 w-3" />;
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <Card className={`${message.is_pinned ? 'ring-2 ring-blue-200' : ''} ${message.is_urgent ? 'ring-2 ring-red-200' : ''}`}>
            <CardContent className="pt-6">
                <div className="space-y-3">
                    {/* Message Header */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={message.author.avatar_url || undefined} />
                                <AvatarFallback>
                                    {message.author.first_name[0]}{message.author.last_name[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">
                                        {message.author.first_name} {message.author.last_name}
                                    </span>
                                    <Badge variant="secondary" className={`text-xs ${getMessageTypeColor(message.message_type)}`}>
                                        {getMessageTypeIcon(message.message_type)}
                                        <span className="ml-1 capitalize">{message.message_type}</span>
                                    </Badge>
                                    {message.is_pinned && <Pin className="h-3 w-3 text-blue-600" />}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                                </p>
                            </div>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => onReply(message)}>
                                    <Reply className="h-4 w-4 mr-2" />
                                    Reply
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Message Content */}
                    <div className="text-sm">
                        {message.content}
                    </div>

                    {/* Attachments */}
                    {message.attachments.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-xs font-medium text-muted-foreground">
                                {message.attachments.length === 1 ? 'Attachment:' : 'Attachments:'}
                            </p>
                            <div className="grid gap-3">
                                {message.attachments.map((attachment) => (
                                    <AttachmentPreview
                                        key={attachment.id}
                                        attachment={attachment}
                                        onDownload={onDownload}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Reactions */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onReaction(message.id, 'like')}
                            className="h-6 px-2"
                        >
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            <span className="text-xs">
                                {message.reactions.filter(r => r.reaction_type === 'like').length}
                            </span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onReaction(message.id, 'heart')}
                            className="h-6 px-2"
                        >
                            <Heart className="h-3 w-3 mr-1" />
                            <span className="text-xs">
                                {message.reactions.filter(r => r.reaction_type === 'heart').length}
                            </span>
                        </Button>
                    </div>

                    {/* Replies */}
                    {message.reply_count > 0 && (
                        <div className="border-t pt-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onToggleExpand}
                                className="text-xs text-blue-600 hover:text-blue-800"
                            >
                                {isExpanded ? 'Hide' : 'Show'} {message.reply_count} {message.reply_count === 1 ? 'reply' : 'replies'}
                            </Button>

                            {isExpanded && (
                                <div className="mt-3 space-y-3 pl-4 border-l-2 border-muted">
                                    {message.replies.map((reply) => (
                                        <div key={reply.id} className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={reply.author.avatar_url || undefined} />
                                                    <AvatarFallback className="text-xs">
                                                        {reply.author.first_name[0]}{reply.author.last_name[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs font-medium">
                                                    {reply.author.first_name} {reply.author.last_name}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <div className="text-sm pl-8">
                                                {reply.content}
                                            </div>
                                            {reply.attachments.length > 0 && (
                                                <div className="pl-8 space-y-2">
                                                    {reply.attachments.map((attachment) => (
                                                        <AttachmentPreview
                                                            key={attachment.id}
                                                            attachment={attachment}
                                                            onDownload={onDownload}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

