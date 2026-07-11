import { Link } from "react-router-dom";
import { FaFacebookF, FaTwitter, FaInstagram } from "react-icons/fa";

const CTASection = () => (
  <footer className="bg-gradient-to-r from-primary to-secondary text-white">
    {/* CTA Top */}
    <div className="py-16 text-center px-4 max-w-4xl mx-auto">
      <h2 className="text-4xl font-bold mb-4">
        Ready to order? Let's get started!
      </h2>
      <p className="text-xl text-white/90 mb-6">
        Join thousands of satisfied customers who trust FoodPanda for their food
        delivery needs.
      </p>
      <Link
        to="/restaurants"
        className="bg-yellow-400 text-black font-semibold py-3 px-8 rounded-full hover:bg-yellow-300 transition"
      >
        Browse Restaurants
      </Link>
    </div>

    {/* Footer Grid */}
    <div className="border-t border-white/20 py-10 px-6 sm:px-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-sm bg-primary-900">
      {/* About */}
      <div>
        <h4 className="font-bold mb-4">Company</h4>
        <ul className="space-y-2">
          <li>
            <Link to="/about" className="hover:underline">
              About Us
            </Link>
          </li>
          <li>
            <Link to="/partner" className="hover:underline">
              Partner
            </Link>
          </li>
          <li>
            <Link to="/rider/login" className="hover:underline">
              Rider
            </Link>
          </li>
          <li>
            <Link to="/careers" className="hover:underline">
              Careers
            </Link>
          </li>
          <li>
            <Link to="/terms" className="hover:underline">
              Terms & Conditions
            </Link>
          </li>
          <li>
            <Link to="/privacy" className="hover:underline">
              Privacy Policy
            </Link>
          </li>
        </ul>
      </div>

      {/* Help */}
      <div>
        <h4 className="font-bold mb-4">Support</h4>
        <ul className="space-y-2">
          <li>
            <Link to="/faq" className="hover:underline">
              FAQs
            </Link>
          </li>
          <li>
            <Link to="/contact" className="hover:underline">
              Contact Us
            </Link>
          </li>
          <li>
            <Link to="/help" className="hover:underline">
              Help Center
            </Link>
          </li>
        </ul>
      </div>

      {/* App Download */}
      {/* <div>
        <h4 className="font-bold mb-4">Get the App</h4>
        <div className="flex flex-col gap-3">
          <img src="/images/appstore.png" alt="App Store" className="w-32" />
          <img src="/images/playstore.png" alt="Google Play" className="w-32" />
        </div>
      </div> */}

      {/* Social & Location */}
      <div>
        <h4 className="font-bold mb-4">Connect</h4>
        <div className="flex gap-4 text-lg mb-4">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-yellow-400"
          >
            <FaFacebookF />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-yellow-400"
          >
            <FaTwitter />
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-yellow-400"
          >
            <FaInstagram />
          </a>
        </div>
        <p>Serving in: Dhaka, Chattogram, Sylhet & more</p>
        <p className="text-xs mt-2">© 2025 FoodPanda Bangladesh</p>
      </div>
    </div>
  </footer>
);

export default CTASection;
