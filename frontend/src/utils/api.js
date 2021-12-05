import axios from "axios";
import { API_URL, ACCOUNT_TYPE, PLURAL_TYPE } from "utils/consts";
import { getUserIdToken } from "utils/auth.service";

const instance = axios.create({
  baseURL: API_URL,
});

const authGet = async (url, config) =>
  instance
    .get(url, { ...config, headers: { Authorization: await getUserIdToken() } })
    .catch(console.error);

const authPost = async (url, data, config) =>
  instance
    .post(url, data, {
      ...config,
      headers: { Authorization: await getUserIdToken() },
    })
    .catch(console.error);

const authPut = async (url, data, config) =>
  instance
    .put(url, data, {
      ...config,
      headers: { Authorization: await getUserIdToken() },
    })
    .catch(console.error);

const authDelete = async (url, config) =>
  instance
    .delete(url, {
      ...config,
      headers: { Authorization: await getUserIdToken() },
    })
    .catch(console.error);

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

export const createAccountProfile = async (profile, type) => {
  profile["account_type"] = type;
  const requestExtension = `/account`;
  return await instance.post(requestExtension, profile).then(
    (response) => response,
    (err) => {
      console.error(err);
    }
  );
};

export const fetchApplications = async () => {
  const requestExtension = "/application/";
  return await authGet(requestExtension).then(
    (response) => response && response.data.result,
    (err) => {
      console.error(err);
    }
  );
};

