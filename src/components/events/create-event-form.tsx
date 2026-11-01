"use client";

import { createEvent } from "@/actions/event-actions";
import { useRef, useState } from "react";

interface Organization {
  id: string;
  name: string;
  code: string;
}

export function CreateEventForm({ availableOrgs }: { availableOrgs: Organization[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<{ error?: string; success?: string } | null>(null);

  async function handleSubmit(formData: FormData) {
    setStatus(null);
    const res = await createEvent(formData);

    if (res?.error) {
      setStatus({ error: res.error });
    } else if (res?.success) {
      setStatus({ success: res.success });
      formRef.current?.reset();
    }
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      {status?.error && (
        <div className="p-3 text-xs bg-red-50 text-red-600 border border-red-200 rounded-md">
          {status.error}
        </div>
      )}
      {status?.success && (
        <div className="p-3 text-xs bg-green-50 text-green-600 border border-green-200 rounded-md">
          {status.success}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Hosting Council / Society</label>
        <select
          name="organization_id"
          required
          className="w-full px-3 py-2 border rounded-md text-sm bg-background"
        >
          <option value="">Select Organization...</option>
          {availableOrgs.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name} ({org.code})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Event Title</label>
        <input
          type="text"
          name="title"
          required
          placeholder="e.g. Annual General Assembly 2026"
          className="w-full px-3 py-2 border rounded-md text-sm bg-background"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Venue / Location</label>
        <input
          type="text"
          name="location"
          placeholder="e.g. University Gymnasium"
          className="w-full px-3 py-2 border rounded-md text-sm bg-background"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Date & Time</label>
        <input
          type="datetime-local"
          name="event_date"
          required
          className="w-full px-3 py-2 border rounded-md text-sm bg-background"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          name="description"
          rows={3}
          placeholder="Details regarding agenda, requirements, or clearances..."
          className="w-full px-3 py-2 border rounded-md text-sm bg-background"
        />
      </div>

      <button
        type="submit"
        className="w-full py-2 px-4 bg-primary text-primary-foreground font-medium rounded-md text-sm hover:opacity-90 transition-opacity"
      >
        Publish Event
      </button>
    </form>
  );
}