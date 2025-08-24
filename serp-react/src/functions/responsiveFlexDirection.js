import { useState, useEffect } from 'react';

const useResponsiveFlexDirection = () => {
  const [responsiveFlexDirection, setResponsiveFlexDirection] = useState('row');

  const updateFlexDirection = () => {
    if (window.innerWidth >= 800) {
      setResponsiveFlexDirection('row');
    } else {
      setResponsiveFlexDirection('column');
    }
  };

  useEffect(() => {
    updateFlexDirection(); // Set initial value
    window.addEventListener('resize', updateFlexDirection);
    
    // Cleanup event listener on component unmount
    return () => window.removeEventListener('resize', updateFlexDirection);
  }, []);

  return responsiveFlexDirection;
};

export const useResponsiveVisibility = () => {
    const [responsiveVisibility, setResponsiveVisibiltiy] = useState('flex');
  
    const updateVisibility = () => {
      if (window.innerWidth >= 800) {
        setResponsiveVisibiltiy('flex');
      } else {
        setResponsiveVisibiltiy('none');
      }
    };
  
    useEffect(() => {
        updateVisibility(); // Set initial value
        window.addEventListener('resize', updateVisibility);
      
        // Cleanup event listener on component unmount
        return () => window.removeEventListener('resize', updateVisibility);
    }, []);
  
    return responsiveVisibility;
  };

export default useResponsiveFlexDirection;