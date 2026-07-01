import { describe, expect, it } from "vitest";
import { formatHongKongDate, isValidIsoDate } from "../src/shared/dates";

describe("date helpers", () => {
  it("formats dates in Asia/Hong_Kong", () => {
    const date = new Date("2026-06-28T16:30:00.000Z");
    expect(formatHongKongDate(date)).toBe("2026-06-29");
  });

  it("accepts YYYY-MM-DD dates", () => {
    expect(isValidIsoDate("2026-06-29")).toBe(true);
  });

  it("rejects invalid dates", () => {
    expect(isValidIsoDate("2026-6-29")).toBe(false);
    expect(isValidIsoDate("2026-02-31")).toBe(false);
    expect(isValidIsoDate("2026-13-01")).toBe(false);
    expect(isValidIsoDate("not-a-date")).toBe(false);
  });
});
