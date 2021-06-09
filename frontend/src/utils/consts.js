const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_ENV === "development"
      ? "https://mentee-dev.herokuapp.com/"
      : "https://mentee-h4i.herokuapp.com/"
    : "http://localhost:5000/";

const FRONT_BASE_URL =
  process.env.NODE_ENV === "production" ? BASE_URL : `http://localhost:3000/`;

export const API_URL = BASE_URL + "api/";

export const AUTH_URL = BASE_URL + "auth/";

export const MENTEE_PROFILE = FRONT_BASE_URL + "gallery/2/";

export const MENTOR_PROFILE = FRONT_BASE_URL + "gallery/1/";

export const REGISTRATION_STAGE = {
  START: 0,
  VERIFY_EMAIL: 1,
  PROFILE_CREATION: 2,
};

export const ACCOUNT_TYPE = {
  ADMIN: 0,
  MENTOR: 1,
  MENTEE: 2,
  GUEST: 3,
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

export const LANGUAGES = [
  "Arabic",
  "Bengali",
  "Burmese",
  "Cantonese",
  "English",
  "French",
  "German",
  "Hindi",
  "Italian",
  "Japanese",
  "Karen",
  "Mandarin",
  "Portuguese",
  "Russian",
  "Spanish",
  "Swahili",
  "Urdu",
];

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

export const SPECIALIZATIONS = [
  "Advocacy and Activism",
  "Arts: Design/Music/Dance and More",
  "Citizenship",
  "Education, Personal Guidance On Next Steps",
  "Entrepreneurship",
  "Finance, Business",
  "Finance, Personal",
  "Health, Community and Environment",
  "Health, Personal: Nutrition, Personal Life Coach, Yoga & Meditation",
  "Interview Skills & Practice",
  "Journalism",
  "Language Lessons",
  "Letter Writing and Other Communications",
  "Legal Issues, Business",
  "Legal Issues, Related to Personal Issues (Excluding Citizenship)",
  "Media/Public Relations",
  "Medicine",
  "Nonprofits/NGOs",
  "Professional Speaking",
  "Resume Writing",
  "Self Confidence",
  "Small Businesses",
  "Technology Training",
  "Other",
];

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

// Error messages for login
export const LOGIN_ERROR_MSGS = {
  INCORRECT_NAME_PASSWORD_ERROR_MSG:
    "Incorrect username and/or password. Please try again.",
  RESET_PASSWORD_ERROR_MSG:
    "Please reset password. A link to reset your password has been sent to your email.",
  SERVER_ERROR_MSG: "Something went wrong.",
  RECREATE_ACCOUNT_ERROR_MSG: "Please re-register your account.",
};
