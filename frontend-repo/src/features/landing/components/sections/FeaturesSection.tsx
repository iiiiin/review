import { memo, forwardRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { featuresData } from '../../landingPageData';
import Modal from '@/shared/components/Modal';
import { stagger, fadeInUp } from '../../animations';

type Feature = typeof featuresData[0];

const FeaturesSection = memo(forwardRef<HTMLElement>((_, ref) => {
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

  useEffect(() => {
    const body = document.body;
    if (selectedFeature) {
      body.style.overflow = 'hidden';
    } else {
      body.style.overflow = 'auto';
    }
    return () => {
      body.style.overflow = 'auto';
    };
  }, [selectedFeature]);

  return (
    <>
      <motion.section
        ref={ref}
        id="features"
        className="h-screen bg-gray-50 snap-start flex items-center"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.5 }}
        variants={stagger}
      >
        <div 
          className="max-w-6xl mx-auto px-6 text-center" 
          style={{ 
            paddingTop: '5rem',
            transform: 'scale(0.9)',
            transformOrigin: 'center top'
          }}
        >
          <motion.p variants={fadeInUp} className="text-indigo-600 font-bold text-base mb-3">
            맞춤형 면접 유형
          </motion.p>
          <motion.h2 variants={fadeInUp} className="text-4xl font-bold text-gray-900 mb-10">
            어떤 면접이든 Re:View와 함께
          </motion.h2>

          <motion.div
            variants={fadeInUp}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch"
          >
            {featuresData.map((feature) => (
              <motion.button
                variants={fadeInUp}
                key={feature.title}
                onClick={() => setSelectedFeature(feature)}
                className="group bg-white p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-2 border-transparent hover:border-blue-500 text-left h-full flex flex-col"
              >
                <div className="overflow-hidden rounded-xl mb-4">
                  <img
                    src={feature.imgSrc}
                    alt={feature.alt}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600 text-base leading-relaxed flex-1">
                  {feature.description}
                </p>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <Modal isOpen={!!selectedFeature} onClose={() => setSelectedFeature(null)} size="5xl">
        {selectedFeature && (
        <div className="p-6">
          <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">{selectedFeature.modalContent.title}</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* 좌측: 일반 면접 정보 */}
            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-xl font-bold mb-3 text-blue-600">{selectedFeature.modalContent.leftContent.title}</h3>
              <p className="text-gray-700 mb-4 leading-relaxed">{selectedFeature.modalContent.leftContent.description}</p>
              <ul className="space-y-2">
                {selectedFeature.modalContent.leftContent.points.map((point, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-2 mt-1">•</span>
                    <span className="text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* 우측: Re:View 특화 기능 */}
            <div className="bg-blue-50 p-6 rounded-xl">
              <h3 className="text-xl font-bold mb-3 text-indigo-600">{selectedFeature.modalContent.rightContent.title}</h3>
              <p className="text-gray-700 mb-4 leading-relaxed">{selectedFeature.modalContent.rightContent.description}</p>
              <ul className="space-y-2">
                {selectedFeature.modalContent.rightContent.points.map((point, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-indigo-500 mr-2 mt-1">✓</span>
                    <span className="text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <button
              onClick={() => setSelectedFeature(null)}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              닫기
            </button>
          </div>
        </div>
        )}
      </Modal>
    </>
  );
}));

export default FeaturesSection;
