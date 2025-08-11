import React from "react";
import "./Footer.css";


export default function Footer() {
  return (
    <footer className="pro-footer">
      <div className="pro-footer-main">
        <div className="pro-footer-brand">
          <span className="pro-footer-logo">King Online Learning Platform</span>
          <span className="pro-footer-slogan">Empowering Your Learning Journey</span>
        </div>
        <div className="pro-footer-links">
          <div>
            <div className="pro-footer-section-title">About</div>
            <a href="#">Our Story</a>
            <a href="#">Careers</a>
            <a href="#">Blog</a>
          </div>
          <div>
            <div className="pro-footer-section-title">Support</div>
            <a href="#">Help Center</a>
            <a href="#">Contact Us</a>
            <a href="#">Terms of Service</a>
            <a href="#">Privacy Policy</a>
          </div>
          <div>
            <div className="pro-footer-section-title">Contact</div>
            <div className="pro-footer-contact-row">
              <span>Email:</span>
              <a href="mailto:support@kolp.com">support@kolp.com</a>
            </div>
            <div className="pro-footer-contact-row">
              <span>Phone:</span>
              <a href="tel:+1234567890">+1 (234) 567-890</a>
            </div>
            <div className="pro-footer-contact-row">
              <span>Address:</span>
              <span>123 Main St, Sydney, NSW, Australia</span>
            </div>
          </div>
        </div>
      </div>
      <div className="pro-footer-divider" />
      <div className="pro-footer-bottom">
        <span>© {new Date().getFullYear()} EduPlatform. All rights reserved.</span>
        <div className="pro-footer-socials">
          <a href="#" aria-label="Facebook" className="pro-footer-social">
            {/* Facebook SVG */}
            <svg width="22" height="22" fill="none" viewBox="0 0 22 22"><circle cx="11" cy="11" r="11" fill="#F5F5F5"/><path d="M13.5 11H12v5H10v-5H9v-2h1V8.5A2.5 2.5 0 0 1 12.5 6h1V8h-1A.5.5 0 0 0 12 8.5V9h1.5v2Z" fill="#1976D2"/></svg>
          </a>
          <a href="#" aria-label="Twitter" className="pro-footer-social">
            {/* Twitter SVG */}
            <svg width="22" height="22" fill="none" viewBox="0 0 22 22"><circle cx="11" cy="11" r="11" fill="#F5F5F5"/><path d="M16 8.3a3.6 3.6 0 0 1-1 .3 1.8 1.8 0 0 0 .8-1c-.3.2-.7.4-1 .5A1.8 1.8 0 0 0 8.8 9.5a5.1 5.1 0 0 1-3.7-1.9s-1.1 2.2 1.3 3.2c-.3.1-.6.1-.9 0 .2.7.8 1.2 1.5 1.2a3.6 3.6 0 0 1-1 .1c.3.5.9.9 1.6.9A5.1 5.1 0 0 1 6 15c5.7 0 8.8-4.7 8.8-8.8v-.4A6.2 6.2 0 0 0 16 8.3Z" fill="#1976D2"/></svg>
          </a>
          <a href="#" aria-label="LinkedIn" className="pro-footer-social">
            {/* LinkedIn SVG */}
            <svg width="22" height="22" fill="none" viewBox="0 0 22 22"><circle cx="11" cy="11" r="11" fill="#F5F5F5"/><path d="M8.5 9.5H6.5v6h2v-6Zm-1-1.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm3.5 1.5h-2v6h2v-3c0-.6.4-1 1-1s1 .4 1 1v3h2v-3.5c0-1.4-1.1-2.5-2.5-2.5Z" fill="#1976D2"/></svg>
          </a>
        </div>
      </div>
    </footer>
  );
}

