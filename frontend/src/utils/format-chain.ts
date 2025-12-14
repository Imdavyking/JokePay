export const formatChainId = (id: string | number) =>
  `0x${Number(id).toString(16)}`;
