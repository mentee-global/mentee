import React, { useEffect, useState } from "react";
import { fetchAppointmentsByMenteeId } from "utils/api";
import useAuth from "utils/hooks/useAuth";
import { formatAppointments } from "utils/dateFormatting";
import OverlaySelect from "components/OverlaySelect";

const appointmentTabs = Object.freeze({
  upcoming: {
    text: "All Upcoming",
    key: "upcoming",
  },
  pending: {
    text: "All Pending",
    key: "pending",
  },
  past: {
    text: "All Past",
    key: "past",
  },
});

function MenteeAppointments() {
  const [appointments, setAppointments] = useState([]);
  const { profileId } = useAuth();

  useEffect(() => {
    async function getAppointments() {
      const appointmentsResponse = await fetchAppointmentsByMenteeId(profileId);
      const formattedAppointments = formatAppointments(appointmentsResponse);
      if (formattedAppointments) {
        setAppointments(formattedAppointments);
      }
    }
    getAppointments();
  }, [profileId]);

  return (
    <>
      <div className="appointments-section">
        <div className="appointments-header">Welcome John!</div>
        <div className="appointments-container">
          <OverlaySelect
            options={appointmentTabs}
            defaultValue={appointmentTabs.upcoming}
            className="overlay-style"
          />
        </div>
      </div>
    </>
  );
}

export default MenteeAppointments;
