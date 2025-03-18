import { useState, ReactNode } from "react";
import Sidebar from "./Sidebar";
import { useLocation } from "wouter";

interface LayoutProps {
  children: ReactNode;
  sessionId: string;
}

const Layout = ({ children, sessionId }: LayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [location] = useLocation();
  
  // Generate page title based on current route
  const getPageTitle = () => {
    switch (location) {
      case "/":
        return "STL Batch Processor";
      case "/upload":
        return "File Upload";
      case "/results":
        return "Results";
      case "/visualization":
        return "3D Visualization";
      case "/settings":
        return "Settings";
      case "/logs":
        return "Processing Logs";
      default:
        return "STL Batch Processor";
    }
  };
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={toggleSidebar} 
        sessionId={sessionId}
      />
      
      <div className="flex-1 md:ml-64 bg-gray-50">
        <header className="bg-white shadow-sm px-4 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">{getPageTitle()}</h2>
          <div className="md:hidden">
            <button 
              className="bg-white p-2 rounded-full text-gray-600 hover:text-gray-700 focus:outline-none"
              onClick={toggleSidebar}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </header>
        
        <main className="p-4 md:p-6">
          {children}
        </main>
        
        <footer className="bg-white py-4 px-6 border-t border-gray-200">
          <div className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} STL Batch Processor | Version 1.0.0
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
