import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Shield, Zap, MessageCircle, BarChart3, CreditCard, User, BookOpen, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, openAuthModal, logout } = useAuth();

  const navItems = [
    { name: 'Home', href: '/', icon: Shield },
    { name: 'Audit', href: '/audit', icon: Shield, protected: true },
    { name: 'Scanner', href: '/scanner', icon: BarChart3, protected: true },
    { name: 'Chatbot', href: '/chatbot', icon: MessageCircle, protected: true },
    { name: 'Dashboard', href: '/dashboard', icon: User, protected: true },
    { name: 'Pricing', href: '/pricing', icon: CreditCard },
    { name: 'Docs', href: '/docs', icon: BookOpen },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleNavClick = (item: any, e: React.MouseEvent) => {
    if (item.protected && !user) {
      e.preventDefault();
      openAuthModal();
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="relative">
              <Zap className="h-8 w-8 text-purple-primary animate-pulse-glow" />
              <div className="absolute inset-0 bg-gradient-primary rounded-full blur-sm opacity-50" />
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              AuditX
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={(e) => handleNavClick(item, e)}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-primary text-primary-foreground shadow-glow'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-2">
            {user ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {user.email}
                </span>
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => openAuthModal(true)}>
                  Login
                </Button>
                <Button size="sm" className="bg-gradient-primary hover:opacity-90" onClick={() => openAuthModal(false)}>
                  Sign Up
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-background/95 backdrop-blur-lg border-t border-border">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-primary text-primary-foreground shadow-glow'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
                onClick={(e) => {
                  handleNavClick(item, e);
                  if (!item.protected || user) setIsOpen(false);
                }}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            ))}
            <div className="flex flex-col space-y-2 px-3 pt-4 border-t border-border">
              {user ? (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground text-center">
                    {user.email}
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={logout}>
                    <LogOut className="h-4 w-4 mr-1" />
                    Logout
                  </Button>
                </div>
              ) : (
                <>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => openAuthModal(true)}>
                    Login
                  </Button>
                  <Button size="sm" className="w-full bg-gradient-primary hover:opacity-90" onClick={() => openAuthModal(false)}>
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;