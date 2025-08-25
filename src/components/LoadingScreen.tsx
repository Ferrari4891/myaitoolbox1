import { useEffect, useState } from "react";

const LoadingScreen = ({ onLoadingComplete }: { onLoadingComplete: () => void }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onLoadingComplete, 300); // Wait for fade out animation
    }, 2000);

    return () => clearTimeout(timer);
  }, [onLoadingComplete]);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 bg-primary z-50 flex items-center justify-center transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="text-center">
        <img 
          src="/src/assets/myaitoolbox-logo.png" 
          alt="MyAIToolbox Logo" 
          className="h-24 w-24 mx-auto mb-4 animate-pulse"
        />
        <h1 className="text-2xl font-bold text-primary-foreground">
          Myaitoolbox.online
        </h1>
        <div className="mt-4 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-foreground"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;