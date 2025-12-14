export const getWholeNumber = (digitNumber: string | number) => {
  return `${digitNumber}`.split(".")[0];
};
