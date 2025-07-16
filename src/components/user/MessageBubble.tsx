import React from "react";

interface Message {
  id: string;
  sender: "user" | "creator";
  content: string;
  timestamp: string;
}

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  return (
    <div
      className={`flex ${
        message.sender === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-xs p-3 rounded-lg ${
          message.sender === "user"
            ? "bg-orange-500 text-white"
            : "bg-[#fffdf4] text-orange-900 border border-orange-500"
        }`}
      >
        <p>{message.content}</p>
        <span
          className={`text-xs ${
            message.sender === "user" ? "text-orange-100" : "text-orange-500"
          }`}
        >
          {message.timestamp}
        </span>
      </div>
    </div>
  );
};

export default MessageBubble;
