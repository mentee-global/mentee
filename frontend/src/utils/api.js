import axios from "axios";
import { API_URL } from "utils/consts";

const instance = axios.create({
  baseURL: API_URL,
});

export const fetchMentorByID = (id) => {
  if (!id) return;
  const requestExtension = "/mentor/" + id;
  return instance.get(requestExtension).then(
    (response) => response.data.result.mentor,
    (err) => {
      console.error(err);
    }
  );
};

export const fetchMentors = () => {
  const requestExtension = "/mentors";
  return instance.get(requestExtension).then(
    (response) => response.data.result.mentors,
    (err) => {
      console.error(err);
    }
  );
};

export const editMentorProfile = (profile, id) => {
  const requestExtension = "/mentor/" + id;
  return instance.put(requestExtension, profile).then(
    (response) => response,
    (err) => {
      console.error(err);
    }
  );
};

export const uploadMentorImage = (data, id) => {
  let formData = new FormData();
  formData.append("image", data);
  const requestExtension = "/mentor/" + id + "/image";
  return instance.put(requestExtension, formData).then(
    (response) => response,
    (err) => {
      console.error(err);
    }
  );
};

export const createMentorProfile = (profile) => {
  const requestExtension = "/mentor";
  return instance.post(requestExtension, profile).then(
    (response) => response,
    (err) => {
      console.error(err);
    }
  );
};

export const createAppointment = (appointment) => {
  const requestExtension = "/appointment/";
  return instance.post(requestExtension, appointment).then(
    (response) => response,
    (err) => {
      console.error(err);
    }
  );
};

export const acceptAppointment = (id) => {
  const requestExtension = "/appointment/accept/" + id;
  return instance.put(requestExtension, {}).then(
    (response) => response,
    (err) => {
      console.error(err);
    }
  );
};

export const deleteAppointment = (id) => {
  const requestExtension = "/appointment/" + id;
  return instance.delete(requestExtension).then(
    (response) => response,
    (err) => {
      console.error(err);
    }
  );
};

export const getAppointmentsByMentorID = (id) => {
  const requestExtension = "/appointment/mentor/" + id;
  return instance.get(requestExtension).then(
    (response) => response.data.result,
    (err) => {
      console.error(err);
    }
  );
};

export const getIsEmailVerified = (email, password) => {
  const requestExtension =
    "/verifyEmail?email=" + email + "&password=" + password;
  return instance.get(requestExtension).then(
    (response) => response.data.result,
    (err) => {
      console.error(err);
      return err.response.data.result;
    }
  );
};

export const fetchAvailability = (id) => {
  const requestExtension = "/availability/" + id;
  return instance.get(requestExtension).then(
    (response) => response.data.result,
    (err) => {
      console.error(err);
    }
  );
};

export const editAvailability = (timeslots, id) => {
  const requestExtension = "/availability/" + id;
  let availability = { Availability: timeslots };
  return instance.put(requestExtension, availability).then(
    (response) => response,
    (err) => {
      console.error(err);
    }
  );
};

export const adminUploadEmails = (file, isMentor) => {
  let mentorOrMentee = "mentors";
  if (!isMentor) {
    mentorOrMentee = "mentees"
  }
  const requestExtension = "/upload/" + mentorOrMentee;
  let formData = new FormData();
  formData.append("fileupload", file);
  return instance.post(requestExtension, formData).then(
    (response) => response,
    (err) => {
      console.error(err);
    }
  );
};

