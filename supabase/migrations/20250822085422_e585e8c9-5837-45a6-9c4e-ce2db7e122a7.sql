-- Create message_replies table for threaded discussions
CREATE TABLE public.message_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL,
  parent_reply_id UUID,
  author_id UUID,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  reply_text TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.message_replies ENABLE ROW LEVEL SECURITY;

-- Create policies for message_replies
CREATE POLICY "Anyone can view approved replies" 
ON public.message_replies 
FOR SELECT 
USING (is_approved = true);

CREATE POLICY "Anyone can insert replies" 
ON public.message_replies 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can manage all replies" 
ON public.message_replies 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.is_admin = true
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_message_replies_updated_at
BEFORE UPDATE ON public.message_replies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_message_replies_message_id ON public.message_replies(message_id);
CREATE INDEX idx_message_replies_parent_reply_id ON public.message_replies(parent_reply_id);
CREATE INDEX idx_message_replies_created_at ON public.message_replies(created_at DESC);