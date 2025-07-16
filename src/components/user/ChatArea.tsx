import React, { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import { useCivicUser } from "../../hooks/useCivicUser";

interface Message {
  id: string;
  sender: "user" | "creator";
  content: string;
  timestamp: string;
}

interface ChatAreaProps {
  selectedCreator: {
    id: string;
    name: string;
  } | null;
  messages: Message[];
  newMessage: string;
  onMessageChange: (value: string) => void;
  onSendMessage: () => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  selectedCreator,
  messages,
  newMessage,
  onMessageChange,
  onSendMessage,
}) => {
  const { user } = useCivicUser();
  const [isLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Debug: Log user and selectedCreator
  useEffect(() => {
    // console.log('Current User:', user);
    // console.log('Selected Creator:', selectedCreator);
  }, [user, selectedCreator]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (!selectedCreator) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#fffdf4]">
        <p className="text-gray-500">Select a creator to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#fffdf4]">
      <div className="p-4 border-b border-orange-100">
        <h2 className="text-xl font-semibold text-orange-900">
          {selectedCreator.name}
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">Loading messages...</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      <MessageInput
        value={newMessage}
        onChange={onMessageChange}
        onSend={onSendMessage}
        disabled={isLoading}
      />
    </div>
  );
};

export default ChatArea;
