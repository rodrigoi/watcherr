import { env } from "@/env";
import { log } from "@/lib";
import { QBittorrentFilesSchema } from "@/schemas";

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
