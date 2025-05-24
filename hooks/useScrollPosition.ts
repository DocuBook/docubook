import { useState, useCallback, useEffect } from 'react';

export function useScrollPosition(threshold = 0.5) {
  const [isScrolled, setIsScrolled] = useState(false);
  
  const handleScroll = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const scrollPosition = window.scrollY;
    const viewportHeight = window.innerHeight;
    const shouldBeSticky = scrollPosition > viewportHeight * threshold;
    
    setIsScrolled(prev => shouldBeSticky !== prev ? shouldBeSticky : prev);
  }, [threshold]);

  // Add scroll event listener
  useEffect(() => {
    // Initial check
    handleScroll();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);
  
  return isScrolled;
}
