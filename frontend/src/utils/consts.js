export const IS_PRODUCTION = process.env.NODE_ENV === "production";
export const IS_DEVELOPMENT = process.env.REACT_APP_ENV === "development";

export const BASE_URL = IS_PRODUCTION
  ? IS_DEVELOPMENT
    ? "https://mentee-dev.herokuapp.com/"
    : "https://app.menteeglobal.org/"
  : "http://localhost:8000/";

export const FRONT_BASE_URL = IS_PRODUCTION
  ? BASE_URL
  : `http://localhost:3000/`;

export const API_URL = BASE_URL + "api/";

export const AUTH_URL = BASE_URL + "auth/";

export const MENTEE_PROFILE = FRONT_BASE_URL + "gallery/2/";
export const PARTNER_PROFILE = FRONT_BASE_URL + "gallery/3/";
export const MENTOR_PROFILE = FRONT_BASE_URL + "gallery/1/";

export const MENTEE_DEFAULT_VIDEO_NAME = "Introduction";

export const MENTEE_GALLERY_PAGE = "/mentee-gallery";

export const MENTOR_GALLERY_PAGE = "/gallery";

export const REGISTRATION_STAGE = {
  START: 0,
  VERIFY_EMAIL: 1,
  PROFILE_CREATION: 2,
};

export const ACCOUNT_TYPE = {
  ADMIN: 0,
  MENTOR: 1,
  MENTEE: 2,
  PARTNER: 3,
  GUEST: 4,
  SUPPORT: 5,
  HUB: 6,
};

export const ACCOUNT_TYPE_LABELS = {
  [ACCOUNT_TYPE.ADMIN]: "admin",
  [ACCOUNT_TYPE.MENTOR]: "mentor",
  [ACCOUNT_TYPE.MENTEE]: "mentee",
  [ACCOUNT_TYPE.PARTNER]: "partner",
  [ACCOUNT_TYPE.GUEST]: "guest",
  [ACCOUNT_TYPE.SUPPORT]: "support",
  [ACCOUNT_TYPE.HUB]: "hub",
};

export const REDIRECTS = {
  [ACCOUNT_TYPE.MENTOR]: "/appointments",
  [ACCOUNT_TYPE.MENTEE]: "/mentee-appointments",
  [ACCOUNT_TYPE.PARTNER]: "/partner-gallery",
  [ACCOUNT_TYPE.ADMIN]: "/account-data",
  [ACCOUNT_TYPE.GUEST]: "/gallery",
  [ACCOUNT_TYPE.SUPPORT]: "/support/all-mentors",
  [ACCOUNT_TYPE.HUB]: "/partner-gallery",
};

export const PLURAL_TYPE = {
  MENTORS: "mentors",
  MENTEES: "mentees",
  ADMINS: "admins",
};

export const APP_STATUS = {
  PENDING: "Pending",
  REVIEWED: "Reviewed",
  REJECTED: "Rejected",
  OFFER_MADE: "Offer Made",
};

export const APPOINTMENT_STATUS = {
  PENDING: "pending",
  DENIED: "denied",
  ACCEPTED: "accepted",
};
export const TRAINING_TYPE = {
  LINK: "LINK",
  VIDEO: "VIDEO",
  DOCUMENT: "DOCUMENT",
};
export const REGIONS = [
  "N. America",
  "Central America",
  "S. America",
  "Caribbean",
  "Europe",
  "Middle East",
  "N. Africa",
  "Sub-Sahara Africa",
  "Central Asia",
  "East Asia",
  "South/SE Asia",
  "Oceana",
];

// TODO: Get a better way to map regions to i18n keys
const regionI18NMapping = {
  "N. America": "northAmerica",
  "Central America": "centralAmerica",
  "S. America": "southAmerica",
  Caribbean: "caribbean",
  Europe: "europe",
  "Middle East": "middleEast",
  "N. Africa": "northAfrica",
  "Sub-Sahara Africa": "subSaharaAfrica",
  "Central Asia": "centralAsia",
  "East Asia": "eastAsia",
  "South/SE Asia": "southAsia",
  Oceana: "oceana",
};

export function getRegions(t) {
  return REGIONS.map((region) =>
    Object({ label: t(`regions.${regionI18NMapping[region]}`), value: region })
  );
}

export const AGE_RANGES = [
  "18-22",
  "23-25",
  "26-30",
  "30s",
  "40s",
  "50s",
  "60s",
  "70s+",
];

export function getAgeRanges(t) {
  return AGE_RANGES.map((ageRange) =>
    Object({ label: t(`ageRanges.${ageRange}`), value: ageRange })
  );
}

export const GENDERS = ["Male", "Female", "Non-Binary", "Other"];

// Keys for fields of Appointments
export const APPOINTMENT_FORM_KEYS = [
  "mentor_id",
  "mentee_id",
  "topic",
  "message",
  "allow_calls",
  "allow_texts",
];

