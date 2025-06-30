import React, { useEffect, useRef, useState } from 'react';

interface BoltBadgeProps {
  variant?: 'white' | 'black' | 'text' | 'auto';
  position?: 'top-right' | 'bottom-right' | 'inline';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'original';
  className?: string;
  backgroundContext?: 'light' | 'dark' | 'auto';
}

const BoltBadge: React.FC<BoltBadgeProps> = ({
  variant = 'auto',
  position = 'inline',
  size = 'md',
  className = '',
  backgroundContext = 'auto',
}) => {
  const [detectedVariant, setDetectedVariant] = useState<
    'white' | 'black' | 'text'
  >('black');
  const badgeRef = useRef<HTMLDivElement>(null);

  // Determine badge variant based on background
  const getBadgeVariant = () => {
    if (variant !== 'auto') return variant;

    // Use detected variant or fallback to black
    return detectedVariant;
  };

  // Detect background color for automatic variant selection
  useEffect(() => {
    if (backgroundContext === 'auto' && badgeRef.current) {
      const detectBackground = () => {
        const element = badgeRef.current;
        if (!element) return;

        // Get computed styles of the element
        const styles = window.getComputedStyle(element);
        const backgroundColor = styles.backgroundColor;

        // Simple background detection logic
        // This is a basic implementation - you might want to enhance this
        if (
          backgroundColor.includes('rgb(0, 0, 0)') ||
          backgroundColor.includes('rgba(0, 0, 0') ||
          backgroundColor.includes('#000')
        ) {
          setDetectedVariant('white');
        } else if (
          backgroundColor.includes('rgb(255, 255, 255)') ||
          backgroundColor.includes('rgba(255, 255, 255') ||
          backgroundColor.includes('#fff') ||
          backgroundColor.includes('#ffffff')
        ) {
          setDetectedVariant('black');
        } else {
          // Default to black for unknown backgrounds
          setDetectedVariant('black');
        }
      };

      detectBackground();

      // Re-detect on window resize
      window.addEventListener('resize', detectBackground);
      return () => window.removeEventListener('resize', detectBackground);
    } else if (backgroundContext === 'dark') {
      setDetectedVariant('white');
    } else if (backgroundContext === 'light') {
      setDetectedVariant('black');
    }
  }, [backgroundContext, variant]);

  const badgeVariant = getBadgeVariant();

  // Get badge image source based on variant
  const getBadgeSrc = () => {
    switch (badgeVariant) {
      case 'white':
        return '/images/white_circle_360x360.png';
      case 'black':
        return '/images/black_circle_360x360.png';
      case 'text':
        return '/images/bolt-badge.svg'; // Text-only version
      default:
        return '/images/black_circle_360x360.png';
    }
  };

  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-8 w-auto';
      case 'lg':
        return 'h-12 w-auto';
      case 'xl':
        return 'h-20 w-auto';
      case 'xxl':
        return 'h-32 w-auto';
      case 'original':
        return 'h-[360px] w-[360px]';
      default:
        return 'h-10 w-auto';
    }
  };

  // Get position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'fixed top-8 right-8 z-50';
      case 'bottom-right':
        return 'fixed bottom-4 right-4 z-50';
      default:
        return '';
    }
  };

  return (
    <div ref={badgeRef} className={`${getPositionClasses()} ${className}`}>
      <a
        href="https://bolt.new/"
        target="_blank"
        rel="noopener noreferrer"
        className="block transition-transform duration-200 hover:scale-105"
        title="Built on Bolt"
      >
        <img
          src={getBadgeSrc()}
          alt="Built on Bolt"
          className={getSizeClasses()}
          onError={(e) => {
            // Fallback to text if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `
                <div class="flex items-center px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg shadow-lg">
                  <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
                  </svg>
                  <span class="text-white text-sm font-medium">Built on Bolt</span>
                </div>
              `;
            }
          }}
        />
      </a>
    </div>
  );
};

export default BoltBadge;
