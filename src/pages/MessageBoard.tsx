import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSimpleAuth } from '@/hooks/useSimpleAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Send } from 'lucide-react';

interface Message {
  id: string;
  author_name: string;
  author_email: string;
  message_text: string;
  message_type: string;
  created_at: string;
}

export default function MessageBoard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState('suggestion');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const { user } = useAuth();
  const { member } = useSimpleAuth();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
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
                  <div className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                  </div>
                </div>
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                  {message.message_text}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}