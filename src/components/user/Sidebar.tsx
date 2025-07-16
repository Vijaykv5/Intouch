import React from "react";
import { MessageSquare, Users, Bell, Settings, LogOut } from "lucide-react";
import { useCivicUser } from "../../hooks/useCivicUser";

interface SidebarProps {
  onSignOut: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onSignOut }) => {
  const { user } = useCivicUser();

  if (!user) return null;

  return (
    <div className="w-64 bg-[#fffdf4] shadow-lg">
      <div className="p-4">
        <div className="flex items-center space-x-3">
          <img
            src={
              user.user_metadata?.avatar_url ||
              "https://i.pravatar.cc/150?img=3"
            }
            alt="User"
            className="w-10 h-10 rounded-full border-2 border-orange-500"
          />
          <div>
            <h2 className="font-semibold text-orange-900">
              {user.user_metadata?.full_name || "User"}
            </h2>
            <p className="text-sm text-orange-600">
              @{user.email?.split("@")[0]}
            </p>
          </div>
        </div>
      </div>

      <nav className="mt-6">
        <div className="px-4 space-y-2">
          <button className="flex items-center w-full p-2 text-orange-900 rounded-lg hover:bg-orange-500 hover:text-white transition-colors">
            <MessageSquare className="w-5 h-5 mr-3" />
            Messages
          </button>
          <button className="flex items-center w-full p-2 text-orange-900 rounded-lg hover:bg-orange-500 hover:text-white transition-colors">
            <Users className="w-5 h-5 mr-3" />
            Creators
          </button>
          <button className="flex items-center w-full p-2 text-orange-900 rounded-lg hover:bg-orange-500 hover:text-white transition-colors">
            <Bell className="w-5 h-5 mr-3" />
            Notifications
          </button>
          <button className="flex items-center w-full p-2 text-orange-900 rounded-lg hover:bg-orange-500 hover:text-white transition-colors">
            <Settings className="w-5 h-5 mr-3" />
            Settings
          </button>
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
