// import {fetchLanguages, fetchSpecializations} from "./api";
import axios from "axios";
export const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_ENV === "development"
      ? "https://mentee-dev.herokuapp.com/"
      : "https://app.menteeglobal.org/"
    : "http://localhost:8000/";

export const FRONT_BASE_URL =
  process.env.NODE_ENV === "production" ? BASE_URL : `http://localhost:3000/`;

export const API_URL = BASE_URL + "api/";

const instance = axios.create({
  baseURL: API_URL,
});

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

// const getAllLangs = async() =>{
//   const requestExtension = `/masters/languages`;
//   var records = await instance.get(requestExtension);
//   var res = [];
//   var languages = records.data.result.result;
//   for (let language of languages) {
//     language.id = language._id["$oid"];
//     res.push(language);
//   }
//   return res;
// }

export const LANGUAGES = async () => {
  const requestExtension = `/masters/languages`;
  var records = await instance.get(requestExtension);
  var res = [];
  var languages = records.data.result.result;
  for (let language of languages) {
    res.push(language.name);
  }
  return res;
};

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

export const SPECIALIZATIONS = async () => {
  const requestExtension = `/masters/specializations`;
  var records = await instance.get(requestExtension);
  var res = [];
  var specializations = records.data.result.result;
  for (let specialization of specializations) {
    res.push(specialization.name);
  }
  return res;
};
export const GENDERS = ["Male", "Female", "Non-Binary", "Other"];

export const AGES = [
  "Under 18 years",
  "18 to 24",
  "25 to 29",
  "30 to 34",
  "35 to 39",
  "40 to 44",
  "45 to 49",
  "Over 60",
];

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
  "SDG 1: No poverty",
  "SDG 2: Zero Hunger",
  "SDG 3: Good Health & Well-being",
  "SDG 4: Quality Education",
  "SDG 5: Gender Equality",
  "SDG 6: Clean Water and Sanitation",
  "SDG 7: Affordable and Clean Energy",
  "SDG 8: Decent Work and Economic Growth",
  "SDG 9: Industry, Innovation and Infrastructures",
  "SDG 10: Reduced Inequality",
  "SDG 11: Sustainable Cities and Communities",
  "SDG 12: Responsible Consumption and Production",
  "SDG 13: Climate Action",
  "SDG 14: Life Below Water",
  "SDG 15: Life on Land",
  "SDG 16: Peace and Justice Strong Institutions",
  "SDG 17: Partnership to Achieve the Goals",
];
export const NEW_APPLICATION_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  BUILDPROFILE: "BuildProfile",
  COMPLETED: "COMPLETED",
  REJECTED: "REJECTED",
};

// Error messages for login
export const LOGIN_ERROR_MSGS = {
  INCORRECT_NAME_PASSWORD_ERROR_MSG:
    "Incorrect username and/or password. Please try again.",
  RESET_PASSWORD_ERROR_MSG:
    "Please reset password. A link to reset your password has been sent to your email.",
  SERVER_ERROR_MSG: "Something went wrong.",
  RECREATE_ACCOUNT_ERROR_MSG: "Please re-register your account.",
  EXISTING_EMAIL: "This email is already in use in another role",
};
