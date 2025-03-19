import { useLocation, Link } from "wouter";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  sessionId: string;
}

const Sidebar = ({ isOpen, onToggle, sessionId }: SidebarProps) => {
  const [location] = useLocation();
  
  const navItems = [
    { path: "/upload", label: "File Upload", icon: "fas fa-upload" },
    { path: "/results", label: "Results", icon: "fas fa-table" },
    { path: "/visualization", label: "3D Visualization", icon: "fas fa-cube" },
    { path: "/settings", label: "Settings", icon: "fas fa-cog" },
    { path: "/logs", label: "Logs", icon: "fas fa-list" }
  ];
  
  const isActive = (path: string) => location === path;
  
  return (
    <div className={`bg-white shadow-md border-r border-gray-200 w-full md:w-64 md:fixed md:h-full z-10 ${isOpen ? '' : 'hidden md:block'}`}>
      <div className="flex items-center justify-between md:justify-center px-4 py-6 border-b border-gray-200">
        {/* Using button instead of Link when on home page to avoid nested anchors */}
        {location === "/" ? (
          <div className="flex items-center space-x-2">
            <svg className="h-8 w-8 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.75 2a3.75 3.75 0 0 1 3.75 3.75v1.875h1.5a3 3 0 0 1 3 3v9.375a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V10.625a3 3 0 0 1 3-3h1.5V5.75A3.75 3.75 0 0 1 11.25 2h1.5Zm3 5.625V5.75a2.25 2.25 0 0 0-2.25-2.25h-1.5a2.25 2.25 0 0 0-2.25 2.25v1.875h6Z"></path>
            </svg>
            <h1 className="text-xl font-bold text-gray-800">STL Processor</h1>
          </div>
        ) : (
          <Link href="/" className="flex items-center space-x-2">
            <svg className="h-8 w-8 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.75 2a3.75 3.75 0 0 1 3.75 3.75v1.875h1.5a3 3 0 0 1 3 3v9.375a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V10.625a3 3 0 0 1 3-3h1.5V5.75A3.75 3.75 0 0 1 11.25 2h1.5Zm3 5.625V5.75a2.25 2.25 0 0 0-2.25-2.25h-1.5a2.25 2.25 0 0 0-2.25 2.25v1.875h6Z"></path>
            </svg>
            <h1 className="text-xl font-bold text-gray-800">STL Processor</h1>
          </Link>
        )}
        
        <button 
          className="md:hidden text-gray-600 focus:outline-none" 
          onClick={onToggle}
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <nav className="px-2 py-4">
        <ul>
          {navItems.map((item) => (
            <li className="mb-2" key={item.path}>
              {/* Skip generating Link component when already on that page */}
              {isActive(item.path) ? (
                <div 
                  className="flex items-center px-4 py-3 rounded-lg font-medium bg-primary-50 text-gray-700"
                >
                  <i className={`${item.icon} w-5 h-5 mr-3 text-primary-600`}></i>
                  <span>{item.label}</span>
                </div>
              ) : (
                <Link 
                  href={item.path} 
                  className="flex items-center px-4 py-3 rounded-lg font-medium text-gray-600 hover:bg-gray-100"
                >
                  <i className={`${item.icon} w-5 h-5 mr-3 text-gray-500`}></i>
                  <span>{item.label}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="border-t border-gray-200 px-4 py-6 mt-auto hidden md:block">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
            U
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">User</p>
            <p className="text-xs text-gray-500 truncate" title={sessionId}>Session: {sessionId.slice(0, 8)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
