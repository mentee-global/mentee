export const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_ENV === "development"
      ? "https://mentee-dev.herokuapp.com/"
      : "https://app.menteeglobal.org/"
    : "http://localhost:8000/";

export const FRONT_BASE_URL =
  process.env.NODE_ENV === "production" ? BASE_URL : `http://localhost:3000/`;

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

export function getRegions(t) {
  return REGIONS.map((region) =>
    Object({ label: t(`regions.${region}`), value: region })
  );
}
// export const LANGUAGES = [
//   "Arabic",
//   "Bengali",
//   "Burmese",
//   "Cantonese",
//   "English",
//   "French",
//   "German",
//   "Hebrew",
//   "Hindi",
//   "Italian",
//   "Japanese",
//   "Karen",
//   "Mandarin",
//   "Portuguese",
//   "Russian",
//   "Spanish",
//   "Swahili",
//   "Urdu",
//   "Other",
// ];

export const AGE_RANGES = [
  "16-18",
  "19-22",
  "23-25",
  "26-30",
  "30s",
  "40s",
  "50s",
  "60s",
  "70s+",
];

// export const SPECIALIZATIONS = [
//   "Advocacy and Activism",
//   "Architecture",
//   "Arts:Dance/Design/Music and More",
//   "Citizenship",
//   "Computer Science",
//   "Education, Personal Guidance On Next Steps",
//   "Engineering",
//   "Entrepreneurship",
//   "Finance, Business",
//   "Finance, Personal",
//   "Health, Community, and Environment",
//   "Health, Personal: Nutrition, Personal Life Coach, Yoga & Meditation",
//   "Interview Skills & Practice",
//   "Journalism",
//   "Language Lessons",
//   "Law",
//   "Legal Issues, Business",
//   "Legal Issues, Related to Personal Issues (Excluding Citizenship)",
//   "Media/Public Relations",
//   "Medicine",
//   "Nonprofits/NGOs",
//   "Political Science",
//   "Professional Speaking",
//   "Psychology: The Study of Clinical Practice (Not Personal Issues)",
//   "Research",
//   "Resume/CV Writing",
//   "Self Confidence",
//   "Small Business: Help With Setting Up, Consulting on Vision, Overall Guidance & More",
//   "Teaching: Skills & Methods",
//   "Technology Training",
//   "Tourism: Field of",
//   "Writing: Improving writing skills, writing books/articles, scholarly writing",
//   "Other",
// ];

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

// Keys for fields of Message
export const MESSAGE_FORM_KEYS = [
  "message",
  "user_name",
  "user_id",
  "recipient_name",
  "recipient_id",
  "email",
  "link",
  "time",
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

export const OPTION_TYPE = {
  LANGUAGE: "language",
  SPECIALIZATION: "specialization",
};