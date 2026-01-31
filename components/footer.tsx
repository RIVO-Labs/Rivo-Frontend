'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  RiGithubFill,
  RiInstagramFill,
  RiMailLine,
  RiMapPinLine,
  RiSecurePaymentLine,
  RiShieldCheckLine,
  RiLineChartLine,
  RiDashboardLine,
  RiRocketLine,
  RiStarFill,
} from 'react-icons/ri';

export function Footer() {
  return (
    <footer className="bg-gradient-to-br from-primary to-primary/80 py-16 text-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute top-10 left-10"
        >
          <RiLineChartLine className="h-32 w-32" />
        </motion.div>
        <motion.div
          animate={{ rotate: -360, scale: [1, 0.8, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-10 right-10"
        >
          <RiSecurePaymentLine className="h-28 w-28" />
        </motion.div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Main grid */}
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand & tagline */}
          <div className="md:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="mb-6 flex items-center gap-3"
            >
              <div className="relative">
                <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <span className="text-4xl font-black text-white">F</span>
                </div>
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-1 -right-1"
                >
                  <RiStarFill className="h-4 w-4 text-yellow-400" />
                </motion.div>
              </div>
            </motion.div>
            <div className="mb-4">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <RiDashboardLine className="h-6 w-6 text-white" />
                Rivo
              </h3>
              <p className="text-sm text-white flex items-center gap-2 mt-2">
                <RiSecurePaymentLine className="h-4 w-4 text-white" />
                Programmable Work Agreements for Global Freelance Teams
              </p>
            </div>
            <p className="text-white flex items-start gap-2">
              <RiShieldCheckLine className="h-5 w-5 text-white mt-1 flex-shrink-0" />
              Freedom of work, with trust locked and executed by code. Build work agreements that automatically execute on Base blockchain.
            </p>
          </div>

          {/* Platform Features */}
          <div className="md:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <h4 className="mb-6 font-semibold text-white flex items-center gap-2">
                <RiRocketLine className="h-5 w-5 text-white" />
                Platform Features
              </h4>
              <ul className="space-y-4">
                <li>
                  <Link href="/dashboard/agreements" className="text-white transition-colors hover:text-white flex items-center gap-2">
                    <RiLineChartLine className="h-4 w-4" />
                    Work Agreements
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/escrow" className="text-white transition-colors hover:text-white flex items-center gap-2">
                    <RiDashboardLine className="h-4 w-4" />
                    Escrow Management
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/payments" className="text-white transition-colors hover:text-white flex items-center gap-2">
                    <RiRocketLine className="h-4 w-4" />
                    Global Payouts
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/disputes" className="text-white transition-colors hover:text-white flex items-center gap-2">
                    <RiShieldCheckLine className="h-4 w-4" />
                    Dispute Protection
                  </Link>
                </li>
              </ul>
            </motion.div>
          </div>

          {/* Contact */}
          <div className="md:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h4 className="mb-6 font-semibold text-white flex items-center gap-2">
                <RiMailLine className="h-5 w-5 text-white" />
                Contact Us
              </h4>
              <ul className="space-y-4 text-white">
                <li className="flex items-center gap-3">
                  <RiMailLine className="h-5 w-5 text-white flex-shrink-0" />
                  <span>hello@Rivo.work</span>
                </li>
                <li className="flex items-center gap-3">
                  <RiGithubFill className="h-5 w-5 text-white flex-shrink-0" />
                  <span>https://github.com/Rivo-labs</span>
                </li>
                <li className="flex items-start gap-3">
                  <RiMapPinLine className="h-5 w-5 text-white flex-shrink-0 mt-1" />
                  <span>Global & Decentralized</span>
                </li>
              </ul>
            </motion.div>
          </div>

          {/* Social & Development */}
          <div className="md:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <h4 className="mb-6 font-semibold text-white flex items-center gap-2">
                <RiGithubFill className="h-5 w-5 text-white" />
                Connect With Us
              </h4>
              
              {/* Social Links */}
              <div className="mb-6">
                <p className="text-white mb-4">Follow our journey:</p>
                <div className="flex gap-4">
                  <motion.a
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    href=""
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white/10 rounded-lg hover:bg-emerald-500/20 transition-colors"
                  >
                    <RiGithubFill className="h-5 w-5" />
                  </motion.a>
                  <motion.a
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    href=""
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white/10 rounded-lg hover:bg-emerald-500/20 transition-colors"
                  >
                    <RiInstagramFill className="h-5 w-5" />
                  </motion.a>
                </div>
              </div>
              
              {/* Repository Link */}
              <div>
                <Link
                  href=""
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-white transition-colors hover:text-emerald-400 bg-white/10 px-4 py-2 rounded-lg hover:bg-emerald-500/20"
                >
                  <RiGithubFill className="h-4 w-4" />
                  <span>View Source Code</span>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 border-t border-white/20 pt-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white flex items-center gap-2">
              © 2025 Rivo Platform. 
            </p>
            <div className="flex items-center gap-4 text-sm text-white">
              <span className="hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer">
                <RiShieldCheckLine className="h-4 w-4" />
                Privacy Policy
              </span>
              <span>•</span>
              <span className="hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer">
                <RiSecurePaymentLine className="h-4 w-4" />
                Terms of Service
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
