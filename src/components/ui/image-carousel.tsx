import * as React from "react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface ImageCarouselProps {
  images: string[]
  alt: string
  className?: string
  autoPlay?: boolean
  interval?: number
}

export function ImageCarousel({ 
  images, 
  alt, 
  className, 
  autoPlay = true, 
  interval = 2000 
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (!autoPlay || images.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      )
    }, interval)

    return () => clearInterval(timer)
  }, [autoPlay, interval, images.length])

  if (!images || images.length === 0) {
    return (
      <div className={cn(
        "w-full h-64 bg-muted rounded-lg flex items-center justify-center",
        className
      )}>
        <span className="text-muted-foreground">No images available</span>
      </div>
    )
  }

  return (
    <div className={cn("relative w-full h-64 rounded-lg overflow-hidden", className)}>
      <img
        src={images[currentIndex]}
        alt={`${alt} - Image ${currentIndex + 1}`}
        className="w-full h-full object-cover transition-opacity duration-300"
      />
      
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                index === currentIndex 
                  ? "bg-primary" 
                  : "bg-primary/30"
              )}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}