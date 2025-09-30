import { CtaLink } from "./cta-link";

export function SectionTwo() {
  return (
    <section className="border border-border container dark:bg-[#121212] lg:pb-0 overflow-hidden mb-12 group">
      <div className="flex flex-col lg:space-x-12 lg:flex-row">
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg flex items-center justify-center lg:w-1/2 h-[446px] -mb-[1px]">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <div className="size-16 mx-auto mb-4 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center">
              <svg className="size-8" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-sm">Zeke Brief Overview</p>
          </div>
        </div>

        <div className="xl:mt-6 lg:max-w-[40%] md:ml-8 md:mb-8 flex flex-col justify-center p-8 md:pl-0 relative">
          <h3 className="font-medium text-xl md:text-2xl mb-4">
            Why teams switch to Zeke
          </h3>

          <p className="text-[#878787] mb-8 lg:mb-4 text-sm">
            Zeke finds the signal you would only catch with a full-time
            researcher. Every claim is cited, the takeaways are role-aware, and
            the outputs—briefs, playbooks, content—are ready the moment your
            analysis finishes.
          </p>

          <div className="flex flex-col space-y-2">
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
                Surface the two minutes that matter across hours of sources
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
                Every insight is anchored to a quote, timestamp, or snippet
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
                Role-aware takeaways for Product, Growth, Exec, and Research
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
                Ship briefs, campaigns, and enablement docs with receipts baked
                in
              </span>
            </div>
          </div>

          <div className="absolute bottom-0 right-0">
            <CtaLink text="See it turn hours into minutes" />
          </div>
        </div>
      </div>
    </section>
  );
}
