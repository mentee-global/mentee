import {
  createAccountProfile,
  editAccountProfile,
  uploadAccountImage,
  fetchAccountById,
  fetchAccounts,
} from "./api";
import { ACCOUNT_TYPE } from "./consts";

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
