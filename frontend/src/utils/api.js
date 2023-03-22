import axios from "axios";
import {
  API_URL,
  ACCOUNT_TYPE,
  PLURAL_TYPE,
  FRONT_BASE_URL,
} from "utils/consts";
import { getUserIdToken } from "utils/auth.service";

const instance = axios.create({
  baseURL: API_URL,
});

const authGet = async (url, config) =>
  instance.get(url, {
    ...config,
    headers: { Authorization: await getUserIdToken() },
  });

const authPost = async (url, data, config) =>
  instance.post(url, data, {
    ...config,
    headers: { Authorization: await getUserIdToken() },
  });

const authPut = async (url, data, config) =>
  instance.put(url, data, {
    ...config,
    headers: { Authorization: await getUserIdToken() },
  });

const authDelete = async (url, config) =>
  instance.delete(url, {
    ...config,
    headers: { Authorization: await getUserIdToken() },
  });

export const fetchAccountById = (id, type) => {
  if (!id) return;
  const requestExtension = `/account/${id}`;
  return authGet(requestExtension, {
    params: {
      account_type: type,
    },
  }).then(
    (response) => response.data.result.account,
    (err) => {
      console.error(err);
    }
  );
};

export const fetchAccounts = (type, restricted = undefined) => {
  const requestExtension = `/accounts/${type}`;
  return authGet(requestExtension, {
    params: {
      restricted: restricted,
    },
  }).then(
    (response) => response.data.result.accounts,
    (err) => {
      console.error(err);
    }
  );
};

