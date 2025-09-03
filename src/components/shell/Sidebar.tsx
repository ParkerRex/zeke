export default function Sidebar() {
  return (
    <aside className="hidden lg:flex w-64 flex-col gap-4 border-r p-4">
      <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Filters</div>
      <nav className="flex flex-col gap-1 text-sm">
        <a 
          href="#" 
          className="flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-gray-100"
        >
          Today
        </a>
        <a 
          href="#" 
          className="flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-gray-100"
        >
          Sector
        </a>
        <a 
          href="#" 
          className="flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-gray-100"
        >
          Company
        </a>
        <a 
          href="#" 
          className="flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-gray-100"
        >
          Watchlists
        </a>
      </nav>
    </aside>
  );
}

