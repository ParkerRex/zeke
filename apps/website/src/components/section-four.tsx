"use client";

import { motion } from "framer-motion";
import { CtaLink } from "./cta-link";

export function SectionFour() {
  return (
    <section className="flex justify-between space-y-12 lg:space-y-0 lg:space-x-8 flex-col lg:flex-row overflow-hidden mb-12 relative">
      <div className="border border-border md:basis-2/3 dark:bg-[#121212] p-10 flex justify-between md:space-x-8 md:flex-row flex-col group">
        <div className="flex flex-col md:basis-1/2">
          <h4 className="font-medium text-xl md:text-2xl mb-4">
            Applied playbooks
          </h4>

          <p className="text-[#878787] md:mb-4 text-sm">
            From the brief screen you can turn insights into role-aware plans in
            seconds. Pick the outcome—campaign, experiment, enablement brief—and
            Zeke drafts it with cited context from the sources you ingested.
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
                Launch briefs, GTM plans, enablement, or experiments with one
                click
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
                Auto-fill your team&apos;s goals, KPIs, and SOP templates
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
                Assign owners, due dates, and next steps directly from the brief
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
                Keep citations inline so stakeholders can audit in seconds
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
                Export to docs, decks, or APIs while preserving the receipt
                trail
              </span>
            </div>
          </div>

          <div className="absolute bottom-6">
            <CtaLink text="Generate your first playbook" />
          </div>
        </div>

        <div className="relative mt-12 md:mt-0 md:basis-1/2 flex items-end justify-center">
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg flex items-center justify-center w-[492px] h-[360px]">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div className="size-16 mx-auto mb-4 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                <svg className="size-8" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-sm">Playbook Builder</p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 1 }}
            viewport={{ once: true }}
            className="absolute right-[30px] bottom-[120px]"
          >
            <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-800 dark:to-yellow-900 rounded-lg flex items-center justify-center w-[174px] h-[86px]">
              <div className="text-center text-yellow-600 dark:text-yellow-300">
                <div className="size-6 mx-auto mb-2 bg-yellow-300 dark:bg-yellow-600 rounded flex items-center justify-center">
                  <svg
                    className="size-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-xs">Comments</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 1.5 }}
            viewport={{ once: true }}
            className="absolute left-8 bottom-[100px]"
          >
            <div className="bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-800 dark:to-purple-900 rounded-lg flex items-center justify-center w-[136px] h-[34px]">
              <div className="text-center text-purple-600 dark:text-purple-300">
                <p className="text-xs">Toolbar</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="border border-border basis-1/3 dark:bg-[#121212] p-10 flex flex-col relative group">
        <h4 className="font-medium text-xl md:text-2xl mb-4">Evidence inbox</h4>
        <ul className="list-decimal list-inside text-[#878787] text-sm space-y-2 leading-relaxed">
          <li>Forward sources or drop links into the Zeke inbox.</li>
          <li>
            We transcribe, index, and attach each receipt to the claims in your
            briefs.
          </li>
          <li>
            Every playbook stays audit-ready—open the exact quote or timestamp
            in one click.
          </li>
        </ul>

        <div className="flex flex-col space-y-2 mb-6 mt-8">
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
              Personalized intake address plus drag-and-drop uploads
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
              Semantic search across comments, claims, and transcripts
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
              Automatic attachments keep every artifact linked to its proof
            </span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 1.4 }}
          viewport={{ once: true }}
          className="xl:absolute bottom-[100px]"
        >
          <div className="bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-800 dark:to-indigo-900 rounded-lg flex items-center justify-center w-[384px] h-[33px] scale-[0.9] 2x:scale-100">
            <div className="text-center text-indigo-600 dark:text-indigo-300">
              <p className="text-xs">Inbox Actions</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 1.8 }}
          viewport={{ once: true }}
          className="xl:absolute mt-4 xl:mt-0 bottom-[140px] right-10"
        >
          <div className="bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-800 dark:to-pink-900 rounded-lg flex items-center justify-center w-[106px] h-[19px]">
            <div className="text-center text-pink-600 dark:text-pink-300">
              <p className="text-xs">Suggested</p>
            </div>
          </div>
        </motion.div>

        <div className="absolute bottom-6">
          <CtaLink text="Keep every receipt" />
        </div>
      </div>
    </section>
  );
}
