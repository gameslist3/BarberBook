export function getScheduleInfo(slotDate: string, slotStartTime: string) {
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
