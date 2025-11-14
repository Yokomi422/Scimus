import { Link, useLocation } from "react-router-dom";
import { Home, FileText, StickyNote, Image, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  { name: "Home", path: "/", icon: Home },
  { name: "Files", path: "/files", icon: FolderOpen },
  { name: "Notes", path: "/notes", icon: StickyNote },
  { name: "Images", path: "/images", icon: Image },
  { name: "PDFs", path: "/pdfs", icon: FileText },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="fixed left-0 top-0 h-screen w-64 border-r border-gray-200 bg-white">
      {/* Logo/Brand */}
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <h1 className="text-xl font-bold text-indigo-600">Scimus</h1>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-4">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
