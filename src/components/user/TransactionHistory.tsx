import React from "react";

// Mock transaction data
const transactions = [
  {
    creator: "anema",
    solAmount: 1.25,
    signature: "5K8s...9d2A",
    signatureFull: "5K8s7d8f9g0h1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8a9b0c9d2A",
  },
  {
    creator: "solana_guru",
    solAmount: 0.75,
    signature: "3J2k...8f7B",
    signatureFull: "3J2k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d3e4f5g6h7i8f7B",
  },
  {
    creator: "blockchain_queen",
    solAmount: 2.00,
    signature: "7H1l...2c3D",
    signatureFull: "7H1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j2c3D",
  },
];

const solscanBaseUrl = "https://solscan.io/tx/";

const TransactionHistory: React.FC = () => {
  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4 text-orange-900">Transaction History</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow">
          <thead>
            <tr className="bg-orange-100 text-orange-900">
              <th className="py-2 px-4 text-left">Creator</th>
              <th className="py-2 px-4 text-left">SOL Amount</th>
              <th className="py-2 px-4 text-left">Signature</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, idx) => (
              <tr key={idx} className="border-b hover:bg-orange-50">
                <td className="py-2 px-4 font-medium">{tx.creator}</td>
                <td className="py-2 px-4">{tx.solAmount} ◎</td>
                <td className="py-2 px-4">
                  <a
                    href={`${solscanBaseUrl}${tx.signatureFull}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline break-all"
                  >
                    {tx.signature}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionHistory; 