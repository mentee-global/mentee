// For miscellaneous util functions

export const formatLinkForHref = (link) => {
  const pattern = /^((http|https|ftp):\/\/)/;

  if (!pattern.test(link)) {
    link = "http://" + link;
  }

  return link;
};

export const truncateString = (str, num) => {
  // If the length of str is less than or equal to num
  // just return str--don't truncate it.
  if (str.length <= num) {
    return str;
  }
  // Return str truncated with '...' concatenated to the end of str.
  return str.slice(0, num) + "...";
};
