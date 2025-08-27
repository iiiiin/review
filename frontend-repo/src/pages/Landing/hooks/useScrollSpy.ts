// src/pages/Landing/hooks/useScrollSpy.ts
import { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

const useScrollSpy = (sectionIds: string[], options: { threshold: number }) => {
  const [activeSection, setActiveSection] = useState(sectionIds[0]);
  const refs = sectionIds.map(() => useInView(options));

  useEffect(() => {
    const currentSection = sectionIds.find((_, index) => refs[index].inView);
    if (currentSection) {
      setActiveSection(currentSection);
    }
  }, [refs, sectionIds]);

  return { activeSection, refs: refs.map(ref => ref.ref) };
};

export default useScrollSpy;
