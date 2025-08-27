// src/pages/Landing/components/sections/HowToSection.tsx
import { memo } from 'react';
import { motion } from 'framer-motion';
import { stagger, fadeInUp } from '../../animations';

interface HowToSectionProps {
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  imagePosition?: 'left' | 'right';
}

const HowToSection = memo(({ title, subtitle, description, imageUrl, imageAlt, imagePosition = 'right' }: HowToSectionProps) => {
  const isImageRight = imagePosition === 'right';
  return (
    <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center max-w-7xl mx-auto px-6" initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.5 }} variants={stagger}>
      <motion.div variants={fadeInUp} className={isImageRight ? 'md:order-1' : 'md:order-2'}>
        <p className="text-indigo-600 font-bold text-lg">{subtitle}</p>
        <h2 className="text-5xl font-bold text-gray-900 my-4">{title}</h2>
        <p className="text-gray-600 leading-relaxed text-lg">{description}</p>
      </motion.div>
      <motion.div variants={fadeInUp} className={isImageRight ? 'md:order-2' : 'md:order-1'}>
        <img src={imageUrl} alt={imageAlt} className="w-full h-auto rounded-lg shadow-xl" />
      </motion.div>
    </motion.div>
  );
});

export default HowToSection;
