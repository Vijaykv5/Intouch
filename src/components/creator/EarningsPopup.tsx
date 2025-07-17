import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabase";
import { toast } from "react-hot-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface EarningsData {
  date: string;
  amount: number;
}

interface EarningsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  creatorId: string;
}

export default function EarningsPopup({
  isOpen,
  onClose,
  creatorId,
}: EarningsPopupProps) {
  const [earnings, setEarnings] = useState<EarningsData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchEarnings();
    }
  }, [isOpen, creatorId]);

  const fetchEarnings = async () => {
    try {
      setIsLoading(true);

      // Get all paid connections for this creator
      const { data: connections, error: connectionsError } = await supabase
        .from("paid_connections")
        .select("amount_paid, created_at")
        .eq("creator_id", creatorId)
        .order("created_at", { ascending: true });

      if (connectionsError) {
        throw connectionsError;
      }

      if (!connections) {
        setEarnings([]);
        return;
      }

      // Group earnings by date
      const earningsByDate = connections.reduce((acc, conn) => {
        const date = new Date(conn.created_at).toISOString().split("T")[0];
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date] += parseFloat(conn.amount_paid);
        return acc;
      }, {} as Record<string, number>);

      // Convert to array format for the chart
      const earningsData = Object.entries(earningsByDate).map(
        ([date, amount]) => ({
          date,
          amount,
        })
      );

      // Calculate total earnings
      const total = earningsData.reduce((sum, data) => sum + data.amount, 0);

      setEarnings(earningsData);
      setTotalEarnings(total);
    } catch (error) {
      console.error("Error fetching earnings:", error);
      toast.error("Failed to load earnings data");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-orange-900">
            Earnings Overview
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-orange-900">
              Total Earnings
            </h3>
            <p className="text-3xl font-bold text-orange-600">
              {totalEarnings.toFixed(2)} SOL
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : earnings.length > 0 ? (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={earnings}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <YAxis tickFormatter={(value) => `${value} SOL`} />
                <Tooltip
                  formatter={(value: number) => [
                    `${value.toFixed(2)} SOL`,
                    "Earnings",
                  ]}
                  labelFormatter={(label) =>
                    new Date(label).toLocaleDateString()
                  }
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center text-gray-500 h-64 flex items-center justify-center">
            No earnings data available
          </div>
        )}
      </div>
    </div>
  );
}
