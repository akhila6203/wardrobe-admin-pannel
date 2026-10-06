import {
  LogOut,
  Menu,
} from "lucide-react";

export default function Header({
  onLogout,
  setSidebarOpen,
}) {
  return (
    <header
      className="
        fixed
        left-0
        right-0
        top-0
        z-30
        h-[72px]
        border-b
        border-slate-200
        bg-white
        lg:left-[240px]
      "
    >

      <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* LEFT */}

        <div className="flex items-center gap-3">

          {/* MOBILE MENU */}

          <button
            type="button"
            onClick={() =>
              setSidebarOpen(true)
            }
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 lg:hidden"
          >
            <Menu size={20} />
          </button>

          <div>

            <h1 className="text-[17px] font-extrabold text-slate-900 sm:text-xl">
               Wardrobe Admin
            </h1>

            <p className="hidden text-xs text-slate-400 sm:block">
              Wardrobe Management
            </p>

          </div>

        </div>

        {/* RIGHT LOGOUT */}

        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-2 rounded-lg border border-[#ee027e]/20 px-3 py-2 text-sm font-semibold text-[#ee027e] transition hover:border-[#ee027e] hover:bg-[#ee027e]/10 sm:px-4"
          // className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 sm:px-4"
        >

          <LogOut size={17} />

          <span className="hidden sm:inline">
            Logout
          </span>

        </button>
      </div>

    </header>
  );
}