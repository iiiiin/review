import { memo, forwardRef, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperInstance } from 'swiper';
import { Autoplay, EffectFade } from 'swiper/modules';
import ScrollDownIndicator from '../ScrollDownIndicator';
import { heroSlidesData } from '../../landingPageData';

import 'swiper/css';
import 'swiper/css/effect-fade';

interface HeroSectionProps {
  isNearFooter?: boolean;
}

const HeroSection = memo(forwardRef<HTMLElement, HeroSectionProps>(({ isNearFooter = false }, ref) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperInstance | null>(null);

  const handleStartClick = useCallback(() => {
    document.getElementById('cta-section')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleLearnMoreClick = useCallback(() => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const textAnimation = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.5 },
  };

  return (
    <section ref={ref} id="hero" className="relative h-screen w-full snap-start">
      <Swiper
        modules={[Autoplay, EffectFade]}
        onSwiper={(swiper) => { swiperRef.current = swiper; }}
        spaceBetween={0}
        slidesPerView={1}
        loop={true}
        autoplay={isNearFooter ? false : { delay: 7000, disableOnInteraction: true, pauseOnMouseEnter: true }}
        touchStartPreventDefault={false}
        allowTouchMove={true}
        effect="fade"
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
        className="h-full w-full"
      >
        {heroSlidesData.map((slide, index) => (
          <SwiperSlide key={index}>
            <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url('${slide.imageUrl}')` }} />
            <div className="absolute inset-0 bg-black opacity-50"></div>
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="absolute inset-0 z-10 flex items-center justify-center text-center text-white">
        <div className="max-w-4xl mx-auto px-6 flex flex-col items-center">
          <div className="h-48 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.h1 key={`title-${activeIndex}`} {...textAnimation} className="text-5xl md:text-6xl font-bold mb-4">
                {heroSlidesData[activeIndex].title}
              </motion.h1>
            </AnimatePresence>
            <AnimatePresence mode="wait">
              <motion.p key={`subtitle-${activeIndex}`} {...textAnimation} transition={{ ...textAnimation.transition, delay: 0.1 }} className="text-lg md:text-xl">
                {heroSlidesData[activeIndex].subtitle}
              </motion.p>
            </AnimatePresence>
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="flex justify-center space-x-4 mt-8">
            <button onClick={handleStartClick} className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition-all duration-300 transform hover:scale-105">
              바로 시작하기
            </button>
            <button onClick={handleLearnMoreClick} className="border border-white bg-white/20 text-white px-6 py-3 rounded-md font-semibold hover:bg-white hover:text-gray-900 transition-all duration-300 transform hover:scale-105">
              자세히 보기
            </button>
          </motion.div>
        </div>
      </div>

      <ScrollDownIndicator />
    </section>
  );
}));

export default HeroSection;
