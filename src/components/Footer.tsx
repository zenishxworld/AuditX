import { Github, Twitter, Linkedin, ArrowUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Footer = () => {
  const { user, openAuthModal } = useAuth();

  // Helper for protected nav
  const handleProtectedNav = (e: React.MouseEvent, path: string) => {
    if (!user) {
      e.preventDefault();
      openAuthModal();
    }
  };

  return (
    <footer className="bg-background border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col md:flex-row gap-12 md:gap-0 md:justify-between">
        {/* Left Column */}
        <div className="md:w-1/3 flex flex-col items-start mb-8 md:mb-0">
          <span className="text-2xl font-bold mb-2">AuditX</span>
          <p className="text-muted-foreground mb-4 max-w-xs">
            AI-powered tools to secure your smart contracts and protect your crypto assets.
          </p>
          <div className="flex space-x-4 mb-6">
            <a href="https://github.com/zenishxworld/auditx-stellar-guard" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <Github className="h-5 w-5 hover:text-primary transition-colors" />
            </a>
            {/* <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <Twitter className="h-5 w-5 hover:text-primary transition-colors" />
            </a>
            <a href="https://linkedin.com/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <Linkedin className="h-5 w-5 hover:text-primary transition-colors" />
            </a> */}
          </div>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center border border-border px-4 py-2 rounded hover:bg-accent transition-colors text-sm font-medium"
          >
            <ArrowUp className="h-4 w-4 mr-2" />
            Back to Top
          </button>
        </div>

        {/* Middle Column: Site Map */}
        <div className="md:w-1/3 mb-8 md:mb-0">
          <h3 className="font-semibold mb-4">Site Map</h3>
          <nav className="flex flex-col space-y-2">
            <Link to="/" className="hover:underline w-fit hover:text-primary transition-colors">Home</Link>
            <Link to="/audit" className="hover:underline w-fit hover:text-primary transition-colors" onClick={e => handleProtectedNav(e, '/audit')}>Audit</Link>
            <Link to="/scanner" className="hover:underline w-fit hover:text-primary transition-colors" onClick={e => handleProtectedNav(e, '/scanner')}>Scanner</Link>
            <Link to="/wallet-inspector" className="hover:underline w-fit hover:text-primary transition-colors" onClick={e => handleProtectedNav(e, '/wallet-inspector')}>Wallet Inspector</Link>
            {/* Chatbot removed */}
            <Link to="/dashboard" className="hover:underline w-fit hover:text-primary transition-colors" onClick={e => handleProtectedNav(e, '/dashboard')}>Dashboard</Link>
            <Link to="/pricing" className="hover:underline w-fit hover:text-primary transition-colors">Pricing</Link>
            <Link to="/docs" className="hover:underline w-fit hover:text-primary transition-colors">Docs</Link>
          </nav>
        </div>

        {/* Right Column: Credits */}
        <div className="md:w-1/3">
          <h3 className="font-semibold mb-4">Credits</h3>
          <div className="space-y-1">
            <div>Zenish Patel – Developer & System Designer</div>
            <div>Moksh Patel – Research & Documentation</div>
          </div>
        </div>
      </div>
      <hr className="border-border" />
      <div className="py-4 text-center text-xs text-muted-foreground">
        © 2025 AuditX. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;