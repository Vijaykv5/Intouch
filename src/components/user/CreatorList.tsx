import React from "react";
import { Search } from "lucide-react";

interface Creator {
  id: string;
  name: string;
  twitter_username?: string;
  profile_image?: string;
  status?: "online" | "offline";
}

interface CreatorListProps {
  creators: Creator[];
  selectedCreator: Creator | null;
  searchQuery: string;
  isLoading: boolean;
  onSearchChange: (query: string) => void;
  onCreatorSelect: (creator: Creator) => void;
}

const CreatorList: React.FC<CreatorListProps> = ({
  creators,
  selectedCreator,
  searchQuery,
  isLoading,
  onSearchChange,
  onCreatorSelect,
}) => {
  const filteredCreators = creators.filter(
    (creator) =>
      creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.twitter_username
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-80 bg-[#fffdf4] border-r border-orange-500">
      <div className="p-4 border-b border-orange-500">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Search creators..."
            className="w-full pl-10 pr-4 py-2 border border-orange-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-y-auto h-[calc(100vh-4rem)]">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-orange-900 mb-2">
            Connected Creators
          </h3>
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            </div>
          ) : filteredCreators.length === 0 ? (
            <p className="text-orange-500 text-sm">No creators found</p>
          ) : (
            filteredCreators.map((creator) => (
              <div
                key={creator.id}
                className={`p-3 rounded-lg cursor-pointer hover:bg-orange-500 hover:text-white transition-colors ${
                  selectedCreator?.id === creator.id
                    ? "bg-orange-500 text-white"
                    : ""
                }`}
                onClick={() => onCreatorSelect(creator)}
              >
                <div className="flex items-center">
                  <div className="relative">
                    <img
                      src={
                        creator.profile_image ||
                        "https://i.pravatar.cc/150?img=3"
                      }
                      alt={creator.name}
                      className="w-10 h-10 rounded-full border-2 border-orange-500"
                    />
                    {creator.status === "online" && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#fffdf4]"></div>
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold">{creator.name}</h3>
                    <p className="text-sm">
                      @{creator.twitter_username || "No Twitter"}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatorList;
