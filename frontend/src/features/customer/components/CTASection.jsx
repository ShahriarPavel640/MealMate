import { Link } from "react-router-dom";
import { FaFacebookF, FaTwitter, FaInstagram } from "react-icons/fa";

const CTASection = () => (
  <footer className="flex flex-col">
    {/* CTA Top - Premium Dark */}
    <div className="bg-[#0f0f0f] py-24 text-center px-4 relative z-10">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-5xl font-extrabold mb-6 tracking-tight text-white drop-shadow-md">
          Ready to order? Let's get started!
        </h2>
        <p className="text-xl text-gray-400 mb-10 font-medium max-w-2xl mx-auto">
          Join thousands of satisfied customers who trust MealMate for their food
          delivery needs.
        </p>
        <Link
          to="/restaurants"
          className="bg-[#e21b70] hover:bg-[#c2145d] text-white font-bold py-4 px-10 rounded-full transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 inline-block"
        >
          Browse Restaurants
        </Link>
      </div>
    </div>

    {/* Footer Grid - Red/Pink Gradient */}
    <div className="bg-gradient-to-br from-[#e21b70] via-pink-500 to-orange-400 border-t border-white/20 py-12 px-6 sm:px-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 text-sm">
      {/* About */}
      <div>
        <h4 className="font-bold text-lg mb-6 text-white drop-shadow-sm">Company</h4>
        <ul className="space-y-3 text-white/90 font-medium">
          <li>
            <Link to="/about" className="hover:text-white hover:underline transition-colors">
              About Us
            </Link>
          </li>
          <li>
            <Link to="/partner" className="hover:text-white hover:underline transition-colors">
              Partner
            </Link>
          </li>
          <li>
            <Link to="/rider/login" className="hover:text-white hover:underline transition-colors">
              Rider
            </Link>
          </li>
          <li>
            <Link to="/careers" className="hover:text-white hover:underline transition-colors">
              Careers
            </Link>
          </li>
          <li>
            <Link to="/terms" className="hover:text-white hover:underline transition-colors">
              Terms & Conditions
            </Link>
          </li>
          <li>
            <Link to="/privacy" className="hover:text-white hover:underline transition-colors">
              Privacy Policy
            </Link>
          </li>
        </ul>
      </div>

      {/* Help */}
      <div>
        <h4 className="font-bold text-lg mb-6 text-white drop-shadow-sm">Support</h4>
        <ul className="space-y-3 text-white/90 font-medium">
          <li>
            <Link to="/faq" className="hover:text-white hover:underline transition-colors">
              FAQs
            </Link>
          </li>
          <li>
            <Link to="/contact" className="hover:text-white hover:underline transition-colors">
              Contact Us
            </Link>
          </li>
          <li>
            <Link to="/help" className="hover:text-white hover:underline transition-colors">
              Help Center
            </Link>
          </li>
        </ul>
      </div>

      {/* Social & Location */}
      <div className="text-white/90 font-medium">
        <h4 className="font-bold text-lg mb-6 text-white drop-shadow-sm">Connect</h4>
        <div className="flex gap-5 text-xl mb-6">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-yellow-400 text-white transition-colors bg-white/10 p-3 rounded-full hover:bg-white/20 border border-white/20"
          >
            <FaFacebookF />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-yellow-400 text-white transition-colors bg-white/10 p-3 rounded-full hover:bg-white/20 border border-white/20"
          >
            <FaTwitter />
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-yellow-400 text-white transition-colors bg-white/10 p-3 rounded-full hover:bg-white/20 border border-white/20"
          >
            <FaInstagram />
          </a>
        </div>
        <p className="mb-2 font-medium text-white">Serving in: Dhaka, Chattogram, Sylhet & more</p>
        <p className="text-xs text-white/70 mt-4">© 2026 MealMate Bangladesh. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default CTASection;
