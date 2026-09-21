import {
  Bell,
  Boxes,
  ChevronLeft,
  ClipboardList,
  FileCheck2,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  PackageSearch,
  PanelLeftClose,
  ReceiptIndianRupee,
  UserRoundCog,
  WalletCards,
  X,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
const links = [
  ["/", "Dashboard", LayoutDashboard],
  ["/profile", "Profile & KYC", FileCheck2],
  ["/products", "Products", PackageSearch],
  ["/inventory", "Inventory", Boxes],
  ["/orders", "Orders & shipping", ClipboardList],
  ["/operations", "Returns & reviews", ReceiptIndianRupee],
  ["/support", "Complaints", MessageSquare],
  ["/finance", "Finance", WalletCards],
  ["/notifications", "Notifications", Bell],
  ["/settings", "Account & security", UserRoundCog],
] as const;
export function Layout() {
  const [open, setOpen] = useState(false);
  const { session, logout } = useAuth();
  return (
    <div className="app-shell">
      <aside className={open ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <span>V</span>
          <div>
            <strong>Vishwaneed</strong>
            <small>Vendor workspace</small>
          </div>
          <button className="mobile-only" onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>
        <nav>
          {links.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={() => setOpen(false)}
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>
        <button className="logout" onClick={() => void logout()}>
          <LogOut />
          Log out
        </button>
      </aside>
      <div className="workspace">
        <header>
          <button className="menu" onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <div>
            <span>Vendor panel</span>
            <strong>
              {session?.user.email ?? session?.user.mobile ?? "Vendor account"}
            </strong>
          </div>
          <NavLink to="/notifications" aria-label="Notifications">
            <Bell />
          </NavLink>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
      {open && (
        <button
          className="scrim"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        >
          <ChevronLeft />
          <PanelLeftClose />
        </button>
      )}
    </div>
  );
}
