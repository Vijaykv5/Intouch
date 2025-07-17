import React from "react";

/**
 * Simple shimmer/skeleton loader for avatar and text.
 * Use <Shimmer type="avatar" /> or <Shimmer type="text" width="120px" height="16px" />
 */
export default function Shimmer({ type = "text", width, height }: { type?: "avatar" | "text"; width?: string; height?: string }) {
  if (type === "avatar") {
    return (
      <div
        className="animate-pulse rounded-full bg-gray-200"
        style={{ width: width || "40px", height: height || "40px" }}
      />
    );
  }
  // Default to text shimmer
  return (
    <div
      className="animate-pulse rounded bg-gray-200"
      style={{ width: width || "100px", height: height || "16px" }}
    />
  );
}
