import React, { useState } from "react";
import { Youtube, Instagram, Mail, Bookmark, X, Loader2 } from "lucide-react";
import { useUser } from "@civic/auth-web3/react";
import { Connection, LAMPORTS_PER_SOL, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import toast from "react-hot-toast";
import { supabase } from "../../utils/supabase";
import { Buffer } from "buffer";
import { useCivicUser } from "../../hooks/useCivicUser";

// Buffer polyfill for browser environment
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = Buffer;
}

// Helper function to get wallet from Civic context
const getWalletFromCivic = (userContext: any) => {
  return (userContext as any).solana?.wallet;
};

interface CreatorProfile {
  id: string;
  creator_name: string;
  username: string;
  description: string;
  price: string;
  x_connected: boolean;
  x_username: string;
  x_profile_image: string | null;
  category: string;
  created_at: string;
  wallet_address: string;
}

export const CreatorDetailsSidebar: React.FC<any> = ({
  creator,
  isOpen,
  onClose,
  onSendMessage,
}) => {
  const userContext = useUser();
  const { userProfile, isLoading: profileLoading, updateWalletAddress } = useCivicUser();
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionSignature, setTransactionSignature] = useState<string | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<'initializing' | 'confirming' | 'success' | 'failed'>('initializing');

  // Check wallet connection status
  React.useEffect(() => {
    const checkWalletConnection = () => {
      const wallet = getWalletFromCivic(userContext);
      setWalletConnected(!!wallet?.publicKey);
    };

    checkWalletConnection();
    // Check periodically
    const interval = setInterval(checkWalletConnection, 1000);
    return () => clearInterval(interval);
  }, [userContext]);

  if (!isOpen || !creator) return null;

  const handleSendMessage = async () => {
    if (!userProfile) {
      toast.error("Please sign in to send a message");
      return;
    }

    if (!userProfile.id) {
      toast.error("User profile ID not found");
      return;
    }

    // Verify that the user profile exists in the database
    const { data: profileCheck, error: profileError } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("id", userProfile.id)
      .single();

    if (profileError || !profileCheck) {
      console.error("User profile not found in database:", profileError);
      toast.error("User profile not found. Please try signing in again.");
      return;
    }

    if (!creator.wallet_address) {
      toast.error("Creator wallet address not found");
      return;
    }

    if (!creator.id) {
      toast.error("Creator ID not found");
      return;
    }

    const priceInSol = parseFloat(creator.price);
    if (isNaN(priceInSol) || priceInSol <= 0) {
      toast.error("Invalid creator price");
      return;
    }

    // Get the wallet from Civic
    const wallet = getWalletFromCivic(userContext);
    if (!wallet) {
      toast.error("Wallet not found. Please make sure you're connected with Civic.");
      return;
    }

    // Show transaction modal
    setShowTransactionModal(true);
    setTransactionStatus('initializing');
    setIsProcessing(true);

    try {
      // Check if user already has a paid connection with this creator
      const { data: existingConnection } = await supabase
        .from("paid_connections")
        .select("*")
        .eq("user_id", userProfile.id)
        .eq("creator_id", creator.id)
        .single();

      if (existingConnection) {
        // User already paid, proceed to chat
        setShowTransactionModal(false);
        setIsProcessing(false);
        onSendMessage();
        return;
      }

      // Create Solana connection
      const connection = new Connection("https://api.devnet.solana.com", "confirmed");
      
      // Calculate lamports
      const lamports = Math.round(priceInSol * LAMPORTS_PER_SOL);
      
      // Get user's public key
      const publicKey = wallet.publicKey;
      if (!publicKey) {
        throw new Error("Public key not found");
      }

      // Create transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(creator.wallet_address),
          lamports,
        })
      );

      // Get latest blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      try {
        // Update status to confirming
        setTransactionStatus('confirming');
        
        // Sign and send transaction
        const signedTransaction = await wallet.signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        
        // Wait for confirmation with timeout
        const confirmation = await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight
        }, 'confirmed');

        if (confirmation.value.err) {
          throw new Error('Transaction failed');
        }

        setTransactionSignature(signature);
        setTransactionStatus('success');

        // Record the paid connection in the database
        console.log("Recording payment with user_id:", userProfile.id, "creator_id:", creator.id);
        
        const { error: dbError } = await supabase
          .from("paid_connections")
          .insert([
            {
              user_id: userProfile.id,
              creator_id: creator.id,
              amount_paid: creator.price,
              transaction_signature: signature,
            },
          ]);

        if (dbError) {
          console.error("Error recording payment:", dbError);
          console.error("User profile ID:", userProfile.id);
          console.error("Creator ID:", creator.id);
          toast.error("Payment successful but failed to record connection");
          return;
        }

        toast.success(`Payment successful! ${creator.price} SOL sent to ${creator.creator_name}`);
        
        // Wait a moment to show success, then proceed to dashboard
        setTimeout(() => {
          setShowTransactionModal(false);
          setIsProcessing(false);
          onSendMessage();
        }, 2000);

      } catch (txError) {
        console.error("Transaction error:", txError);
        setTransactionStatus('failed');
        toast.error("Transaction failed. Please try again.");
        return;
      }

    } catch (error) {
      console.error("Error:", error);
      setTransactionStatus('failed');
      toast.error("Error processing transaction");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>
        <div className="flex flex-col items-center gap-4">
          <img
            src={creator.x_profile_image || ""}
            alt={creator.creator_name}
            className="w-24 h-24 rounded-full object-cover"
          />
          <h2 className="text-xl font-semibold">{creator.creator_name}</h2>
          <p className="text-gray-600">{creator.description}</p>
          
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Message Price</p>
            <p className="text-2xl font-bold text-orange-600">{creator.price} SOL</p>
          </div>

          {/* Wallet Connection Status */}
          <div className="text-center">
            <div className={`flex items-center justify-center gap-2 p-2 rounded-lg ${
              walletConnected ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                walletConnected ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
              <span className="text-sm">
                {walletConnected ? 'Wallet Connected' : 'Wallet Not Connected'}
              </span>
            </div>
          </div>

          {transactionSignature && (
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700 mb-1">Payment Successful!</p>
              <a
                href={`https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:text-blue-700"
              >
                View Transaction
              </a>
            </div>
          )}

          <button
            onClick={handleSendMessage}
            disabled={isProcessing || !walletConnected || profileLoading}
            className={`flex items-center gap-2 px-6 py-3 rounded-full transition ${
              isProcessing || !walletConnected || profileLoading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-orange-500 text-white hover:bg-orange-600"
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing Payment...
              </>
            ) : profileLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading Profile...
              </>
            ) : !walletConnected ? (
              "Connect Wallet First"
            ) : (
              "Send Message"
            )}
          </button>
        </div>
      </div>

      {/* Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 animate-fade-in">
            <div className="flex flex-col items-center gap-4">
              {transactionStatus === 'initializing' && (
                <>
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                  <h3 className="text-lg font-semibold">Initializing Transaction</h3>
                  <p className="text-gray-600 text-center">Preparing to send {creator.price} SOL to {creator.creator_name}</p>
                </>
              )}
              
              {transactionStatus === 'confirming' && (
                <>
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                  <h3 className="text-lg font-semibold">Confirming Transaction</h3>
                  <p className="text-gray-600 text-center">Waiting for blockchain confirmation...</p>
                </>
              )}
              
              {transactionStatus === 'success' && (
                <>
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-green-600">Payment Successful!</h3>
                  <p className="text-gray-600 text-center">Redirecting to dashboard...</p>
                  {transactionSignature && (
                    <a
                      href={`https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:text-blue-700"
                    >
                      View Transaction
                    </a>
                  )}
                </>
              )}
              
              {transactionStatus === 'failed' && (
                <>
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-red-600">Transaction Failed</h3>
                  <p className="text-gray-600 text-center">Please try again</p>
                  <button
                    onClick={() => setShowTransactionModal(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-full hover:bg-gray-600 transition"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
