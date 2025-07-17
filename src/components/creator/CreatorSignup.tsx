"use client";

import { useState } from "react";
// import { FaXTwitter } from "react-icons/fa6";
import { supabase } from "../../utils/supabase";
import { useNavigate } from "react-router-dom";


export default function ProfileUpdate() {
  const [formData, setFormData] = useState({
    fullName: "",
    bio: "",
    username: "",
    price: "",
    xConnected: false,
    xUsername: "",
    xProfileImage: "",
    category: "",
    walletAddress: "",
  });

  const [fieldErrors, setFieldErrors] = useState({
    fullName: "",
    bio: "",
    username: "",
    price: "",
    category: "",
    walletAddress: "",
  });

  
  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [creatorUrl, setCreatorUrl] = useState("");
  // const user = useCurrentUser();
  // console.log(user)
  const navigate = useNavigate();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authFormData, setAuthFormData] = useState({
    username: "",
    twitterHandle: "",
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  

  // Debounced function to check username uniqueness
  const checkUsernameUniqueness = async (username: string) => {
    if (username.length < 3) {
      setUsernameError("Username must be at least 3 characters long");
      return;
    }

    setIsCheckingUsername(true);
    try {
      const { data: existingProfile, error: checkError } = await supabase
        .from("creator_profiles")
        .select("username")
        .eq("username", username)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existingProfile) {
        setUsernameError("This username is already taken");
      } else {
        setUsernameError(null);
      }
    } catch (err) {
      console.error("Error checking username:", err);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleInputChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Real-time validation for username
    if (name === "username") {
      if (value.length < 3) {
        setUsernameError("Username must be at least 3 characters long");
      } else {
        // Clear error if length is valid, but check uniqueness
        setUsernameError(null);
        // Debounce the uniqueness check
        const timeoutId = setTimeout(() => {
          checkUsernameUniqueness(value);
        }, 500);
        return () => clearTimeout(timeoutId);
      }
    }
  };

  const handleXConnect = () => {
    if (formData.xConnected) {
      setFormData((prev) => ({
        ...prev,
        xConnected: false,
        xUsername: "",
        xProfileImage: "",
      }));
      return;
    }
    // No X auth implemented, just set error or ignore
    setError("X (Twitter) authentication is not available.");
  };

  const validateForm = () => {
    const errors = {
      fullName: "",
      bio: "",
      username: "",
      price: "",
      category: "",
      walletAddress: "",
    };

    let isValid = true;

    if (!formData.fullName.trim()) {
      errors.fullName = "Full name is required";
      isValid = false;
    }

    if (!formData.bio.trim()) {
      errors.bio = "Bio is required";
      isValid = false;
    }

    if (!formData.username.trim()) {
      errors.username = "Username is required";
      isValid = false;
    }

    if (!formData.price) {
      errors.price = "Price is required";
      isValid = false;
    }

    if (!formData.category) {
      errors.category = "Category is required";
      isValid = false;
    }

    

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setUsernameError(null);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    // Validate username length
    if (formData.username.length < 3) {
      setUsernameError("Username must be at least 3 characters long");
      setIsLoading(false);
      return;
    }

    try {
      // Check if username already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from("creator_profiles")
        .select("username")
        .eq("username", formData.username)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existingProfile) {
        setUsernameError("This username is already taken");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("creator_profiles")
        .insert([
          {
            creator_name: formData.fullName,
            username: formData.username,
            description: formData.bio,
            price: formData.price,
            x_connected: formData.xConnected,
            x_username: formData.xUsername,
            x_profile_image: formData.xProfileImage,
            category: formData.category,
            
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) {
        throw error;
      }

      // Store the creator profile in localStorage
      localStorage.setItem("creator_profile", JSON.stringify(data[0]));

      // Navigate directly to creator dashboard
      window.location.href = "/creator-dashboard";
    } catch (err: any) {
      console.error("Error creating profile:", err);
      setError(err.message || "Failed to create profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSubmit = async () => {
    setIsAuthLoading(true);
    setAuthError(null);

    try {
      if (!authFormData.username.trim() || !authFormData.twitterHandle.trim()) {
        setAuthError("Please fill in all fields");
        return;
      }

      // Check if the username exists
      const { data: profile, error } = await supabase
        .from("creator_profiles")
        .select("*")
        .eq("username", authFormData.username)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          setAuthError("Username not found. Please check your username.");
        } else {
          throw error;
        }
        return;
      }

      if (!profile) {
        setAuthError("Username not found. Please check your username.");
        return;
      }

      // Store the creator profile in localStorage
      localStorage.setItem("creator_profile", JSON.stringify(profile));

      // Navigate to creator dashboard
      window.location.href = "/creator-dashboard";
    } catch (err: any) {
      console.error("Authentication error:", err);
      setAuthError(err.message || "Failed to authenticate. Please try again.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-200 to-orange-100 flex items-center justify-center py-8 px-4">
      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Already a user?
            </h2>
            <p className="text-gray-600 mb-6">
              Please authenticate to access your profile
            </p>

            {authError && (
              <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
                {authError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  value={authFormData.username}
                  onChange={(e) =>
                    setAuthFormData((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  placeholder="Enter your username"
                  className="w-full outline-none text-gray-800 text-base border border-gray-200 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Twitter Handle *
                </label>
                <input
                  type="text"
                  value={authFormData.twitterHandle}
                  onChange={(e) =>
                    setAuthFormData((prev) => ({
                      ...prev,
                      twitterHandle: e.target.value,
                    }))
                  }
                  placeholder="Enter your Twitter handle"
                  className="w-full outline-none text-gray-800 text-base border border-gray-200 rounded-lg p-2"
                />
              </div>

              <button
                onClick={handleAuthSubmit}
                disabled={isAuthLoading}
                className={`w-full px-4 py-2 bg-orange-500 text-white rounded-full font-medium ${
                  isAuthLoading
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-orange-600"
                }`}
              >
                {isAuthLoading ? "Authenticating..." : "Authenticate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Profile Created Successfully!
            </h2>
            <p className="text-gray-600 mb-6">
              Your creator profile is now live at:
            </p>
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
              <a
                href={creatorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 break-all hover:text-orange-600 hover:underline"
              >
                {creatorUrl}
              </a>
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setCreatorUrl(creatorUrl);
                  navigate(creatorUrl);
                }}
                className="px-4 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors"
              >
                View Profile
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate("/dashboard");
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-lg relative">
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-4 py-2 text-orange-500 hover:text-orange-600 font-medium"
          >
            Already a creator?
          </button>
        </div>

        <div className="px-12 py-16">
          <h1 className="text-3xl font-bold text-gray-800 mb-10 text-center">
            Complete your profile
          </h1>

          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-6">
            

            {/* X Connection */}
            <div className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* <FaXTwitter className="text-black text-xl" /> */}
                  <div>
                    <span className="text-sm font-medium text-gray-600">
                      Connect X Account
                    </span>
                    {formData.xConnected && formData.xUsername && (
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500">
                          Connected as @{formData.xUsername}
                        </p>
                        {formData.xProfileImage && (
                          <img
                            src={formData.xProfileImage}
                            alt="X Profile"
                            className="w-6 h-6 rounded-full"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleXConnect}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-full font-medium transition-colors ${
                    formData.xConnected
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-black text-white hover:bg-gray-800"
                  } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {isLoading
                    ? "Connecting..."
                    : formData.xConnected
                    ? "Connected"
                    : "Connect"}
                </button>
              </div>
            </div>

            {/* Full name */}
            <div className="rounded-xl border border-gray-200 p-4">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Full name *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                className={`w-full outline-none text-gray-800 text-base ${
                  fieldErrors.fullName ? "border-red-500" : ""
                }`}
              />
              {fieldErrors.fullName && (
                <p className="text-red-500 text-sm mt-1">
                  {fieldErrors.fullName}
                </p>
              )}
            </div>

            {/* Bio */}
            <div className="rounded-xl border border-gray-200 p-4">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Bio *
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="This is your headline. Introduce yourself 😊"
                className={`w-full outline-none text-gray-800 text-base resize-none min-h-[40px] ${
                  fieldErrors.bio ? "border-red-500" : ""
                }`}
              />
              {fieldErrors.bio && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.bio}</p>
              )}
            </div>

            {/* Username */}
            <div className="rounded-xl border border-gray-200 p-4">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Username *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Enter your username"
                  className={`w-full outline-none text-gray-800 text-base ${
                    fieldErrors.username ? "border-red-500" : ""
                  }`}
                />
                {isCheckingUsername && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                  </div>
                )}
              </div>
              {(fieldErrors.username || usernameError) && (
                <p className="text-red-500 text-sm mt-1">
                  {fieldErrors.username || usernameError}
                </p>
              )}
            </div>

            {/* Category Selection */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Select Category *
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  "Founder",
                  "Creator",
                  "Engineer",
                  "Influencer",
                  "Developer",
                ].map((category) => (
                  <div
                    key={category}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, category }))
                    }
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.category === category
                        ? "bg-orange-100 border-orange-300"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <h3 className="font-medium text-gray-800">{category}</h3>
                  </div>
                ))}
              </div>
              {fieldErrors.category && (
                <p className="text-red-500 text-sm mt-1">
                  {fieldErrors.category}
                </p>
              )}
            </div>

            {/* Price Input Only */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Price *
              </h2>
              <div className="flex items-center gap-4">
                <div className="rounded-xl border border-gray-200 p-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0.01 SOL"
                      min="0.01"
                      step="0.01"
                      className={`w-20 outline-none text-gray-800 text-base ${
                        fieldErrors.price ? "border-red-500" : ""
                      }`}
                    />
                    <span className="text-sm text-gray-500 ml-2">SOL</span>
                  </div>
                </div>
              </div>
              {fieldErrors.price && (
                <p className="text-red-500 text-sm mt-1">
                  {fieldErrors.price}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 mt-8">
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className={`px-6 py-3 bg-orange-500 text-white rounded-full font-medium ${
                  isLoading
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-orange-600"
                }`}
              >
                {isLoading ? "Creating Profile..." : "Create Profile"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