export const editAccountProfile = (profile, id, type) => {
  const requestExtension = `/account/${id}`;
  return authPut(requestExtension, profile, {
    params: {
      account_type: type,
    },
  }).then(
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
  return authPut(requestExtension, formData).then(
    (response) => response,
    (err) => {
      console.error(err);
    }
  );
};

export const createAccountProfile = async (profile, type, isHave) => {
  profile["account_type"] = type;
  let requestExtension = `/account`;
  if (isHave === true) {
    requestExtension = `/accountProfile`;
  }

  return authPost(requestExtension, profile).then(
    (response) => response,
    (err) => {
      console.error(err);
    }
  );
};

export const fetchApplications = async (isMentor) => {
  let requestExtension = "/application/";
  if (isMentor === false) {
    requestExtension = "/application/menteeApps";
  }
  return authGet(requestExtension).then(
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

export const getAppState = async (email, role) => {
  const requestExtension = `/application/checkConfirm/${email}/${role}`;
  const res = await instance.get(requestExtension);
  let state = res.data.result.state;
  return state;
};

export const getExistingProfile = async (email, role) => {
  const requestExtension = `/application/isHaveProfile/${email}/${role}`;
  const res = await instance.get(requestExtension);
  let isHaveProfile = res.data.result.isHaveProfile || false;
  let rightRole = null;
  if (res.data.result.rightRole) {
    rightRole = res.data.result.rightRole;
  }
  return { isHaveProfile, rightRole };
};

export const changeStateBuildProfile = async (email, role) => {
  const requestExtension = `/application/changeStateBuildProfile/${email}/${role}`;
  const res = await instance.get(requestExtension);
  let state = res.data.result.state;
  return state;
};

export const isHaveAccount = async (email, role) => {
  const requestExtension = `/application/checkHaveAccount/${email}/${role}`;
  const res = await instance.get(requestExtension);
  let isHave = res.data.result.isHave;
  let isHaveProfile = res.data.result.isHaveProfile;
  let isVerified = res.data.result.isVerified;
  return { isHave, isHaveProfile, isVerified };
};

export const getTrainings = async (role) => {
  const requestExtension = `/training/${role}`;
  const res = await authGet(requestExtension).catch(console.error);
  const trains = res.data.result.trainings;
  let newTrain = [];
  for (let train of trains) {
    train.id = train._id["$oid"];
    newTrain.push(train);
  }
  return newTrain;
};
export const getNotifys = async () => {
  const requestExtension = `/notifys/`;
  const res = await authGet(requestExtension).catch(console.error);
  const notifys = res.data.result.notifys;
  return notifys;
};
export const markNotifyReaded = async (id) => {
  const requestExtension = `/notifys/${id}`;
  let response = await authGet(requestExtension).catch(console.error);
  const notify = response.data.result.notify;
  return notify;
};
export const newNotify = async (message, mentorId, readed) => {
  const requestExtension = `/notifys/newNotify`;
  const formData = new FormData();
  formData.append("message", message);
  formData.append("mentorId", mentorId);
  formData.append("readed", readed);
  let response = await authPost(requestExtension, formData).catch(
    console.error
  );
  let notify = response.data.result.notify;
  return notify;
};
export const deleteTrainbyId = (id, accountType) => {
  const requestExtension = `/training/${id}`;
  return authDelete(requestExtension).then(
    (response) => response,
    (err) => {
      console.error(err);
      return false;
    }
  );
};
export const getTrainById = async (id) => {
  const requestExtension = `/training/train/${id}`;
  let response = await authGet(requestExtension).catch(console.error);
  const train = response.data.result.train;
  return train;
};
export const getTrainVideo = async (id) => {
  const requestExtension = `/training/trainVideo/${id}`;
  let response = await authGet(requestExtension, {
    responseType: "blob",
  }).catch(console.error);
  return response;
};
export const EditTrainById = async (
  id,
  name,
  url,
  description,
  role,
  isVideo,
  filee,
  typee
) => {
  const requestExtension = `/training/${id}`;
  const formData = new FormData();
  formData.append("name", name);
  formData.append("url", url);
  formData.append("description", description);
  formData.append("role", role);
  formData.append("typee", typee);

  formData.append("isVideo", isVideo);
  if (!isVideo) {
    formData.append("filee", filee);
  }
  let response = await authPut(requestExtension, formData).catch(console.error);
  let Train = response.data.result.train;
  return Train;
};
export const newTrainCreate = async (
  name,
  url,
  description,
  role,
  isVideo,
  filee,
  typee
) => {
  const requestExtension = `/training/${role}`;
  const formData = new FormData();
  formData.append("front_url", FRONT_BASE_URL);
  formData.append("name", name);
  formData.append("url", url);
  formData.append("typee", typee);

  formData.append("description", description);

  formData.append("role", role);

  formData.append("isVideo", isVideo);
  if (!isVideo) {
    formData.append("filee", filee);
  }
  let response = await authPost(requestExtension, formData).catch(
    console.error
  );
  let Train = response.data.result.train;
  return Train;
};
export const createAppointment = (appointment) => {
  const requestExtension = `/appointment/`;
  return authPost(requestExtension, appointment).then(
    (response) => response,
    (err) => {
      console.error(err);
    }
  );
};

export const acceptAppointment = (id) => {
  const requestExtension = `/appointment/accept/${id}`;
  return authPut(requestExtension, {}).then(
    (response) => response,
    (err) => {
      console.error(err);
    }
  );
};

export const deleteAppointment = (id) => {
  const requestExtension = `/appointment/${id}`;
  return authDelete(requestExtension).then(
    (response) => response,
    (err) => {
      console.error(err);
    }
  );
};

export const fetchAppointmentsById = (id, accountType) => {
  const requestExtension = `/appointment/${accountType}/${id}`;
  return authGet(requestExtension).then(
    (response) => response.data.result,
    (err) => {
      console.error(err);
    }
  );
};

export const getIsEmailVerified = (email, password) => {
  const requestExtension = `/verifyEmail?email=${email}&password=${password}`;
  return authGet(requestExtension).then(
    (response) => response.data.result,
    (err) => {
      console.log("error loading");
      console.error(err);
      return err.response.data.result;
    }
  );
};

export const fetchAvailability = (id) => {
  const requestExtension = `/availability/${id}`;
  return authGet(requestExtension).then(
    (response) => response.data.result,
    (err) => {
      console.error(err);
    }
  );
};

export const sendNotifyUnreadMessage = (recipient_id) => {
  const requestExtension = `/notifications/unread_alert/${recipient_id}`;
  return authGet(requestExtension).then(
    (response) => response.message,
    (err) => {
      console.error(err);
    }
  );
};

export const getUnreadDMCount = (id) => {
  const requestExtension = `/notifications/${id}`;
  return authGet(requestExtension).then(
    (response) => response.data.result,
    (err) => {
      console.error(err);
    }
  );
};

export const updateUnreadDMCount = (recipient, sender) => {
  const data = {
    recipient,
    sender,
  };
  const requestExtension = `/notifications/update`;
  return authPut(requestExtension, data).then(
    (response) => response,
    (err) => err
  );
};

export const editAvailability = (timeslots, id) => {
  const requestExtension = `/availability/${id}`;
  let availability = { Availability: timeslots };
  return authPut(requestExtension, availability).then(
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

export const fetchAllAppointments = () => {
  const requestExtension = "/appointment/";
  return authGet(requestExtension).then(
    (response) => response.data.result,
    (err) => {
      console.error(err);
    }
  );
};

export const downloadBlob = (response, filename) => {
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
  let response = await authGet(requestExtension, {
    responseType: "blob",
    params: {
      account_type: ACCOUNT_TYPE.MENTOR,
    },
  }).catch(console.error);

  downloadBlob(response, "mentee_data.xlsx");
};
export const downloadMentorsApps = async () => {
  const requestExtension = "/download/apps/all";
  let response = await authGet(requestExtension, {
    responseType: "blob",
    params: {
      account_type: ACCOUNT_TYPE.MENTOR,
    },
  }).catch(console.error);

  downloadBlob(response, "mentor_applications.xlsx");
};
export const downloadMenteeApps = async () => {
  const requestExtension = "/download/apps/all";
  let response = await authGet(requestExtension, {
    responseType: "blob",
    params: {
      account_type: ACCOUNT_TYPE.MENTEE,
    },
  }).catch(console.error);

  downloadBlob(response, "mentee_applications.xlsx");
};

export const downloadMenteesData = async () => {
  const requestExtension = "/download/accounts/all";
  let response = await authGet(requestExtension, {
    responseType: "blob",
    params: {
      account_type: ACCOUNT_TYPE.MENTEE,
    },
  }).catch(console.error);

  downloadBlob(response, "mentee_data.xlsx");
};
export const downloadPartnersData = async () => {
  const requestExtension = "/download/accounts/all";
  let response = await authGet(requestExtension, {
    responseType: "blob",
    params: {
      account_type: ACCOUNT_TYPE.PARTNER,
    },
  }).catch(console.error);

  downloadBlob(response, "mentee_data.xlsx");
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
  return authPut(requestExtension, data).then(
    (response) => response,
    (err) => {
      console.error(err);
    }
  );
};

export const getFavMentorsById = (mentee_id) => {
  const requestExtension = `/mentee/favorites/${mentee_id}`;
  return authGet(requestExtension).then(
    (response) => response.data.result.favorites,
    (err) => console.error(err)
  );
};

export const sendMessage = (data) => {
  const requestExtension = `/messages/`;
  return authPost(requestExtension, data).then(
    (response) => response,
    (err) => {
      console.error(err);
    }
  );
};

export const updateApplicationById = async (data, id, isMentor) => {
  let requestExtension = `/application/${id}/${ACCOUNT_TYPE.MENTOR}`;
  if (isMentor === false) {
    requestExtension = `/application/${id}/${ACCOUNT_TYPE.MENTEE}`;
  }
  return await authPut(requestExtension, data).then(
    (response) => response,
    (err) => {
      console.error(err);
    }
  );
};

export const getApplicationById = async (id, isMentor) => {
  let requestExtension = `/application/${id}`;
  if (isMentor === false) {
    requestExtension = `/application/mentee/${id}`;
  }
  return authGet(requestExtension).then(
    (response) => response.data.result.mentor_application,
    (err) => {
      console.error(err);
    }
  );
};
export const adminUploadEmails = (file, password, isMentor) => {
  const requestExtension = "/upload/accounts";
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

export const adminUploadEmailsText = (messageText, role) => {
  const requestExtension = "/upload/accountsEmails";
  let formData = new FormData();
  formData.append("messageText", messageText);
  formData.append("role", role);

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
  return authGet(requestExtension).then(
    (response) => response.data.result.Messages,
    (err) => {
      console.error(err);
    }
  );
};

export const getDirectMessages = (user_id) => {
  const requestExtension = `/direct/messages/?recipient_id=${user_id}&sender_id=${user_id}`;
  return authGet(requestExtension).then(
    (response) => response.data.result.Messages,
    (err) => {
      console.error(err);
    }
  );
};

export const getLatestMessages = (user_id) => {
  const requestExtension = `/messages/contacts/${user_id}`;
  return authGet(requestExtension).then(
    (response) => response.data.result.data,
    (err) => {
      console.error(err);
    }
  );
};
export const getDetailMessages = (
  pageNumber,
  pageSize,
  searchTerm,
  startDate,
  endDate
) => {
  const requestExtension = `/messages/contacts/mentors/${pageNumber}?searchTerm=${searchTerm}&startDate=${startDate}&endDate=${endDate}&pageSize=${pageSize}`;
  return authGet(requestExtension).then(
    (response) => {
      return {
        data: response.data.result.data,
        total_length: response.data.result.total_length,
      };
    },
    (err) => {
      console.error(err);
    }
  );
};
export const getMessageData = (sender_id, recipient_id) => {
  const requestExtension = `/messages/direct/?recipient_id=${recipient_id}&sender_id=${sender_id}`;
  return authGet(requestExtension).then(
    (response) => response.data.result.Messages,
    (err) => {
      console.error(err);
    }
  );
};

export const getMenteePrivateStatus = (profileId) => {
  const requestExtension = `/account/${profileId}/private`;
  return authGet(requestExtension).then(
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
  return authPost(requestExtension, data).then(
    (response) => response,
    (err) => console.error(err)
  );
};

export const deleteLanguageByID = (id) => {
  const requestExtension = `/masters/languages/${id}`;
  return authDelete(requestExtension).then(
    (response) => response,
    (err) => {
      console.error(err);
      return false;
    }
  );
};
export const EditLanguageById = async (id, name) => {
  const requestExtension = `/masters/languages/${id}`;
  const formData = new FormData();
  formData.append("name", name);
  let response = await authPut(requestExtension, formData).catch(console.error);
  let record = response.data.result.result;
  return record;
};
export const newLanguageCreate = async (name) => {
  const requestExtension = `/masters/languages`;
  const formData = new FormData();
  formData.append("name", name);
  let response = await authPost(requestExtension, formData).catch(
    console.error
  );

  let record = response.data.result.result;
  return record;
};

export const fetchAdminLanguages = async () => {
  const requestExtension = `/masters/languages`;
  var records = await authGet(requestExtension).catch(console.error);
  var res = [];
  var languages = records.data.result.result;
  var index = 0;
  for (let language of languages) {
    index++;
    language.id = language._id["$oid"];
    language.custom_index = index;
    res.push(language);
  }
  return res;
};

export const getLanguageById = async (id) => {
  const requestExtension = `/masters/languages/${id}`;
  let response = await authGet(requestExtension).catch(console.error);
  const record = response.data.result.result;
  return record;
};

export const deleteSpecializationByID = (id) => {
  const requestExtension = `/masters/specializations/${id}`;
  return authDelete(requestExtension).then(
    (response) => response,
    (err) => {
      console.error(err);
      return false;
    }
  );
};

export const fetchAdminSpecializations = async () => {
  const requestExtension = `/masters/specializations`;
  var records = await authGet(requestExtension).catch(console.error);
  var res = [];
  var specializations = records.data.result.result;
  var index = 0;
  for (let specialization of specializations) {
    index++;
    specialization.id = specialization._id["$oid"];
    specialization.custom_index = index;
    res.push(specialization);
  }
  return res;
};

export const getSpecializationById = async (id) => {
  const requestExtension = `/masters/specializations/${id}`;
  let response = await authGet(requestExtension).catch(console.error);
  const record = response.data.result.result;
  return record;
};

export const EditSpecializationById = async (id, name) => {
  const requestExtension = `/masters/specializations/${id}`;
  const formData = new FormData();
  formData.append("name", name);
  let response = await authPut(requestExtension, formData).catch(console.error);
  let record = response.data.result.result;
  return record;
};

export const newSpecializationCreate = async (name) => {
  const requestExtension = `/masters/specializations`;
  const formData = new FormData();
  formData.append("name", name);
  let response = await authPost(requestExtension, formData).catch(
    console.error
  );

  let record = response.data.result.result;
  return record;
};

export const getDisplayLanguages = async () => {
  const requestExtension = `/masters/languages`;
  var records = await authGet(requestExtension).catch(console.error);
  var res = [];
  var languages = records.data.result.result;
  for (let language of languages) {
    res.push(language.name);
  }
  return res;
};

export const getDisplaySpecializations = async () => {
  const requestExtension = `/masters/specializations`;
  var records = await authGet(requestExtension).catch(console.error);
  var res = [];
  var specializations = records.data.result.result;
  for (let specialization of specializations) {
    res.push(specialization.name);
  }
  return res;
};

/**
 * Wrapper function calls to general account endpoints
 * This helps with avoiding the need to change multiple files
 * should there be a need to change the value for ACCOUNT_TYPE
 */

export const createMentorProfile = async (data, isHave) => {
  return await createAccountProfile(data, ACCOUNT_TYPE.MENTOR, isHave);
};

export const createMenteeProfile = async (data, isHave) => {
  return await createAccountProfile(data, ACCOUNT_TYPE.MENTEE, isHave);
};
export const createPartnerProfile = async (data, isHave) => {
  return await createAccountProfile(data, ACCOUNT_TYPE.PARTNER, isHave);
};

export const editMentorProfile = async (data, id) => {
  return await editAccountProfile(data, id, ACCOUNT_TYPE.MENTOR);
};

export const editMenteeProfile = async (data, id) => {
  return await editAccountProfile(data, id, ACCOUNT_TYPE.MENTEE);
};
export const editPartnerProfile = async (data, id) => {
  return await editAccountProfile(data, id, ACCOUNT_TYPE.PARTNER);
};

export const uploadMentorImage = async (data, id) => {
  return await uploadAccountImage(data, id, ACCOUNT_TYPE.MENTOR);
};

export const uploadMenteeImage = async (data, id) => {
  return await uploadAccountImage(data, id, ACCOUNT_TYPE.MENTEE);
};
export const uploadPartnerImage = async (data, id) => {
  return await uploadAccountImage(data, id, ACCOUNT_TYPE.PARTNER);
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
export const fetchPartners = async (restricted = undefined) => {
  return await fetchAccounts(ACCOUNT_TYPE.PARTNER, restricted);
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
