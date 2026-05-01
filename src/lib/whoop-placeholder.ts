import type { WhoopData } from "./types";

export async function fetchWhoopData(_userId: string, _date: string): Promise<WhoopData> {
  // Placeholder — will connect to WHOOP API later.
  // For now returns empty data; manual entry via whoop_json field.
  return {};
}

export async function syncWhoopData(
  _userId: string,
  _date: string,
  data: WhoopData
): Promise<WhoopData> {
  // Placeholder — stores data locally via the daily_logs whoop_json field.
  return data;
}
