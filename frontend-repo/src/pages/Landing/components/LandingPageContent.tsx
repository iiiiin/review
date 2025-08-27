// src/pages/Landing/components/LandingPageContent.tsx
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/store/authStore';
import { useInView } from 'react-intersection-observer';

import SideNav from './SideNav';
import HeroSection from './sections/HeroSection';
import FeaturesSection from './sections/FeaturesSection';
import HowToSection from './sections/HowToSection';
import TestimonialsSection from './sections/TestimonialsSection';
import CtaSection from './sections/CtaSection';

import { howToSectionsData } from '../landingPageData';

const LandingPageContent = ({ 
  setActiveSection, 
  footerInView 
}: { 
  setActiveSection: (section: string) => void;
  footerInView: boolean;
}) => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();
  const [activeInternal, setActiveInternal] = useState('hero');

  const handleStartInterview = useCallback(() => {
    if (!isLoggedIn) {
      navigate('/auth/login');
    } else {
      navigate('/interview');
    }
  }, [navigate, isLoggedIn]);

  const options = { threshold: 0.5 };
  const { ref: heroRef, inView: heroInView } = useInView(options);
  const { ref: featuresRef, inView: featuresInView } = useInView(options);
  const { ref: howto0Ref, inView: howto0InView } = useInView(options);
  const { ref: howto1Ref, inView: howto1InView } = useInView(options);
  const { ref: howto2Ref, inView: howto2InView } = useInView(options);
  const { ref: testimonialsRef, inView: testimonialsInView } = useInView(options);
  const { ref: ctaRef, inView: ctaInView } = useInView(options);

  useEffect(() => {
    const sections = [
      { id: 'hero', inView: heroInView },
      { id: 'features', inView: featuresInView },
      { id: 'how-to-0', inView: howto0InView },
      { id: 'how-to-1', inView: howto1InView },
      { id: 'how-to-2', inView: howto2InView },
      { id: 'testimonials', inView: testimonialsInView },
      { id: 'cta-section', inView: ctaInView },
    ];

    const currentSection = sections.find(section => section.inView);
    if (currentSection) {
      setActiveSection(currentSection.id);
      setActiveInternal(currentSection.id);
    }
  }, [heroInView, featuresInView, howto0InView, howto1InView, howto2InView, testimonialsInView, ctaInView, setActiveSection]);

  const howToRefs = [howto0Ref, howto1Ref, howto2Ref];

  return (
    <>
      {activeInternal !== 'hero' && activeInternal !== 'cta-section' && activeInternal !== 'footer' && <SideNav activeSection={activeInternal} />}
      <HeroSection ref={heroRef} isNearFooter={ctaInView || footerInView} />
      <FeaturesSection ref={featuresRef} />
      <div id="how-to">
        {howToSectionsData.map((data, index) => (
          <section
            ref={howToRefs[index]}
            key={index}
            id={`how-to-${index}`}
            className={`h-screen snap-start flex items-center justify-center ${index % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}
          >
            <HowToSection {...data} imagePosition={index % 2 === 0 ? 'right' : 'left'} />
          </section>
        ))}
      </div>
      <TestimonialsSection ref={testimonialsRef} isNearFooter={ctaInView || footerInView} />
      <CtaSection ref={ctaRef} onStartClick={handleStartInterview} />
    </>
  );
};

export default LandingPageContent;