interface HeroSectionProps {
  backgroundImage: string;
  title: string;
  subtitle?: string;
  height?: string;
}

const HeroSection = ({ 
  backgroundImage, 
  title, 
  subtitle, 
  height = "h-96" 
}: HeroSectionProps) => {
  return (
    <section className={`relative ${height} overflow-hidden`}>
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-hero-overlay/20 to-hero-overlay/60" />
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center h-full px-4">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-hero-text mb-4 drop-shadow-lg">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xl md:text-2xl text-hero-text/90 drop-shadow-md">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      {/* Bottom Shadow */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-800/70 via-gray-600/40 to-transparent pointer-events-none" />
      
      {/* Bottom White Line */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-white z-10" />
    </section>
  );
};

export default HeroSection;