import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, History, Wallet, User, MessageCircle, LogOut, Menu, X, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRiderAuthStore } from '@/features/rider/store/riderAuthStore';

const RiderLayout = ({ children, onChatClick }) => {
  const { authrider, logout } = useRiderAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/rider', icon: Home },
    { name: 'History', path: '/rider/history', icon: History },
    { name: 'Earnings', path: '/rider/earnings', icon: Wallet },
    { name: 'Profile', path: '/rider/data/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row tracking-tight relative pb-16 md:pb-0">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white/90 backdrop-blur-md text-gray-900 p-4 flex justify-between items-center sticky top-0 z-40 shadow-sm border-b border-gray-200">
        <Link to="/rider" className="text-xl font-extrabold flex items-center text-[#e21b70]">
          <Package className="w-6 h-6 mr-2" /> MealMate
        </Link>
        <div className="flex items-center space-x-2">
          {onChatClick && (
            <button onClick={onChatClick} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
              <MessageCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div 
        className={`hidden md:flex bg-white/70 backdrop-blur-xl border-r border-gray-200 flex-col fixed h-full z-10 shadow-sm transition-all duration-300 ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className={`p-6 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          <Link to="/rider" className={`font-bold text-[#e21b70] flex items-center ${isSidebarCollapsed ? '' : 'text-2xl'}`}>
            <Package className={`${isSidebarCollapsed ? 'w-8 h-8' : 'w-8 h-8 mr-2'}`} /> 
            {!isSidebarCollapsed && <span>MealMate</span>}
          </Link>
          {!isSidebarCollapsed && (
            <button 
              onClick={() => setIsSidebarCollapsed(true)} 
              className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {isSidebarCollapsed && (
          <div className="flex justify-center mb-6">
            <button 
              onClick={() => setIsSidebarCollapsed(false)} 
              className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className={`mt-4 mb-6 ${isSidebarCollapsed ? 'px-3' : 'px-6'}`}>
          {!isSidebarCollapsed && (
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Navigation</p>
          )}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  title={isSidebarCollapsed ? item.name : ""}
                  className={`flex items-center rounded-2xl transition-all duration-200 ${
                    isSidebarCollapsed ? 'p-3 justify-center' : 'p-3'
                  } ${
                    isActive 
                      ? 'bg-[#e21b70] text-white shadow-md shadow-[#e21b70]/30 font-semibold translate-x-1' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-[#e21b70]'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSidebarCollapsed ? '' : 'mr-3'}`} />
                  {!isSidebarCollapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
        
        {onChatClick && (
          <div className={`mb-6 ${isSidebarCollapsed ? 'px-3' : 'px-6'}`}>
            {!isSidebarCollapsed && (
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Communication</p>
            )}
            <button
              onClick={onChatClick}
              title={isSidebarCollapsed ? "Chats" : ""}
              className={`w-full flex items-center rounded-2xl transition-all duration-200 text-gray-600 hover:bg-purple-50 hover:text-purple-600 ${
                isSidebarCollapsed ? 'p-3 justify-center' : 'p-3'
              }`}
            >
              <MessageCircle className={`w-5 h-5 ${isSidebarCollapsed ? '' : 'mr-3'}`} />
              {!isSidebarCollapsed && <span>Chats</span>}
            </button>
          </div>
        )}
        
        <div className={`mt-auto p-4 border-t border-gray-100 ${isSidebarCollapsed ? 'flex flex-col items-center' : ''}`}>
          <div className={`flex items-center mb-4 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
            <div className={`w-10 h-10 rounded-full bg-[#e21b70]/10 text-[#e21b70] flex items-center justify-center font-bold text-lg ${isSidebarCollapsed ? '' : 'mr-3'}`}>
              {(authrider?.name || "R").charAt(0).toUpperCase()}
            </div>
            {!isSidebarCollapsed && (
              <div>
                <p className="font-semibold text-gray-900 leading-tight truncate w-32">{authrider?.name || "Rider"}</p>
                <p className="text-xs text-gray-500">Rider Account</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            title={isSidebarCollapsed ? "Logout" : ""}
            className={`flex items-center justify-center rounded-2xl transition-all duration-200 text-red-600 hover:bg-red-50 hover:shadow-sm font-medium ${
              isSidebarCollapsed ? 'w-full p-3' : 'w-full p-3'
            }`}
          >
            <LogOut className={`w-5 h-5 ${isSidebarCollapsed ? '' : 'mr-2'}`} />
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 w-full transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        {children}
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 flex justify-around p-3 z-40 pb-safe shadow-[0_-4px_10px_-2px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center p-2 rounded-xl transition-colors ${
                isActive ? 'text-[#e21b70]' : 'text-gray-500'
              }`}
            >
              <Icon className={`w-6 h-6 mb-1 ${isActive ? 'fill-[#e21b70]/20' : ''}`} />
              <span className="text-[10px] font-semibold">{item.name}</span>
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center p-2 rounded-xl transition-colors text-red-500"
        >
          <LogOut className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-semibold">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default RiderLayout;
