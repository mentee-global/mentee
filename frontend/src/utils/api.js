import axios from "axios";
import {
  API_URL,
  ACCOUNT_TYPE,
  PLURAL_TYPE,
  FRONT_BASE_URL,
} from "utils/consts";
import { getUserIdToken } from "utils/auth.service";
import i18n from "./i18n";

const instance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  // 30s default. Slow 3G uploads still fit; truly stalled requests bail
  // with a clear timeout error instead of spinning forever.
  timeout: 30000,
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

const authPatch = async (url, data, config) =>
  instance.patch(url, data, {
    ...config,
    headers: { Authorization: await getUserIdToken() },
  });

const authDelete = async (url, config) =>
  instance.delete(url, {
    ...config,
    headers: { Authorization: await getUserIdToken() },
  });

export const getAllcountries = () => {
  const requestExtension = "/countries";
  return authGet(requestExtension, {}).then(
    (response) => response.data.result,
    (err) => {
      console.error(err);
    }
  );
};

export const fetchAccountById = (id, type) => {
  if (!id || typeof id !== "string") return;
  const requestExtension = `/account/${id}`;
  return authGet(requestExtension, {
    params: {
      account_type: type,
    },
  }).then(
    (response) => {
      const res = response?.data?.result?.account;
      if (!res) return undefined;
      res.role = type;
      return res;
    },
    (err) => {
      console.error(err);
    }
  );
};

export const fetchEventById = (id) => {
  if (!id) return;
  const requestExtension = `/event/${id}`;
  return authGet(requestExtension).then(
    (response) => response.data.result.event,
    (err) => {
      console.error(err);
    }
  );
};

export const fetchEvents = async (
  type,
  hub_user_id = null,
  partner_id = null,
  user_id = null
) => {
  const requestExtension = `/events/${type}`;
  return authGet(requestExtension, {
    params: {
      hub_user_id: hub_user_id,
      partner_id: partner_id,
      user_id: user_id,
    },
  }).then(
    (response) => response.data.result.events,
    (err) => {
      console.error(err);
    }
  );
};

export const fetchAccounts = (
  type,
  restricted = undefined,
  hub_user_id = "",
  include_hubs = false,
  all = false
) => {
  const requestExtension = `/accounts/${type}`;
  return authGet(requestExtension, {
    params: {
      restricted: restricted,
      hub_user_id: hub_user_id,
      include_hubs: include_hubs,
      all: all ? "true" : undefined,
    },
  }).then(
    (response) => {
      const account_data = response?.data?.result?.accounts;
      if (!Array.isArray(account_data)) return [];
      account_data.forEach((account_item) => {
        account_item.role = type;
      });
      return account_data;
    },
    (err) => {
      console.error(err);
      return [];
    }
  );
};

const _surfacedError = (err) => {
  console.error(err);
  const isTimeout =
    err?.code === "ECONNABORTED" ||
    (typeof err?.message === "string" && err.message.startsWith("timeout of"));
  return {
    ok: false,
    error: isTimeout
      ? "Request timed out. Please check your connection and try again."
      : err?.response?.data?.message || err?.message || "Network error",
    status: err?.response?.status,
  };
};

export const editAccountProfile = (profile, id, type) => {
  const requestExtension = `/account/${id}`;
  return authPut(requestExtension, profile, {
    params: {
      account_type: type,
    },
  }).then((response) => response, _surfacedError);
};

export const uploadAccountImage = (data, id, type) => {
  let formData = new FormData();
  formData.append("image", data);
  formData.append("account_type", type);
  const requestExtension = `/account/${id}/image`;
  return authPut(requestExtension, formData).then(
    (response) => response,
    _surfacedError
  );
};

