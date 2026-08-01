export function getScheduleInfo(slotDate: string, slotStartTime?: string | null) {
    if (!slotStartTime) return { text: "", hasStarted: false };

    const nowStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const now = new Date(nowStr);
    
    const match = slotStartTime.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return { text: "", hasStarted: false };
    
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3]?.toUpperCase();
    
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    
    const [year, month, day] = slotDate.split('-');
    const targetDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hours, minutes, 0, 0);
    
    const diffMs = targetDate.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    const hasStarted = diffMins <= 0;
    
    let text = "";
    if (diffMins < -60) text = "Started over an hour ago";
    else if (diffMins < 0) text = `Started ${Math.abs(diffMins)}m ago`;
    else if (diffMins === 0) text = "Starting now!";
    else {
        const h = Math.floor(diffMins / 60);
        const m = diffMins % 60;
        if (h > 0) text = `Starts in ${h}h ${m}m`;
        else text = `Starts in ${m}m`;
    }
    
    return { text, hasStarted };
}

export function getKolkataDateString() {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function parseTimeToMinutes(timeStr: string): { hours: number; minutes: number } | null {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3]?.toUpperCase();

  if (ampm === "PM" && hours < 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;

  return { hours, minutes };
}

/** Numeric minutes-of-day for a "h:mm AM/PM" style time — for reliable sorting. */
export function timeToMinutes(timeStr?: string | null): number {
  if (!timeStr) return 0;
  const parsed = parseTimeToMinutes(timeStr);
  return parsed ? parsed.hours * 60 + parsed.minutes : 0;
}

export function getOvertimeInfo(
  slotDate: string,
  slotStartTime?: string | null,
  totalDurationMinutes: number = 30
): { isOvertime: boolean; overtimeSeconds: number } {
  if (!slotStartTime) return { isOvertime: false, overtimeSeconds: 0 };

  const nowStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const now = new Date(nowStr);

  const parsed = parseTimeToMinutes(slotStartTime);
  if (!parsed) return { isOvertime: false, overtimeSeconds: 0 };

  // Calculate scheduled end time: start + duration
  const startTotalMinutes = parsed.hours * 60 + parsed.minutes;
  const endTotalMinutes = startTotalMinutes + totalDurationMinutes;
  const endHours = Math.floor(endTotalMinutes / 60);
  const endMins = endTotalMinutes % 60;

  const [year, month, day] = slotDate.split("-");
  const scheduledEnd = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    endHours,
    endMins,
    0,
    0
  );

  const diffMs = now.getTime() - scheduledEnd.getTime();
  const diffSecs = Math.floor(diffMs / 1000);

  return {
    isOvertime: diffSecs >= 0,
    overtimeSeconds: Math.max(0, diffSecs),
  };
}

export function formatOvertime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
