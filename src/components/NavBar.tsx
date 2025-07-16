import React, { useState, useCallback, useRef } from "react";
import {
  Search,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  LogOut,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "@civic/auth/react";
import { userHasWallet } from "@civic/auth-web3";
import { Copy, Wallet, ExternalLink, Check } from "lucide-react";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

interface NavBarProps {
  goToCreatorSignupPage: () => void;
}

export default function NavBar({
  goToCreatorSignupPage,
}: NavBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const { signIn, user, signOut } = useUser();
  const [signingIn, setSigningIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleSignIn = useCallback(() => {
    setSigningIn(true);
    Promise.resolve(signIn())
      .finally(() => setSigningIn(false));
  }, [signIn]);

  const handleSignOut = useCallback(() => {
    setSigningOut(true);
    Promise.resolve(signOut())
      .finally(() => {
        setSigningOut(false);
        setDropdownOpen(false);
        setMobileDropdownOpen(false);
      });
  }, [signOut]);

  const minifyAddress = (address: string | null): string => {
    if (!address) return "";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const copyToClipboard = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const fetchWalletBalance = async (publicKey: any) => {
    if (!publicKey) return;
    try {
      setIsLoadingBalance(true);
      const rpcEndpoint = "https://api.devnet.solana.com";
      const connection = new Connection(rpcEndpoint);
      let solanaPublicKey;
      if (typeof publicKey === 'string') {
        solanaPublicKey = new PublicKey(publicKey);
      } else if (publicKey.toBase58) {
        solanaPublicKey = publicKey;
      } else if (publicKey.toString) {
        solanaPublicKey = new PublicKey(publicKey.toString());
      } else {
        throw new Error("Invalid public key format");
      }
      const balance = await connection.getBalance(solanaPublicKey);
      setWalletBalance(balance / LAMPORTS_PER_SOL);
    } catch (error) {
      setWalletBalance(null);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  React.useEffect(() => {
    async function initializeWallet() {
      if (!user) {
        setWalletAddress(null);
        setWalletBalance(null);
        return;
      }
      if (userHasWallet(user)) {
        let address = null;
        if ((user as any).solana?.address) {
          address = (user as any).solana.address;
        } else if ((user as any).solana?.wallet?.publicKey?.toString()) {
          address = (user as any).solana.wallet.publicKey.toString();
        } else if ((user as any).publicKey?.toString()) {
          address = (user as any).publicKey.toString();
        }
        if (address) {
          setWalletAddress(address);
          await fetchWalletBalance(address);
        }
      } else {
        setWalletAddress(null);
        setWalletBalance(null);
      }
    }
    initializeWallet();
  }, [user]);

  // Close dropdown on outside click
  // Desktop
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);
  // Mobile
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        mobileDropdownRef.current &&
        !mobileDropdownRef.current.contains(event.target as Node)
      ) {
        setMobileDropdownOpen(false);
      }
    }
    if (mobileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileDropdownOpen]);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 transition-colors duration-300">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            className="text-2xl font-bold text-gray-800 focus:outline-none bg-transparent border-none cursor-pointer"
            style={{ background: 'none', border: 'none', padding: 0 }}
            onClick={() => navigate("/")}
            aria-label="Go to home page"
          >
            InTouch
          </button>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          {/* <a
            href="#"
            className="text-gray-600 hover:text-gray-800 transition duration-300"
          >
            For Creators
          </a> */}
        </div>
        <div className="hidden md:flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Find creators"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
          </div>
          {!user && (
            <button
              onClick={handleSignIn}
              className={`px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition duration-300 relative overflow-hidden ${signingIn ? 'opacity-80 cursor-not-allowed' : ''}`}
              disabled={signingIn}
            >
              {signingIn ? (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="block w-5 h-5 rounded-full bg-gradient-to-r from-blue-400 via-blue-200 to-blue-400 animate-pulse" />
                </span>
              ) : (
                'Sign In'
              )}
              {/* <span className={signingIn ? 'invisible' : ''}>Sign In</span> */}
            </button>
          )}
          {/* Desktop user/account section */}
          {signingOut ? (
            <div className="flex items-center px-4 py-2 bg-gray-100 rounded-full animate-pulse min-w-[160px] min-h-[40px]">
              <div className="w-8 h-8 rounded-full bg-gray-200 mr-2" />
              <div className="h-4 w-24 bg-gray-200 rounded" />
            </div>
          ) : user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((open) => !open)}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200 transition duration-300 focus:outline-none"
              >
                {/* Avatar */}
                <img
                  src={user.picture || "/default-avatar.png"}
                  alt="avatar"
                  className="w-8 h-8 rounded-full object-cover mr-2 border border-gray-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/default-avatar.png";
                  }}
                />
                <span className="mr-2">
                  {user.email ? user.email : "Account"}
                </span>
                {dropdownOpen ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-100">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="flex items-center space-x-3 mb-2">
                      <img
                        src={user.picture || "/default-avatar.png"}
                        alt="avatar"
                        className="w-10 h-10 rounded-full object-cover border border-gray-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/default-avatar.png";
                        }}
                      />
                      <div>
                        <p className="font-medium text-gray-800">{user.email ? user.email : "Account"}</p>
                        <p className="text-xs text-gray-500">Authenticated with Civic</p>
                      </div>
                    </div>
                  </div>
                  {/* Wallet Section */}
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-500">Wallet</span>
                      {isCreatingWallet ? (
                        <span className="text-gray-400 text-xs">Creating...</span>
                      ) : walletAddress ? (
                        <span className="text-green-600 flex items-center"><Check className="h-3 w-3 mr-1" /> Connected</span>
                      ) : (
                        <span className="text-gray-400 text-xs">Not connected</span>
                      )}
                    </div>
                    {walletAddress && (
                      <div className="bg-gray-50 p-2 rounded flex items-center justify-between">
                        <div className="flex items-center">
                          <Wallet className="h-4 w-4 text-gray-700 mr-2" />
                          <span className="text-xs font-mono text-gray-700" title={walletAddress}>
                            {minifyAddress(walletAddress)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <a
                            href={`https://explorer.solana.com/address/${walletAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View on Solana Explorer"
                            className="text-gray-400 hover:text-gray-700"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          <button
                            className="ml-1 text-gray-400 hover:text-gray-700"
                            onClick={copyToClipboard}
                            title="Copy wallet address"
                          >
                            <Copy className={`h-4 w-4 ${isCopied ? "text-green-600" : ""}`} />
                          </button>
                        </div>
                      </div>
                    )}
                    {walletBalance !== null && (
                      <div className="text-xs text-gray-500 mt-1">
                        Balance: {isLoadingBalance ? "Loading..." : `${walletBalance} SOL`}
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
          {/* Only show Join as creator if not signed in */}
          {!user && !signingOut && (
            <button
              onClick={goToCreatorSignupPage}
              className="px-4 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition duration-300"
            >
              Join as creator
            </button>
          )}
        </div>
        <button
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>
      {isMenuOpen && (
        <div className="md:hidden bg-white py-4 transition-colors duration-300">
          <div className="container mx-auto px-4 space-y-4">
            {/* <a
              href="#"
              className="block text-gray-600 hover:text-gray-800 transition duration-300"
            >
              For Creators
            </a> */}
            <div className="relative">
              <input
                type="text"
                placeholder="Find experts"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
            {!user && (
              <button
                onClick={handleSignIn}
                className={`w-full px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition duration-300 text-center relative overflow-hidden ${signingIn ? 'opacity-80 cursor-not-allowed' : ''}`}
                disabled={signingIn}
              >
                {signingIn ? (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="block w-5 h-5 rounded-full bg-gradient-to-r from-blue-400 via-blue-200 to-blue-400 animate-pulse" />
                  </span>
                ) : (
                  'Sign In'
                )}
                {/* <span className={signingIn ? 'invisible' : ''}>Sign In</span> */}
              </button>
            )}
            {/* Mobile user/account section */}
            {signingOut ? (
              <div className="flex items-center w-full px-4 py-2 bg-gray-100 rounded-full animate-pulse min-h-[40px]">
                <div className="w-8 h-8 rounded-full bg-gray-200 mr-2" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
              </div>
            ) : user && (
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
                    {user.email ? user.email : "Account"}
                  </span>
                  {mobileDropdownOpen ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </button>
                {mobileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-100">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="flex items-center space-x-3 mb-2">
                        <img
                          src={user.picture || "/default-avatar.png"}
                          alt="avatar"
                          className="w-10 h-10 rounded-full object-cover border border-gray-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/default-avatar.png";
                          }}
                        />
                        <div>
                          <p className="font-medium text-gray-800">{user.email ? user.email : "Account"}</p>
                          <p className="text-xs text-gray-500">Authenticated with Civic</p>
                        </div>
                      </div>
                    </div>
                    {/* Wallet Section */}
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-500">Wallet</span>
                        {isCreatingWallet ? (
                          <span className="text-gray-400 text-xs">Creating...</span>
                        ) : walletAddress ? (
                          <span className="text-green-600 flex items-center"><Check className="h-3 w-3 mr-1" /> Connected</span>
                        ) : (
                          <span className="text-gray-400 text-xs">Not connected</span>
                        )}
                      </div>
                      {walletAddress && (
                        <div className="bg-gray-50 p-2 rounded flex items-center justify-between">
                          <div className="flex items-center">
                            <Wallet className="h-4 w-4 text-gray-700 mr-2" />
                            <span className="text-xs font-mono text-gray-700" title={walletAddress}>
                              {minifyAddress(walletAddress)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <a
                              href={`https://explorer.solana.com/address/${walletAddress}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View on Solana Explorer"
                              className="text-gray-400 hover:text-gray-700"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                            <button
                              className="ml-1 text-gray-400 hover:text-gray-700"
                              onClick={copyToClipboard}
                              title="Copy wallet address"
                            >
                              <Copy className={`h-4 w-4 ${isCopied ? "text-green-600" : ""}`} />
                            </button>
                          </div>
                        </div>
                      )}
                      {walletBalance !== null && (
                        <div className="text-xs text-gray-500 mt-1">
                          Balance: {isLoadingBalance ? "Loading..." : `${walletBalance} SOL`}
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
            {/* Only show Join as creator if not signed in */}
            {!user && !signingOut && (
              <button
                onClick={goToCreatorSignupPage}
                className="w-full px-4 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition duration-300"
              >
                Become a creator
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
