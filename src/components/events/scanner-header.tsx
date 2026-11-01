"use client";

import { useState } from "react";
import Link from "next/link";

interface ScannerHeaderProps {
  initialCount: number;
  orgCode: string;
  eventTitle: string;
  eventLocation: string | null;
  eventDate: string;
}

export function ScannerHeader({
  initialCount,
  orgCode,
  eventTitle,
  eventLocation,
  eventDate,
  countOverride,
}: ScannerHeaderProps & { countOverride?: number }) {
  const displayCount = countOverride ?? initialCount;

  return (
    <div className="flex justify-between items-center border-b pb-4">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/admin/events" className="hover:underline">
            ← Events
          </Link>
          <span>/</span>
          <span>{orgCode}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{eventTitle}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {eventLocation || "Location TBA"} • {new Date(eventDate).toLocaleString()}
        </p>
      </div>

      <div className="text-right">
        <div className="text-3xl font-extrabold text-green-600">
          {displayCount}
        </div>
        <div className="text-xs text-gray-500 font-medium">Total Checked-In</div>
      </div>
    </div>
  );
}