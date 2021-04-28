import React, { useEffect, useState } from "react";

import { fetchAppointmentsByMenteeId } from "utils/api";
import { formatAppointments } from "utils/dateFormatting";
import { ACCOUNT_TYPE } from "utils/consts";
import OverlaySelect from "components/OverlaySelect";
import useAuth from "utils/hooks/useAuth";

import "components/css/MenteeAppointments.scss";
import ApptData from "utils/MenteeApptsData.json";

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
    <div className="mentee-appt-card">
      <div className="mentee-appt-card-header">Hello</div>
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
      const formattedAppointments = formatAppointments(
        appointmentsResponse,
        ACCOUNT_TYPE.MENTEE
      );
      if (formattedAppointments) {
        console.log(formattedAppointments);
        setAppointments(ApptData);
        setVisibleAppts(ApptData.past);
      }
    }
    getAppointments();
  }, [profileId]);

  const handleOverlayChange = (newSelect) => {
    setVisibleAppts(appointments[newSelect.key]);
  };

  return (
    <>
      <div className="mentee-appts-section">
        <div className="mentee-appts-header">Welcome John!</div>
        <div className="mentee-appts-container">
          <OverlaySelect
            options={appointmentTabs}
            defaultValue={appointmentTabs.upcoming}
            className="mentee-appts-overlay-style"
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
