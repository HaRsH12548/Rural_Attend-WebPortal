import {
  WifiOff,
  Building2,
  FileSpreadsheet,
  UtensilsCrossed,
  UserCheck,
  TrendingDown,
  CheckCircle2,
} from 'lucide-react';

/**
 * "What Services We Provide" grid section.
 * @returns {import('react').ReactElement} The services overview component.
 */
export function ServicesSection() {
  const services = [
    {
      icon: WifiOff,
      title: 'Offline-Resilient Roll Capture',
      desc: 'Engineered specifically for low-reception village schools. Teachers mark rolls locally on mobile devices without network friction, syncing safely as soon as connectivity resumes.',
      highlights: [
        'Zero sync conflicts or overwritten registers',
        'Works seamlessly in dead zones and basements',
        'Instant 30-second morning roll completion',
      ],
    },
    {
      icon: Building2,
      title: 'Branch & Multi-School Oversight',
      desc: 'Centralized web portal for Headmasters and District Trustees. View real-time morning submission progress across all grades, detect overdue classes, and audit historical sessions.',
      highlights: [
        'Configurable morning cutoff deadlines',
        'Real-time class submission tracker',
        'Role-scoped access for Branch and School Admins',
      ],
    },
    {
      icon: FileSpreadsheet,
      title: 'Batch Roster Onboarding (Excel & CSV)',
      desc: 'Eliminate tedious manual student entry. Ingest hundreds of enrolled students and section distributions from standard spreadsheet templates with immediate error checks.',
      highlights: [
        'Supports .xlsx, .xls, and .csv files',
        'Automatic validation of roll numbers and genders',
        'Roll-over student rosters across academic sessions',
      ],
    },
    {
      icon: UtensilsCrossed,
      title: 'Nutrition & Meal Program Audits',
      desc: 'Eliminate over-rationing or student meal shortages. RuralAttend produces verified daily headcount reports that align directly with Mid-Day Meal (MDM) government compliance.',
      highlights: [
        'Tamper-resistant daily headcount log',
        'Exportable monthly grain reconciliation',
        'Direct alignment with government quota schemas',
      ],
    },
    {
      icon: UserCheck,
      title: 'Teacher Provisioning & Substitute Cover',
      desc: 'Safely assign class teachers, create temporary credentials for new staff with one-click print slips, and manage substitute teacher assignments for seamless daily continuity.',
      highlights: [
        'One-time credential slips for teachers',
        'Substitute coverage without messy paper notes',
        'Clean section and subject teacher allocations',
      ],
    },
    {
      icon: TrendingDown,
      title: 'Early Dropout & Anomaly Detection',
      desc: 'Catch irregular absences before they result in permanent student dropouts. Spot patterns of consecutive missed days to trigger timely community teacher visits.',
      highlights: [
        'Consecutive absence threshold alerts',
        'Gender-stratified retention trends',
        'Exportable student attendance history sheets',
      ],
    },
  ];

  return (
    <section className="lp-services-section" id="services">
      <div className="landing-container">
        <div className="lp-section-header">
          <span className="landing-pill teal">Comprehensive Platform Services</span>
          <h2 className="lp-section-title">
            Everything your school network needs to modernize daily governance.
          </h2>
          <p className="lp-section-subtitle">
            From the morning assembly bell to the annual government audit, RuralAttend replaces
            cumbersome paper bureaucracy with clarity and confidence.
          </p>
        </div>

        <div className="lp-services-grid">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div key={index} className="lp-service-card">
                <div className="lp-service-icon">
                  <Icon size={24} />
                </div>
                <h3 className="lp-service-title">{service.title}</h3>
                <p className="lp-service-desc">{service.desc}</p>
                <ul className="lp-service-highlights">
                  {service.highlights.map((h, i) => (
                    <li key={i}>
                      <CheckCircle2 size={14} />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
