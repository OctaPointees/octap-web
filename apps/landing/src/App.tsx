import SiteHeader from './sections/SiteHeader';
import Hero from './sections/Hero';
import WaveDivider from './sections/WaveDivider';
import PromoStrip from './sections/PromoStrip';
import WhatIsOctap from './sections/WhatIsOctap';
import HowItWorks from './sections/HowItWorks';
import PartnerLogoWall from './sections/PartnerLogoWall';
import Features from './sections/Features';
import LaunchOffer from './sections/LaunchOffer';
import GoodToKnow from './sections/GoodToKnow';
import Testimonials from './sections/Testimonials';
import UseCases from './sections/UseCases';
import StatsBand from './sections/StatsBand';
import Developers from './sections/Developers';
import Compare from './sections/Compare';
import Press from './sections/Press';
import LeadGen from './sections/LeadGen';
import SdkCta from './sections/SdkCta';
import Faq from './sections/Faq';
import FinalCta from './sections/FinalCta';
import SiteFooter from './sections/SiteFooter';

export default function App() {
  return (
    <div
      className="font-body antialiased relative bg-ground text-ink"
      style={{ overflowX: 'clip' }}
    >
      <div className="relative" style={{ zIndex: 1 }}>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main-content" tabIndex={-1}>
          <Hero />
          <WaveDivider />
          <PromoStrip />
          <WhatIsOctap />
          <HowItWorks />
          <PartnerLogoWall />
          <Features />
          <LaunchOffer />
          <GoodToKnow />
          <Testimonials />
          <UseCases />
          <StatsBand />
          <Developers />
          <Compare />
          <Press />
          <LeadGen />
          <SdkCta />
          <Faq />
          <FinalCta />
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
