export const extractFileExtension = (path: string) => {
  const i = path.lastIndexOf(".");
  return i === -1 ? "" : path.slice(i);
};
