export function Metrics() {
  return (
    <div className="grid grid-cols-2 md:flex md:flex-nowrap gap-8 lg:absolute bottom-0 left-0 md:divide-x mt-20 lg:mt-0">
      <div className="flex flex-col md:pr-8 text-center">
        <h4 className="text-[#878787] text-sm mb-4">Stories analyzed</h4>
        <span className="text-2xl text-stroke">12,400+</span>
      </div>
      <div className="flex flex-col md:px-8 text-center">
        <h4 className="text-[#878787] text-sm mb-4">Hours saved</h4>
        <span className="text-2xl text-stroke">47,000+</span>
      </div>
      <div className="flex flex-col md:px-8 text-center">
        <h4 className="text-[#878787] text-sm mb-4">Insights extracted</h4>
        <span className="text-2xl text-stroke">85K+</span>
      </div>
      <div className="flex flex-col md:px-8 text-center">
        <h4 className="text-[#878787] text-sm mb-4">Sources tracked</h4>
        <span className="text-2xl text-stroke">340+</span>
      </div>
    </div>
  );
}
