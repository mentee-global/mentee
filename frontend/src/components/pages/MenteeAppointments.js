import React, { useEffect, useState } from "react";
import { fetchAppointmentsByMenteeId } from "utils/api";
import useAuth from "utils/hooks/useAuth";
import { formatAppointments } from "utils/dateFormatting";
import OverlaySelect from "components/OverlaySelect";
import { ACCOUNT_TYPE } from "utils/consts";

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

function AppointmentCard({ info }) {
  return (
    <div className="card-container">
      <div className="card-header"></div>
    </div>
  );
}

function MenteeAppointments() {
  const [appointments, setAppointments] = useState({});
  const [visibleAppts, setVisibleAppts] = useState([]);
  const { profileId } = useAuth();

  useEffect(() => {
    async function getAppointments() {
      const appointmentsResponse = await fetchAppointmentsByMenteeId(profileId);
      // TODO: Change this format appointments since it doesn't fit with this page
      const formattedAppointments = formatAppointments(
        appointmentsResponse,
        ACCOUNT_TYPE.MENTEE
      );
      if (formattedAppointments) {
        console.log(formattedAppointments);
        setAppointments(formattedAppointments);
      }
    }
    getAppointments();
  }, [profileId]);

  const handleOverlayChange = (newSelect) => {
    setVisibleAppts(appointments[newSelect.key]);
  };

  return (
    <>
      <div className="appointments-section">
        <div className="appointments-header">Welcome John!</div>
        <div className="appointments-container">
          <OverlaySelect
            options={appointmentTabs}
            defaultValue={appointmentTabs.upcoming}
            className="overlay-style"
            onChange={handleOverlayChange}
          />
          {visibleAppts.map((elem) => (
            <AppointmentCard info={elem} />
          ))}
        </div>
      </div>
    </>
  );
}

export default MenteeAppointments;
