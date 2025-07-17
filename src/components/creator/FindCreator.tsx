import { useState, useEffect } from "react";
import {
  Search,
  Youtube,
  Instagram,
  Mail,
  Bookmark,
  ChevronDown,
} from "lucide-react";
import { ChatDialog } from "./chat-dialog";
import { CreatorDetailsSidebar } from "./CreatorDetailsSidebar";
import "./styles.css";
import { supabase } from "../../utils/supabase";
import Header from "../NavBar";


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

export default function Component() {
  
  const [loading, setLoading] = useState(true);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<CreatorProfile | null>(
    null
  );
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  useEffect(() => {
    fetchCreators();
  }, []);

  const fetchCreators = async () => {
    try {
      console.log("Fetching creators");
      // setLoading(true);
      const { data, error } = await supabase
        .from("creator_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("Creators:", data);

      if (error) throw error;
      setCreators(data || []);
    } catch (error) {
      console.error("Error fetching creators:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique categories from creators
  const categories = [
    "All",
    ...new Set(creators.map((creator) => creator.category)),
  ];

  const filteredCreators = creators.filter((creator) => {
    const matchesSearch =
      creator.creator_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || creator.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreatorClick = (creator: CreatorProfile) => {
    setShowChatDialog(false);
    setSelectedCreator(creator);
  };

  const handleSidebarSendMessage = () => {
    setShowChatDialog(true);
  };

  const handleCloseSidebar = () => {
    // setSelectedCreator(null);
  };

  return (
    <div className="min-h-screen bg-[#fffdf4]">
      <Header goToCreatorSignupPage={() => {}} />
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-center w-full">
            Find your favourite creator
          </h1>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-16 max-w-4xl mx-auto">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by name or category"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white rounded-full py-3 px-6 pr-12 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 transition duration-300"
            />
            <button className="absolute right-1 top-1/2 -translate-y-1/2 bg-orange-400 rounded-full p-2 hover:bg-orange-500 transition duration-300">
              <Search className="text-white" />
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="flex items-center gap-2 bg-white rounded-full py-3 px-6 text-gray-700 hover:bg-gray-50 transition duration-300 border border-gray-200 min-w-[200px]"
            >
              <span className="flex-1 text-left">
                Filter: {selectedCategory}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {showCategoryDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-10">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setShowCategoryDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-orange-50 transition duration-200 ${
                      category === selectedCategory
                        ? "text-orange-500 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-lg overflow-hidden shadow-md card-animation"
              >
                <div className="shimmer w-full h-48"></div>
                <div className="p-4">
                  <div className="shimmer w-3/4 h-6 mb-2"></div>
                  <div className="shimmer w-1/2 h-4 mb-4"></div>
                  <div className="shimmer w-full h-8"></div>
                </div>
              </div>
            ))
          ) : filteredCreators.length > 0 ? (
            filteredCreators.map((creator) => (
              <div
                key={creator.id}
                className="bg-white rounded-lg overflow-hidden shadow-md card-animation hover:shadow-lg transition duration-300 cursor-pointer"
                onClick={() => handleCreatorClick(creator)}
              >
                <div className="relative h-48">
                  {creator.x_profile_image ? (
                    <img
                      src={getHighResProfileImage(creator.x_profile_image)}
                      alt={creator.creator_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-orange-100 flex items-center justify-center">
                      {/* <div className="w-16 h-16 text-orange-400" /> */}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="font-bold text-lg">
                      {creator.creator_name}
                    </h2>
                    <span className="text-gray-600 text-sm">
                      @{creator.username}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mb-4">
                    {creator.description}
                  </p>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex space-x-2">
                      {creator.x_connected && (
                        <Youtube size={20} className="text-gray-600" />
                      )}
                      <Instagram size={20} className="text-gray-600" />
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      {creator.category}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">
                      Starting Price
                    </span>
                    <span className="font-bold">{creator.price} SOL</span>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex space-x-2">
                      <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition duration-300">
                        <Mail size={20} className="text-gray-600" />
                      </button>
                      <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition duration-300">
                        <Bookmark size={20} className="text-gray-600" />
                      </button>
                    </div>
                    <button
                      className="bg-orange-400 text-white font-bold py-2 px-4 rounded-full hover:bg-orange-500 transition duration-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreatorClick(creator);
                      }}
                    >
                      Send Message
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <h3 className="text-xl font-semibold text-gray-700">
                No creators found
              </h3>
              <p className="text-gray-500 mt-2">
                Try adjusting your search query
              </p>
            </div>
          )}
        </div>

        <CreatorDetailsSidebar
          creator={selectedCreator}
          isOpen={!!selectedCreator}
          onClose={handleCloseSidebar}
          onSendMessage={handleSidebarSendMessage}
        />

        <ChatDialog
          isOpen={showChatDialog && !!selectedCreator}
          onClose={() => setShowChatDialog(false)}
          creatorName={selectedCreator?.creator_name || ""}
        />
      </div>
    </div>
  );
}

// Function to get high resolution Twitter profile image
const getHighResProfileImage = (url: string | null): string | undefined => {
  if (!url) return undefined;
  // Replace '_normal' with '_400x400' for higher resolution
  return url.replace("_normal", "_400x400");
};
