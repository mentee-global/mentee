import React, { useEffect, useState } from "react";
import { MenuOutlined, SmileOutlined } from "@ant-design/icons";
import { Result } from "antd";

import { fetchAppointmentsByMenteeId } from "utils/api";
import { formatAppointments } from "utils/dateFormatting";
import { ACCOUNT_TYPE, PROFILE_URL, APPOINTMENT_STATUS } from "utils/consts";
import OverlaySelect from "components/OverlaySelect";
import useAuth from "utils/hooks/useAuth";
import BookmarkSidebar from "components/BookmarkSidebar";

import "components/css/MenteeAppointments.scss";
import ApptData from "utils/MenteeApptsData.json";
import BookMarkData from "utils/MenteeBookMarks.json";

const appointmentTabs = Object.freeze({
  upcoming: {
    text: "All Upcoming",
    key: "upcoming",
  },
  past: {
    text: "All Past",
    key: "past",
  },
});

function AppointmentCard({ info }) {
  return (
    <div className="mentee-appt-card">
      <div className="status-section">
        {info.status ?? "pending"}{" "}
        <div className={`status-${info.status ?? "pending"}`} />
      </div>
      <div className="mentee-appt-card-header">
        Meeting with <a href={PROFILE_URL + info.mentorID}>{info.mentorName}</a>
      </div>
      <div className="mentee-appt-card-time">
        {info.date}
        <br />
        {info.time}
      </div>
      <div className="mentee-appt-card-topic">
        <MenuOutlined /> {info.topic}
      </div>
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
        setAppointments(formattedAppointments);
        setVisibleAppts(formattedAppointments.upcoming);
      }
    }
    getAppointments();
  }, [profileId]);

  const handleOverlayChange = (newSelect) => {
    setVisibleAppts(appointments[newSelect]);
  };

  return (
    <div className="mentee-appointments-page">
      <div className="mentee-appts-section">
        <div className="mentee-appts-header">Welcome {ApptData.name}!</div>
        <div className="mentee-appts-container">
          <OverlaySelect
            options={appointmentTabs}
            defaultValue={appointmentTabs.upcoming}
            className="mentee-appts-overlay-style"
            onChange={handleOverlayChange}
          />
          {!visibleAppts || !visibleAppts.length ? (
            <Result
              icon={<SmileOutlined style={{ color: "#A58123" }} />}
              title="There are currently no appointments"
            />
          ) : (
            visibleAppts.map((elem) => <AppointmentCard info={elem} />)
          )}
        </div>
      </div>
      <BookmarkSidebar bookmarks={BookMarkData.bookmarks} />
    </div>
  );
}

export default MenteeAppointments;