export const createAccountProfile = async (profile, type, inFirebase) => {
  profile["account_type"] = type;
  let requestExtension = `/account`;
  if (inFirebase) {
    requestExtension = `/accountProfile`;
  }

  return authPost(requestExtension, profile).then(
    (response) => response,
    _surfacedError
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

export const fetchApplicationsSearch = async (
  isMentor,
  {
    page = 1,
    pageSize = 20,
    search = "",
    applicationState = "",
    partnerId = "",
    effectiveStage = "",
  } = {}
) => {
  const params = new URLSearchParams({ page, page_size: pageSize });
  if (search) params.set("search", search);
  if (applicationState && applicationState !== "all")
    params.set("application_state", applicationState);
  if (partnerId) params.set("partner_id", partnerId);
  if (effectiveStage && effectiveStage !== "all")
    params.set("effective_stage", effectiveStage);

  const base = isMentor
    ? "/application/search"
    : "/application/menteeApps/search";

  return authGet(`${base}?${params.toString()}`).then(
    (response) => response && response.data.result,
    (err) => {
      console.error(err);
    }
  );
};

export const createApplication = (application) => {
  const requestExtension = `/application/new`;
  application.preferred_language = i18n.language;
  return instance.post(requestExtension, application).then(
    (response) => ({ ok: true, response, status: response.status }),
    (err) => ({ ..._surfacedError(err), response: err?.response })
  );
};

const _hasValidEmailAndRole = (email, role) =>
  typeof email === "string" &&
  email.length > 0 &&
  Number.isFinite(Number(role));

export const getApplicationStatus = async (email, role) => {
  if (!_hasValidEmailAndRole(email, role)) {
    return { ok: false, state: null };
  }
  const requestExtension = `/application/status/${email}/${role}`;
  try {
    const res = await instance.get(requestExtension);
    return {
      ok: true,
      state: res.data?.result?.state,
      application_data: res.data?.result?.application_data,
    };
  } catch (err) {
    return _surfacedError(err);
  }
};

export const checkProfileExists = async (email, role) => {
  if (!_hasValidEmailAndRole(email, role)) {
    return { profileExists: false, rightRole: undefined };
  }
  const requestExtension = `/application/profile/exists/${email}/${role}`;
  const res = await instance.get(requestExtension);
  let profileExists = res.data?.result?.profileExists;
  let rightRole = res.data?.result?.rightRole;
  return { profileExists, rightRole };
};

export const changeStateTraining = async (id, role, traing_status) => {
  const requestExtension = `/application/changeStateTraining`;
  return authPost(requestExtension, { id, role, traing_status }).then(
    (response) => ({ ok: true, response }),
    _surfacedError
  );
};

export const changeStateBuildProfile = async ({ email, role }) => {
  const requestExtension = `/application/changeStateBuildProfile/${email}/${role}`;
  try {
    const res = await authGet(requestExtension, {
      params: {
        front_url: FRONT_BASE_URL,
        preferred_language: i18n.language,
      },
    });
    return { ok: true, state: res?.data?.result?.state };
  } catch (err) {
    return _surfacedError(err);
  }
};

export const checkStatusByEmail = async (email, role) => {
  if (!_hasValidEmailAndRole(email, role)) {
    return { inFirebase: false, profileExists: false, isVerified: false };
  }
  const requestExtension = `/application/email/status/${email}/${role}`;
  const res = await instance.get(requestExtension);
  let inFirebase = res.data?.result?.inFirebase;
  let profileExists = res.data?.result?.profileExists;
  let isVerified = res.data?.result?.isVerified;
  return { inFirebase, profileExists, isVerified };
};
export const getSignedData = async (role) => {
  const requestExtension = `/training/getSignedDoc/${role}`;
  const res = await authGet(requestExtension, {}).catch(console.error);

  const data = res.data.result.signed;
  return data;
};
export const getSignedDocfile = async (id, role) => {
  const requestExtension = `/training/getSignedDocfile/${id}/${role}`;
  const res = await authGet(requestExtension, {
    role: role,
    responseType: "blob",
  }).catch(console.error);
  return res;
};
export const getOriginSignDoc = async () => {
  const requestExtension = `/training/getOriginDoc`;
  const res = await authGet(requestExtension, {
    responseType: "blob",
  }).catch(console.error);
  return res;
};

export const saveSignedDoc = async (signedBlob, user_email, train_id, role) => {
  const requestExtension = `/training/saveSignedDoc`;
  const formData = new FormData();
  formData.append("signedPdf", signedBlob);
  formData.append("user_email", user_email);
  formData.append("role", role);
  formData.append("train_id", train_id);
  let response = await authPost(requestExtension, formData).catch(
    console.error
  );
  return response;
};

export const newLibraryCreate = async (values, user) => {
  const requestExtension = `/training/new_library`;
  const formData = new FormData();
  formData.append("front_url", FRONT_BASE_URL);
  Object.entries(values).forEach(([key, value]) => {
    formData.append(key, value);
  });
  formData.append("user_id", user._id.$oid);
  formData.append("user_name", !user.hub_id ? user.name : user.person_name);
  formData.append("hub_id", !user.hub_id ? user._id.$oid : user.hub_id);
  let response = await authPost(requestExtension, formData).catch((err) => {
    console.error(err);
  });
  return response?.data;
};

export const getCommunityLibraries = async (user) => {
  const requestExtension = `/training/community_libraries`;
  const res = await authGet(requestExtension, {
    params: {
      hub_id: !user.hub_id ? user._id.$oid : user.hub_id,
    },
  }).catch(console.error);
  const data = res?.data?.result?.library;
  if (!Array.isArray(data)) return [];
  let newData = [];
  let seenOids = new Set();
  for (let item of data) {
    const oid = item._id["$oid"];
    if (!seenOids.has(oid)) {
      item.id = oid;
      newData.push(item);
      seenOids.add(oid);
    }
  }
  return newData;
};

export const getTrainings = async (
  role,
  user_email = null,
  user_id = null,
  hub_user_id = null,
  lang = i18n.language
) => {
  const requestExtension = `/training/${role}`;
  try {
    const res = await authGet(requestExtension, {
      params: {
        lang: lang,
        user_email: user_email,
        user_id: user_id,
        hub_user_id: hub_user_id,
      },
    });
    const trains = res?.data?.result?.trainings;
    const newTrain = [];
    const seenOids = new Set();
    if (!Array.isArray(trains)) {
      return { ok: true, trainings: [] };
    }
    for (let train of trains) {
      const oid = train._id["$oid"];
      if (!seenOids.has(oid)) {
        train.id = oid;
        newTrain.push(train);
        seenOids.add(oid);
      }
    }
    return { ok: true, trainings: newTrain };
  } catch (err) {
    return _surfacedError(err);
  }
};

export const updateTrainings = async (data) => {
  const requestExtension = `/training/update_multiple`;
  const res = await authPatch(requestExtension, {
    trainings: data,
  }).catch(console.error);
  const trains = res?.data?.result?.trainings;
  if (!Array.isArray(trains)) return [];
  return trains;
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

export const deleteLibrarybyId = (id) => {
  const requestExtension = `/training/library/${id}`;
  return authDelete(requestExtension).then(
    (response) => response,
    (err) => {
      console.error(err);
      return false;
    }
  );
};

export const deleteTrainbyId = (id) => {
  const requestExtension = `/training/${id}`;
  return authDelete(requestExtension).then(
    (response) => response,
    (err) => {
      console.error(err);
      return false;
    }
  );
};

export const getLibraryById = async (id) => {
  const requestExtension = `/training/library/${id}`;
  let response = await authGet(requestExtension, {
    params: {},
  }).catch(console.error);
  const train = response.data.result.library;
  return train;
};

export const getTrainById = async (id, user_email = null) => {
  const requestExtension = `/training/train/${id}`;
  let response = await authGet(requestExtension, {
    params: {
      user_email: user_email,
    },
  }).catch(console.error);
  const train = response.data.result.train;
  return train;
};

export const getLibraryFile = async (id, lang = i18n.language) => {
  const requestExtension = `/training/libraryFile/${id}`;
  let response = await authGet(requestExtension, {
    responseType: "blob",
    params: {
      lang: lang,
    },
  }).catch(console.error);
  return response;
};

export const getTrainVideo = async (id, lang = i18n.language) => {
  const requestExtension = `/training/trainVideo/${id}`;
  let response = await authGet(requestExtension, {
    responseType: "blob",
    params: {
      lang: lang,
    },
  }).catch(console.error);
  return response;
};

export const EditDataById = async (id, values = []) => {
  const requestExtension = `/training/library/${id}`;
  const formData = new FormData();
  Object.entries(values).forEach(([key, value]) => {
    formData.append(key, value);
  });
  let response = await authPut(requestExtension, formData).catch((err) => {
    console.error(err);
  });
  return response?.data;
};

export const EditTrainById = async (id, values = []) => {
  const requestExtension = `/training/${id}`;
  const formData = new FormData();
  Object.entries(values).forEach(([key, value]) => {
    if (key === "mentor_id" || key === "mentee_id") {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, value);
    }
  });
  let response = await authPut(requestExtension, formData).catch((err) => {
    console.error(err);
  });
  return response?.data;
};

export const newPolicyCreate = async (values) => {
  const { role } = values;
  const requestExtension = `/training/add_policy/${role}`;
  const formData = new FormData();
  formData.append("front_url", FRONT_BASE_URL);
  Object.entries(values).forEach(([key, value]) => {
    formData.append(key, value);
  });
  let response = await authPost(requestExtension, formData).catch((err) => {
    console.error(err);
  });
  return response?.data;
};

export const getAnnouncements = async (
  role,
  user_id = null,
  hub_user_id = null,
  lang = i18n.language
) => {
  const requestExtension = `/announcement/${role}`;
  const res = await authGet(requestExtension, {
    params: {
      lang: lang,
      user_id: user_id,
      hub_user_id: hub_user_id,
    },
  }).catch(console.error);
  const data = res?.data?.result?.res;
  if (!Array.isArray(data)) return [];
  let newData = [];
  for (let item of data) {
    item.id = item._id["$oid"];
    newData.push(item);
  }
  return newData;
};

export const newAnnounceCreate = async (values) => {
  const { role } = values;
  const requestExtension = `/announcement/register/${role}`;
  const formData = new FormData();
  formData.append("front_url", FRONT_BASE_URL);
  Object.entries(values).forEach(([key, value]) => {
    if (key === "mentor_id" || key === "mentee_id") {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, value);
    }
  });
  let response = await authPost(requestExtension, formData).catch((err) => {
    console.error(err);
  });
  return response?.data;
};

export const uploadAnnounceImage = (image, id) => {
  const requestExtension = `/announcement/upload/${id}/image`;
  let formData = new FormData();
  formData.append("image", image);
  return authPut(requestExtension, formData).then(
    (response) => response,
    (err) => {
      console.error(err);
    }
  );
};

export const getAnnounceDoc = async (id, lang = i18n.language) => {
  const requestExtension = `/announcement/getDoc/${id}`;
  let response = await authGet(requestExtension, {
    responseType: "blob",
    params: {
      lang: lang,
    },
  }).catch(console.error);
  return response;
};

export const deleteAnnouncebyId = (id) => {
  const requestExtension = `/announcement/delete/${id}`;
  return authDelete(requestExtension).then(
    (response) => response,
    (err) => {
      console.error(err);
      return false;
    }
  );
};

export const getAnnounceById = async (id) => {
  const requestExtension = `/announcement/get/${id}`;
  let response = await authGet(requestExtension, {
    params: {},
  }).catch(console.error);
  const announcement = response.data.result.announcement;
  return announcement;
};
export const EditAnnounceById = async (id, values = []) => {
  const requestExtension = `/announcement/edit/${id}`;
  const formData = new FormData();
  Object.entries(values).forEach(([key, value]) => {
    if (key === "mentor_id" || key === "mentee_id") {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, value);
    }
  });
  let response = await authPut(requestExtension, formData).catch((err) => {
    console.error(err);
  });
  return response?.data;
};

