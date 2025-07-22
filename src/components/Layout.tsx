import { ReactNode } from 'react';
import Navbar from './Navbar';
import AuthModal from './AuthModal';
import { Toaster } from '@/components/ui/toaster';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-16">
        {children}
      </main>
      <Footer />
      <AuthModal />
      <Toaster />
    </div>
  );
};

export default Layout;