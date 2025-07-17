import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCivicUser } from "../../hooks/useCivicUser";
import { supabase } from "../../utils/supabase";
import { toast } from "react-hot-toast";
import Sidebar from "./Sidebar";
import CreatorList from "./CreatorList";
import ChatArea from "./ChatArea";
import TransactionHistory from "./TransactionHistory";

interface Creator {
  id: string;
  name: string;
  description: string;
  about: string;
  twitter_username?: string;
  priority_dm_price: number;
  user_id: string;
  status?: "online" | "offline";
  profile_image?: string;
  wallet_address?: string;
}

interface Message {
  id: string;
  sender: "user" | "creator";
  content: string;
  timestamp: string;
}

interface LocationState {
  creator: Creator;
  user: any;
}

// interface CreatorProfile {
//   id: string;
//   creator_name: string;
//   username: string;
//   avatar_url: string;
const DashBoard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>("chat");
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useCivicUser();
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // Handle persistent draft per creator
  const handleNewMessageChange = (value: string) => {
    setNewMessage(value);
    if (user && selectedCreator) {
      const draftKey = `chat_draft_${user.id}_${selectedCreator.id}`;
      localStorage.setItem(draftKey, value);
    }
  };
  const [connectedCreators, setConnectedCreators] = useState<Creator[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  console.log("coonected creator:", user?.id);
  

  // On mount, fetch connected creators and handle initial creator from location.state
  useEffect(() => {
    const state = location.state as LocationState;
    if (state?.creator) {
      setSelectedCreator(state.creator);
      // fetchMessages will be triggered by selectedCreator effect
    }
    fetchConnectedCreators();
  }, [location, user]);

  // Listen for new messages for the selected creator and load chat history/draft
  useEffect(() => {
    if (!selectedCreator || !user) return;
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
          if (payload.new.creator_id === selectedCreator.id) {
            const newMessage: Message = {
              id: payload.new.id,
              sender: "user",
              content: payload.new.content,
              timestamp: new Date(payload.new.created_at).toLocaleTimeString(),
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
          if (payload.new.creator_id === selectedCreator.id) {
            const newMessage: Message = {
              id: payload.new.id,
              sender: "creator",
              content: payload.new.content,
              timestamp: new Date(payload.new.created_at).toLocaleTimeString(),
            };
            setMessages((prev) => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    // Fetch messages from localStorage/backend for this creator
    fetchMessages(selectedCreator.id);
    // Load draft message for this creator
    const draftKey = `chat_draft_${user.id}_${selectedCreator.id}`;
    setNewMessage(localStorage.getItem(draftKey) || "");

    return () => {
      userMessagesChannel.unsubscribe();
      creatorMessagesChannel.unsubscribe();
    };
  }, [selectedCreator, user]);

  const fetchConnectedCreators = async () => {
    console.log("fetchConnectedCreators called, user:", user);
    if (!user) return;

    try {
      setIsLoading(true);

      // Step 1: Fetch user profile from user_profiles using email
      const { data: userProfile, error: userProfileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("email", user.email)
        .single();

      if (userProfileError || !userProfile) {
        console.error("User profile not found for:", user.email);
        setConnectedCreators([]);
        return;
      }
      const appUserId = userProfile.id;
      console.log("[fetchConnectedCreators] App user id:", appUserId);

      // Step 2: Fetch connections using app user id
      const { data: connections, error: connectionsError } = await supabase
        .from("paid_connections")
        .select("creator_id")
        .eq("user_id", appUserId);

      console.log("[fetchConnectedCreators] Connections fetched:", connections);
      if (connectionsError) {
        console.error("[fetchConnectedCreators] Error fetching connections:", connectionsError);
        toast.error("Failed to load connected creators");
        setConnectedCreators([]);
        return;
      }

      if (!connections || connections.length === 0) {
        console.warn("[fetchConnectedCreators] No connections found for user:", appUserId);
        setConnectedCreators([]);
        return;
      }

      const creatorIds = connections.map((conn) => conn.creator_id);
      console.log("[fetchConnectedCreators] Creator IDs:", creatorIds);

      // Step 3: Fetch creator profiles
      const { data: creators, error: creatorsError } = await supabase
        .from("creator_profiles")
        .select("*")
        .in("id", creatorIds);

      console.log("[fetchConnectedCreators] Creators fetched:", creators);
      if (creatorsError) {
        console.error("[fetchConnectedCreators] Error fetching creator details:", creatorsError);
        toast.error("Failed to load creator details");
        setConnectedCreators([]);
        return;
      }

      if (!creators || creators.length === 0) {
        console.warn("[fetchConnectedCreators] No creators found for IDs:", creatorIds);
        setConnectedCreators([]);
        return;
      }

      // Step 4: Map to Creator type
      const mappedCreators: Creator[] = creators.map((creator) => ({
        id: creator.id,
        name: creator.creator_name || "Unknown",
        description: creator.description || "",
        about: creator.about || "",
        twitter_username: creator.username || "",
        profile_image: creator.x_profile_image || "",
        priority_dm_price: creator.priority_dm_price || 0,
        user_id: creator.id,
        status: isCreatorOnline(creator.last_seen) ? "online" : "offline",
        wallet_address: creator.wallet_address || "",
      }));

      console.log("[fetchConnectedCreators] Mapped creators:", mappedCreators);
      setConnectedCreators(mappedCreators);
    } catch (error) {
      console.error("[fetchConnectedCreators] Error fetching connected creators:", error);
      toast.error("Failed to load connected creators");
      setConnectedCreators([]);
    } finally {
      setIsLoading(false);
    }
  };

  const isCreatorOnline = (lastSeen: string | null) => {
    if (!lastSeen) return false;
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    return now.getTime() - lastSeenDate.getTime() < 5 * 60 * 1000;
  };

  const fetchMessages = async (creatorId: string) => {
    if (!user) return;

    // Try to load from localStorage first
    const localKey = `chat_history_${user.id}_${creatorId}`;
    const localData = localStorage.getItem(localKey);
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        setMessages(parsed);
      } catch (e) {
        // ignore parse error
      }
    }

    // Fetch app user profile
    const { data: userProfile, error: userProfileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("email", user.email)
      .single();

    if (userProfileError || !userProfile) {
      console.error("User profile not found for:", user.email);
      setMessages([]);
      return;
    }
    const appUserId = userProfile.id;

    try {
      // Fetch user messages
      const { data: userMessages, error: userError } = await supabase
        .from("user_messages")
        .select("*")
        .eq("user_id", appUserId)
        .eq("creator_id", creatorId)
        .order("created_at", { ascending: true });

      if (userError) {
        console.error("Error fetching user messages:", userError);
        return;
      }

      // Fetch creator messages
      const { data: creatorMessages, error: creatorError } = await supabase
        .from("creator_messages")
        .select("*")
        .eq("user_id", appUserId)
        .eq("creator_id", creatorId)
        .order("created_at", { ascending: true });

      if (creatorError) {
        console.error("Error fetching creator messages:", creatorError);
        return;
      }

      // Transform messages to include sender type
      const formattedUserMessages = (userMessages || []).map((msg) => ({
        id: msg.id,
        sender: "user" as const,
        content: msg.content,
        timestamp: new Date(msg.created_at).toLocaleTimeString(),
      }));

      const formattedCreatorMessages = (creatorMessages || []).map((msg) => ({
        id: msg.id,
        sender: "creator" as const,
        content: msg.content,
        timestamp: new Date(msg.created_at).toLocaleTimeString(),
      }));

      // Combine and sort all messages by timestamp
      const allMessages = [
        ...formattedUserMessages,
        ...formattedCreatorMessages,
      ].sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      setMessages(allMessages);
      // Save to localStorage
      localStorage.setItem(localKey, JSON.stringify(allMessages));
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedCreator || !user) return;

    try {
      // console.log('Sending message:', {
      //   user_id: user.id,
      //   creator_id: selectedCreator.id,
      //   content: newMessage
      // });

      const { data, error } = await supabase
        .from("user_messages")
        .insert([
          {
            user_id: user.id,
            creator_id: selectedCreator.id,
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
        sender: "user",
        content: newMessage,
        timestamp: new Date(data[0].created_at).toLocaleTimeString(),
      };

      setMessages((prev) => {
        const updated = [...prev, newMessageObj];
        // Persist to localStorage
        if (user && selectedCreator) {
          const localKey = `chat_history_${user.id}_${selectedCreator.id}`;
          localStorage.setItem(localKey, JSON.stringify(updated));
        }
        return updated;
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-orange-50">
      <Sidebar 
        onSignOut={handleSignOut}
        onSectionSelect={setActiveSection}
        activeSection={activeSection}
      />
      {activeSection === "chat" && (
        <>
          <CreatorList
            creators={connectedCreators}
            selectedCreator={selectedCreator}
            searchQuery={searchQuery}
            isLoading={isLoading}
            onSearchChange={setSearchQuery}
            onCreatorSelect={(creator) => {
              setSelectedCreator(creator);
              // fetchMessages will be triggered by selectedCreator effect
            }}
          />
          <ChatArea
            selectedCreator={selectedCreator}
            messages={messages}
            newMessage={newMessage}
            onMessageChange={handleNewMessageChange}
            onSendMessage={handleSendMessage}
          />
        </>
      )}
      {activeSection === "transactions" && (
        <TransactionHistory connectedCreators={connectedCreators} />
      )}
    </div>
  );
}



export default DashBoard;