export const newTrainCreate = async (values) => {
  const { role } = values;
  const requestExtension = `/training/${role}`;
  const formData = new FormData();
  formData.append("front_url", FRONT_BASE_URL);
  Object.entries(values).forEach(([key, value]) => {
    if (key === "mentor_id" || key === "mentee_id") {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, value);
    }
  });
  let response = await authPost(requestExtension, formData).catch((err) => {
    console.error(err);
  });
  return response?.data;
};

export const translateDocuments = (id) => {
  const requestExtension = `/training/translate/${id}`;
  return authPut(requestExtension).then(
    (response) => response?.data,
    (err) => {
      console.error(err);
    }
  );
};

export const getTranslateDocumentCost = (id) => {
  const requestExtension = `/training/translateCost/${id}`;
  return authGet(requestExtension).then(
    (response) => response?.data,
    (err) => {
      console.error(err);
    }
  );
};

export const createAppointment = (appointment) => {
  const requestExtension = `/appointment/`;
  return authPost(requestExtension, appointment).then(
    (response) => response,
    (err) => {
      console.error(err);
      return false;
    }
  );
};

export const adminHubUserData = (values, __image, id) => {
  const requestExtension = `/hub_register`;
  let formData = new FormData();
  formData.append("id", id);
  formData.append("email", values.email);
  formData.append("name", values.name);
  formData.append("url", values.url);
  // Only send a password when the admin actually entered one. On edit the field
  // is left untouched (undefined); appending it would serialize the string
  // "undefined" and the backend would overwrite the hub's Firebase password.
  if (values.password) {
    formData.append("password", values.password);
  }
  formData.append("invite_key", values.invite_key ? values.invite_key : "");
  formData.append("image", __image);

  return authPut(requestExtension, formData).then(
    (response) => response,
    (err) => {
      console.error(err);
    }
  );
};

export const editEmailPassword = (data) => {
  const requestExtension = `/edit_email_password`;
  // Let axios rejections propagate so the caller can read the server's
  // error message (err.response.data.message) — swallowing them here
  // hid the 404 "No Firebase Auth account for ex_email" details.
  return authPost(requestExtension, data);
};

export const createEvent = (event) => {
  const requestExtension = `/event_register`;
  event.front_url = FRONT_BASE_URL;
  return authPost(requestExtension, event).then(
    (response) => response,
    (err) => {
      console.error(err);
    }
  );
};

export const uploadEventImage = (image, id) => {
  const requestExtension = `/event_register/${id}/image`;
  let formData = new FormData();
  formData.append("image", image);
  return authPut(requestExtension, formData).then(
    (response) => response,
    (err) => {
      console.error(err);
    }
  );
};

export const deleteEvent = (event_item) => {
  const requestExtension = `/events/delete/${event_item._id.$oid}`;
  return authDelete(requestExtension).then(
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
    (response) => {
      const result = response?.data?.result || {};
      return {
        ...result,
        requests: Array.isArray(result.requests) ? result.requests : [],
      };
    },
    (err) => {
      console.error(err);
      return { name: "", requests: [] };
    }
  );
};

