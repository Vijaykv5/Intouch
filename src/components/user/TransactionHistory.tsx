import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabase";
import { useCivicUser } from "../../hooks/useCivicUser";

interface TransactionRow {
  id: string;
  created_at: string;
  amount_paid: number;
  transaction_signature: string | null;
  creator_id: string;
}

const solscanBaseUrl = "https://solscan.io/tx/";

import type { Creator } from "./CreatorList";

interface TransactionHistoryProps {
  connectedCreators: Creator[];
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ connectedCreators }) => {
  const { user } = useCivicUser();
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      console.group("=== Transaction History Debug ===");
      if (!user) {
        console.log("❌ No user object found");
        console.groupEnd();
        setIsLoading(false);
        return;
      }
      if (!user.email) {
        console.log("❌ No user email found in user object:", user);
        console.groupEnd();
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        // 1. Get user profile by email to get user_id
        const { data: userProfile, error: userError } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("email", user.email)
          .single();
        console.log("User profile:", userProfile, "Error:", userError);
        if (userError || !userProfile) {
          console.error("❌ Error fetching user profile:", userError);
          setTransactions([]);
          setIsLoading(false);
          console.groupEnd();
          return;
        }
        // 2. Fetch transactions for user_id
        const { data: transactionsData, error: transactionsError } =
          await supabase
            .from("paid_connections")
            .select("*")
            .eq("user_id", userProfile.id)
            .order("created_at", { ascending: false });
        console.log(
          "Transactions:",
          transactionsData,
          "Error:",
          transactionsError
        );
        if (transactionsError) {
          console.error("❌ Error fetching transactions:", transactionsError);
          setTransactions([]);
          setIsLoading(false);
          console.groupEnd();
          return;
        }
        const validTransactions = (transactionsData || [])
          .filter((tx): tx is TransactionRow => tx && tx.id && tx.created_at)
          .map((tx) => ({
            id: tx.id,
            created_at: tx.created_at,
            amount_paid: tx.amount_paid,
            transaction_signature: tx.transaction_signature ?? null,
            creator_id: tx.creator_id,
          }));
        setTransactions(validTransactions);
        console.log("Final validTransactions:", validTransactions);
      } catch (error) {
        console.error("❌ Error in fetchTransactions:", error);
        setTransactions([]);
      } finally {
        setIsLoading(false);
        setTimeout(() => {
          console.groupEnd();
        }, 100);
      }
    };
    fetchTransactions();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        <p className="text-gray-600">Loading transactions...</p>
        <p className="text-sm text-gray-400">
          Check browser console for debug information
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-orange-900">
        Transaction History
      </h2>
      {transactions.length === 0 ? (
        <div className="text-center py-10 space-y-2">
          <p className="text-gray-500">No transactions found</p>
          <p className="text-sm text-gray-400">
            Check browser console for debug information
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 text-sm"
          >
            Refresh Data
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {transactions.map((tx) => (
            <div key={tx.id} className="border-b border-gray-100 last:border-0">
              <div className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  {(() => {
                    const creator = connectedCreators.find(c => c.id === tx.creator_id);
                    return (
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden">
                          {creator?.profile_image ? (
                            <img
                              src={creator.profile_image}
                              alt={creator.name || "Creator"}
                              className="w-10 h-10 object-cover rounded-full"
                              onError={e => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(creator?.name || "U")}`;
                              }}
                            />
                          ) : (
                            <span className="text-lg">{creator?.name?.charAt(0) || "?"}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {creator?.name || "Unknown Creator"}
                          </p>
                          <p className="text-sm text-gray-500">
                            @{creator?.twitter_username || "unknown"}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="text-right">
                    <p className="font-semibold text-orange-600">
                      {tx.amount_paid ? `${tx.amount_paid} SOL` : "N/A"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {tx.transaction_signature && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <a
                      href={`${solscanBaseUrl}${tx.transaction_signature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center"
                    >
                      View on Solscan
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 ml-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
