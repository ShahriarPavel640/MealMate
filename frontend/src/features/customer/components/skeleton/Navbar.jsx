import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { userAuthStore } from "@/features/customer/store/userAuthStore";
import { useRiderAuthStore } from "@/features/rider/store/riderAuthStore";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const logout = userAuthStore((state) => state.logout);
  const authUser = userAuthStore((state) => state.authUser);

  const { authrider, logout: riderLogout } = useRiderAuthStore();
  const navigate = useNavigate();

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
            <Link to="/profile">
              {authUser.name || authUser.user?.name || "Profile"}
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
            <Link to="/rider/data/profile">{authrider.name}</Link>
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
    <nav className="bg-[#e21b70] text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold">
          MealMate
        </Link>

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

        {/* Mobile Menu Button */}
        <button
          className="md:hidden focus:outline-none"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
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
                className="hover:underline"
              >
                Profile
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
