import React from "react";
import { MessageSquare, Users, Bell, Settings, LogOut, List } from "lucide-react";
import { useCivicUser } from "../../hooks/useCivicUser";

interface SidebarProps {
  onSignOut: () => void;
  onSectionSelect: (section: string) => void;
  activeSection: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onSignOut, onSectionSelect, activeSection }) => {
  const { user } = useCivicUser();

  if (!user) return null;

  const navItems = [
    { label: "Messages", icon: MessageSquare, section: "chat" },
    { label: "Creators", icon: Users, section: "creators" },
    { label: "Transaction History", icon: List, section: "transactions" },
    { label: "Settings", icon: Settings, section: "settings" },
  ];

  return (
    <div className="w-64 bg-[#fffdf4] shadow-lg h-screen relative">
      <div className="p-4">
        <div className="flex items-center space-x-3">
          <img
            src={
              user.picture ||
              "https://i.pravatar.cc/150?img=3"
            }
            alt="User"
            className="w-10 h-10 rounded-full border-2 border-orange-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://i.pravatar.cc/150?img=3";
            }}
          />
          <div>
            <h2 className="font-semibold text-orange-900">
              {user.email ? user.email.split("@")[0] : "User"}
            </h2>
            <p className="text-sm text-orange-600">
              {user.email || "Authenticated with Civic"}
            </p>
          </div>
        </div>
      </div>

      <nav className="mt-6">
        <div className="px-4 space-y-2">
          {navItems.map(({ label, icon: Icon, section }) => (
            <button
              key={label}
              className={`flex items-center w-full p-2 rounded-lg transition-colors ${
                activeSection === section
                  ? "bg-orange-500 text-white"
                  : "text-orange-900 hover:bg-orange-500 hover:text-white"
              }`}
              onClick={() => onSectionSelect(section)}
            >
              <Icon className="w-5 h-5 mr-3" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      <div className="absolute bottom-0 w-64 p-4">
        <button
          onClick={onSignOut}
          className="flex items-center w-full p-2 text-orange-500 rounded-lg hover:bg-orange-500 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
