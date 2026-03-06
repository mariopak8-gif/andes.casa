import Link from "next/link";
import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12 px-[5%]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="font-playfair text-xl font-bold">ANDES</span>
          </div>
          <p className="text-gray-400 text-sm">
            Empowering a Global Sharing Economy for Tomorrow's Leaders
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/about">About Us</Link>
            </li>
            <li>
              <Link href="/anti-fraud">Anti-fraud</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-lg mb-4">Support</h4>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li>
              <a href="#faq" className="hover:text-cyan-500 transition-colors">
                FAQ
              </a>
            </li>
            <li>
              <a
                href="#contact"
                className="hover:text-cyan-500 transition-colors"
              >
                Contact
              </a>
            </li>
            <li>
              <a
                href="#privacy"
                className="hover:text-cyan-500 transition-colors"
              >
                Privacy Policy
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
        <p>© 2026 ANDES. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
