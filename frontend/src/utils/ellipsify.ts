export const ellipsify = (str: string, length = 12) => {
  if (str.length > length) {
    return (
      str.substr(0, length / 2) + "..." + str.substr(str.length - length / 2)
    );
  } else {
    return str;
  }
};
