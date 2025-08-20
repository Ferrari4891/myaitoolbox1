import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Mail, MailX, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SimpleMember {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  joined_at: string;
  is_active: boolean;
  receive_notifications: boolean;
}

const SimpleMemberManagement = () => {
  const [members, setMembers] = useState<SimpleMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('simple_members')
        .select('*')
        .order('joined_at', { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const toggleNotifications = async (memberId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('simple_members')
        .update({ receive_notifications: !currentStatus })
        .eq('id', memberId);

      if (error) throw error;

      setMembers(prev => prev.map(member => 
        member.id === memberId 
          ? { ...member, receive_notifications: !currentStatus }
          : member
      ));

      toast.success(`Notifications ${!currentStatus ? 'enabled' : 'disabled'} for member`);
    } catch (error) {
      console.error('Error updating notifications:', error);
      toast.error('Failed to update notification settings');
    }
  };

  const removeMember = async (memberId: string, memberEmail: string) => {
    try {
      const { error } = await supabase
        .from('simple_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      setMembers(prev => prev.filter(member => member.id !== memberId));
      toast.success(`Member ${memberEmail} removed successfully`);
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Simple Members</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading members...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Simple Members
          <Badge variant="secondary">{members.length} total</Badge>
        </CardTitle>
        <CardDescription>
          Manage members who joined through the simplified email-only system
        </CardDescription>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <p className="text-muted-foreground">No simple members found.</p>
        ) : (
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{member.display_name}</h3>
                    <Badge variant={member.is_active ? "default" : "secondary"}>
                      {member.is_active ? "Active" : "Inactive"}
                    </Badge>
                    {member.receive_notifications && (
                      <Badge variant="outline" className="text-xs">
                        <Mail className="w-3 h-3 mr-1" />
                        Notifications
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined: {new Date(member.joined_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant={member.receive_notifications ? "outline" : "default"}
                    size="sm"
                    onClick={() => toggleNotifications(member.id, member.receive_notifications)}
                  >
                    {member.receive_notifications ? (
                      <>
                        <MailX className="w-4 h-4 mr-1" />
                        Disable Notifications
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-1" />
                        Enable Notifications
                      </>
                    )}
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-destructive" />
                          Remove Member
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to permanently remove <strong>{member.display_name}</strong> ({member.email}) from the system? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => removeMember(member.id, member.email)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Remove Member
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SimpleMemberManagement;