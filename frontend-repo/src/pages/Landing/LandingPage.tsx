import { useState, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import Header from '@/shared/layout/Header';
import Footer from '@/shared/layout/Footer';
import LandingPageContent from '@/pages/Landing/components/LandingPageContent';
import ScrollToTopButton from '@/pages/Landing/components/ScrollToTopButton';

const LandingPage = () => {
  const mainRef = useRef<HTMLElement>(null);
  const [showTopButton, setShowTopButton] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const { ref: footerRef, inView: footerInView } = useInView({ threshold: 0.3 });

  const handleScroll = () => {
    if (mainRef.current) {
      setShowTopButton(mainRef.current.scrollTop > 400);
    }
  };

  const scrollToTop = () => {
    mainRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div className="bg-white h-screen flex flex-col">
      <Header onLogoClick={scrollToTop} activeSection={activeSection} />
      <main
        ref={mainRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory scroll-smooth"
      >
        <LandingPageContent setActiveSection={setActiveSection} footerInView={footerInView} />
        <section id="footer" className="snap-start" ref={footerRef}>
          <Footer />
        </section>
      </main>
      <ScrollToTopButton isVisible={showTopButton} onClick={scrollToTop} />
    </div>
  );
};

export default LandingPage;
