import { env } from "@/env";
import { SonarrQueueResponseSchema, type SonarrQueueItem } from "@/schemas";

export const fetchQueue = async (
  page: number = 1,
  queueItems: Array<SonarrQueueItem> = [],
): Promise<Array<SonarrQueueItem>> => {
  const results = await fetch(`${env.SONARR_URL}/api/v3/queue?page=${page}`, {
    headers: {
      "X-Api-Key": env.SONARR_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  const parsedResults = SonarrQueueResponseSchema.safeParse(
    await results.json(),
  );

  if (!parsedResults.success) {
    console.log(parsedResults.error);
    return [];
  }

  const { pageSize, totalRecords, records } = parsedResults.data;

  if (totalRecords <= pageSize * page) {
    return [...queueItems, ...records];
  }

  return fetchQueue(page + 1, [...queueItems, ...records]);
};

export const removeFromQueue = async (ids: number[]): Promise<void> => {
  const blockResults = await fetch(
    `${env.SONARR_URL}/api/v3/queue/bulk?removeFromClient=true&blocklist=true&skipRedownload=false&changeCategory=false`,
    {
      method: "DELETE",
      headers: {
        "X-Api-Key": env.SONARR_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ids: ids,
      }),
    },
  );

  if (!blockResults.ok) {
    console.log(new Date(), "bulk removal failed with error.");
  }
};
