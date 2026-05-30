// For miscellaneous util functions

export const formatLinkForHref = (link) => {
  const pattern = /^((http|https|ftp):\/\/)/;

  if (!pattern.test(link)) {
    link = "http://" + link;
  }

  return link;
};

export const validateEmail = (email) => {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

// Simple and flexible URL regex that accepts:
// - URLs with or without protocol (http/https)
// - URLs starting with www.
// - Simple domain names like example.com
// - LinkedIn URLs and other social media profiles
export const urlRegex =
  /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+([/?#][^\s]*)?$/i;

export const validateUrl = (value) => {
  return urlRegex.test(value);
};

export const phoneRegex = // eslint-disable-next-line no-useless-escape
  /^(?:(?:\(?(?:00|\+)([1-4]\d\d|[1-9]\d?)\)?)?[\-\.\ \\\/]?)?((?:\(?\d{1,}\)?[\-\.\ \\\/]?){0,})(?:[\-\.\ \\\/]?(?:#|ext\.?|extension|x)[\-\.\ \\\/]?(\d+))?$/i;

export const validatePhoneNumber = (str) => {
  return phoneRegex.test(str);
};

// Generate a hub invite key using a cryptographically secure RNG (not
// Math.random). The key travels in a public invite URL and is validated
// server-side, so it must be unguessable.
export const generateInviteKey = (length = 20) => {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const values = new Uint32Array(length);
  window.crypto.getRandomValues(values);
  let key = "";
  for (let i = 0; i < length; i++) {
    key += charset[values[i] % charset.length];
  }
  return key;
};
