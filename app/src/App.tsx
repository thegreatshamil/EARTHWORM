import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import Navbar from '@/components/navbar/Navbar';
import HomePage from '@/pages/HomePage';
import ChatPage from '@/pages/ChatPage';
import AccountPage from '@/pages/AccountPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import type { Page } from '@/types';
import './App.css';

// Page transition variants
const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const pageTransition = {
  duration: 0.25,
  ease: [0.22, 1, 0.36, 1] as const,
};

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated and trying to access protected pages
  const handlePageChange = (page: Page) => {
    const protectedPages: Page[] = ['home', 'chat', 'account'];
    if (protectedPages.includes(page) && !isAuthenticated) {
      setCurrentPage('login');
    } else {
      setCurrentPage(page);
    }
  };

  const renderPage = () => {
    // If not authenticated, only show login or register
    if (!isAuthenticated) {
      switch (currentPage) {
        case 'register':
          return <RegisterPage onPageChange={handlePageChange} />;
        case 'login':
        default:
          return <LoginPage onPageChange={handlePageChange} />;
      }
    }

    // If authenticated, show normal pages
    switch (currentPage) {
      case 'home':
        return <HomePage onPageChange={handlePageChange} />;
      case 'chat':
        return <ChatPage onPageChange={handlePageChange} />;
      case 'account':
        return <AccountPage onPageChange={handlePageChange} />;
      case 'login':
        // If already authenticated, redirect to home
        return <HomePage onPageChange={handlePageChange} />;
      case 'register':
        // If already authenticated, redirect to home
        return <HomePage onPageChange={handlePageChange} />;
      default:
        return <HomePage onPageChange={handlePageChange} />;
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#28282B] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-3 border-[#f4d03f]/30 border-t-[#f4d03f] rounded-full"
        />
      </div>
    );
  }

  // Show auth pages without navbar
  if (!isAuthenticated) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
        >
          {renderPage()}
        </motion.div>
      </AnimatePresence>
    );
  }

  // Show normal app with navbar
  return (
    <div className="min-h-screen bg-[#28282B] text-foreground">
      {/* Navbar - always visible when authenticated */}
      <Navbar currentPage={currentPage} onPageChange={handlePageChange} />

      {/* Page content with transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
          className={currentPage === 'chat' ? 'h-screen pt-20' : ''}
        >
          {renderPage()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
