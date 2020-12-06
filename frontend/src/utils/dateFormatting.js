import moment from "moment";

export const formatAppointments = (data) => {
  if (!data) {
    return;
  }

  const output = {
    mentor_name: data.mentor_name,
    upcoming: [],
    pending: [],
    past: [],
  };
  const appointments = data.requests;
  const now = moment();

  let appointment;
  for (appointment of appointments) {
    const timeslot = appointment.timeslot;

    const startTime = moment(timeslot.start_time.$date);
    const endTime = moment(timeslot.end_time.$date);

    let keyToInsertAt = "upcoming";
    if (!appointment.accepted && startTime.isSameOrAfter(now)) {
      keyToInsertAt = "pending";
    } else if (startTime.isBefore(now)) {
      keyToInsertAt = "past";
    }

    const formattedAppointment = {
      description: appointment.message,
      id: appointment._id.$oid,
      name: appointment.name,
      email: appointment.email,
      age: appointment.age,
      time: startTime.format("h:m a") + " - " + endTime.format("h:m a"),
      isoTime: startTime.format(),
      email: appointment.email,
      phone_number: appointment.phone_number,
      languages: appointment.languages,
      gender: appointment.gender,
      ethnicity: appointment.ethnicity,
      location: appointment.location,
      mentorship_goals: appointment.mentorship_goals,
      specialist_categories: appointment.specialist_categories,
    };

    // This is the only case where we might not have a date for a certain key
    if (output[keyToInsertAt].length < 1) {
      const dayObject = {
        isoTime: startTime.format(),
        date: startTime.format("M/D"),
        date_name: startTime.format("ddd"),
        appointments: [formattedAppointment],
      };
      output[keyToInsertAt].push(dayObject);
      continue;
    }

    const idxDayInsertAt = findIdxToInsert(
      output[keyToInsertAt],
      startTime,
      "date"
    );
    const dayFound =
      idxDayInsertAt < output[keyToInsertAt].length
        ? moment(output[keyToInsertAt][idxDayInsertAt].isoTime)
        : undefined;
    // Checks if appointment is in the same day
    if (dayFound && dayFound.isSame(startTime, "date")) {
      const idxAppointmentInsert = findIdxToInsert(
        output[keyToInsertAt].appointments,
        startTime,
        "minute"
      );

      output[keyToInsertAt][idxDayInsertAt]["appointments"].splice(
        idxAppointmentInsert,
        0,
        formattedAppointment
      );
    } else {
      // We will need to make a new day and fit in the current appointment
      const dayObject = {
        isoTime: startTime.format(),
        date: startTime.format("M/D"),
        date_name: startTime.format("ddd"),
        appointments: [formattedAppointment],
      };

      output[keyToInsertAt].splice(idxDayInsertAt, 0, dayObject);
    }
  }

  // We reverse past since we want from most recent to least recent
  output.past.reverse();
  return output;
};

const findIdxToInsert = (times, timeToInsert, granularity) => {
  if (!times) {
    return 0;
  }

  let low = 0;
  let high = times.length - 1;
  let mid = low;
  let midDay = moment(times[mid].isoTime);

  // Binary search to get nearest day index to new day
  while (low < high) {
    mid = Math.floor((high + low) / 2);
    midDay = moment(times[mid].isoTime);
    if (midDay.isSame(timeToInsert, granularity)) {
      return mid;
    } else if (midDay.isBefore(timeToInsert, granularity)) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  if (midDay.isBefore(timeToInsert, granularity)) {
    return mid + 1;
  } else {
    return mid;
  }
};
