import { useEffect, useState } from "react";
import { Twitter, MessageCircle } from "lucide-react";
import { useParams } from "react-router-dom";
import { supabase } from "../../utils/supabase";

interface CreatorData {
  creator_name: string;
  username: string;
  description: string;
  price: string;
  x_connected: boolean;
  x_username: string;
  x_profile_image: string | null;
  category: string;
  x_access_token?: string;
}

function PreviewPage() {
  const { username } = useParams();
  const [creatorData, setCreatorData] = useState<CreatorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to get high resolution Twitter profile image
  const getHighResProfileImage = (url: string | null): string | undefined => {
    if (!url) return undefined;
    // Replace '_normal' with '_400x400' for higher resolution
    return url.replace("_normal", "_400x400");
  };

  useEffect(() => {
    const fetchCreatorData = async () => {
      try {
        const { data, error } = await supabase
          .from("creator_profiles")
          .select("*")
          .eq("username", username)
          .single();

        if (error) throw error;
        setCreatorData(data);
      } catch (err) {
        console.error("Error fetching creator data:", err);
        setError("Failed to load creator profile");
      } finally {
        setIsLoading(false);
      }
    };

    if (username) {
      fetchCreatorData();
    }
  }, [username]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error || !creatorData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Profile Not Found
          </h1>
          <p className="text-gray-600">
            The creator profile you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 flex items-center justify-center py-8">
      <div className="w-full max-w-4xl mx-4">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Header Section */}
          <div className="relative h-64 bg-gradient-to-r from-orange-400 to-orange-600">
            <div className="absolute -bottom-16 left-8">
              <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden">
                {creatorData.x_profile_image ? (
                  <img
                    src={getHighResProfileImage(creatorData.x_profile_image)}
                    alt={`${creatorData.creator_name}'s profile`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-orange-100">
                    {/* <div className="w-16 h-16 text-orange-500" /> */}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="pt-20 px-8 pb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {creatorData.creator_name}
                </h1>
                <p className="text-lg text-gray-600 mt-2">
                  {creatorData.description}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={() => {
                    // TODO: Implement message sending logic
                    // console.log('Send message to:', creatorData.username);
                  }}
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full font-semibold transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  Send Message
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-gray-900">
                    {creatorData.price}
                  </span>
                  {/* <img src={solana} alt="SOL" className="w-5 h-5" /> */}
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Username
                  </h3>
                  <p className="text-lg text-gray-900">
                    @{creatorData.username}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Category
                  </h3>
                  <p className="text-lg text-gray-900">
                    {creatorData.category}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Starting Price
                  </h3>
                  <div className="flex items-center gap-2">
                    <p className="text-lg text-gray-900">{creatorData.price}</p>
                    {/* <img src={solana} alt="SOL" className="w-5 h-5" /> */}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Social Media
                  </h3>
                  <div className="flex items-center mt-1 gap-2">
                    <Twitter className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-600">
                      {creatorData.x_connected
                        ? `@${creatorData.x_username}`
                        : "Not connected"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PreviewPage;
