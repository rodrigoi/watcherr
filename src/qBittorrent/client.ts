import { QBittorrentFilesSchema, QBittorrentItemsInfoSchema } from "@/schemas";

import { env } from "@/env";
import { log } from "@/lib";
import type { QBittorrentItems } from "@/schemas";

export const fetchTorrentList = async (
  category: "sonarr",
): Promise<QBittorrentItems | null> => {
  log(`Fetching torrent list for ${category}.`);

  const results = await fetch(
    `${env.QBITTORRENT_URL}/api/v2/torrents/info?category=${category}`,
  );

  if (!results.ok) {
    return null;
  }

  const parsedResults = QBittorrentItemsInfoSchema.safeParse(
    await results.json(),
  );

  if (!parsedResults.success) {
    return null;
  }

  return parsedResults.data;
};

export const fetchTorrentFiles = async (
  hash: string,
): Promise<string[] | null> => {
  log(`Fetching torrent files for ${hash}.`);
  const results = await fetch(
    `${env.QBITTORRENT_URL}/api/v2/torrents/files?hash=${hash}`,
  );

  /**
   * Bail if we don't get a 200 back.
   */
  if (!results.ok) {
    log(
      `Failed to fetch files from qbt for ${hash}. Is the service down?. Check URL.`,
    );
    return null;
  }

  const parsedResults = QBittorrentFilesSchema.safeParse(await results.json());

  if (!parsedResults.success) {
    log(`Failde to parse qbt response for ${hash}. Has the API changed?.`);
    log(parsedResults.error);
    return null;
  }

  log(`Found ${parsedResults.data.length} files in qbt for ${hash}.`);

  return parsedResults.data.map(({ name }) => name);
};

export const removeTorrentItems = async (hashes: string[]): Promise<void> => {
  log(`Removing ${hashes.length} torrents from qbt.`);

  const results = await fetch(
    `${env.QBITTORRENT_URL}/api/v2/torrents/delete?hashes=${hashes.join("|")}&deleteFiles=true`,
  );

  if (!results.ok) {
    log(`Failed to remove torrent items. Got a ${results.status} response:`);
    log(await results.text());
    return;
  }

  log("Torrent items removal successful.");
};
