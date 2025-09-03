export default function Sidebar() {
  return (
    <aside className="hidden lg:flex w-64 flex-col gap-2 border-r p-4">
      <div className="text-sm font-semibold text-muted-foreground">Filters</div>
      <nav className="flex flex-col gap-1 text-sm">
        <button className="text-left hover:underline">Today</button>
        <button className="text-left hover:underline">Sector</button>
        <button className="text-left hover:underline">Company</button>
        <button className="text-left hover:underline">Watchlists</button>
      </nav>
    </aside>
  );
}

