import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "react-email";

import type { SonarrQueueItem } from "@/schemas";

export type Removal = {
  item: SonarrQueueItem;
  triggeringFile: string;
  extension: string;
};

type NotificationProps = { removedDownloads: Removal[] };

export const getSubject = (removedDownloads: Removal[]): string =>
  `[watcherr] removed ${removedDownloads.length} dangerous ${removedDownloads.length === 1 ? "download" : "downloads"}.`;

export default function Notification({ removedDownloads }: NotificationProps) {
  const count = removedDownloads.length;
  const heading = `watcherr removed ${count} ${count === 1 ? "download" : "downloads"}`;

  return (
    <Html>
      <Head />
      <Preview>{heading}</Preview>
      <Body
        style={{
          fontFamily: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`,
        }}
      >
        <Container>
          <Heading>{heading}</Heading>
          <Hr />
          {removedDownloads.map(({ item, triggeringFile, extension }, i) => (
            <Section key={item.id}>
              <Text>
                <strong>{item.title ?? "(untitled)"}</strong>
              </Text>
              <Text>Triggered by: {triggeringFile}</Text>
              <Text>Reason: invalid file extension {extension}</Text>
              {i < removedDownloads.length - 1 && <Hr />}
            </Section>
          ))}
        </Container>
      </Body>
    </Html>
  );
}

Notification.PreviewProps = {
  removedDownloads: [
    {
      item: {
        id: 101,
        title: "Some.Show.S01E03.1080p.WEB-DL",
        trackedDownloadStatus: "warning",
        statusMessages: [],
        downloadId: "abc123",
        outputPath: "/downloads/Some.Show.S01E03/installer.exe",
      },
      triggeringFile: "Some.Show.S01E03/installer.exe",
      extension: ".exe",
    },
    {
      item: {
        id: 102,
        title: null,
        trackedDownloadStatus: "warning",
        statusMessages: [],
      },
      triggeringFile: "readme.scr",
      extension: ".scr",
    },
  ],
} satisfies NotificationProps;