export const createApplication = (application) => {
  const requestExtension = `/application/new`;
  return instance.post(requestExtension, application).then(
    (response) => response,
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

export const fetchAppointmentsById = (id, accountType) => {
  const requestExtension = `/appointment/${accountType}/${id}`;
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

export const fetchAppointmentsByType = (accountType) => {
  const requestExtension = `/appointment/${accountType}`;
  return authGet(requestExtension).then(
    (response) => response.data.result,
    (err) => {
      console.error(err);
    }
  );
};

export const fetchPaginatedAppointments = (
  pageNumber,
  searchValue,
  filterValue
) => {
  const requestExtension = `/appointment/all/${pageNumber}/${searchValue}/${filterValue}`;
  return authGet(requestExtension).then(
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

export const downloadMentorsData = async () => {
  const requestExtension = "/download/accounts/all";
  return authGet(requestExtension, {
    responseType: "blob",
    params: {
      account_type: ACCOUNT_TYPE.MENTOR,
    },
  }).then(
    (response) => {
      downloadBlob(response, "mentor_data.xlsx");
    },
    (err) => {
      console.error(err);
    }
  );
};

export const downloadMenteesData = async () => {
  const requestExtension = "/download/accounts/all";
  return authGet(requestExtension, {
    responseType: "blob",
    params: {
      account_type: ACCOUNT_TYPE.MENTEE,
    },
  }).then(
    (response) => {
      downloadBlob(response, "mentee_data.xlsx");
    },
    (err) => {
      console.error(err);
    }
  );
};

export const downloadAllApplicationData = async () => {
  const requestExtension = "/download/appointments/all";
  return authGet(requestExtension, {
    responseType: "blob",
  }).then(
    (response) => {
      downloadBlob(response, "all_appointments.xlsx");
    },
    (err) => {
      console.error(err);
    }
  );
};

export const deleteAccountById = (id, accountType) => {
  const requestExtension = `/account/${accountType}/${id}`;
  return authDelete(requestExtension).then(
    (response) => response,
    (err) => {
      console.error(err);
      return false;
    }
  );
};

export const editFavMentorById = (mentee_id, mentor_id, favorite) => {
  const requestExtension = `/mentee/editFavMentor`;
  const data = {
    mentee_id,
    mentor_id,
    favorite,
  };
  return instance.put(requestExtension, data).then(
    (response) => response,
    (err) => {
      console.error(err);
    }
  );
};

export const getFavMentorsById = (mentee_id) => {
  const requestExtension = `/mentee/favorites/${mentee_id}`;
  return instance.get(requestExtension).then(
    (response) => response.data.result.favorites,
    (err) => console.error(err)
  );
};

export const sendMessage = (data) => {
  const requestExtension = `/messages/`;
  return instance.post(requestExtension, data).then(
    (response) => response,
    (err) => {
      console.error(err);
    }
  );
};

export const updateApplicationById = async (data, id) => {
  const requestExtension = `/application/${id}`;
  return await authPut(requestExtension, data).then(
    (response) => response,
    (err) => {
      console.error(err);
    }
  );
};

export const getApplicationById = async (id) => {
  const requestExtension = `/application/${id}`;
  return authGet(requestExtension).then(
    (response) => response.data.result.mentor_application,
    (err) => {
      console.error(err);
    }
  );
};

export const adminUploadEmails = (file, password, isMentor) => {
  const requestExtension = "/upload/mentors";
  let formData = new FormData();
  formData.append("fileupload", file);
  formData.append("pass", password);
  if (isMentor) {
    formData.append("mentorOrMentee", "true");
  } else {
    formData.append("mentorOrMentee", "false");
  }
  return authPost(requestExtension, formData).then(
    (response) => response,
    (err) => {
      console.error(err);
    }
  );
};

export const getAdmin = (id) => {
  const requestExtension = `/admin/${id}`;
  return authGet(requestExtension).then(
    (response) => response && response.data.result.admin,
    (err) => console.error(err)
  );
};

export const getMessages = (user_id) => {
  const requestExtension = `/messages/?recipient_id=${user_id}`;
  return instance.get(requestExtension).then(
    (response) => response.data.result.Messages,
    (err) => {
      console.error(err);
    }
  );
};

export const getDirectMessages = (user_id) => {
  const requestExtension = `/direct/messages/?recipient_id=${user_id}&sender_id=${user_id}`;
  return instance.get(requestExtension).then(
    (response) => response.data.result.Messages,
    (err) => {
      console.error(err);
    }
  );
};

export const getLatestMessages = (user_id) => {
  const requestExtension = `/messages/contacts/${user_id}`;
  return instance.get(requestExtension).then(
    (response) => response.data.result.data,
    (err) => {
      console.error(err);
    }
  );
};

export const getMessageData = (sender_id, recipient_id) => {
  const requestExtension = `/messages/direct/?recipient_id=${recipient_id}&sender_id=${sender_id}`;
  return instance.get(requestExtension).then(
    (response) => response.data.result.Messages,
    (err) => {
      console.error(err);
    }
  );
};

export const getMenteePrivateStatus = (profileId) => {
  const requestExtension = `/account/${profileId}/private`;
  return instance.get(requestExtension).then(
    (response) => response.data && response.data.result,
    (err) => {
      console.error(err);
    }
  );
};

export const sendMenteeMentorEmail = (
  mentorId,
  menteeId,
  responseEmail,
  interestAreas,
  communicationMethod,
  message
) => {
  const requestExtension = `/messages/mentor/${mentorId}`;
  const data = {
    mentee_id: menteeId,
    response_email: responseEmail,
    interest_areas: interestAreas,
    communication_method: communicationMethod,
    message: message,
  };
  return instance.post(requestExtension, data).then(
    (response) => response,
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

export const fetchAppointmentsByMenteeId = async (id) => {
  return await fetchAppointmentsById(id, ACCOUNT_TYPE.MENTEE);
};

export const fetchAppointmentsByMentorId = async (id) => {
  return await fetchAppointmentsById(id, ACCOUNT_TYPE.MENTOR);
};

export const fetchMentorsAppointments = async () =>
  await fetchAppointmentsByType(PLURAL_TYPE.MENTORS);

export const fetchMenteesAppointments = async () =>
  await fetchAppointmentsByType(PLURAL_TYPE.MENTEES);
