import React from "react";
import { Youtube, Instagram, Mail, Bookmark, X } from "lucide-react";
// import toast from "react-hot-toast";
// import { supabase } from "../../../../utils/supabase";
// import { useCurrentUser } from "../../../../hooks/useCurrentUser";

interface CreatorProfile {
  id: string;
  creator_name: string;
  username: string;
  description: string;
  price: string;
  x_connected: boolean;
  x_username: string;
  x_profile_image: string | null;
  category: string;
  created_at: string;
  wallet_address: string;
}

// Remove wallet payment logic and just show profile info or a message
export const CreatorDetailsSidebar: React.FC<any> = ({
  creator,
  isOpen,
  onClose,
  onSendMessage,
}) => {
  if (!isOpen || !creator) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>
        <div className="flex flex-col items-center gap-4">
          <img
            src={creator.x_profile_image || ""}
            alt={creator.creator_name}
            className="w-24 h-24 rounded-full object-cover"
          />
          <h2 className="text-xl font-semibold">{creator.creator_name}</h2>
          <p className="text-gray-600">{creator.description}</p>
          <button
            onClick={onSendMessage}
            className="bg-orange-500 text-white px-4 py-2 rounded-full hover:bg-orange-600 transition"
          >
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
};
