import { QBittorrentFilesSchema } from "@/schemas";
import { env } from "@/env";

export const fetchTorrentFiles = async (
  hash: string,
): Promise<string[] | null> => {
  const results = await fetch(
    `${env.QBITTORRENT_URL}/api/v2/torrents/files?hash=${hash}`,
  );

  if (!results.ok) {
    console.log(new Date(), `No files found in qbt for ${hash}`);
  }

  const parsedResults = QBittorrentFilesSchema.safeParse(await results.json());

  if (!parsedResults.success) {
    return null;
  }

  return parsedResults.data.map(({ name }) => name);
};
