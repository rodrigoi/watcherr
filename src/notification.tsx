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

export type RemovedItem = {
  hash: string;
  title: string | null;
  triggeringFile: string;
  extension?: string;
  zombie: boolean;
};

type NotificationProps = { removedDownloads: RemovedItem[] };

export const getSubject = (removedDownloads: RemovedItem[]): string =>
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
          {removedDownloads.map(
            ({ hash, title, triggeringFile, extension, zombie }, i) => (
              <Section key={hash}>
                <Text>
                  <strong>{title ?? "(untitled)"}</strong>
                </Text>
                <Text>Triggered by: {triggeringFile}</Text>
                {zombie ? (
                  <Text>Reason: zombie download</Text>
                ) : (
                  <Text>Reason: invalid file extension {extension}</Text>
                )}

                {i < removedDownloads.length - 1 && <Hr />}
              </Section>
            ),
          )}
        </Container>
      </Body>
    </Html>
  );
}

Notification.PreviewProps = {
  removedDownloads: [
    {
      hash: "this-is-a-hash",
      title: "Some.Show.S01E03.1080p.WEB-DL",
      triggeringFile: "Some.Show.S01E03/installer.exe",
      extension: ".exe",
      zombie: false,
    },
    {
      hash: "this-is-another-hash",
      title: null,
      triggeringFile: "readme.scr",
      extension: ".scr",
      zombie: false,
    },
    {
      hash: "this-is-a-zombie-hash",
      title: null,
      triggeringFile: "readme.scr",
      extension: ".scr",
      zombie: true,
    },
  ],
} satisfies NotificationProps;
