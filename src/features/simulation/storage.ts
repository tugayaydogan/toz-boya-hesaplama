import { CompletedJobRecord } from "./types";

const HISTORY_KEY =
  "industrial-weighing-simulator-history";

export function getCompletedJobs(): CompletedJobRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored =
      localStorage.getItem(HISTORY_KEY);

    if (!stored) {
      return [];
    }

    const parsed =
      JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

export function saveCompletedJob(
  job: CompletedJobRecord
) {
  const previous =
    getCompletedJobs();

  const updated = [
    job,
    ...previous,
  ];

  localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(updated)
  );
}

export function clearCompletedJobs() {
  localStorage.removeItem(
    HISTORY_KEY
  );
}