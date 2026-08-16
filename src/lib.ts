import { INVALID_EXTENSIONS } from "@/constants";

export const isValidFile = (path: string) =>
  !(INVALID_EXTENSIONS as readonly string[]).includes(
    extractFileExtension(path),
  );

export const extractFileExtension = (path: string) => {
  const i = path.lastIndexOf(".");
  return i === -1 ? "" : path.slice(i);
};

export const log = (message: unknown, ...rest: unknown[]) => {
  const logMessage = [new Date(), message];

  console.log(...[...logMessage, ...(rest.length > 0 ? rest : [])]);
};
