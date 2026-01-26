import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {isMobile && mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      <AppSidebar
        collapsed={isMobile ? !mobileMenuOpen : sidebarCollapsed}
        onToggle={() => {
          if (isMobile) {
            setMobileMenuOpen(!mobileMenuOpen);
          } else {
            setSidebarCollapsed(!sidebarCollapsed);
          }
        }}
        isMobile={isMobile}
        mobileMenuOpen={mobileMenuOpen}
      />
      
      <main
        className={cn(
          "min-h-screen transition-all duration-300",
          isMobile ? "ml-0" : (sidebarCollapsed ? "ml-16" : "ml-60")
        )}
      >
        {/* Mobile header */}
        {isMobile && (
          <div className="sticky top-0 z-30 bg-card border-b border-border h-14 flex items-center px-4 gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-semibold text-foreground">StudyPlus</span>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
