import React from 'react';

const shell: React.CSSProperties = {
  minHeight: '100vh',
  padding: '40px 20px',
  background: 'var(--bg)',
  color: 'var(--text)',
  fontFamily: 'Inter, system-ui, sans-serif',
};

const card: React.CSSProperties = {
  maxWidth: 900,
  margin: '0 auto',
  padding: 32,
  border: '1px solid var(--line)',
  borderRadius: 18,
  background: 'var(--panel)',
  lineHeight: 1.7,
};

const linkStyle: React.CSSProperties = {
  color: 'var(--accent-2)',
  textDecoration: 'none',
};

export function TermsPage() {
  return (
    <div style={shell}>
      <main style={card}>
        <h1>TGS Tournament Manager — Terms of Service</h1>
        <p>Last updated: September 18, 2026</p>
        <p>
          TGS Tournament Manager is a web application for creating and managing
          gaming tournaments, players, fixtures, scores, and reports.
        </p>
        <h2>1. Use of the Service</h2>
        <p>
          You agree to use the application lawfully and only for legitimate
          tournament-management purposes.
        </p>
        <h2>2. Accounts and Data</h2>
        <p>
          You are responsible for information entered into your account and
          tournament records. Do not enter passwords, payment information, or
          other sensitive information that is not required by the application.
        </p>
        <h2>3. Tournament Content</h2>
        <p>
          Tournament names, player names, scores, fixture information, and
          related content are provided by users. Users are responsible for the
          accuracy and legality of content they enter.
        </p>
        <h2>4. Availability</h2>
        <p>
          The service may be updated, changed, suspended, or discontinued
          without notice. Features may change over time.
        </p>
        <h2>5. Third-Party Services</h2>
        <p>
          The application may use third-party services such as hosting and
          database providers. Their own terms may also apply.
        </p>
        <h2>6. Disclaimer</h2>
        <p>
          The service is provided on an “as is” and “as available” basis to the
          extent permitted by applicable law.
        </p>
        <h2>7. Contact</h2>
        <p>
          For questions about these terms, use the contact method provided by
          the TGS project owner.
        </p>
        <p><a href="/" style={linkStyle}>← Back to TGS Tournament Manager</a></p>
      </main>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <div style={shell}>
      <main style={card}>
        <h1>TGS Tournament Manager — Privacy Policy</h1>
        <p>Last updated: September 18, 2026</p>
        <p>
          This policy explains what information TGS Tournament Manager may
          process to provide its features.
        </p>
        <h2>1. Information We May Process</h2>
        <p>
          Depending on how the application is used, this may include account
          information such as name and email address, tournament information,
          player names, fixtures, scores, reports, and technical information
          needed to operate the service.
        </p>
        <h2>2. How Information Is Used</h2>
        <p>
          Information may be used to provide tournament-management features,
          save and display tournament records, authenticate users, maintain the
          service, troubleshoot problems, and improve the application.
        </p>
        <h2>3. Sharing</h2>
        <p>
          We do not sell personal information. Information may be processed by
          service providers used to host, store, secure, or operate the
          application.
        </p>
        <h2>4. Public Tournament Information</h2>
        <p>
          Tournament and player information may be shared or displayed through
          features that users choose to publish or share. Do not enter
          information that should remain private.
        </p>
        <h2>5. Data Security</h2>
        <p>
          Reasonable measures are used to protect information, but no online
          service can guarantee absolute security.
        </p>
        <h2>6. Data Requests</h2>
        <p>
          For privacy questions or requests concerning your information,
          contact the TGS project owner.
        </p>
        <p><a href="/" style={linkStyle}>← Back to TGS Tournament Manager</a></p>
      </main>
    </div>
  );
}
