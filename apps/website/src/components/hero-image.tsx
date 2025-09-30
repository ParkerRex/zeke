"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export function HeroImage() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="scale-100 sm:scale-100 md:scale-[0.9] lg:scale-[0.7] xl:scale-100 mt-10 md:mt-0 lg:absolute -right-[420px] -top-[100px] 2xl:scale-[1.35] 2xl:-top-[20px] z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="[transform:perspective(4101px)_rotateX(51deg)_rotateY(-13deg)_rotateZ(40deg)]">
          <div
            className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border border-border rounded-lg flex items-center justify-center dark:[box-shadow:0px_80px_60px_0px_rgba(0,0,0,0.35),0px_35px_28px_0px_rgba(0,0,0,0.25),0px_18px_15px_0px_rgba(0,0,0,0.20),0px_10px_8px_0px_rgba(0,0,0,0.17),0px_5px_4px_0px_rgba(0,0,0,0.14),0px_2px_2px_0px_rgba(0,0,0,0.10)] [box-shadow:0px_82px_105px_0px_#E3E2DF7A,0px_29.93px_38.33px_0px_#E3E2DF54,0px_14.53px_18.61px_0px_#E3E2DF44,0px_7.12px_9.12px_0px_#E3E2DF36,0px_2.82px_3.61px_0px_#E3E2DF26]"
            style={{ width: 1141, height: 641 }}
            onLoad={() => setIsLoaded(true)}
          >
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div className="size-24 mx-auto mb-6 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                <svg
                  className="size-12"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-lg font-medium">Dashboard Interface</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                Research & Analytics Platform
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
