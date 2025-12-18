import { motion } from "framer-motion";
import { SignInButton, SignedIn, SignedOut } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

const IntroPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 text-center p-6">
      <motion.h1
        className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Sangrahak
      </motion.h1>

      <motion.p
        className="text-gray-600 dark:text-gray-300 text-lg max-w-xl mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        An AI-powered Inventory & Depot Management System that helps you track, forecast, and optimize resources efficiently.
      </motion.p>

      {/* When user is signed out */}
      <SignedOut>
        <SignInButton mode="modal">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 bg-blue-600 text-white text-lg font-medium rounded-xl shadow-md hover:bg-blue-700 transition"
          >
            Get Started
          </motion.button>
        </SignInButton>
      </SignedOut>

      {/* When user is signed in */}
      <SignedIn>
        <motion.button
          onClick={() => navigate("/dashboard")}
          className="px-8 py-3 bg-emerald-600 text-white text-lg font-medium rounded-xl shadow-md hover:bg-emerald-700 transition"
        >
          Go to Dashboard
        </motion.button>
      </SignedIn>
    </div>
  );
};

export default IntroPage;
