// src/pages/Landing/components/sections/CtaSection.tsx
import { memo, forwardRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { stagger, fadeInUp } from '../../animations';
import UsersIcon from '@/shared/components/icons/UsersIcon';
import CameraIcon from '@/shared/components/icons/CameraIcon';
import MicrophoneIcon from '@/shared/components/icons/MicrophoneIcon';
import ChartBarIcon from '@/shared/components/icons/ChartBarIcon';
import { interviewTags } from '../../landingPageData';

interface CtaSectionProps {
  onStartClick: () => void;
}

const CtaSection = memo(forwardRef<HTMLElement, CtaSectionProps>(({ onStartClick }, ref) => {
    const [userCount, setUserCount] = useState(123);

    useEffect(() => {
        const interval = setInterval(() => {
            setUserCount(prevCount => prevCount + Math.floor(Math.random() * 3) - 1);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

  return (
    <section
      ref={ref}
      id="cta-section"
      className="h-screen bg-gradient-to-br from-blue-700 to-indigo-800 snap-start flex items-center justify-center p-4"
    >
      <motion.div
        className="w-full max-w-4xl mx-auto"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.8 }}
        variants={stagger}
      >
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-10 md:p-16 text-center">
          <motion.div variants={fadeInUp} className="mb-6 text-blue-200 font-semibold flex items-center justify-center">
            <UsersIcon />
            <span>현재 {userCount}명이 면접을 준비하고 있어요</span>
          </motion.div>
          <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-bold text-white mb-4">
            AI 면접 서비스를 지금 바로 만나<br />보세요
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            성공적인 면접을 위한 완벽한 솔루션을 제공합니다.<br /> 자신감을 갖고 면접에 임하세요.
          </motion.p>
          <motion.div variants={fadeInUp} className="flex justify-center gap-8 md:gap-16 my-10">
            <CameraIcon />
            <MicrophoneIcon />
            <ChartBarIcon />
          </motion.div>
          <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-2 my-8">
            {interviewTags.map(tag => (
                <span key={tag} className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {tag}
                </span>
            ))}
          </motion.div>
          <motion.div variants={fadeInUp}>
            <button
              onClick={onStartClick}
              className="bg-white text-indigo-600 px-8 py-4 rounded-md text-lg font-bold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
            >
              AI 면접 시작하기
            </button>
          </motion.div>
          <motion.p variants={fadeInUp} className="mt-4 text-sm text-blue-200/80">
            지금 가입하고 맞춤형 피드백을 받아보세요
          </motion.p>
        </div>
      </motion.div>
    </section>
  );
}));

export default CtaSection;
