import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabase";
import { toast } from "react-hot-toast";
import { Search, MessageSquare, LogOut, DollarSign, Link } from "lucide-react";
import { useNavigate } from "react-router-dom";
import EarningsPopup from "./EarningsPopup";

interface User {
  id: string;
  name: string;
  email: string;
  profile_image?: string;
  paid_amount?: string;
  transaction_signature?: string;
}

interface CreatorProfile {
  id: string;
  creator_name: string;
  username: string;
  x_username: string;
  x_profile_image: string;
  category: string;
  price: string;
}

// interface UserProfile {
//   id: string;
//   name: string | null;
//   email: string;
//   profile_image: string | null;
//   x_profile_image: string | null;
//   username: string | null;
// }

// interface Conversation {
//   id: string;
//   user_id: string;
//   last_message: string | null;
//   last_message_at: string | null;
//   user_profiles: UserProfile;
// }

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_type: "creator" | "user";
}

export default function CreatorDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(
    null
  );
  const [showEarnings, setShowEarnings] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Get creator profile from localStorage
    const storedProfile = localStorage.getItem("creator_profile");
    if (!storedProfile) {
      // If no profile in localStorage, redirect to creator signup
      navigate("/creator/signup");
      return;
    }

    try {
      const profile = JSON.parse(storedProfile);
      setCreatorProfile(profile);
      fetchConnectedUsers(profile.id);

      // Set up real-time subscriptions for both message types
      const userMessagesChannel = supabase
        .channel("user_messages")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "user_messages",
          },
          (payload: any) => {
            if (selectedUser && payload.new.user_id === selectedUser.id) {
              const newMessage: Message = {
                id: payload.new.id,
                content: payload.new.content,
                created_at: payload.new.created_at,
                sender_type: "user",
              };
              setMessages((prev) => [...prev, newMessage]);
            }
          }
        )
        .subscribe();

      const creatorMessagesChannel = supabase
        .channel("creator_messages")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "creator_messages",
          },
          (payload: any) => {
            if (selectedUser && payload.new.user_id === selectedUser.id) {
              const newMessage: Message = {
                id: payload.new.id,
                content: payload.new.content,
                created_at: payload.new.created_at,
                sender_type: "creator",
              };
              setMessages((prev) => [...prev, newMessage]);
            }
          }
        )
        .subscribe();

      return () => {
        userMessagesChannel.unsubscribe();
        creatorMessagesChannel.unsubscribe();
      };
    } catch (error) {
      console.error("Error parsing creator profile:", error);
      navigate("/creator/signup");
    }
  }, [navigate, selectedUser]);

  const fetchConnectedUsers = async (creatorId: string) => {
    try {
      setIsLoading(true);
      // console.log('Starting fetchConnectedUsers for creator:', creatorId);

      // First get all paid connections for this creator
      const { data: connections, error: connectionsError } = await supabase
        .from("paid_connections")
        .select("*")
        .eq("creator_id", creatorId);

      if (connectionsError) {
        console.error("Error fetching connections:", connectionsError);
        toast.error("Failed to load connected users");
        return;
      }

      if (!connections || connections.length === 0) {
        // console.log('No connections found for creator:', creatorId);
        setUsers([]);
        return;
      }

      // console.log('Found connections:', connections);

      // Get user details for all connected users
      const userIds = connections.map((conn) => conn.user_id);
      const { data: userProfiles, error: profilesError } = await supabase
        .from("user_profiles")
        .select("*")
        .in("id", userIds);

      if (profilesError) {
        console.error("Error fetching user profiles:", profilesError);
        toast.error("Failed to load user details");
        return;
      }

      // console.log('Found user profiles:', userProfiles);

      // Combine the data from both queries
      const formattedUsers: User[] = connections.map((conn) => {
        const userProfile = userProfiles?.find(
          (profile) => profile.id === conn.user_id
        );
        return {
          id: conn.user_id,
          name: userProfile?.name || userProfile?.username || "Anonymous User",
          email: userProfile?.email || "",
          profile_image:
            userProfile?.profile_image || userProfile?.x_profile_image,
          paid_amount: conn.amount_paid,
          transaction_signature: conn.transaction_signature,
        };
      });

      // console.log('Formatted users:', formattedUsers);
      setUsers(formattedUsers);
    } catch (error) {
      console.error("Error in fetchConnectedUsers:", error);
      toast.error("Failed to load connected users");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (userId: string) => {
    if (!creatorProfile) return;

    try {
      // console.log('Fetching messages for:', { userId, creatorId: creatorProfile.id });

      // Get user messages
      const { data: userMessages, error: userError } = await supabase
        .from("user_messages")
        .select("*")
        .eq("user_id", userId)
        .eq("creator_id", creatorProfile.id)
        .order("created_at", { ascending: true });

      if (userError) {
        console.error("Error fetching user messages:", userError);
        return;
      }

      // Get creator messages
      const { data: creatorMessages, error: creatorError } = await supabase
        .from("creator_messages")
        .select("*")
        .eq("user_id", userId)
        .eq("creator_id", creatorProfile.id)
        .order("created_at", { ascending: true });

      if (creatorError) {
        console.error("Error fetching creator messages:", creatorError);
        return;
      }

      // Transform messages to include sender type
      const formattedUserMessages: Message[] = (userMessages || []).map(
        (msg) => ({
          id: msg.id,
          content: msg.content,
          created_at: msg.created_at,
          sender_type: "user",
        })
      );

      const formattedCreatorMessages: Message[] = (creatorMessages || []).map(
        (msg) => ({
          id: msg.id,
          content: msg.content,
          created_at: msg.created_at,
          sender_type: "creator",
        })
      );

      // Combine and sort all messages by timestamp
      const allMessages = [
        ...formattedUserMessages,
        ...formattedCreatorMessages,
      ].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      // console.log('Formatted messages:', allMessages);
      setMessages(allMessages);
    } catch (error) {
      console.error("Error in fetchMessages:", error);
      toast.error("Failed to load messages");
    }
  };

  // const formatTimestamp = (timestamp: string) => {
  //   const date = new Date(timestamp);
  //   const now = new Date();
  //   const diff = now.getTime() - date.getTime();
  //   const diffMinutes = Math.floor(diff / 60000);
  //   const diffHours = Math.floor(diff / 3600000);
  //   const diffDays = Math.floor(diff / 86400000);

  //   if (diffMinutes < 1) return 'Just now';
  //   if (diffMinutes < 60) return `${diffMinutes}m ago`;
  //   if (diffHours < 24) return `${diffHours}h ago`;
  //   if (diffDays < 7) return `${diffDays}d ago`;
  //   return date.toLocaleDateString();
  // };

  const handleSendMessage = async () => {
    if (!creatorProfile || !selectedUser || !newMessage.trim()) return;

    try {
      // console.log('Sending message:', {
      //   creator_id: creatorProfile.id,
      //   user_id: selectedUser.id,
      //   content: newMessage
      // });

      const { data, error } = await supabase
        .from("creator_messages")
        .insert([
          {
            creator_id: creatorProfile.id,
            user_id: selectedUser.id,
            content: newMessage,
          },
        ])
        .select();

      if (error) {
        console.error("Error sending message:", error);
        throw error;
      }

      // console.log('Message sent successfully:', data);

      // Add the new message to the local state
      const newMessageObj: Message = {
        id: data[0].id,
        content: newMessage,
        created_at: data[0].created_at,
        sender_type: "creator",
      };

      setMessages((prev) => [...prev, newMessageObj]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("creator_profile");
    navigate("/");
  };

  const handleCustomUrlClick = () => {
    if (creatorProfile?.username) {
      window.open(`/creator/${creatorProfile.username}`, "_blank");
    } else {
      toast.error("Custom URL not set");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!creatorProfile) {
    return null; // Will redirect to signup
  }

  return (
    <div className="flex h-screen bg-orange-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-white border-b border-orange-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-black">InTouch</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleCustomUrlClick}
            className="p-2 text-gray-600 hover:text-gray-800 flex items-center space-x-1"
            title="View Custom URL"
          >
            <Link className="w-4 h-4" />
            <span className="text-sm">Your Profile</span>
          </button>
          <div className="flex items-center space-x-2">
            <img
              src={creatorProfile?.x_profile_image}
              alt={creatorProfile?.creator_name}
              className="w-8 h-8 rounded-full"
            />
            <span className="font-medium">{creatorProfile?.creator_name}</span>
          </div>
          <button
            onClick={() => setShowEarnings(true)}
            className="p-2 text-gray-600 hover:text-gray-800"
            title="View Earnings"
          >
            <DollarSign className="w-5 h-5" />
          </button>
          <button
            onClick={handleSignOut}
            className="p-2 text-gray-600 hover:text-gray-800"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="w-80 bg-white border-r border-orange-200 mt-16">
        <div className="p-4 border-b border-orange-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-8rem)]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No connected users found
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={`p-3 rounded-lg cursor-pointer hover:bg-orange-50 transition-colors ${
                    selectedUser?.id === user.id ? "bg-orange-50" : ""
                  }`}
                  onClick={() => {
                    setSelectedUser(user);
                    fetchMessages(user.id);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="relative">
                        <img
                          src={
                            user.profile_image ||
                            "https://i.pravatar.cc/150?img=3"
                          }
                          alt={user.name}
                          className="w-10 h-10 rounded-full border-2 border-orange-200"
                        />
                      </div>
                      <div className="ml-3">
                        <h3 className="font-semibold">{user.name}</h3>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col mt-16">
        {selectedUser ? (
          <>
            <div className="p-4 border-b border-orange-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <img
                    src={
                      selectedUser.profile_image ||
                      "https://i.pravatar.cc/150?img=3"
                    }
                    alt={selectedUser.name}
                    className="w-10 h-10 rounded-full border-2 border-orange-200"
                  />
                  <div className="ml-3">
                    <h3 className="font-semibold">{selectedUser.name}</h3>
                    <p className="text-sm text-gray-500">
                      {selectedUser.email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {selectedUser.paid_amount && (
                    <p className="text-sm font-medium text-orange-600">
                      Paid: {selectedUser.paid_amount} SOL
                    </p>
                  )}
                  {selectedUser.transaction_signature && (
                    <a
                      href={`https://explorer.solana.com/tx/${selectedUser.transaction_signature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:text-blue-700"
                    >
                      View Transaction
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender_type === "creator"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender_type === "creator"
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100"
                    }`}
                  >
                    <p>{message.content}</p>
                    <div className="flex items-center justify-end mt-1 space-x-1">
                      <p className="text-xs opacity-70">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-orange-200">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 p-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSendMessage();
                    }
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a user to start chatting
          </div>
        )}
      </div>

      {/* Earnings Popup */}
      {creatorProfile && (
        <EarningsPopup
          isOpen={showEarnings}
          onClose={() => setShowEarnings(false)}
          creatorId={creatorProfile.id}
        />
      )}
    </div>
  );
}
