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

  appointments.sort((a, b) =>
    moment(a.timeslot.start_time.$date).diff(
      moment(b.timeslot.start_time.$date)
    )
  );

  let dateIndices = {
    upcoming: 0,
    pending: 0,
    past: 0,
  };
  let currentDate;
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
      time: startTime.format("h:mm a") + " - " + endTime.format("h:mm a"),
      isoTime: startTime.format(),
    };

    // This is the only case where we might not have a date for a certain key
    if (output[keyToInsertAt].length < 1) {
      const dayObject = {
        date: startTime.format("M/D"),
        date_name: startTime.format("ddd"),
        appointments: [formattedAppointment],
      };
      output[keyToInsertAt].push(dayObject);
      currentDate = startTime;
      continue;
    }

    if (currentDate.isSame(startTime, "date")) {
      output[keyToInsertAt][dateIndices[keyToInsertAt]]["appointments"].push(
        formattedAppointment
      );
    } else {
      // We will need to make a new day and fit in the current appointment
      const dayObject = {
        date: startTime.format("M/D"),
        date_name: startTime.format("ddd"),
        appointments: [formattedAppointment],
      };
      currentDate = startTime;
      dateIndices[keyToInsertAt]++;
      output[keyToInsertAt].push(dayObject);
    }
  }

  // We reverse past since we want from most recent to least recent
  output.past.reverse();
  return output;
};
