// src/pages/Landing/components/sections/TestimonialsSection.tsx
import { memo, forwardRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import { testimonialsData } from '../../landingPageData';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface TestimonialsSectionProps {
  isNearFooter?: boolean;
}

const TestimonialsSection = memo(forwardRef<HTMLElement, TestimonialsSectionProps>(({ isNearFooter = false }, ref) => {
  return (
    <section ref={ref} id="testimonials" className="h-screen bg-gray-50 snap-start flex items-center">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <p className="text-indigo-600 font-bold mb-2">사용자 후기</p>
        <h2 className="text-4xl font-bold text-gray-900 mb-12">Re:View를 경험한 사람들</h2>
        <div className="relative">
          <Swiper
            modules={[Autoplay]}
            spaceBetween={30}
            slidesPerView={1}
            loop={true}
            autoplay={isNearFooter ? false : { delay: 5000, disableOnInteraction: true, pauseOnMouseEnter: true }}
            touchStartPreventDefault={false}
            allowTouchMove={true}
            breakpoints={{ 768: { slidesPerView: 2, spaceBetween: 30 }, 1024: { slidesPerView: 3, spaceBetween: 40 } }}
            className="!pb-12"
          >
            {testimonialsData.map((testimonial, index) => (
              <SwiperSlide key={index} className="pb-4">
                <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center text-center h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                  <img
                    src={testimonial.avatar}
                    alt={`${testimonial.author}님의 프로필 사진`}
                    className="w-20 h-20 rounded-full mb-4 border-4 border-blue-100"
                  />
                  <p className="text-gray-600 italic mb-6 flex-grow">"{testimonial.quote}"</p>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{testimonial.author}</h3>
                    <p className="text-sm text-gray-500">{testimonial.title}</p>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}));

export default TestimonialsSection;
