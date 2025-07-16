import React, { useState, useEffect } from "react";
import { X, Flag, AlertTriangle } from "lucide-react";
import { supabase } from "../../utils/supabase";
import { useUser } from "@civic/auth/react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

interface ChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  creatorName: string;
}

interface CreatorData {
  id: string;
  creator_name: string;
  username: string;
}

export const ChatDialog: React.FC<ChatDialogProps> = ({
  isOpen,
  onClose,
  creatorName,
}) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [creatorData, setCreatorData] = useState<CreatorData | null>(null);
  const { user } = useUser();

  useEffect(() => {
    const fetchCreator = async () => {
      if (!user) {
        setError("Please sign in to chat");
        setIsLoading(false);
        return;
      }

      try {
        // console.log('Looking up creator with name:', creatorName);

        // Get creator ID from creator name
        const { data: creatorData, error: creatorError } = await supabase
          .from("creator_profiles")
          .select("id, creator_name, username")
          .eq("creator_name", creatorName)
          .limit(1)
          .single();

        if (creatorError) {
          console.error("Error fetching creator:", creatorError);
          setError("Error looking up creator. Please try again.");
          return;
        }

        if (!creatorData) {
          console.error("No creator found with name:", creatorName);
          setError("Creator not found");
          return;
        }

        setCreatorData(creatorData);
      } catch (error) {
        console.error("Unexpected error:", error);
        setError("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchCreator();
    }
  }, [isOpen, creatorName, user]);

  const handleReport = async () => {
    if (!reportReason.trim()) {
      toast.error("Please provide a reason for reporting");
      return;
    }

    try {
      const { error: reportError } = await supabase.from("reports").insert([
        {
          user_id: user?.id,
          creator_name: creatorName,
          reason: reportReason,
          created_at: new Date().toISOString(),
        },
      ]);

      if (reportError) throw reportError;

      toast.success("Report submitted successfully");
      setShowReportModal(false);
      setReportReason("");
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Failed to submit report. Please try again.");
    }
  };

  const handleInitiateChat = () => {
    if (creatorData && user) {
      onClose();
      navigate("/dashboard", {
        state: {
          creator: creatorData,
          user: user,
        },
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 animate-fade-in">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Chat Guidelines</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">{error}</div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Chat Rules</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                  <span>
                    Be respectful and professional in all communications
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                  <span>No inappropriate language or content</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                  <span>
                    Keep conversations focused on the agreed-upon topics
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                  <span>Respect privacy and confidentiality</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Reporting</h3>
              <p className="text-gray-600">
                If you experience any inappropriate behavior or violations of
                these rules, please report it immediately.
              </p>
              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-2 text-red-500 hover:text-red-600 transition-colors duration-200"
              >
                <Flag className="w-5 h-5" />
                Report Creator
              </button>
            </div>

            <button
              onClick={handleInitiateChat}
              className="w-full bg-orange-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors duration-200"
            >
              Initiate Chat
            </button>
          </div>
        )}

        {/* Report Modal */}
        {showReportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md p-6">
              <h3 className="text-lg font-semibold mb-4">Report Creator</h3>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Please describe the reason for your report..."
                className="w-full p-3 border rounded-lg mb-4 h-32 resize-none"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReport}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
