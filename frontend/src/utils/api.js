import axios from "axios";
import { API_URL, ACCOUNT_TYPE } from "utils/consts";

const instance = axios.create({
  baseURL: API_URL,
});

export const fetchAccountById = (id, type) => {
  if (!id) return;
  const requestExtension = `/account/${id}`;
  return instance
    .get(requestExtension, {
      params: {
        account_type: type,
      },
    })
    .then(
      (response) => response.data.result.account,
      (err) => {
        console.error(err);
      }
    );
};

export const fetchAccounts = (type) => {
  const requestExtension = `/accounts/${type}`;
  return instance.get(requestExtension).then(
    (response) => response.data.result.accounts,
    (err) => {
      console.error(err);
    }
  );
};

export const editAccountProfile = (profile, id, type) => {
  const requestExtension = `/account/${id}`;
  return instance
    .put(requestExtension, profile, {
      params: {
        account_type: type,
      },
    })
    .then(
      (response) => response,
      (err) => {
        console.error(err);
      }
    );
};

export const uploadAccountImage = (data, id, type) => {
  let formData = new FormData();
  formData.append("image", data);
  formData.append("account_type", type);
  const requestExtension = `/account/${id}/image`;
  return instance.put(requestExtension, formData).then(
    (response) => response,
    (err) => {
      console.error(err);
    }
  );
};

export const createAccountProfile = (profile, type) => {
  profile["account_type"] = type;
  const requestExtension = `/account`;
  return instance.post(requestExtension, profile).then(
    (response) => response,
    (err) => {
      console.error(err);
    }
  );
};

export const fetchApplications = () => {
  const requestExtension = "/application/";
  return instance.get(requestExtension).then(
    (response) => response.data.result,
    (err) => {
      console.error(err);
    }
  );
};

export const createAppointment = (appointment) => {
  const requestExtension = `/appointment/`;
  return instance.post(requestExtension, appointment).then(
    (response) => response,
    (err) => {
      console.error(err);
    }
  );
};

export const acceptAppointment = (id) => {
  const requestExtension = `/appointment/accept/${id}`;
  return instance.put(requestExtension, {}).then(
    (response) => response,
    (err) => {
      console.error(err);
    }
  );
};

export const deleteAppointment = (id) => {
  const requestExtension = `/appointment/${id}`;
  return instance.delete(requestExtension).then(
    (response) => response,
    (err) => {
      console.error(err);
    }
  );
};

export const getAppointmentsByMentorID = (id) => {
  const requestExtension = `/appointment/mentor/${id}`;
  return instance.get(requestExtension).then(
    (response) => response.data.result,
    (err) => {
      console.error(err);
    }
  );
};

export const getIsEmailVerified = (email, password) => {
  const requestExtension = `/verifyEmail?email=${email}&password=${password}`;
  return instance.get(requestExtension).then(
    (response) => response.data.result,
    (err) => {
      console.error(err);
      return err.response.data.result;
    }
  );
};

export const fetchAvailability = (id) => {
  const requestExtension = `/availability/${id}`;
  return instance.get(requestExtension).then(
    (response) => response.data.result,
    (err) => {
      console.error(err);
    }
  );
};

export const editAvailability = (timeslots, id) => {
  const requestExtension = `/availability/${id}`;
  let availability = { Availability: timeslots };
  return instance.put(requestExtension, availability).then(
    (response) => response,
    (err) => {
      console.error(err);
    }
  );
};

export const fetchMentorsAppointments = () => {
  const requestExtension = "/appointment/mentors";
  return instance.get(requestExtension).then(
    (response) => response.data.result,
    (err) => {
      console.error(err);
    }
  );
};

export const fetchAllAppointments = () => {
  const requestExtension = "/appointment/";
  return instance.get(requestExtension).then(
    (response) => response.data.result,
    (err) => {
      console.error(err);
    }
  );
};

const downloadBlob = (response, filename) => {
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(url);
};

export const downloadMentorsData = () => {
  const requestExtension = "/download/accounts/all";
  return instance
    .get(requestExtension, {
      responseType: "blob",
    })
    .then(
      (response) => {
        downloadBlob(response, "data.xlsx");
      },
      (err) => {
        console.error(err);
      }
    );
};

export const downloadAllApplicationData = () => {
  const requestExtension = "/download/appointments/all";
  return instance
    .get(requestExtension, {
      responseType: "blob",
    })
    .then(
      (response) => {
        downloadBlob(response, "all_appointments.xlsx");
      },
      (err) => {
        console.error(err);
      }
    );
};

export const deleteMentorById = (id) => {
  const requestExtension = `/mentor/${id}`;
  return instance.delete(requestExtension).then(
    (response) => response,
    (err) => {
      console.error(err);
      return false;
    }
  );
};

export const updateApplicationById = (data, id) => {
  const requestExtension = `/application/${id}`;
  return instance.put(requestExtension, data).then(
    (response) => response,
    (err) => {
      console.error(err);
    }
  );
};

export const getApplicationById = (id) => {
  const requestExtension = `/application/${id}`;
  return instance.get(requestExtension).then(
    (response) => response.data.result.mentor_application,
    (err) => {
      console.error(err);
    }
  );
};

export const adminUploadEmails = (file, isMentor) => {
  let mentorOrMentee = "mentors";
  if (!isMentor) {
    mentorOrMentee = "mentees";
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

export const getAdmin = (id) => {
  const requestExtension = `/admin/${id}`;
  return instance.get(requestExtension).then(
    (response) => response && response.data.result.admin,
    (err) => console.error(err)
  );
};

/**
 * Wrapper function calls to general account endpoints
 * This helps with avoiding the need to change multiple files
 * should there be a need to change the value for ACCOUNT_TYPE
 */

export const createMentorProfile = async (data) => {
  return await createAccountProfile(data, ACCOUNT_TYPE.MENTOR);
};

export const createMenteeProfile = async (data) => {
  return await createAccountProfile(data, ACCOUNT_TYPE.MENTEE);
};

export const editMentorProfile = async (data, id) => {
  return await editAccountProfile(data, id, ACCOUNT_TYPE.MENTOR);
};

export const editMenteeProfile = async (data, id) => {
  return await editAccountProfile(data, id, ACCOUNT_TYPE.MENTEE);
};

export const uploadMentorImage = async (data, id) => {
  return await uploadAccountImage(data, id, ACCOUNT_TYPE.MENTOR);
};

export const uploadMenteeImage = async (data, id) => {
  return await uploadAccountImage(data, id, ACCOUNT_TYPE.MENTEE);
};

export const fetchMentorByID = async (id) => {
  return await fetchAccountById(id, ACCOUNT_TYPE.MENTOR);
};

export const fetchMenteeByID = async (id) => {
  return await fetchAccountById(id, ACCOUNT_TYPE.MENTEE);
};

export const fetchMentors = async () => {
  return await fetchAccounts(ACCOUNT_TYPE.MENTOR);
};

export const fetchMentees = async () => {
  return await fetchAccounts(ACCOUNT_TYPE.MENTEE);
};
