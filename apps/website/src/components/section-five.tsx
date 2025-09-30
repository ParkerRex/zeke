"use client";

import { motion } from "framer-motion";
import { CtaLink } from "./cta-link";
import { ExportToast } from "./export-toast";

export function SectionFive() {
  return (
    <section className="flex justify-between space-y-12 lg:space-y-0 lg:space-x-8 flex-col lg:flex-row overflow-hidden mb-12">
      <div className="border border-border lg:basis-2/3 dark:bg-[#121212] p-10 flex lg:space-x-8 lg:flex-row flex-col-reverse lg:items-start group">
        <div className="mt-8 lg:mt-0 basis-1/2 max-w-[70%] sm:max-w-[50%] md:max-w-[35%]">
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg flex items-center justify-center aspect-square">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div className="size-16 mx-auto mb-4 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                <svg className="size-8" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 2L3 7v11a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V7l-7-5zM6 16H4v-2h2v2zm0-4H4v-2h2v2zm6 4h-2v-2h2v2zm0-4h-2v-2h2v2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-sm">Research Vault</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col basis-1/2 relative h-full">
          <h4 className="font-medium text-xl md:text-2xl mb-4">
            Research vault
          </h4>

          <p className="text-[#878787] mb-4 text-sm">
            Every transcript, claim, comment, and output lives in one vault with
            citations attached. No more scattered docs or mystery sources when
            leadership asks “where did this come from?”
          </p>

          <p className="text-[#878787] text-sm">
            Organize by projects, personas, industries, or campaigns. Zeke keeps
            the full trail from raw source → insight → playbook so you can pick
            up any thread instantly.
          </p>

          <div className="flex flex-col space-y-2 h-full mt-8">
            <div className="flex space-x-2 text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 18 13"
                fill="none"
                className="flex-none w-[1.125rem] h-[1lh]"
              >
                <path
                  fill="currentColor"
                  d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z"
                />
              </svg>
              <span className="text-primary">
                Automatic clustering by topic, persona, and business goal
              </span>
            </div>
            <div className="flex space-x-2 text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 18 13"
                fill="none"
                className="flex-none w-[1.125rem] h-[1lh]"
              >
                <path
                  fill="currentColor"
                  d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z"
                />
              </svg>
              <span className="text-primary">
                Semantic search across briefs, receipts, and comments
              </span>
            </div>

            <div className="absolute bottom-0 left-0">
              <CtaLink text="Keep everything cited" />
            </div>
          </div>
        </div>
      </div>

      <div className="border border-border basis-1/3 dark:bg-[#121212] p-10 flex flex-col group">
        <h4 className="font-medium text-xl md:text-2xl mb-4">Share anywhere</h4>
        <p className="text-[#878787] text-sm mb-8">
          Download a cited appendix for finance, drop a playbook into Notion, or
          push the brief straight into your CRM or project tool. Zeke packages
          every artifact with the proof teams expect.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-auto"
        >
          <ExportToast />
        </motion.div>

        <div className="mt-8 hidden md:flex">
          <CtaLink text="Deliver proof-ready updates" />
        </div>
      </div>
    </section>
  );
}
