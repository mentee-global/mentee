import axios from "axios";

const instance = axios.create({
    baseURL: "http://localhost:5000"
});

export const fetchMentorByID = id => {
    return instance
        .get("/mentor/" + id)
        .then(
            response => response.data.result.mentor,
            err => {
                console.error(err);
                return null;
            },
        );
};

export const fetchMentors = () => {
    return instance
        .get("/mentors")
        .then(
            response => response.data.result.mentors,
            err => {
                console.error(err);
                return null;
            }
        );
}

export const editMentorProfile = (profile, id) => {
    const requestExtension = "/mentor/" + id;
    return instance
        .put(requestExtension, profile)
        .then(
            res => res.data,
            err => {
                console.error(err);
                return null;
            }
        );
}

export const createMentorProfile = (profile, id) => {
    const requestExtension = "/mentor";
    return instance
        .post(requestExtension, profile)
        .then(
            res => res.data,
            err => {
                console.error(err);
                return null;
            }
        )
}

export const createAppointment = appointment => {
    const requestExtension = "/appointment";
    return instance
        .post(requestExtension, appointment)
        .then(
            res => res.data,
            err => {
                console.error(err);
                return null;
            }
        );
}

export const acceptAppointment = id => {
    const requestExtension = "/appointment/" + id;
    return instance
        .put(requestExtension)
        .then(
            res => res.data,
            err => {
                console.error(err);
                return null;
            }
        );
}

export const deleteAppointment = id => {
    const requestExtension = "/appointment/" + id;
    return instance
        .delete(requestExtension)
        .then(
            res => res.data,
            err => {
                console.error(err);
                return null;
            }
        )
}
