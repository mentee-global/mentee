import React, { useEffect, useState } from "react";
import { MenuOutlined, SmileOutlined } from "@ant-design/icons";
import { Result, message } from "antd";
import { useSelector } from "react-redux";

import {
  fetchAppointmentsByMenteeId,
  getFavMentorsById,
  editFavMentorById,
} from "utils/api";
import { formatAppointments } from "utils/dateFormatting";
import { ACCOUNT_TYPE, MENTOR_PROFILE } from "utils/consts";
import OverlaySelect from "components/OverlaySelect";
import {useAuth} from "utils/hooks/useAuth";
import BookmarkSidebar from "components/BookmarkSidebar";
import MenteeInterestModal from "components/MenteeInterestModal";
import "components/css/MenteeAppointments.scss";

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
        Meeting with{" "}
        <a href={`${MENTOR_PROFILE}${info.mentorID}`}>
          {info.mentorName ?? "Mentor Not Found"}
        </a>
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
  const [favMentors, setFavMentors] = useState([]);
  const { profileId } = useAuth();
  const [isLoading, setisLoading] = useState(true);
  const user = useSelector((state) => state.user.user);
  const [haveInterest, SetHaveInterest] = useState(true);

  useEffect(() => {
    async function getData() {
      const appointmentsResponse = await fetchAppointmentsByMenteeId(profileId);
      setisLoading(true);
      const resFavMentors = await getFavMentorsById(profileId);

      const formattedAppointments = formatAppointments(
        appointmentsResponse,
        ACCOUNT_TYPE.MENTEE
      );

      if (formattedAppointments && favMentors) {
        setAppointments(formattedAppointments);
        setVisibleAppts(formattedAppointments.upcoming);

        resFavMentors.map((elem) => (elem.id = elem._id.$oid));
        setFavMentors(resFavMentors);
        setisLoading(false);
      } else {
        console.error("Failed to fetch appointments or favorite mentors");
      }
    }
    getData();
  }, [profileId]);

  const handleOverlayChange = (newSelect) => {
    setVisibleAppts(appointments[newSelect]);
  };

  const handleUnfavorite = async (mentorId, name) => {
    const res = await editFavMentorById(profileId, mentorId, false);
    if (!res) {
      message.error(`Failed to unfavorite mentor ${name}`, 3);
    } else {
      message.success(`Successfully unfavorite mentor ${name}`, 3);
      const newFav = favMentors.filter((mentor) => mentor.id != mentorId);
      setFavMentors(newFav);
    }
  };
  useEffect(() => {
    if (user) {
      if (!user.specializations || user.specializations.length <= 0) {
        SetHaveInterest(false);
      }
    }
  }, [user]);

  return (
    <div className="mentee-appointments-page">
      {!haveInterest && <MenteeInterestModal />}
      <div className="mentee-appts-section">
        <div className="mentee-appts-header">Welcome {user?.name}!</div>
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
      <BookmarkSidebar
        bookmarks={favMentors}
        unfavorite={handleUnfavorite}
        isLoading={isLoading}
      />
    </div>
  );
}

export default MenteeAppointments;
