import './landing.css';
import { LandingHeader } from './components/LandingHeader';
import { HeroSection } from './components/HeroSection';
import { WhoWeAreSection } from './components/WhoWeAreSection';
import { ServicesSection } from './components/ServicesSection';
import { ImpactCalculator } from './components/ImpactCalculator';
import { HowItWorksSection } from './components/HowItWorksSection';
import { BookSessionSection } from './components/BookSessionSection';
import { FaqSection } from './components/FaqSection';
import { LandingFooter } from './components/LandingFooter';

/**
 * Public landing page providing insights into RuralAttend's services, mission,
 * team session booking, and routing to administrator login.
 * @returns {import('react').ReactElement} The complete landing page.
 */
export default function LandingPage() {
  return (
    <div className="landing-root">
      {/* Navigation Bar */}
      <LandingHeader />

      <main id="main-content">
        {/* Hero with live simulated dashboard */}
        <HeroSection />

        {/* Who We Are & Mission narrative */}
        <WhoWeAreSection />

        {/* Services & Capabilities deep dive */}
        <ServicesSection />

        {/* Dynamic School Time & Paper Savings Calculator */}
        <ImpactCalculator />

        {/* 4-Step Rollout Workflow */}
        <HowItWorksSection />

        {/* Book a Session & Direct Email Actions */}
        <BookSessionSection />

        {/* Frequently Asked Questions */}
        <FaqSection />
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
