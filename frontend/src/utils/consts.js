const BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://mentee-h4i.herokuapp.com/"
    : "http://localhost:5000/";

export const API_URL = BASE_URL + "api/";

export const AUTH_URL = BASE_URL + "auth/";

export const REGISTRATION_STAGE = {
  START: 0,
  VERIFY_EMAIL: 1,
  PROFILE_CREATION: 2,
};

export const LANGUAGES = [
  "Arabic",
  "Bengali",
  "Cantonese",
  "English",
  "French",
  "German",
  "Hindi",
  "Italian",
  "Japanese",
  "Mandarin",
  "Portuguese",
  "Russian",
  "Spanish",
  "Swahili",
  "Urdu",
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
  "name",
  "email",
  "phone_number",
  "languages",
  "age",
  "gender",
  "location",
  "specialist_categories",
  "message",
  "organization",
  "allow_calls",
  "allow_texts",
];
