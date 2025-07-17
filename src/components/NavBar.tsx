import React, { useState, useCallback, useRef } from "react";
import Shimmer from "./Shimmer";
import { Search, Menu, X, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser, UserButton } from "@civic/auth-web3/react";
import { Copy, Wallet as WalletIcon, ExternalLink, Check, LogOut } from "lucide-react";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

// --- Web3 User Context Types and Type Guard ---
import type { WalletAdapter } from "@solana/wallet-adapter-base";

type UserContext = ReturnType<typeof useUser>;


function userHasWallet(
  ctx: UserContext
): ctx is UserContext & { solana: { address: string; wallet: WalletAdapter } } {
  return (
    typeof ctx === "object" &&
    ctx !== null &&
    typeof (ctx as any).solana === "object" &&
    (ctx as any).solana !== null &&
    typeof (ctx as any).solana.address === "string" &&
    typeof (ctx as any).solana.wallet === "object" &&
    (ctx as any).solana.wallet !== null
  );
}

interface NavBarProps {
  goToCreatorSignupPage: () => void;
}

// Declaring the global Civic Web3 object for better TypeScript recognition
declare global {
  interface Window {
    civicWeb3?: {
      createWallet?: () => Promise<void>;
    };
  }
}



export default function NavBar({ goToCreatorSignupPage }: NavBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const userContext = useUser();
  const { user } = userContext;
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  console.log("userContext", userContext);
  /**
   * Handles the user sign-out process.
   * Clears user-related states like wallet address and balance.
   */
  const handleSignOut = useCallback(() => {
    try {
      if (userContext.signOut) {
        userContext.signOut();
        setDropdownOpen(false);
        setMobileDropdownOpen(false);
        setWalletAddress(null);
        setWalletBalance(null);
      }
    } catch (error) {
      console.error("Failed to sign out:", error);
      // Optionally, show a user-friendly error message
    }
  }, [userContext]);

  /**
   * Minifies a Solana wallet address for display.
   * @param address The full wallet address.
   * @returns A minified string like "ABCD...WXYZ" or an empty string if null.
   */
  const minifyAddress = (address: string | null): string => {
    if (!address) return "";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  /**
   * Copies the wallet address to the clipboard.
   * Provides visual feedback for a short period.
   */
  const copyToClipboard = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset copied state after 2 seconds
    }
  };

  /**
   * Fetches the Solana balance for a given public key.
   * @param publicKey The Solana public key (can be string or PublicKey object).
   */
  const fetchWalletBalance = async (
    publicKey: string | PublicKey | undefined
  ) => {
    if (!publicKey) {
      setWalletBalance(null); // Clear balance if no public key
      return;
    }
    try {
      setIsLoadingBalance(true);
      const rpcEndpoint = "https://api.devnet.solana.com"; // Consider making this configurable (e.g., via environment variables)
      const connection = new Connection(rpcEndpoint);

      let solanaPublicKey: PublicKey;
      if (typeof publicKey === "string") {
        solanaPublicKey = new PublicKey(publicKey);
      } else if (publicKey instanceof PublicKey) {
        // More robust check for PublicKey instance
        solanaPublicKey = publicKey;
      } else {
        console.error(
          "Invalid public key format provided for balance fetch:",
          publicKey
        );
        setWalletBalance(null); // Ensure balance is cleared on invalid format
        return;
      }

      const balance = await connection.getBalance(solanaPublicKey);
      setWalletBalance(balance / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      setWalletBalance(null); // Clear balance on error
    } finally {
      setIsLoadingBalance(false);
    }
  };

  /**
   * Effect to handle wallet initialization and balance fetching.
   * Runs when the user context changes.
   */
  React.useEffect(() => {
    const initializeWallet = async () => {
      if (!user) {
        setWalletAddress(null);
        setWalletBalance(null);
        return;
      }

      if (userHasWallet(userContext)) {
        const currentWalletAddress = userContext.solana.address;
        setWalletAddress(currentWalletAddress);
        await fetchWalletBalance(currentWalletAddress);
      } else if (
        "createWallet" in userContext &&
        typeof userContext.createWallet === "function"
      ) {
        try {
          setIsCreatingWallet(true);
          await userContext.createWallet();
          if (userHasWallet(userContext)) {
            const newWalletAddress = userContext.solana.address;
            setWalletAddress(newWalletAddress);
            await fetchWalletBalance(newWalletAddress);
          }
        } catch (error) {
          console.error("Failed to create wallet:", error);
          setWalletAddress(null);
          setWalletBalance(null);
        } finally {
          setIsCreatingWallet(false);
        }
      } else {
        setWalletAddress(null);
        setWalletBalance(null);
      }
    };

    initializeWallet();
  }, [userContext, fetchWalletBalance]);

  /**
   * Effect for closing dropdowns when clicking outside.
   */
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  /**
   * Effect for closing mobile dropdown when clicking outside.
   * This is a separate effect for the mobile dropdown.
   */
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileDropdownRef.current &&
        !mobileDropdownRef.current.contains(event.target as Node)
      ) {
        setMobileDropdownOpen(false);
      }
    };
    if (mobileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileDropdownOpen]);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 transition-colors duration-300">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            className="text-2xl font-bold text-gray-800 focus:outline-none bg-transparent border-none cursor-pointer"
            style={{ background: "none", border: "none", padding: 0 }}
            onClick={() => navigate("/")}
            aria-label="Go to home page"
          >
            InTouch
          </button>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          {/* Future link for creators can go here */}
          {/* <Link to="/for-creators" className="text-gray-600 hover:text-gray-800 transition duration-300">
            For Creators
          </Link> */}
        </div>
        <div className="hidden md:flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Find creators"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500"
              aria-label="Find creators search input"
            />
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
          </div>

          {/* Desktop user/account section */}
          {typeof user === "undefined" ? (
            <div className="flex items-center gap-2">
              <Shimmer type="avatar" />
              <Shimmer type="text" width="100px" height="16px" />
            </div>
          ) : !user ? (
            <div className="flex items-center">
              <UserButton />
              <button
                onClick={goToCreatorSignupPage}
                className="px-4 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition duration-300 font-semibold shadow-sm focus:outline-none ml-2"
              >
                Join as creator
              </button>
            </div>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((open) => !open)}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200 transition duration-300 focus:outline-none"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                {/* Avatar */}
                <img
                  src={user.picture || "/default-avatar.png"}
                  alt={`${user.email || "User"}'s avatar`}
                  className="w-8 h-8 rounded-full object-cover mr-2 border border-gray-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/default-avatar.png";
                  }}
                />
                <span className="mr-2">
                  {user.email || "Account"}
                </span>
                {dropdownOpen ? (
                  <ChevronUp size={18} aria-label="Collapse menu" />
                ) : (
                  <ChevronDown size={18} aria-label="Expand menu" />
                )}
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-100">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="flex items-center space-x-3 mb-2">
                      <img
                        src={user.picture || "/default-avatar.png"}
                        alt={`${user.email || "User"}'s avatar`}
                        className="w-10 h-10 rounded-full object-cover border border-gray-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/default-avatar.png";
                        }}
                      />
                      <div>
                        <p className="font-bold text-xs text-gray-800">
                          {user.email || "Account"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Authenticated with Civic
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Wallet Section */}
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-500">Authentication</span>
                      <span className="text-green-600 flex items-center">
                        <Check className="h-3 w-3 mr-1" /> Verified
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-500">Wallet</span>
                      {isCreatingWallet ? (
                        <span className="text-gray-400 text-xs">
                          Creating...
                        </span>
                      ) : walletAddress ? (
                        <span className="text-green-600 flex items-center">
                          <Check className="h-3 w-3 mr-1" /> Connected
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">
                          Not connected
                        </span>
                      )}
                    </div>

                    {walletAddress && (
                      <div className="bg-gray-50 p-2 rounded flex items-center justify-between">
                        <div className="flex items-center">
                          <WalletIcon className="h-3 w-3 text-gray-700 mr-2" />
                          <span
                            className="text-xs font-mono text-gray-700"
                            title={walletAddress}
                          >
                            {minifyAddress(walletAddress)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <a
                            href={`https://explorer.solana.com/address/${walletAddress}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View on Solana Explorer (Devnet)"
                            className="text-gray-400 hover:text-gray-700 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <button
                            className="text-gray-400 hover:text-gray-700"
                            onClick={copyToClipboard}
                            title="Copy wallet address"
                          >
                            <Copy
                              className={`h-3 w-3 ${
                                isCopied ? "text-green-600" : ""
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    )}
                    {walletBalance !== null && (
                      <div className="px-4 py-2 text-xs text-gray-500">
                        Balance:{" "}
                        {isLoadingBalance
                          ? "Loading..."
                          : `${walletBalance.toFixed(4)} SOL`}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <button
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>
      {isMenuOpen && (
        <div className="md:hidden bg-white py-4 transition-colors duration-300">
          <div className="container mx-auto px-4 space-y-4">
            {/* Future link for creators can go here */}
            {/* <Link to="/for-creators" className="block text-gray-600 hover:text-gray-800 transition duration-300">
              For Creators
            </Link> */}
            <div className="relative">
              <input
                type="text"
                placeholder="Find experts"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500"
                aria-label="Find experts search input"
              />
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>

            {/* Mobile user/account section */}
            {typeof user === "undefined" ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Shimmer type="avatar" />
                  <Shimmer type="text" width="100px" height="16px" />
                </div>
              </div>
            ) : !user ? (
              <div className="flex flex-col gap-2">
                <UserButton />
                <button
                  onClick={goToCreatorSignupPage}
                  className="px-4 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition duration-300 font-semibold shadow-sm focus:outline-none mt-2 w-full"
                >
                  Join as creator
                </button>
              </div>
            ) : (
              <div className="relative" ref={mobileDropdownRef}>
                <button
                  onClick={() => setMobileDropdownOpen((open) => !open)}
                  className="flex items-center w-full px-4 py-2 bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200 transition duration-300 focus:outline-none"
                >
                  {/* Avatar */}
                  <img
                    src={user.picture || "/default-avatar.png"}
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover mr-2 border border-gray-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/default-avatar.png";
                    }}
                  />
                  <span className="mr-2">
                    {user.email
                      ? user.email
                      : "Account"}
                  </span>
                  {mobileDropdownOpen ? (
                    <ChevronUp size={18} aria-label="Collapse menu" />
                  ) : (
                    <ChevronDown size={18} aria-label="Expand menu" />
                  )}
                </button>
                {mobileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-100">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="flex items-center space-x-3 mb-2">
                        <img
                          src={
                            user.picture || "/default-avatar.png"
                          }
                          alt={`${user.email || "User"}'s avatar`}
                          className="w-10 h-10 rounded-full object-cover border border-gray-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "/default-avatar.png";
                          }}
                        />
                        <div>
                          <p className="font-medium text-xs text-gray-800">
                            {user.email || "Account"}
                          </p>
                          <p className="text-xs text-gray-500">
                            Authenticated with Civic
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* Wallet Section */}
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-500">Authentication</span>
                        <span className="text-green-600 flex items-center">
                          <Check className="h-3 w-3 mr-1" /> Verified
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-500">Wallet</span>
                        {isCreatingWallet ? (
                          <span className="text-gray-400 text-xs">
                            Creating...
                          </span>
                        ) : walletAddress ? (
                          <span className="text-green-600 flex items-center">
                            <Check className="h-3 w-3 mr-1" /> Connected
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">
                            Not connected
                          </span>
                        )}
                      </div>

                      {walletAddress && (
                        <div className="bg-gray-50 p-2 rounded flex items-center justify-between">
                          <div className="flex items-center">
                            <WalletIcon className="h-3 w-3 text-gray-700 mr-2" />
                            <span
                              className="text-xs font-mono text-gray-700"
                              title={walletAddress}
                            >
                              {minifyAddress(walletAddress)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <a
                              href={`https://explorer.solana.com/address/${walletAddress}?cluster=devnet`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View on Solana Explorer (Devnet)"
                              className="text-gray-400 hover:text-gray-700 transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <button
                              className="text-gray-400 hover:text-gray-700"
                              onClick={copyToClipboard}
                              title="Copy wallet address"
                            >
                              <Copy
                                className={`h-3 w-3 ${
                                  isCopied ? "text-green-600" : ""
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      )}
                      {walletBalance !== null && (
                        <div className="px-4 py-2 text-xs text-gray-500">
                          Balance:{" "}
                          {isLoadingBalance
                            ? "Loading..."
                            : `${walletBalance.toFixed(4)} SOL`}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <LogOut className="mr-2 h-4 w-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
