import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { BrowserRouter } from 'react-router-dom';
import LandingPage from '@/features/landing/LandingPage';

describe('LandingPage component', () => {
  it('renders the complete landing page structure without crashing', () => {
    const html = renderToString(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>,
    );

    // Verify Brand Lockup & Header
    expect(html).toContain('RuralAttend');
    expect(html).toContain('RURAL SCHOOL ATTENDANCE SYSTEM');

    // Verify Navigation & Links
    expect(html).toContain('Who We Are');
    expect(html).toContain('Platform Services');
    expect(html).toContain('School Impact');
    expect(html).toContain('How It Works');
    expect(html).toContain('FAQ');

    // Verify Hero Headings & Subhead
    expect(html).toContain('Every learner accounted for');
    expect(html).toContain('Zero-friction attendance');
    expect(html).toContain('Book a Session with Our Team');

    // Verify Sign In link routing to /login
    expect(html).toContain('href="/login"');

    // Verify Services Section
    expect(html).toContain('Offline-Resilient Roll Capture');
    expect(html).toContain('Branch &amp; Multi-School Oversight');
    expect(html).toContain('Batch Roster Onboarding');
    expect(html).toContain('Nutrition &amp; Meal Program Audits');

    // Verify Calculator
    expect(html).toContain('School Branches in Your Trust / District');
    expect(html).toContain('Estimated Annual Impact');

    // Verify Book a Session & Direct Email
    expect(html).toContain('Book a 1-on-1 walkthrough with our team');
    expect(html).toContain('team@ruralattend.org');
    expect(html).toContain('Request Walkthrough Session');

    // Verify FAQ
    expect(html).toContain('Frequently Asked Questions');
    expect(html).toContain('Does RuralAttend work in remote areas with zero cellular reception?');

    // Verify Footer
    expect(html).toContain('Dedicated to rural educational clarity and student retention');
  });
});
