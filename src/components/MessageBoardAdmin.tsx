import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, Plus, Edit, Trash2, Tag, Settings, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  author_name: string;
  author_email: string;
  message_text: string;
  message_type: string;
  created_at: string;
  is_approved: boolean;
  author_id: string | null;
}

interface MessageCategory {
  key: string;
  label: string;
  color: string;
}

const defaultCategories: MessageCategory[] = [
  { key: 'suggestion', label: 'Suggestion', color: 'bg-blue-100 text-blue-800' },
  { key: 'feedback', label: 'Feedback', color: 'bg-green-100 text-green-800' },
  { key: 'question', label: 'Question', color: 'bg-yellow-100 text-yellow-800' },
  { key: 'tech_issues', label: 'Tech Issues', color: 'bg-red-100 text-red-800' },
  { key: 'new_features', label: "New feature's", color: 'bg-purple-100 text-purple-800' },
  { key: 'general', label: 'General', color: 'bg-gray-100 text-gray-800' },
];

export default function MessageBoardAdmin() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [categories, setCategories] = useState<MessageCategory[]>(defaultCategories);
  const [loading, setLoading] = useState(true);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newMessage, setNewMessage] = useState({
    author_name: '',
    author_email: '',
    message_text: '',
    message_type: 'suggestion',
    is_approved: true,
  });
  const [newCategory, setNewCategory] = useState({
    key: '',
    label: '',
    color: 'bg-gray-100 text-gray-800',
  });
  const { toast } = useToast();

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
        description: "Failed to load messages.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMessage = async () => {
    if (!newMessage.message_text.trim() || !newMessage.author_name.trim() || !newMessage.author_email.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .insert([newMessage]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Message added successfully!",
      });

      setNewMessage({
        author_name: '',
        author_email: '',
        message_text: '',
        message_type: 'suggestion',
        is_approved: true,
      });
      setAddDialogOpen(false);
      fetchMessages();
    } catch (error) {
      console.error('Error adding message:', error);
      toast({
        title: "Error",
        description: "Failed to add message.",
        variant: "destructive",
      });
    }
  };

  const handleEditMessage = async () => {
    if (!editingMessage) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({
          author_name: editingMessage.author_name,
          author_email: editingMessage.author_email,
          message_text: editingMessage.message_text,
          message_type: editingMessage.message_type,
          is_approved: editingMessage.is_approved,
        })
        .eq('id', editingMessage.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Message updated successfully!",
      });

      setEditDialogOpen(false);
      setEditingMessage(null);
      fetchMessages();
    } catch (error) {
      console.error('Error updating message:', error);
      toast({
        title: "Error",
        description: "Failed to update message.",
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
        description: "Failed to delete message.",
        variant: "destructive",
      });
    }
  };

  const toggleMessageApproval = async (messageId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_approved: !currentStatus })
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Message ${!currentStatus ? 'approved' : 'hidden'} successfully!`,
      });

      fetchMessages();
    } catch (error) {
      console.error('Error toggling message approval:', error);
      toast({
        title: "Error",
        description: "Failed to update message status.",
        variant: "destructive",
      });
    }
  };

  const handleAddCategory = () => {
    if (!newCategory.key.trim() || !newCategory.label.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both key and label fields.",
        variant: "destructive",
      });
      return;
    }

    if (categories.some(cat => cat.key === newCategory.key)) {
      toast({
        title: "Error",
        description: "Category key already exists.",
        variant: "destructive",
      });
      return;
    }

    setCategories(prev => [...prev, newCategory]);
    setNewCategory({
      key: '',
      label: '',
      color: 'bg-gray-100 text-gray-800',
    });
    setCategoryDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Category added successfully! Note: This only affects the admin interface.",
    });
  };

  const handleDeleteCategory = (categoryKey: string) => {
    if (defaultCategories.some(cat => cat.key === categoryKey)) {
      toast({
        title: "Error",
        description: "Cannot delete default categories.",
        variant: "destructive",
      });
      return;
    }

    setCategories(prev => prev.filter(cat => cat.key !== categoryKey));
    toast({
      title: "Success",
      description: "Category removed from admin interface.",
    });
  };

  const getCategoryInfo = (type: string) => {
    const category = categories.find(cat => cat.key === type);
    return category || { key: type, label: type, color: 'bg-gray-100 text-gray-800' };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Loading message board data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="h-6 w-6" />
            Message Board Management
          </h2>
          <p className="text-muted-foreground">Manage messages and categories</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Tag className="h-4 w-4 mr-2" />
                Manage Categories
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Manage Categories</DialogTitle>
                <DialogDescription>
                  Add or remove message categories. Default categories cannot be deleted.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Category key (e.g., bugs)"
                    value={newCategory.key}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, key: e.target.value }))}
                  />
                  <Input
                    placeholder="Category label (e.g., Bug Reports)"
                    value={newCategory.label}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, label: e.target.value }))}
                  />
                </div>
                <Button onClick={handleAddCategory} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {categories.map((category) => (
                    <div key={category.key} className="flex items-center justify-between p-2 border rounded">
                      <span className={`px-2 py-1 rounded text-xs ${category.color}`}>
                        {category.label}
                      </span>
                      {!defaultCategories.some(cat => cat.key === category.key) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.key)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Message
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Message</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Author name"
                  value={newMessage.author_name}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, author_name: e.target.value }))}
                />
                <Input
                  placeholder="Author email"
                  type="email"
                  value={newMessage.author_email}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, author_email: e.target.value }))}
                />
                <Select 
                  value={newMessage.message_type} 
                  onValueChange={(value) => setNewMessage(prev => ({ ...prev, message_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.key} value={category.key}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Message content"
                  value={newMessage.message_text}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, message_text: e.target.value }))}
                  className="min-h-[100px]"
                />
                <div className="flex gap-2">
                  <Button onClick={handleAddMessage} className="flex-1">Add Message</Button>
                  <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Messages ({messages.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({messages.filter(m => m.is_approved).length})</TabsTrigger>
          <TabsTrigger value="pending">Hidden ({messages.filter(m => !m.is_approved).length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {messages.map((message) => (
            <MessageCard 
              key={message.id} 
              message={message} 
              getCategoryInfo={getCategoryInfo}
              onEdit={(msg) => {
                setEditingMessage(msg);
                setEditDialogOpen(true);
              }}
              onDelete={handleDeleteMessage}
              onToggleApproval={toggleMessageApproval}
            />
          ))}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {messages.filter(m => m.is_approved).map((message) => (
            <MessageCard 
              key={message.id} 
              message={message} 
              getCategoryInfo={getCategoryInfo}
              onEdit={(msg) => {
                setEditingMessage(msg);
                setEditDialogOpen(true);
              }}
              onDelete={handleDeleteMessage}
              onToggleApproval={toggleMessageApproval}
            />
          ))}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {messages.filter(m => !m.is_approved).map((message) => (
            <MessageCard 
              key={message.id} 
              message={message} 
              getCategoryInfo={getCategoryInfo}
              onEdit={(msg) => {
                setEditingMessage(msg);
                setEditDialogOpen(true);
              }}
              onDelete={handleDeleteMessage}
              onToggleApproval={toggleMessageApproval}
            />
          ))}
        </TabsContent>
      </Tabs>

      {/* Edit Message Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Message</DialogTitle>
          </DialogHeader>
          {editingMessage && (
            <div className="space-y-4">
              <Input
                placeholder="Author name"
                value={editingMessage.author_name}
                onChange={(e) => setEditingMessage(prev => prev ? { ...prev, author_name: e.target.value } : null)}
              />
              <Input
                placeholder="Author email"
                type="email"
                value={editingMessage.author_email}
                onChange={(e) => setEditingMessage(prev => prev ? { ...prev, author_email: e.target.value } : null)}
              />
              <Select 
                value={editingMessage.message_type} 
                onValueChange={(value) => setEditingMessage(prev => prev ? { ...prev, message_type: value } : null)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.key} value={category.key}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Message content"
                value={editingMessage.message_text}
                onChange={(e) => setEditingMessage(prev => prev ? { ...prev, message_text: e.target.value } : null)}
                className="min-h-[100px]"
              />
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="approved"
                  checked={editingMessage.is_approved}
                  onChange={(e) => setEditingMessage(prev => prev ? { ...prev, is_approved: e.target.checked } : null)}
                />
                <label htmlFor="approved" className="text-sm">Approved (visible to users)</label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleEditMessage} className="flex-1">Save Changes</Button>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface MessageCardProps {
  message: Message;
  getCategoryInfo: (type: string) => MessageCategory;
  onEdit: (message: Message) => void;
  onDelete: (id: string) => void;
  onToggleApproval: (id: string, currentStatus: boolean) => void;
}

function MessageCard({ message, getCategoryInfo, onEdit, onDelete, onToggleApproval }: MessageCardProps) {
  const categoryInfo = getCategoryInfo(message.message_type);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className="font-medium">{message.author_name}</div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`}>
              {categoryInfo.label}
            </span>
            {!message.is_approved && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Hidden
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleApproval(message.id, message.is_approved)}
              className="h-8 w-8 p-0"
            >
              {message.is_approved ? (
                <AlertTriangle className="h-3 w-3 text-yellow-600" />
              ) : (
                <Settings className="h-3 w-3 text-green-600" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(message)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(message.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            <div className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
            </div>
          </div>
        </div>
        <p className="text-foreground whitespace-pre-wrap leading-relaxed mb-2">
          {message.message_text}
        </p>
        <div className="text-xs text-muted-foreground">
          From: {message.author_email}
        </div>
      </CardContent>
    </Card>
  );
}