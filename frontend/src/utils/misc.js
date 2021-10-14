// For miscellaneous util functions

export const formatLinkForHref = (link) => {
  const pattern = /^((http|https|ftp):\/\/)/;

  if (!pattern.test(link)) {
    link = "http://" + link;
  }

  return link;
};