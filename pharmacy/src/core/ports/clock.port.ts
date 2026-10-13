export interface Clock {
  now(): Date;
  nowIso(): string;
  formatIst(date?: Date | string): string;
}