export const getIsEmailVerified = (email, password) => {
  const requestExtension = `/verifyEmail?email=${email}&password=${password}`;
  return authGet(requestExtension).then(
    (response) => response.data.result,
    (err) => {
      console.error(err);
      return err.response.data.result;
    }
  );
};

export const fetchAvailability = (id) => {
  const requestExtension = `/availability/${id}`;
  return authGet(requestExtension).then(
    (response) => {
      const result = response?.data?.result || {};
      return {
        ...result,
        availability: Array.isArray(result.availability)
          ? result.availability
          : [],
      };
    },
    (err) => {
      console.error(err);
      return { availability: [] };
    }
  );
};

export const sendNotifyGroupMessage = (
  recipient_id,
  title,
  tagged = true,
  new_message_flag = true
) => {
  const requestExtension = `/notifications/unread_alert_group/${recipient_id}`;
  return authGet(requestExtension, {
    params: {
      title: title,
      tagged: tagged,
      new_message_flag: new_message_flag,
      front_url: window.location.href,
    },
  }).then(
    (response) => response.message,
    (err) => {
      console.error(err);
    }
  );
};

export const deleteGroupMessage = (message_id) => {
  const requestExtension = `/messages/group_delete/${message_id}`;
  return authDelete(requestExtension).then(
    (response) => response.message,
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

export const sendInviteMail = (
  recipient_id,
  sender_id,
  availabes_in_future
) => {
  const requestExtension = `/appointment/send_invite_email`;
  return authPost(requestExtension, {
    recipient_id: recipient_id,
    sener_id: sender_id,
    availabes_in_future: availabes_in_future,
  }).then(
    (response) => response,
    (err) => {
      console.error(err);
    }
  );
};

export const generateToken = () => {
  const requestExtension = `/meeting/generateToken`;
  return authGet(requestExtension).then(
    (response) => response.data.result,
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
  if (!response || response.data == null) {
    console.error("downloadBlob: missing response data, skipping download");
    return;
  }
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(url);
};

export const downloadMentorsData = async ({ ids } = {}) => {
  const requestExtension = "/download/accounts/all";
  const params = { account_type: ACCOUNT_TYPE.MENTOR };
  if (ids && ids.length > 0) params.ids = ids.join(",");
  let response = await authGet(requestExtension, {
    responseType: "blob",
    params,
  }).catch(console.error);

  downloadBlob(response, "mentor_accounts.xlsx");
};
export const downloadMentorsApps = async (
  partnerId = "",
  { search = "", applicationState = "", effectiveStage = "" } = {}
) => {
  const requestExtension = "/download/apps/all";
  const params = { account_type: ACCOUNT_TYPE.MENTOR };
  if (partnerId) params.partner_id = partnerId;
  if (search) params.search = search;
  if (applicationState && applicationState !== "all")
    params.application_state = applicationState;
  if (effectiveStage && effectiveStage !== "all")
    params.effective_stage = effectiveStage;

  let response = await authGet(requestExtension, {
    responseType: "blob",
    params,
  }).catch(console.error);

  downloadBlob(
    response,
    partnerId
      ? `mentor_applications_${partnerId}.xlsx`
      : "mentor_applications.xlsx"
  );
};
export const downloadMenteeApps = async (
  partnerId = "",
  { search = "", applicationState = "", effectiveStage = "" } = {}
) => {
  const requestExtension = "/download/apps/all";
  const params = { account_type: ACCOUNT_TYPE.MENTEE };
  if (partnerId) params.partner_id = partnerId;
  if (search) params.search = search;
  if (applicationState && applicationState !== "all")
    params.application_state = applicationState;
  if (effectiveStage && effectiveStage !== "all")
    params.effective_stage = effectiveStage;

  let response = await authGet(requestExtension, {
    responseType: "blob",
    params,
  }).catch(console.error);

  downloadBlob(
    response,
    partnerId
      ? `mentee_applications_${partnerId}.xlsx`
      : "mentee_applications.xlsx"
  );
};

export const downloadMenteesData = async ({ ids } = {}) => {
  const requestExtension = "/download/accounts/all";
  const params = { account_type: ACCOUNT_TYPE.MENTEE };
  if (ids && ids.length > 0) params.ids = ids.join(",");
  let response = await authGet(requestExtension, {
    responseType: "blob",
    params,
  }).catch(console.error);

  downloadBlob(response, "mentee_data.xlsx");
};
export const downloadPartnersData = async (
  searchHubUserId = null,
  includeHubs = false
) => {
  const requestExtension = "/download/accounts/all";
  let response = await authGet(requestExtension, {
    responseType: "blob",
    params: {
      account_type: ACCOUNT_TYPE.PARTNER,
      hub_user_id: searchHubUserId,
      include_hubs: includeHubs,
    },
  }).catch(console.error);

  downloadBlob(response, "partner_accounts.xlsx");
};

export const downloadHubsData = async (searchHubUserId = null) => {
  const requestExtension = "/download/accounts/all";
  let response = await authGet(requestExtension, {
    responseType: "blob",
    params: {
      account_type: ACCOUNT_TYPE.HUB,
      hub_user_id: searchHubUserId,
    },
  }).catch(console.error);

  downloadBlob(response, "hub_accounts.xlsx");
};

export const downloadGuestsData = async () => {
  const requestExtension = "/download/accounts/all";
  let response = await authGet(requestExtension, {
    responseType: "blob",
    params: {
      account_type: ACCOUNT_TYPE.GUEST,
    },
  }).catch(console.error);

  downloadBlob(response, "guest_accounts.xlsx");
};

export const downloadSupportersData = async () => {
  const requestExtension = "/download/accounts/all";
  let response = await authGet(requestExtension, {
    responseType: "blob",
    params: {
      account_type: ACCOUNT_TYPE.SUPPORT,
    },
  }).catch(console.error);

  downloadBlob(response, "support_accounts.xlsx");
};

export const downloadModeratorsData = async () => {
  const requestExtension = "/download/accounts/all";
  let response = await authGet(requestExtension, {
    responseType: "blob",
    params: {
      account_type: ACCOUNT_TYPE.MODERATOR,
    },
  }).catch(console.error);

  downloadBlob(response, "moderator_accounts.xlsx");
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
  // Normalize to { ok, message } so callers can surface the backend's reason
  // (e.g. a 409 "Hub still owns content (...)" refusal) instead of a generic
  // failure toast.
  return authDelete(requestExtension).then(
    () => ({ ok: true }),
    (err) => {
      console.error(err);
      return { ok: false, message: err?.response?.data?.message };
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
    (response) =>
      Array.isArray(response?.data?.result?.favorites)
        ? response.data.result.favorites
        : [],
    (err) => {
      console.error(err);
      return [];
    }
  );
};

export const sendMessage = (data) => {
  const requestExtension = `/messages/`;
  return authPost(requestExtension, data).then(
    (response) => ({
      ok: response.status >= 200 && response.status < 300,
      held: response.status === 202,
      message: response?.data?.message,
      response,
    }),
    (err) => {
      console.error(err);
      return {
        ok: false,
        error: err?.response?.data?.message || err?.message || "Network error",
      };
    }
  );
};

export const updateApplicationById = async (data, id, isMentor) => {
  let requestExtension = `/application/${id}/${ACCOUNT_TYPE.MENTOR}`;
  if (isMentor === false) {
    requestExtension = `/application/${id}/${ACCOUNT_TYPE.MENTEE}`;
  }
  data.front_url = FRONT_BASE_URL;
  data.preferred_language = i18n.language;
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

export const deleteApplication = async (id, isMentor) => {
  let requestExtension = `/application/${id}/${ACCOUNT_TYPE.MENTOR}`;
  if (isMentor === false) {
    requestExtension = `/application/${id}/${ACCOUNT_TYPE.MENTEE}`;
  }
  return authDelete(requestExtension).then(
    (response) => response,
    (err) => {
      console.error(err);
      return false;
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

export const adminUploadEmailsText = (
  messageText,
  role,
  password = null,
  name = null
) => {
  const requestExtension = "/upload/accountsEmails";
  let formData = new FormData();
  formData.append("messageText", messageText);
  formData.append("role", role);
  formData.append("password", password);
  formData.append("name", name);

  return authPost(requestExtension, formData).then(
    (response) => response,
    (err) => {
      console.error(err);
      return err;
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
  if (!user_id) return Promise.resolve({ data: [] });
  const requestExtension = `/messages/contacts/${user_id}`;
  return authGet(requestExtension).then(
    (response) => ({
      data: Array.isArray(response?.data?.result?.data)
        ? response.data.result.data
        : [],
    }),
    (err) => {
      console.error(err);
      return { data: [] };
    }
  );
};
export const getDetailMessages = (
  pageNumber,
  pageSize,
  searchTerm,
  startDate,
  endDate,
  partner_id = "no-affiliation",
  view_mode = "mentee-to-mentor",
  showOnlyUnanswered = false
) => {
  let queryParams = new URLSearchParams();

  if (searchTerm) queryParams.append("searchTerm", searchTerm);
  if (startDate) queryParams.append("startDate", startDate);
  if (endDate) queryParams.append("endDate", endDate);
  if (pageSize) queryParams.append("pageSize", pageSize);
  if (partner_id) queryParams.append("partner_id", partner_id);
  if (view_mode) queryParams.append("view_mode", view_mode);
  queryParams.append("unanswered_only", showOnlyUnanswered);

  const requestExtension = `/messages/contacts/mentors/${pageNumber}?${queryParams.toString()}`;

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

export const getGroupMessageData = (hub_user_id) => {
  const requestExtension = `/messages/group/?hub_user_id=${
    hub_user_id ? hub_user_id : ""
  }`;
  return authGet(requestExtension).then(
    (response) => response.data.result.Messages,
    (err) => {
      console.error(err);
    }
  );
};

// Merge held (flagged, undelivered) messages into the delivered list in
// chronological order. A held message is only the newest right after it's sent;
// once later messages arrive it belongs earlier in the thread. Both delivered
// and held items carry created_at.$date, and Array.sort is stable, so the
// backend's (created_at, id) ordering of delivered messages is preserved.
const mergeHeldMessages = (msgs, held) => {
  if (!held.length) return msgs;
  const ts = (m) =>
    new Date(m?.created_at?.$date ?? m?.time ?? 0).getTime() || 0;
  return [...msgs, ...held].sort((a, b) => ts(a) - ts(b));
};

export const getMessageData = (sender_id, recipient_id) => {
  if (typeof recipient_id !== "string" || !sender_id)
    return Promise.resolve([]);
  const requestExtension = `/messages/direct/?recipient_id=${recipient_id}&sender_id=${sender_id}`;
  return authGet(requestExtension).then(
    (response) => {
      const result = response?.data?.result;
      const msgs = Array.isArray(result?.Messages) ? result.Messages : [];
      const held = Array.isArray(result?.HeldMessages)
        ? result.HeldMessages
        : [];
      return mergeHeldMessages(msgs, held);
    },
    (err) => {
      console.error(err);
      return [];
    }
  );
};

// Paginated thread fetch: returns the newest `limit` messages (oldest->newest),
// optionally older than the (before, beforeId) keyset cursor, plus whether older
// messages remain and the cursor to request the next older page. The cursor is a
// compound (created_at, _id) bound so messages sharing a created_at can't trap
// pagination on a single timestamp.
export const getDirectMessagesPage = (
  sender_id,
  recipient_id,
  { limit = 30, before = null, beforeId = null } = {}
) => {
  if (typeof recipient_id !== "string" || !sender_id) {
    return Promise.resolve({
      messages: [],
      hasMore: false,
      nextBefore: null,
      nextBeforeId: null,
      error: false,
    });
  }
  let requestExtension = `/messages/direct/?recipient_id=${recipient_id}&sender_id=${sender_id}&limit=${limit}`;
  if (before && beforeId) {
    requestExtension += `&before=${encodeURIComponent(
      before
    )}&before_id=${encodeURIComponent(beforeId)}`;
  }
  return authGet(requestExtension).then(
    (response) => {
      const result = response?.data?.result;
      const msgs = Array.isArray(result?.Messages) ? result.Messages : [];
      const held = Array.isArray(result?.HeldMessages)
        ? result.HeldMessages
        : [];
      return {
        // Held messages only arrive on the first page; merge them in by time.
        messages: mergeHeldMessages(msgs, held),
        hasMore: !!result?.has_more,
        nextBefore: result?.next_before || null,
        nextBeforeId: result?.next_before_id || null,
        error: false,
      };
    },
    (err) => {
      console.error(err);
      // Signal the failure instead of reporting an empty end-of-history, so the
      // caller can preserve the cursor and let the user retry.
      return {
        messages: [],
        hasMore: false,
        nextBefore: null,
        nextBeforeId: null,
        error: true,
      };
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
  interestAreas,
  message
) => {
  const requestExtension = `/messages/mentor/${mentorId}`;
  const data = {
    mentee_id: menteeId,
    interest_areas: interestAreas,
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
  var languages = records?.data?.result?.result;
  if (!Array.isArray(languages)) return res;
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
  var specializations = records?.data?.result?.result;
  if (!Array.isArray(specializations)) return res;
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
  const records = await authGet(requestExtension).catch(console.error);
  const currentLang = i18n.language;
  let res = [];
  const languages = records?.data?.result?.result;
  if (!Array.isArray(languages)) return res;
  for (let language of languages) {
    const value = language.name;
    res.push({ value, label: language?.translations?.[currentLang] ?? value });
  }
  return res;
};

export const getDisplaySpecializations = async () => {
  const requestExtension = `/masters/specializations`;
  const records = await authGet(requestExtension).catch(console.error);
  const currentLang = i18n.language;
  let res = [];
  const specializations = records?.data?.result?.result;
  if (!Array.isArray(specializations)) return res;
  for (let specialization of specializations) {
    const value = specialization.name;
    res.push({
      value,
      label: specialization?.translations?.[currentLang] ?? value,
    });
  }
  return res;
};

export const translateOption = async (optionType, selectId) => {
  const requestExtension = `/masters/translate`;
  const formData = new FormData();
  formData.append("optionType", optionType);
  formData.append("selectId", selectId);
  const result = await authPut(requestExtension, formData).catch(console.error);
  return result.data?.result;
};

/**
 * Wrapper function calls to general account endpoints
 * This helps with avoiding the need to change multiple files
 * should there be a need to change the value for ACCOUNT_TYPE
 */

export const createMentorProfile = async (data, inFirebase) => {
  return await createAccountProfile(data, ACCOUNT_TYPE.MENTOR, inFirebase);
};

export const createMenteeProfile = async (data, inFirebase) => {
  return await createAccountProfile(data, ACCOUNT_TYPE.MENTEE, inFirebase);
};
export const createPartnerProfile = async (data, inFirebase) => {
  return await createAccountProfile(data, ACCOUNT_TYPE.PARTNER, inFirebase);
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

export const fetchMentors = async (restricted = undefined, all = false) => {
  return await fetchAccounts(ACCOUNT_TYPE.MENTOR, restricted, "", false, all);
};
export const fetchPartners = async (
  restricted = undefined,
  hub_user_id = null
) => {
  return await fetchAccounts(ACCOUNT_TYPE.PARTNER, restricted, hub_user_id);
};

export const fetchMentees = async (
  from_suppport_user = undefined,
  all = false
) => {
  return await fetchAccounts(
    ACCOUNT_TYPE.MENTEE,
    from_suppport_user,
    "",
    false,
    all
  );
};

export const searchAccounts = (type, params = {}) => {
  const requestExtension = `/accounts/${type}/search`;
  return authGet(requestExtension, { params }).then(
    (response) => {
      const result = response?.data?.result || {};
      const accounts = Array.isArray(result.accounts) ? result.accounts : [];
      accounts.forEach((a) => {
        a.role = type;
      });
      return { ...result, accounts, total: result.total ?? accounts.length };
    },
    (err) => {
      console.error(err);
      return { accounts: [], total: 0 };
    }
  );
};

export const searchMentors = (params) =>
  searchAccounts(ACCOUNT_TYPE.MENTOR, params);
export const searchMentees = (params) =>
  searchAccounts(ACCOUNT_TYPE.MENTEE, params);
export const searchPartners = (params) =>
  searchAccounts(ACCOUNT_TYPE.PARTNER, params);

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

export const getGroupParticipants = (hubId) => {
  const requestExtension = `/messages/group/participants/${hubId}`;
  return authGet(requestExtension).then(
    (response) => response.data.result.participants,
    (err) => {
      console.error(err);
    }
  );
};

export const downloadPartnerMentorsData = async (
  partnerId,
  format = "xlsx",
  { includeApplicants = true, effectiveStage = "" } = {}
) => {
  const requestExtension = `/download/partner/${partnerId}/accounts`;
  const params = {
    account_type: ACCOUNT_TYPE.MENTOR,
    format: format,
    include_applicants: includeApplicants ? "true" : "false",
  };
  if (effectiveStage && effectiveStage !== "all")
    params.effective_stage = effectiveStage;

  let response = await authGet(requestExtension, {
    responseType: "blob",
    params,
  }).catch(console.error);

  if (response) {
    const extension = format === "csv" ? "csv" : "xlsx";
    downloadBlob(response, `partner_mentors.${extension}`);
  }
};

export const downloadPartnerMenteesData = async (
  partnerId,
  format = "xlsx",
  { includeApplicants = true, effectiveStage = "" } = {}
) => {
  const requestExtension = `/download/partner/${partnerId}/accounts`;
  const params = {
    account_type: ACCOUNT_TYPE.MENTEE,
    format: format,
    include_applicants: includeApplicants ? "true" : "false",
  };
  if (effectiveStage && effectiveStage !== "all")
    params.effective_stage = effectiveStage;

  let response = await authGet(requestExtension, {
    responseType: "blob",
    params,
  }).catch(console.error);

  if (response) {
    const extension = format === "csv" ? "csv" : "xlsx";
    downloadBlob(response, `partner_mentees.${extension}`);
  }
};

export const submitBugReport = async (bugReportData) => {
  const requestExtension = `/bug-report`;
  return instance.post(requestExtension, bugReportData).then(
    (response) => response,
    (err) => {
      console.error(err);
      return err;
    }
  );
};

// Admin - Bug Reports Management
export const fetchBugReports = async (filters = {}) => {
  const requestExtension = `/admin/bug-reports`;
  return authGet(requestExtension, { params: filters }).then(
    (response) => response.data.result.bug_reports,
    (err) => {
      console.error(err);
    }
  );
};

export const fetchBugReportById = async (id) => {
  const requestExtension = `/admin/bug-reports/${id}`;
  return authGet(requestExtension).then(
    (response) => response.data.result.bug_report,
    (err) => {
      console.error(err);
    }
  );
};

export const updateBugReport = async (id, data) => {
  const requestExtension = `/admin/bug-reports/${id}`;
  return authPut(requestExtension, data).then(
    (response) => response,
    (err) => {
      console.error(err);
    }
  );
};

export const deleteBugReportById = async (id) => {
  const requestExtension = `/admin/bug-reports/${id}`;
  return authDelete(requestExtension).then(
    (response) => response,
    (err) => {
      console.error(err);
      return false;
    }
  );
};

// Admin - Error Logs
export const fetchErrorLogs = async (filters = {}) => {
  const requestExtension = `/admin/error-logs`;
  return authGet(requestExtension, { params: filters }).then(
    (response) => response.data.result,
    (err) => {
      console.error(err);
      return { items: [], next_before: null, count: 0 };
    }
  );
};

export const fetchErrorLogById = async (id) => {
  const requestExtension = `/admin/error-logs/${id}`;
  return authGet(requestExtension).then(
    (response) => response.data.result.error_log,
    (err) => {
      console.error(err);
    }
  );
};

export const fetchErrorAlertRecipients = async () => {
  const requestExtension = `/admin/error-logs/recipients`;
  return authGet(requestExtension).then(
    (response) => response.data.result.admins,
    (err) => {
      console.error(err);
      return [];
    }
  );
};

export const setErrorAlertRecipients = async (adminIds) => {
  const requestExtension = `/admin/error-logs/recipients`;
  return authPut(requestExtension, { admin_ids: adminIds }).then(
    (response) => ({ ok: true, response }),
    (err) => {
      console.error(err);
      return {
        ok: false,
        error: err?.response?.data?.message || err?.message || "Network error",
      };
    }
  );
};

export const deleteErrorLog = async (id) => {
  const requestExtension = `/admin/error-logs/${id}`;
  return authDelete(requestExtension).then(
    (response) => ({ ok: true, response }),
    (err) => {
      console.error(err);
      return {
        ok: false,
        error: err?.response?.data?.message || err?.message || "Network error",
      };
    }
  );
};

// Admin - Message Flags
export const fetchMessageFlags = async (filters = {}) => {
  const requestExtension = `/admin/message-flags/`;
  return authGet(requestExtension, { params: filters }).then(
    (response) => response.data.result,
    (err) => {
      console.error(err);
      return { items: [], total: 0, page: 1, limit: 50 };
    }
  );
};

export const fetchMessageFlagSenders = async () => {
  const requestExtension = `/admin/message-flags/senders`;
  return authGet(requestExtension).then(
    (response) => response.data.result.senders,
    (err) => {
      console.error(err);
      return [];
    }
  );
};

export const fetchMessageFlagById = async (id) => {
  const requestExtension = `/admin/message-flags/${id}`;
  return authGet(requestExtension).then(
    (response) => response.data.result,
    (err) => {
      console.error(err);
      return null;
    }
  );
};

export const updateMessageFlagAction = async (id, action, note = "") => {
  const requestExtension = `/admin/message-flags/${id}/action`;
  return authPut(requestExtension, { action, note }).then(
    (response) => ({ ok: true, result: response.data.result }),
    (err) => {
      console.error(err);
      return {
        ok: false,
        error: err?.response?.data?.message || err?.message || "Network error",
      };
    }
  );
};

export const fetchMessageFlagRecipients = async () => {
  const requestExtension = `/admin/message-flags/recipients`;
  return authGet(requestExtension).then(
    (response) => response.data.result.admins,
    (err) => {
      console.error(err);
      return [];
    }
  );
};

export const setMessageFlagRecipients = async (adminIds) => {
  const requestExtension = `/admin/message-flags/recipients`;
  return authPut(requestExtension, { admin_ids: adminIds }).then(
    (response) => ({ ok: true, response }),
    (err) => {
      console.error(err);
      return {
        ok: false,
        error: err?.response?.data?.message || err?.message || "Network error",
      };
    }
  );
};

// Admin - OAuth Clients
export const fetchOAuthClients = async () => {
  const res = await authGet("/admin/oauth-clients");
  return res?.data?.result?.clients ?? [];
};

export const fetchOAuthClient = async (clientId) => {
  const res = await authGet(`/admin/oauth-clients/${clientId}`);
  return res?.data?.result?.client ?? null;
};

export const createOAuthClient = async (payload) => {
  const res = await authPost("/admin/oauth-clients", payload);
  return res?.data?.result ?? null;
};

export const updateOAuthClient = async (clientId, payload) => {
  const res = await authPatch(`/admin/oauth-clients/${clientId}`, payload);
  return res?.data?.result?.client ?? null;
};

export const rotateOAuthClientSecret = async (clientId) => {
  const res = await authPost(
    `/admin/oauth-clients/${clientId}/rotate-secret`,
    {}
  );
  return res?.data?.result ?? null;
};

export const revokeOAuthClientTokens = async (clientId) => {
  const res = await authPost(
    `/admin/oauth-clients/${clientId}/revoke-all-tokens`,
    {}
  );
  return res?.data?.result ?? null;
};

export const deleteOAuthClient = async (clientId) => {
  const res = await authDelete(`/admin/oauth-clients/${clientId}`, {
    data: { confirm_client_id: clientId },
  });
  return res?.data?.result ?? null;
};

// Admin - User search (whitelist picker)
export const fetchAdminUserSearch = async ({ q, limit = 20 } = {}) => {
  const query = new URLSearchParams();
  if (q) query.set("q", q);
  if (limit) query.set("limit", String(limit));
  const res = await authGet(`/admin/users/search?${query.toString()}`);
  return res?.data?.result?.results ?? [];
};

export const fetchAdminUsersByIds = async (ids = []) => {
  if (!ids.length) return [];
  const query = new URLSearchParams({ ids: ids.join(",") });
  const res = await authGet(`/admin/users?${query.toString()}`);
  return res?.data?.result?.results ?? [];
};

// User - Connected Apps (self-service)
export const fetchConnectedApps = async () => {
  const res = await authGet("/user/connected-apps");
  return res?.data?.result?.connected_apps ?? [];
};

export const revokeConnectedApp = async (clientId) => {
  const res = await authDelete(`/user/connected-apps/${clientId}`);
  return res?.data?.result ?? null;
};

export const fetchOAuthHasAny = async () => {
  const res = await authGet("/user/oauth-access/has-any");
  return Boolean(res?.data?.result?.has_any);
};

// Admin dashboard — see backend/api/views/admin_dashboard.py.
const DASH = "/admin/dashboard";

export const fetchDashboardSummary = async (section = "all") => {
  const res = await authGet(`${DASH}/summary`, { params: { section } });
  return res?.data?.result?.summary ?? null;
};

export const fetchDashboardApplicationsByMonth = async (role, months = 12) => {
  const res = await authGet(`${DASH}/applications/by-month`, {
    params: { role, months },
  });
  return res?.data?.result?.buckets ?? [];
};

export const fetchDashboardApplicationsOverview = async (months = 12) => {
  const res = await authGet(`${DASH}/applications/overview`, {
    params: { months },
  });
  return res?.data?.result ?? null;
};

export const fetchDashboardUsersOverview = async () => {
  const res = await authGet(`${DASH}/users/overview`);
  return res?.data?.result ?? null;
};

export const fetchDashboardAppointmentsOverview = async (
  months = 12,
  minRequests = 3,
  limit = 20
) => {
  const res = await authGet(`${DASH}/appointments/overview`, {
    params: { months, min_requests: minRequests, limit },
  });
  return res?.data?.result ?? null;
};

export const fetchDashboardMessagesOverview = async (days = 90) => {
  const res = await authGet(`${DASH}/messages/overview`, { params: { days } });
  return res?.data?.result ?? null;
};

export const fetchDashboardOpsOverview = async (
  errorDays = 30,
  oauthDays = 60
) => {
  const res = await authGet(`${DASH}/ops/overview`, {
    params: { error_days: errorDays, oauth_days: oauthDays },
  });
  return res?.data?.result ?? null;
};

export const fetchDashboardOpsHygiene = async () => {
  const res = await authGet(`${DASH}/ops/hygiene`);
  return res?.data?.result?.hygiene ?? null;
};

export const fetchDashboardAppointmentsByMonth = async (months = 12) => {
  const res = await authGet(`${DASH}/appointments/by-month`, {
    params: { months },
  });
  return res?.data?.result?.buckets ?? [];
};

export const fetchDashboardTopMentors = async (limit = 10) => {
  const res = await authGet(`${DASH}/appointments/top-mentors`, {
    params: { limit },
  });
  return res?.data?.result?.mentors ?? [];
};

export const fetchDashboardAcceptanceRates = async (
  minRequests = 3,
  limit = 30
) => {
  const res = await authGet(`${DASH}/appointments/acceptance-rates`, {
    params: { min_requests: minRequests, limit },
  });
  return res?.data?.result?.mentors ?? [];
};

export const fetchDashboardMessagesByDay = async (days = 90) => {
  const res = await authGet(`${DASH}/messages/by-day`, { params: { days } });
  return res?.data?.result?.buckets ?? [];
};

export const fetchDashboardCountries = async (limit = 15) => {
  const res = await authGet(`${DASH}/demographics/countries`, {
    params: { limit },
  });
  return res?.data?.result?.items ?? [];
};

export const fetchDashboardTopics = async (limit = 15) => {
  const res = await authGet(`${DASH}/demographics/topics`, {
    params: { limit },
  });
  return res?.data?.result?.items ?? [];
};

export const fetchDashboardCrisisStatus = async (limit = 10) => {
  const res = await authGet(`${DASH}/demographics/crisis-status`, {
    params: { limit },
  });
  return res?.data?.result?.items ?? [];
};

export const fetchDashboardIdentify = async (
  source = "mentee",
  population = "applications"
) => {
  const res = await authGet(`${DASH}/demographics/identify`, {
    params: { source, population },
  });
  const result = res?.data?.result ?? {};
  return {
    items: result.items ?? [],
    meta: result.meta ?? null,
  };
};

export const fetchDashboardMentorSpecializations = async (limit = 15) => {
  const res = await authGet(`${DASH}/demographics/mentor-specializations`, {
    params: { limit },
  });
  return res?.data?.result?.items ?? [];
};

export const fetchDashboardMentorFlags = async () => {
  const res = await authGet(`${DASH}/demographics/mentor-flags`);
  return res?.data?.result?.flags ?? null;
};

export const fetchDashboardTopPartners = async (
  role = "mentee",
  limit = 10
) => {
  const res = await authGet(`${DASH}/partners/top`, {
    params: { role, limit },
  });
  return res?.data?.result?.partners ?? [];
};

export const fetchDashboardErrorsByDay = async (days = 30) => {
  const res = await authGet(`${DASH}/errors/by-day`, { params: { days } });
  return res?.data?.result?.buckets ?? [];
};

export const fetchDashboardTopExceptions = async (limit = 10) => {
  const res = await authGet(`${DASH}/errors/top-exceptions`, {
    params: { limit },
  });
  return res?.data?.result?.items ?? [];
};

export const fetchDashboardTopErrorEndpoints = async (limit = 10) => {
  const res = await authGet(`${DASH}/errors/top-endpoints`, {
    params: { limit },
  });
  return res?.data?.result?.items ?? [];
};

export const fetchDashboardOauthTokensByDay = async (days = 60) => {
  const res = await authGet(`${DASH}/oauth/tokens-by-day`, {
    params: { days },
  });
  return res?.data?.result?.buckets ?? [];
};

const ADMIN_ONBOARDING = "/admin/onboarding";

export const fetchAdminOnboarding = async ({
  role = ACCOUNT_TYPE.MENTEE,
  page = 1,
  pageSize = 20,
  search = "",
  partnerId = "",
  effectiveStage = "",
  attention = false,
  attentionType = "",
} = {}) => {
  const res = await authGet(ADMIN_ONBOARDING, {
    params: {
      role,
      page,
      page_size: pageSize,
      search: search || undefined,
      partner_id: partnerId || undefined,
      effective_stage:
        effectiveStage && effectiveStage !== "all" ? effectiveStage : undefined,
      attention: attention ? "true" : undefined,
      attention_type:
        attentionType && attentionType !== "all" ? attentionType : undefined,
    },
  });
  return res?.data?.result ?? { rows: [], total: 0 };
};

export const runAdminOnboardingAction = async (role, email, action) => {
  const res = await authPost(
    `${ADMIN_ONBOARDING}/${role}/${encodeURIComponent(
      email
    )}/actions/${action}`,
    {
      front_url: FRONT_BASE_URL,
      preferred_language: i18n.language,
    }
  );
  return res?.data ?? null;
};
