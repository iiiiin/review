// src/pages/Landing/components/SideNav.tsx
import { memo } from 'react';
import { sectionDetails } from '../landingPageData';

const SideNav = memo(({ activeSection }: { activeSection: string }) => {
    return (
      <nav className="fixed top-1/2 left-8 transform -translate-y-1/2 z-20">
        <ul className="space-y-4">
          {sectionDetails.map(({ id, label }) => (
            <li key={id} className="group relative flex justify-start">
              <span className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2 py-1 rounded-md bg-gray-900 text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
                {label}
              </span>
              <a
                href={`#${id}`}
                className={`block w-3 h-3 rounded-full transition-all duration-300 ${
                  activeSection === id || (id === 'how-to' && activeSection.startsWith('how-to'))
                    ? 'bg-blue-500 scale-150'
                    : 'bg-white/50 hover:bg-white'
                } [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.5))]`}
                aria-label={`'${label}' 섹션으로 이동`}
              />
            </li>
          ))}
        </ul>
      </nav>
    );
});

export default SideNav;