export const SDGS = [
  "SDG1",
  "SDG2",
  "SDG3",
  "SDG4",
  "SDG5",
  "SDG6",
  "SDG7",
  "SDG8",
  "SDG9",
  "SDG10",
  "SDG11",
  "SDG12",
  "SDG13",
  "SDG14",
  "SDG15",
  "SDG16",
  "SDG17",
];

export function getSDGs(t) {
  return SDGS.map((sdg) =>
    Object({
      label: t(`SDGS.${sdg}`),
      value: t(`SDGS.${sdg}`, { lng: "en" }),
    })
  );
}

export const NEW_APPLICATION_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  BUILDPROFILE: "BuildProfile",
  COMPLETED: "COMPLETED",
  REJECTED: "REJECTED",
};

export const getAppStatusOptions = () => {
  return Object.values(NEW_APPLICATION_STATUS).map((status) => {
    return { value: status, label: status };
  });
};

export const formatDateTime = (time_object) => {
  const month = time_object.getMonth() + 1; // Adding 1 because months are 0-indexed
  const day = time_object.getDate();
  const year = time_object.getFullYear();

  const hour = time_object.getHours();
  const minute = time_object.getMinutes();
  // const second = time_object.getSeconds();

  const formattedDate = `${month.toString().padStart(2, "0")}/${day
    .toString()
    .padStart(2, "0")}/${year}`;
  const amPM = hour >= 12 ? "PM" : "AM";
  const formattedHour = hour % 12 || 12; // Convert to 12-hour format
  const formattedTime = `${formattedHour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")} ${amPM}`;

  const formattedDateTime = `${formattedDate} ${formattedTime}`;
  return formattedDateTime;
};

export const OPTION_TYPE = {
  LANGUAGE: "language",
  SPECIALIZATION: "specialization",
};

export const I18N_LANGUAGES = [
  { value: "en-US", label: "English" },
  { value: "es-US", label: "Spanish" },
  { value: "ar", label: "Arabic" },
  { value: "pt-BR", label: "Portuguese" },
  { value: "fa-AF", label: "Farsi" },
  { value: "pa-AR", label: "Pashto" },
];

export const TIMEZONE_OPTIONS = [
  { value: "UTC-12:00", label: "(UTC-12:00) International Date Line West" },
  { value: "UTC-11:00", label: "(UTC-11:00) Coordinated Universal Time-11" },
  { value: "UTC-10:00", label: "(UTC-10:00) Hawaii" },
  { value: "UTC-09:00", label: "(UTC-09:00) Alaska" },
  { value: "UTC-08:00", label: "(UTC-08:00) Pacific Time (US & Canada)" },
  { value: "UTC-07:00", label: "(UTC-07:00) Mountain Time (US & Canada)" },
  { value: "UTC-06:00", label: "(UTC-06:00) Central Time (US & Canada)" },
  { value: "UTC-05:00", label: "(UTC-05:00) Eastern Time (US & Canada)" },
  { value: "UTC-04:00", label: "(UTC-04:00) Atlantic Time (Canada)" },
  { value: "UTC-03:00", label: "(UTC-03:00) Buenos Aires" },
  { value: "UTC-02:00", label: "(UTC-02:00) Coordinated Universal Time-02" },
  { value: "UTC-01:00", label: "(UTC-01:00) Azores" },
  {
    value: "UTC+00:00",
    label: "(UTC+00:00) Greenwich Mean Time: Dublin, Edinburgh, Lisbon, London",
  },
  {
    value: "UTC+01:00",
    label: "(UTC+01:00) Central European Time: Amsterdam, Berlin, Rome, Paris",
  },
  {
    value: "UTC+02:00",
    label: "(UTC+02:00) Eastern European Time: Athens, Bucharest, Jerusalem",
  },
  {
    value: "UTC+03:00",
    label: "(UTC+03:00) Moscow, St. Petersburg, Volgograd",
  },
  { value: "UTC+04:00", label: "(UTC+04:00) Abu Dhabi, Muscat" },
  { value: "UTC+05:00", label: "(UTC+05:00) Islamabad, Karachi" },
  { value: "UTC+06:00", label: "(UTC+06:00) Dhaka" },
  { value: "UTC+07:00", label: "(UTC+07:00) Bangkok, Hanoi, Jakarta" },
  {
    value: "UTC+08:00",
    label: "(UTC+08:00) Beijing, Chongqing, Hong Kong, Urumqi",
  },
  { value: "UTC+09:00", label: "(UTC+09:00) Tokyo, Osaka, Sapporo" },
  { value: "UTC+10:00", label: "(UTC+10:00) Sydney, Melbourne, Brisbane" },
  { value: "UTC+11:00", label: "(UTC+11:00) Solomon Islands, New Caledonia" },
  { value: "UTC+12:00", label: "(UTC+12:00) Auckland, Wellington" },
  { value: "UTC+13:00", label: "(UTC+13:00) Nuku'alofa" },
  { value: "UTC+14:00", label: "(UTC+14:00) Kiritimati Island" },
];
