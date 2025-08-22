import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSimpleAuth } from '@/hooks/useSimpleAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Send, Reply, ChevronDown, ChevronUp, Edit, Trash2 } from 'lucide-react';

interface MessageReply {
  id: string;
  message_id: string;
  parent_reply_id: string | null;
  author_name: string;
  author_email: string;
  reply_text: string;
  created_at: string;
  author_id: string | null;
}

interface Message {
  id: string;
  author_name: string;
  author_email: string;
  message_text: string;
  message_type: string;
  created_at: string;
  replies?: MessageReply[];
}

export default function MessageBoard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState('suggestion');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editType, setEditType] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  
  const { user } = useAuth();
  const { member } = useSimpleAuth();

  useEffect(() => {
    fetchMessages();
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(data?.is_admin || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const fetchMessages = async () => {
    try {
      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Fetch replies for all messages
      const { data: repliesData, error: repliesError } = await supabase
        .from('message_replies')
        .select('*')
        .order('created_at', { ascending: true });

      if (repliesError) throw repliesError;

      // Group replies by message_id
      const repliesByMessage = (repliesData || []).reduce((acc, reply) => {
        if (!acc[reply.message_id]) {
          acc[reply.message_id] = [];
        }
        acc[reply.message_id].push(reply);
        return acc;
      }, {} as Record<string, MessageReply[]>);

      // Combine messages with their replies
      const messagesWithReplies = (messagesData || []).map(message => ({
        ...message,
        replies: repliesByMessage[message.id] || []
      }));

      setMessages(messagesWithReplies);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message.",
        variant: "destructive",
      });
      return;
    }

    if (!user && !member) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to post a message.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const messageData = {
        message_text: newMessage.trim(),
        message_type: messageType,
        author_name: user?.user_metadata?.display_name || member?.displayName || 'Anonymous',
        author_email: user?.email || member?.email || '',
        author_id: user?.id || null,
      };

      const { error } = await supabase
        .from('messages')
        .insert([messageData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your message has been posted!",
      });

      setNewMessage('');
      setMessageType('suggestion');
      fetchMessages(); // Refresh messages
    } catch (error) {
      console.error('Error posting message:', error);
      toast({
        title: "Error",
        description: "Failed to post message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (messageId: string) => {
    if (!replyText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reply.",
        variant: "destructive",
      });
      return;
    }

    if (!user && !member) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to reply.",
        variant: "destructive",
      });
      return;
    }

    setSubmittingReply(true);

    try {
      const replyData = {
        message_id: messageId,
        reply_text: replyText.trim(),
        author_name: user?.user_metadata?.display_name || member?.displayName || 'Anonymous',
        author_email: user?.email || member?.email || '',
        author_id: user?.id || null,
      };

      const { error } = await supabase
        .from('message_replies')
        .insert([replyData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your reply has been posted!",
      });

      setReplyText('');
      setReplyingTo(null);
      // Expand the message to show the new reply
      setExpandedMessages(prev => new Set([...prev, messageId]));
      fetchMessages(); // Refresh messages
    } catch (error) {
      console.error('Error posting reply:', error);
      toast({
        title: "Error",
        description: "Failed to post reply. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingReply(false);
    }
  };

  const toggleExpanded = (messageId: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .update({
          message_text: editText.trim(),
          message_type: editType,
        })
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Message updated successfully!",
      });

      setEditingMessage(null);
      setEditText('');
      setEditType('');
      fetchMessages();
    } catch (error) {
      console.error('Error updating message:', error);
      toast({
        title: "Error",
        description: "Failed to update message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Message deleted successfully!",
      });

      fetchMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const startEditingMessage = (message: Message) => {
    setEditingMessage(message.id);
    setEditText(message.message_text);
    setEditType(message.message_type);
  };

  const getMessageTypeLabel = (type: string) => {
    switch (type) {
      case 'suggestion': return 'Suggestion';
      case 'feedback': return 'Feedback';
      case 'question': return 'Question';
      case 'general': return 'General';
      default: return 'Message';
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'suggestion': return 'bg-blue-100 text-blue-800';
      case 'feedback': return 'bg-green-100 text-green-800';
      case 'question': return 'bg-yellow-100 text-yellow-800';
      case 'general': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading messages...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <MessageCircle className="h-8 w-8" />
          Message Board
        </h1>
        <p className="text-muted-foreground">
          Share your suggestions, feedback, and questions with the community.
        </p>
      </div>

      {/* Post new message form */}
      {(user || member) && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Post a Message</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Select value={messageType} onValueChange={setMessageType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select message type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="suggestion">Suggestion</SelectItem>
                    <SelectItem value="feedback">Feedback</SelectItem>
                    <SelectItem value="question">Question</SelectItem>
                    <SelectItem value="general">General Discussion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="min-h-[100px] resize-none"
                  maxLength={1000}
                />
                <div className="text-sm text-muted-foreground mt-1 text-right">
                  {newMessage.length}/1000
                </div>
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? (
                  "Posting..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Post Message
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {!user && !member && (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Please sign in to post messages on the message board.
              </p>
              <Button onClick={() => window.location.href = '/'}>
                Go to Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messages list */}
      <div className="space-y-4">
        {messages.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No messages yet. Be the first to start the conversation!</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          messages.map((message) => (
            <Card key={message.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="font-medium">{message.author_name}</div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMessageTypeColor(message.message_type)}`}>
                      {getMessageTypeLabel(message.message_type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditingMessage(message)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMessage(message.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>

                {editingMessage === message.id ? (
                  <div className="space-y-4 mb-4">
                    <Select value={editType} onValueChange={setEditType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select message type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="suggestion">Suggestion</SelectItem>
                        <SelectItem value="feedback">Feedback</SelectItem>
                        <SelectItem value="question">Question</SelectItem>
                        <SelectItem value="general">General Discussion</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      placeholder="Edit your message..."
                      className="min-h-[100px] resize-none"
                      maxLength={1000}
                    />
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        {editText.length}/1000
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingMessage(null);
                            setEditText('');
                            setEditType('');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleEditMessage(message.id)}
                          disabled={!editText.trim()}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed mb-4">
                    {message.message_text}
                  </p>
                )}

                {/* Reply actions */}
                <div className="flex items-center gap-4 pt-2 border-t">
                  {(user || member) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(replyingTo === message.id ? null : message.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Reply className="h-4 w-4 mr-2" />
                      Reply
                    </Button>
                  )}
                  
                  {message.replies && message.replies.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(message.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {expandedMessages.has(message.id) ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-2" />
                          Hide {message.replies.length} {message.replies.length === 1 ? 'reply' : 'replies'}
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-2" />
                          Show {message.replies.length} {message.replies.length === 1 ? 'reply' : 'replies'}
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Reply form */}
                {replyingTo === message.id && (
                  <div className="mt-4 pl-4 border-l-2 border-muted">
                    <div className="space-y-3">
                      <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write your reply..."
                        className="min-h-[80px] resize-none"
                        maxLength={500}
                      />
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          {replyText.length}/500
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyText('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleReply(message.id)}
                            disabled={submittingReply || !replyText.trim()}
                          >
                            {submittingReply ? "Posting..." : "Post Reply"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Replies */}
                {message.replies && message.replies.length > 0 && expandedMessages.has(message.id) && (
                  <div className="mt-4 space-y-3">
                    {message.replies.map((reply) => (
                      <div key={reply.id} className="pl-4 border-l-2 border-muted">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-sm">{reply.author_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                          </div>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                          {reply.reply_text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}