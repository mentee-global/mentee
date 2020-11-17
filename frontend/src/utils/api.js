import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:5000",
});

// This is just for the time being while we get auth up and running
// TODO: Delete these after auth is done
// Also if there are other ID's you want to test add them into here and import them into your file
export const mentorID = "5f9c8e5b8784f24df9f21819";
export const appointmentID = "5f93224191f097b50954408c";

export const fetchMentorByID = (id) => {
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
  const requestExtension = "/appointment";
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
