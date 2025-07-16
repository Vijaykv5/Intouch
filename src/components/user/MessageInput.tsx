import React from "react";

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChange,
  onSend,
  disabled = false,
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // console.log('Enter key pressed');
      if (!disabled && value.trim()) {
        onSend();
      }
    }
  };

  const handleSendClick = () => {
    // console.log('Send button clicked');
    if (!disabled && value.trim()) {
      onSend();
    }
  };

  return (
    <div className="p-4 border-t border-orange-100">
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 p-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          disabled={disabled}
        />
        <button
          onClick={handleSendClick}
          disabled={disabled || !value.trim()}
          className={`px-4 py-2 rounded-lg ${
            disabled || !value.trim()
              ? "bg-orange-200 text-orange-400 cursor-not-allowed"
              : "bg-orange-500 text-white hover:bg-orange-600"
          }`}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
