import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Mail, User, Users } from "lucide-react";

interface AddMemberDialogProps {
  open: boolean;
  onClose: () => void;
  onMemberAdded: () => void;
  memberType: 'admin' | 'simple';
}

export const AddMemberDialog = ({ open, onClose, onMemberAdded, memberType }: AddMemberDialogProps) => {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !displayName) {
      toast({
        title: "Missing Information",
        description: "Email and display name are required.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const functionName = memberType === 'admin' ? 'create-member' : 'create-simple-member';
      const body = memberType === 'admin' 
        ? { email, displayName, firstName, lastName }
        : { email, displayName, firstName, lastName, joinedAt: new Date().toISOString() };
      
      const { data, error } = await supabase.functions.invoke(functionName, { body });

      if (error) throw error;

      if (data.success) {
        const memberTypeText = memberType === 'admin' ? 'Administrator' : 'Simple Member';
        const description = memberType === 'admin' 
          ? `${displayName} has been added as an administrator and will receive login credentials via email.`
          : `${displayName} has been added as a simple member.`;
        
        toast({
          title: `${memberTypeText} Created Successfully`,
          description,
        });
        
        // Reset form
        setEmail("");
        setDisplayName("");
        setFirstName("");
        setLastName("");
        
        onMemberAdded();
        onClose();
      } else {
        toast({
          title: "Cannot Create Member",
          description: data.error || "A user with this email may already exist. Try a different email or reset their password.",
          variant: "destructive",
        });
        return;
      }
    } catch (error: any) {
      console.error('Error creating member:', error);
      let description = error?.message || "Failed to create member. Please try again.";
      try {
        const body = (error as any)?.context?.body;
        if (body) {
          const parsed = typeof body === 'string' ? JSON.parse(body) : body;
          if (parsed?.error) description = parsed.error;
        }
      } catch {}
      toast({
        title: "Error Creating Member",
        description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setEmail("");
      setDisplayName("");
      setFirstName("");
      setLastName("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New {memberType === 'admin' ? 'Administrator' : 'Simple Member'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@example.com"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Display Name *
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="John Doe"
              required
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                disabled={loading}
              />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> {memberType === 'admin' 
                ? 'The new administrator will receive an email with their login credentials. The temporary password is "geezer" and they\'ll be required to change it on first login.'
                : 'The simple member will be added to the member directory with basic access privileges.'}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : `Create ${memberType === 'admin' ? 'Administrator' : 'Simple Member'}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};