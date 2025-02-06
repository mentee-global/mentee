import moment from "moment";

import { APPOINTMENT_STATUS } from "./consts";
import { ACCOUNT_TYPE } from "utils/consts";

const isPending = (appointment) =>
  appointment.status === APPOINTMENT_STATUS.PENDING ||
  (appointment.accepted !== undefined && !appointment.accepted);

export const formatAppointments = (data, type) => {
  if (!data || !data.requests) {
    return;
  }

  const output = {
    name: data.name,
    upcoming: [],
    pending: [],
    past: [],
  };
  let appointments = data.requests;
  if (type === ACCOUNT_TYPE.MENTOR) {
    appointments = data.requests.filter(
      (elem) => elem?.status !== APPOINTMENT_STATUS.DENIED
    );
  }

  const now = moment();

  appointments.sort((a, b) =>
    moment(a.timeslot.start_time.$date).diff(
      moment(b.timeslot.start_time.$date)
    )
  );

  let appointmentType = {
    upcoming: {
      index: 0,
      dayObject: moment(),
    },
    pending: {
      index: 0,
      dayObject: moment(),
    },
    past: {
      index: 0,
      dayObject: moment(),
    },
  };

  let appointment;
  for (appointment of appointments) {
    const timeslot = appointment.timeslot;
    const startTime = moment(timeslot.start_time.$date);
    const endTime = moment(timeslot.end_time.$date);

    let currentKey = "upcoming";
    if (
      isPending(appointment) &&
      startTime.isSameOrAfter(now) &&
      type !== ACCOUNT_TYPE.MENTEE
    ) {
      currentKey = "pending";
    } else if (startTime.isBefore(now)) {
      currentKey = "past";
    }
    let keyInfo = appointmentType[currentKey];
    const formattedAppointment = {
      message: appointment.message,
      id: appointment._id.$oid,
      mentorID: appointment.mentor_id.$oid,
      menteeID: appointment.mentee_id && appointment.mentee_id.$oid,
      name: appointment.name,
      mentorName: appointment.mentor_name,
      date: startTime.format("LL"),
      time: startTime.format("LT") + " - " + endTime.format("LT"),
      isoTime: startTime.format(),
      topic: appointment.topic,
      allowTexts: appointment.allow_texts,
      allowCalls: appointment.allow_calls,
      status: appointment.status,
      timeslot: appointment.timeslot,
    };
    if (!appointment.status) {
      formattedAppointment.status = appointment.accepted
        ? APPOINTMENT_STATUS.ACCEPTED
        : APPOINTMENT_STATUS.PENDING;
    }

    // Short process for formatting into Mentee's Appointment Page
    if (type === ACCOUNT_TYPE.MENTEE) {
      output[currentKey].push(formattedAppointment);
      continue;
    }

    // case where there is no dates at all in current type of appointment
    if (output[currentKey].length < 1) {
      const dayObject = {
        date: startTime.format("M/D"),
        date_name: startTime.format("ddd"),
        appointments: [formattedAppointment],
      };
      output[currentKey].push(dayObject);
      appointmentType[currentKey].dayObject = startTime;
    } else if (keyInfo.dayObject.isSame(startTime, "date")) {
      output[currentKey][keyInfo.index]["appointments"].push(
        formattedAppointment
      );
    } else {
      // creates a new day since current appointment doesn't fit current day
      const dayObject = {
        date: startTime.format("M/D"),
        date_name: startTime.format("ddd"),
        appointments: [formattedAppointment],
      };
      appointmentType[currentKey].dayObject = startTime;
      appointmentType[currentKey].index++;
      output[currentKey].push(dayObject);
    }
  }

  // We reverse past since we want from most recent to least recent
  output.past.reverse();
  return output;
};
