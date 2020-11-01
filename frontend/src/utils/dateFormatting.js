import moment from "moment";

export const formatAppointments = (data) => {
  if (data == null) {
    return;
  }

  const formatted = {
    mentor_name: data.mentor_name,
    upcoming: [],
    pending: [],
    past: [],
  };
  const appointments = data.requests;
  const now = moment();

  let prevDate = now;
  for (const index in appointments) {
    const timeslot = appointments[index].timeslot;
    const appointment = appointments[index];

    const startTime = moment(timeslot.start_time.$date);
    const endTime = moment(timeslot.end_time.$date);
    let key = "upcoming";

    if (!appointment.accepted && startTime.isSameOrAfter(now)) {
      key = "pending";
    } else if (startTime.isBefore(now)) {
      key = "past";
    }

    const formattedAppointment = {
      name: appointment.name,
      time: startTime.format("h:m a") + " - " + endTime.format("h:m a"),
      description: appointment.message,
      id: appointment._id.$oid,
    };

    if (prevDate.isSame(startTime, "date") && formatted[key].length > 0) {
      const dayIndex = formatted[key].length - 1;

      formatted[key][dayIndex].appointments.unshift(formattedAppointment);
    } else {
      const dayObject = {
        ISODate: startTime.format(),
        date: startTime.format("M/D"),
        date_name: startTime.format("ddd"),
        appointments: [formattedAppointment],
      };

      // This block of code searches through the appointments and finds where it can be inserted
      // For now it is in O(n) time but we can change this to O(logn) with binary search
      if (formatted[key].length < 1) {
        formatted[key].push(dayObject);
      } else if (formatted[key].length < 2) {
        const formattedDateObject = formatted[key][0];
        const formattedDate = moment(formattedDateObject.ISODate);
        if (startTime.isBefore(formattedDate, "date")) {
          formatted[key].unshift(dayObject);
        } else {
          formatted[key].push(dayObject);
        }
      } else {
        const firstDay = moment(formatted[key][0].ISODate);
        const lastDay = moment(
          formatted[key][formatted[key].length - 1].ISODate
        );

        if (firstDay.isAfter(startTime, "date")) {
          formatted[key].unshift(dayObject);
        } else if (lastDay.isBefore(startTime, "date")) {
          formatted[key].push(dayObject);
        } else {
          let currPointer = 0;
          let nextPointer = 1;
          for (let i = 0; i < formatted[key].length - 2; i++) {
            const currDate = moment(formatted[key][currPointer].ISODate);
            const nextDate = moment(formatted[key][nextPointer].ISODate);

            if (
              currDate.isBefore(startTime, "date") &&
              nextDate.isAfter(startTime, "date")
            ) {
              break;
            }
            currPointer++;
            nextPointer++;
          }

          formatted[key].splice(nextPointer, 0, dayObject);
        }
      }
      prevDate = startTime;
    }
  }
  formatted.past.reverse();
  return formatted;
};
