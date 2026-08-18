import { extractFileExtension, isValidFile, log } from "@/lib";
import { type RemovedItem } from "@/notification";
import {
  fetchTorrentFiles,
  fetchTorrentList,
  removeTorrentItems,
} from "@/qBittorrent/client";
import { sendNotification } from "@/resend/client";
import { fetchQueue, removeFromQueue } from "@/sonarr/client";

log("------------------------------------------------------");

const sonarrDownloads = await fetchQueue();

/**
 * for each download, check if it has a warning. Otherwise,
 * download file list from QBT.
 */
const downloadsToRemove = (
  await Promise.all(
    sonarrDownloads.map(
      async (download): Promise<({ id: number } & RemovedItem) | null> => {
        /**
         * if the download has a warning it means that it completed.
         * This means that we can verify the output path instead of
         * retrieving the torrent download information
         */
        if (
          download.trackedDownloadStatus === "warning" &&
          download.outputPath &&
          !isValidFile(download.outputPath)
        ) {
          log(`Possible completed download: "${download.title}"`);

          return {
            id: download.id,
            hash: download.downloadId ?? "",
            title: download.title ?? null,
            triggeringFile: download.outputPath,
            extension: extractFileExtension(download.outputPath),
            zombie: false,
          };
        }

        /**
         * we need to verify the torrent download information
         */
        const torrentFiles = download.downloadId
          ? await fetchTorrentFiles(download.downloadId)
          : null;

        if (!torrentFiles) {
          return null;
        }

        /**
         * find the first invalid file for the download
         */
        const invalidFile = torrentFiles.find((path) => !isValidFile(path));

        if (invalidFile) {
          log(`Invalid file found for "${download.title}".`);

          return {
            id: download.id,
            hash: download.downloadId ?? "",
            title: download.title ?? null,
            triggeringFile: invalidFile,
            extension: extractFileExtension(invalidFile),
            zombie: false,
          };
        }

        log(`File is valid for "${download.title}".`);
        return null;
      },
    ),
  )
).filter((d): d is { id: number } & RemovedItem => Boolean(d));

/**
 * find zombie downloads. Sometimes we remove a download from sonarr but qbt
 * don't get the signal, so the download stays there, waiting.
 */
const sonarrHashes = sonarrDownloads.map((d) => d.downloadId);
const torrentList = (await fetchTorrentList("sonarr")) ?? [];

/**
 * find the hashes of the zombie downloads. Sonarr Download ID is upper case,
 * while QBT hash is lower case.
 * For compatibility, `zombieDownloads` preserves case, so we can use it directly on the API.
 */
const zombieDownloads = torrentList.filter(
  ({ hash }) => !sonarrHashes.includes(hash.toLocaleUpperCase()),
);

log(
  `Download count: ${sonarrDownloads.length} | Zombie dowloads: ${zombieDownloads.length} | Items to remove: ${downloadsToRemove.length + zombieDownloads.length}`,
);

/**
 * bail if nothing to remove.
 */
if (downloadsToRemove.length === 0 && zombieDownloads.length === 0) {
  log("");
  log(`Nothing to do, exiting.`);
  log("------------------------------------------------------");
  process.exit(0);
}

if (downloadsToRemove.length > 0) {
  /**
   * bulk remove all the downloads from the queue via Sonarr
   */
  await removeFromQueue(downloadsToRemove.map(({ id }) => id));
}

if (zombieDownloads.length > 0) {
  /**
   * remove all zombie downloads from QBT regardless of the file extension
   */
  await removeTorrentItems(zombieDownloads.map(({ hash }) => hash));
}

/**
 * build list for the notifications client
 */
const removals = [
  ...downloadsToRemove,
  ...zombieDownloads.map((zombie) => ({
    id: 0,
    hash: zombie.hash,
    title: zombie.name,
    triggeringFile: zombie.name,
    extension: "zombie file",
    zombie: true,
  })),
];

if (removals.length > 0) {
  /**
   * send email notification of the removal
   */
  await sendNotification(removals);
}

log("------------------------------------------------------");
