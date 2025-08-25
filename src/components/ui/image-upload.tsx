import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Upload, X, Image, Link, Wand2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface ImageUploadProps {
  onImageUploaded: (url: string) => void
  onImageRemoved: () => void
  currentImage?: string
  label?: string
  className?: string
}

export function ImageUpload({ 
  onImageUploaded, 
  onImageRemoved, 
  currentImage, 
  label = "Upload Image",
  className 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [generatingAI, setGeneratingAI] = useState(false)
  const { toast } = useToast()

  const uploadImage = async (file: File) => {
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to upload images.",
          variant: "destructive",
        })
        return
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      const { data, error } = await supabase.storage
        .from('venue-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('venue-images')
        .getPublicUrl(data.path)

      onImageUploaded(publicUrl)
      
      toast({
        title: "Image uploaded",
        description: "Your image has been uploaded successfully.",
      })
    } catch (error) {
      console.error('Error uploading image:', error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await uploadImage(file)
    }
    // Reset the input value so the same file can be selected again
    e.target.value = ''
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadImage(e.dataTransfer.files[0])
    }
  }

  const handleUrlUpload = async () => {
    if (!urlInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      // Download the image from URL
      const response = await fetch(urlInput)
      if (!response.ok) {
        throw new Error('Failed to fetch image from URL')
      }

      const blob = await response.blob()
      
      // Create a file from the blob
      const fileName = `image-${Date.now()}.${blob.type.split('/')[1] || 'jpg'}`
      const file = new File([blob], fileName, { type: blob.type })

      // Upload using existing upload logic
      await uploadImage(file)
      setUrlInput('')
      
    } catch (error) {
      console.error('Error uploading from URL:', error)
      toast({
        title: "Error",
        description: "Failed to upload image from URL. Please check the URL and try again.",
        variant: "destructive",
      })
      setUploading(false)
    }
  }

  const handleAIGeneration = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt for AI image generation",
        variant: "destructive",
      })
      return
    }

    setGeneratingAI(true)
    try {
      const response = await supabase.functions.invoke('generate-image', {
        body: { 
          prompt: aiPrompt,
          size: "1024x1024"
        }
      })

      if (response.error) {
        throw new Error(response.error.message || 'Failed to generate image')
      }

      const { imageBase64, success } = response.data
      
      if (!success || !imageBase64) {
        throw new Error('No image generated')
      }

      // Convert base64 to blob
      const base64Response = await fetch(`data:image/png;base64,${imageBase64}`)
      const blob = await base64Response.blob()
      
      // Create file and upload
      const fileName = `ai-generated-${Date.now()}.png`
      const file = new File([blob], fileName, { type: 'image/png' })
      
      await uploadImage(file)
      setAiPrompt('')
      
    } catch (error) {
      console.error('Error generating AI image:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to generate AI image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setGeneratingAI(false)
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      
      {currentImage ? (
        <div className="relative">
          <div className="relative aspect-video w-full max-w-xs rounded-lg overflow-hidden border border-border">
            <img
              src={currentImage}
              alt="Uploaded image"
              className="w-full h-full object-cover"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
            onClick={() => {
              onImageRemoved()
              toast({
                title: "Image removed",
                description: "The image has been removed.",
              })
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              From URL
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              AI Generate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4">
            <div
              className={cn(
                "relative border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center transition-colors",
                dragActive && "border-primary bg-primary/5",
                "hover:border-muted-foreground/50"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-2">
                <Image className="h-8 w-8 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">
                  <span>Drag and drop an image here, or </span>
                  <Label htmlFor={`file-upload-${label.replace(/\s+/g, '-')}`} className="cursor-pointer text-primary hover:text-primary/80">
                    browse
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Supports: JPG, PNG, GIF up to 5MB
                </p>
              </div>
              <Input
                id={`file-upload-${label.replace(/\s+/g, '-')}`}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {uploading && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="url" className="mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image-url">Image URL</Label>
                <Input
                  id="image-url"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  disabled={uploading}
                />
              </div>
              <Button 
                type="button" 
                onClick={handleUrlUpload}
                disabled={uploading || !urlInput.trim()}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Link className="h-4 w-4 mr-2" />
                    Upload from URL
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ai-prompt">Describe the image you want to generate</Label>
                <Textarea
                  id="ai-prompt"
                  placeholder="A beautiful sunset over mountains with vibrant colors..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  disabled={generatingAI}
                  rows={3}
                />
              </div>
              <Button 
                type="button" 
                onClick={handleAIGeneration}
                disabled={generatingAI || !aiPrompt.trim()}
                className="w-full"
              >
                {generatingAI ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate with AI
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}