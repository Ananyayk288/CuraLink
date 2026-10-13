import { Clock } from "@/core/ports/clock.port";

export class SystemClock implements Clock {
  constructor(private readonly fixedTime?: Date) {}

  now(): Date {
    return this.fixedTime ? new Date(this.fixedTime) : new Date();
  }

  nowIso(): string {
    return this.now().toISOString();
  }

  formatIst(dateInput?: Date | string): string {
    const d = dateInput
      ? typeof dateInput === "string"
        ? new Date(dateInput)
        : dateInput
      : this.now();

    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
      hour12: true,
    }).format(d);
  }
}
