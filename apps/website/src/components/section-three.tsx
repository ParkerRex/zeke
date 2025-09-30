"use client";

import { CtaLink } from "@/components/cta-link";
import { motion } from "framer-motion";

export function SectionThree() {
  return (
    <section className="relative mb-12 group">
      <div className="border border-border container dark:bg-[#121212] p-8 md:p-10 md:pb-0 overflow-hidden">
        <div className="flex flex-col md:space-x-12 md:flex-row">
          <div className="xl:mt-6 md:max-w-[40%] md:mr-8 md:mb-8">
            <h3 className="font-medium text-xl md:text-2xl mb-4">
              How Zeke works
            </h3>

            <p className="text-[#878787] md:mb-4 text-sm">
              Discover → Analyze → Apply → Create. Zeke ingests the long-form
              content you care about, flags what is truly new, and turns it into
              role-aware plans and outputs with citations the whole way.
            </p>

            <div className="flex flex-col space-y-2 mt-8">
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
                  Ingest podcasts, videos, papers, and posts in one queue
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
                  Auto-transcribe, tag, and index each claim with receipts
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
                  Spot novelty, contradictions, and trendlines automatically
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
                  Map insights to the goals and SOPs your team runs on
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
                  Generate briefs, playbooks, and content with sources attached
                </span>
              </div>
            </div>

            <div className="absolute bottom-6">
              <CtaLink text="Watch the workflow" />
            </div>
          </div>

          <div className="relative mt-8 md:mt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.7 }}
              viewport={{ once: true }}
              className="absolute -left-[80px] top-[200px]"
            >
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-900 rounded-lg flex items-center justify-center size-[135px]">
                <div className="text-center text-blue-600 dark:text-blue-300">
                  <div className="size-8 mx-auto mb-2 bg-blue-300 dark:bg-blue-600 rounded flex items-center justify-center">
                    <svg
                      className="size-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p className="text-xs">Tagged</p>
                </div>
              </div>
            </motion.div>

            <div className="scale-75 md:scale-100">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 1.2 }}
                viewport={{ once: true }}
                className="absolute -right-[65px] md:-right-[15px] md:-top-[20px]"
              >
                <div className="bg-gradient-to-br from-green-100 to-green-200 dark:from-green-800 dark:to-green-900 rounded-lg flex items-center justify-center w-[238px] h-[124px]">
                  <div className="text-center text-green-600 dark:text-green-300">
                    <div className="size-8 mx-auto mb-2 bg-green-300 dark:bg-green-600 rounded flex items-center justify-center">
                      <svg
                        className="size-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <p className="text-xs">Breakdown</p>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg flex items-center justify-center h-[400px] -mb-[32px] md:-mb-[1px] mt-8 md:mt-0">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <div className="size-16 mx-auto mb-4 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="size-8"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-sm">Zeke Pipeline</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
