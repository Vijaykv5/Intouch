import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCivicUser } from "../../hooks/useCivicUser";
import { supabase } from "../../utils/supabase";
import { toast } from "react-hot-toast";
import Sidebar from "./Sidebar";
import CreatorList from "./CreatorList";
import ChatArea from "./ChatArea";

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
//   last_seen?: string;
// }

// interface Connection {
//   creator_id: string;
//   creator_profiles: CreatorProfile;
// }

const DashBoard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useCivicUser();
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [connectedCreators, setConnectedCreators] = useState<Creator[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const state = location.state as LocationState;
    if (state?.creator) {
      setSelectedCreator(state.creator);
      fetchMessages(state.creator.id);
    }

    fetchConnectedCreators();

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
          if (
            selectedCreator &&
            payload.new.creator_id === selectedCreator.id
          ) {
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
          if (
            selectedCreator &&
            payload.new.creator_id === selectedCreator.id
          ) {
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

    return () => {
      userMessagesChannel.unsubscribe();
      creatorMessagesChannel.unsubscribe();
    };
  }, [location, selectedCreator, user]);

  const fetchConnectedCreators = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      const { data: connections, error: connectionsError } = await supabase
        .from("paid_connections")
        .select("creator_id")
        .eq("user_id", user.id);

      if (connectionsError) {
        console.error("Error fetching connections:", connectionsError);
        toast.error("Failed to load connected creators");
        return;
      }

      if (!connections || connections.length === 0) {
        setConnectedCreators([]);
        return;
      }

      const creatorIds = connections.map((conn) => conn.creator_id);

      const { data: creators, error: creatorsError } = await supabase
        .from("creator_profiles")
        .select("*")
        .in("id", creatorIds);

      if (creatorsError) {
        console.error("Error fetching creator details:", creatorsError);
        toast.error("Failed to load creator details");
        return;
      }

      if (!creators) {
        setConnectedCreators([]);
        return;
      }

      const mappedCreators: Creator[] = creators.map((creator) => ({
        id: creator.id,
        name: creator.creator_name,
        description: "",
        about: "",
        twitter_username: creator.username,
        profile_image: creator.x_profile_image,
        priority_dm_price: 0,
        user_id: creator.id,
        status: isCreatorOnline(creator.last_seen) ? "online" : "offline",
      }));

      setConnectedCreators(mappedCreators);
    } catch (error) {
      console.error("Error fetching connected creators:", error);
      toast.error("Failed to load connected creators");
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

    try {
      // Fetch user messages
      const { data: userMessages, error: userError } = await supabase
        .from("user_messages")
        .select("*")
        .eq("user_id", user.id)
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
        .eq("user_id", user.id)
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

      setMessages((prev) => [...prev, newMessageObj]);
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
      <Sidebar onSignOut={handleSignOut} />

      <div className="flex-1 flex">
        <CreatorList
          creators={connectedCreators}
          selectedCreator={selectedCreator}
          searchQuery={searchQuery}
          isLoading={isLoading}
          onSearchChange={setSearchQuery}
          onCreatorSelect={(creator) => {
            const fullCreator: Creator = {
              ...creator,
              description: "",
              about: "",
              priority_dm_price: 0,
              user_id: creator.id,
            };
            setSelectedCreator(fullCreator);
            fetchMessages(creator.id);
          }}
        />

        <ChatArea
          selectedCreator={selectedCreator}
          messages={messages}
          newMessage={newMessage}
          onMessageChange={setNewMessage}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
};

export default DashBoard;
