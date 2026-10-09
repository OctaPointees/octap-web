import { useState } from 'react';

import AmbientBackground from './sections/AmbientBackground';
import Header from './sections/Header';
import Hero from './sections/Hero';
import WhatIsOctap from './sections/WhatIsOctap';
import WhoItsFor from './sections/WhoItsFor';
import Features from './sections/Features';
import HowItWorks from './sections/HowItWorks';
import Developers from './sections/Developers';
import Compare from './sections/Compare';
import Partners from './sections/Partners';
import GoodToKnow from './sections/GoodToKnow';
import Faq from './sections/Faq';
import FinalCta from './sections/FinalCta';
import Footer from './sections/Footer';
import { useLandingAnimations } from './hooks/useLandingAnimations';
import type { Theme } from './types';

export default function LandingApp() {
  const [theme, setTheme] = useState<Theme>('dark');
  useLandingAnimations();

  return (
    <div
      className="font-sans antialiased relative"
      data-name="landing page root"
      data-theme={theme}
      style={{ background: 'var(--bg)', color: 'var(--ink)' }}
    >
      <AmbientBackground />

      <div className="relative" style={{ zIndex: 1 }}>
        <Header theme={theme} onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} />
        <Hero />
        <WhatIsOctap />
        <WhoItsFor />
        <Features />
        <HowItWorks />
        <Developers />
        <Compare />
        <Partners />
        <GoodToKnow />
        <Faq />
        <FinalCta />
        <Footer theme={theme} />
      </div>
    </div>
  );
}
