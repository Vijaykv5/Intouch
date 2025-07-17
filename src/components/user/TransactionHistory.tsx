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

const explorerBaseUrl = "https://explorer.solana.com/tx/"; 


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
    <div className="p-8 max-w-5xl min-h-[80vh] mx-auto flex flex-col items-center">
      <h2 className="text-3xl font-extrabold mb-8 text-orange-900 tracking-tight text-center">Transaction History</h2>
      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-white rounded-2xl shadow-md px-8 py-16 mt-12 space-y-4 w-full max-w-xl">
          <svg className="w-16 h-16 text-orange-200 mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg>
          <p className="text-gray-500 text-lg">No transactions found</p>
          <p className="text-sm text-gray-400">Check browser console for debug information</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-lg shadow hover:from-orange-500 hover:to-orange-600 transition-all text-base font-semibold"
          >
            Refresh Data
          </button>
        </div>
      ) : (
        <div className="w-full max-w-6xl mx-auto bg-white rounded-xl shadow overflow-hidden divide-y divide-orange-100 border border-orange-200">
          {transactions.map((tx) => {
            const creator = connectedCreators.find(c => c.id === tx.creator_id);
            const dateObj = new Date(tx.created_at);
            const dateStr = dateObj.toLocaleDateString();
            const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            return (
              <div key={tx.id} className="flex items-center px-6 py-4 hover:bg-orange-50 transition-all">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden mr-4">
                  {creator?.profile_image ? (
                    <img
                      src={creator.profile_image}
                      alt={creator.name || "Creator"}
                      className="w-12 h-12 object-cover rounded-full"
                      onError={e => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(creator?.name || "U")}`;
                      }}
                    />
                  ) : (
                    <span className="text-lg font-bold">{creator?.name?.charAt(0) || "?"}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{creator?.name || "Unknown Creator"}</span>
                    <span className="text-xs text-gray-400">@{creator?.twitter_username || "unknown"}</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500">{dateStr}</span>
                    <span className="text-xs text-gray-400">{timeStr}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end ml-4">
                  <span className="text-lg font-bold text-orange-600">{tx.amount_paid ? `${tx.amount_paid} SOL` : "N/A"}</span>
                  {tx.transaction_signature && (
                    <a
                      href={`${explorerBaseUrl}${tx.transaction_signature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center px-3 py-1 bg-orange-50 text-orange-700 rounded hover:bg-orange-100 text-xs font-medium transition"
                    >
                      View on Explorer
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
