import { env } from "@/env";
import { log } from "@/lib";
import { SonarrQueueResponseSchema, type SonarrQueueItem } from "@/schemas";

export const fetchQueue = async (
  page: number = 1,
  queueItems: Array<SonarrQueueItem> = [],
): Promise<Array<SonarrQueueItem>> => {
  log(`Fetching Sonarr download queue page ${page}.`);

  const results = await fetch(`${env.SONARR_URL}/api/v3/queue?page=${page}`, {
    headers: {
      "X-Api-Key": env.SONARR_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  /**
   * bail if we don't get a 200 back
   */
  if (!results.ok) {
    log(`Failed to fetch Sonarr queue. Got a ${results.status} code back.`);
    log(await results.text());
    return [];
  }

  const parsedResults = SonarrQueueResponseSchema.safeParse(
    await results.json(),
  );

  if (!parsedResults.success) {
    log("Failed to parse Sonarr queue results. Has the API changed.");
    log(parsedResults.error);
    return [];
  }

  const { pageSize, totalRecords, records } = parsedResults.data;

  log(`Found ${records.length} items on page ${page}.`);

  if (totalRecords <= pageSize * page) {
    return [...queueItems, ...records];
  }

  return fetchQueue(page + 1, [...queueItems, ...records]);
};

export const removeFromQueue = async (ids: number[]): Promise<void> => {
  log(`Removing ${ids.length} items from the queue.`);
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
    log(
      `Failed to remove items from the queue. Got a ${blockResults.status} response:`,
    );
    log(await blockResults.text());
    return;
  }

  log("Bulk removal sucessful.");
};
