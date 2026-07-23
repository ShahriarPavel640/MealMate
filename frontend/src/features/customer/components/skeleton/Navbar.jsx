import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, User, Bell, Info, Clock, Check } from "lucide-react";
import { userAuthStore } from "@/features/customer/store/userAuthStore";
import { useRiderAuthStore } from "@/features/rider/store/riderAuthStore";
import { useNotificationStore } from "@/features/customer/store/notificationStore";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const logout = userAuthStore((state) => state.logout);
  const authUser = userAuthStore((state) => state.authUser);

  const { authrider, logout: riderLogout } = useRiderAuthStore();
  const navigate = useNavigate();

  const { 
    notifications, 
    unreadCount, 
    fetchNotifications, 
    markAllAsRead, 
    loading, 
    hasMore 
  } = useNotificationStore();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef();

  // Fetch initial notifications when customer logs in
  useEffect(() => {
    if (authUser) {
      fetchNotifications(0, 10);
    }
  }, [authUser, fetchNotifications]);

  const handleScroll = (e) => {
    const { scrollHeight, scrollTop, clientHeight } = e.target;
    // Allow a 1px margin for fractional pixel rounding errors
    const bottom = Math.abs(scrollHeight - scrollTop - clientHeight) <= 1;
    if (bottom && hasMore && !loading) {
      fetchNotifications(notifications.length, 10);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    }

    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  const handleLogout = () => {
    if (authUser) {
      logout();
    } else if (authrider) {
      riderLogout();
    }
    navigate("/login");
  };

  const renderAuthButtons = () => {
    if (authUser) {
      return (
        <>
          <li>
            <Link to="/profile" className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-md transition-all shadow-sm">
              <div className="w-7 h-7 rounded-full bg-white text-[#e21b70] flex items-center justify-center font-bold text-sm">
                {(authUser.name || authUser.user?.name || "U").charAt(0).toUpperCase()}
              </div>
              <span className="font-semibold text-sm hidden sm:block">
                {authUser.name || authUser.user?.name || "Profile"}
              </span>
            </Link>
          </li>
          <li>
            <button
              onClick={handleLogout}
              className="px-4 py-1 border border-white rounded hover:bg-white hover:text-[#e21b70] transition"
            >
              Logout
            </button>
          </li>
        </>
      );
    } else if (authrider) {
      return (
        <>
          <li>
            <Link 
              to="/rider/data/profile"
              className="flex items-center gap-2 px-4 py-1.5 bg-white text-[#e21b70] font-semibold rounded-full hover:bg-gray-100 transition shadow-sm"
            >
              <User className="size-4" />
              {authrider.name}
            </Link>
          </li>
        </>
      );
    } else {
      return (
        <>
          <li>
            <Link
              to="/login"
              className="px-4 py-1 border border-white rounded hover:bg-white hover:text-[#e21b70] transition"
            >
              Login
            </Link>
          </li>
          <li>
            <Link
              to="/signup"
              className="px-4 py-1 border border-white rounded hover:bg-white hover:text-[#e21b70] transition"
            >
              Signup
            </Link>
          </li>
        </>
      );
    }
  };

  return (
    <nav className="bg-[#e21b70]/90 backdrop-blur-md text-white shadow-lg sticky top-0 z-50 border-b border-white/10 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold">
          MealMate
        </Link>

        <div className="flex items-center gap-4">
          {/* Desktop Links */}
          <ul className="hidden md:flex gap-6 items-center font-medium">
            {!authrider && (
              <>
                <li>
                  <Link to="/">Home</Link>
                </li>
                <li>
                  <Link to="/restaurants">Restaurants</Link>
                </li>
              </>
            )}

            {authUser && (
              <li>
                <Link to="/order-history">Orders</Link>
              </li>
            )}
            {renderAuthButtons()}
          </ul>

          {/* Always Visible Notification Bell */}
          {authUser && (
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications((v) => !v)}
                className="relative p-2 text-white hover:text-gray-200 transition"
              >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-white text-[#e21b70] text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div
                  className="absolute top-14 right-0 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden text-black transform transition-all origin-top-right animate-in fade-in zoom-in-95 duration-200"
                >
                  <div className="p-4 border-b border-gray-100 bg-white flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-800">
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <span className="bg-[#e21b70]/10 text-[#e21b70] text-xs font-bold px-2 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={markAllAsRead}
                      disabled={unreadCount === 0}
                      className={`text-xs flex items-center gap-1 transition-colors ${unreadCount > 0 ? 'text-gray-500 hover:text-[#e21b70]' : 'text-gray-300 cursor-not-allowed'}`}
                    >
                      <Check size={14} />
                      Mark all as read
                    </button>
                  </div>
                  {notifications.length > 0 ? (
                    <div 
                      className="max-h-64 overflow-y-auto"
                      onScroll={handleScroll}
                    >
                      {notifications.map((notif, index) => (
                        <div
                          key={index}
                          className={`p-4 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors flex items-start gap-3 cursor-pointer ${notif.is_read ? 'bg-white' : 'bg-[#e21b70]/5'}`}
                        >
                          <div className={`mt-0.5 p-1.5 rounded-full shrink-0 ${notif.is_read ? 'bg-gray-100 text-gray-500' : 'bg-[#e21b70]/10 text-[#e21b70]'}`}>
                            <Info size={16} />
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm leading-relaxed ${notif.is_read ? 'text-gray-700' : 'text-gray-900 font-semibold'}`}>
                              {notif.message}
                            </p>
                            <div className="flex items-center text-xs text-gray-500 mt-1.5 font-medium">
                              <Clock size={12} className="mr-1" />
                              {new Date(notif.created_at || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          </div>
                          {!notif.is_read && (
                            <div className="w-2 h-2 rounded-full bg-[#e21b70] mt-1.5 shrink-0 shadow-sm"></div>
                          )}
                        </div>
                      ))}
                      {loading && (
                        <div className="p-4 text-center">
                          <span className="text-sm text-gray-500">Loading...</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="p-4 text-sm text-gray-500 text-center">No notifications yet</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden focus:outline-none p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <ul className="md:hidden flex flex-col items-center gap-4 py-4 font-medium bg-[#e21b70] text-white">
          {!authrider && (
            <>
              <li>
                <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/restaurants"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Restaurants
                </Link>
              </li>
            </>
          )}

          {authUser ? (
            <>
              <li>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:underline"
                >
                  Profile
                </Link>
              </li>
              <li>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="px-4 py-1 border border-white rounded hover:bg-white hover:text-[#e21b70] transition"
                >
                  Logout
                </button>
              </li>
            </>
          ) : authrider ? (
            <li>
              <Link
                to="/rider/data/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-[#e21b70] font-semibold rounded-full hover:bg-gray-100 transition shadow-sm w-full"
              >
                <User className="size-4" />
                Profile ({authrider.name})
              </Link>
            </li>
          ) : (
            <>
              <li>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-1 border border-white rounded hover:bg-white hover:text-[#e21b70] transition"
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-1 border border-white rounded hover:bg-white hover:text-[#e21b70] transition"
                >
                  Signup
                </Link>
              </li>
            </>
          )}
        </ul>
      )}
    </nav>
  );
};

export default Navbar;
