import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { Button, Col, Row, Result, Switch, Badge } from "antd";
import {
  ClockCircleOutlined,
  InfoCircleFilled,
  SmileOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import "components/css/Appointments.scss";
import { formatAppointments } from "utils/dateFormatting";
import AvailabilityCalendar from "components/AvailabilityCalendar";
import {
  acceptAppointment,
  fetchAppointmentsByMentorId,
  deleteAppointment,
  fetchMenteeByID,
  editMentorProfile,
} from "utils/api";
import { ACCOUNT_TYPE } from "utils/consts";
import { getMenteeID, getMentorID } from "utils/auth.service";
import AppointmentInfo from "../AppointmentInfo";
import MenteeButton from "../MenteeButton.js";
import useAuth from "utils/hooks/useAuth";
import { fetchUser } from "features/userSlice";

const Tabs = Object.freeze({
  upcoming: {
    title: "All Upcoming",
    key: "upcoming",
  },
  pending: {
    title: "All Pending",
    key: "pending",
  },
  past: {
    title: "All Past",
    key: "past",
  },
  availability: {
    title: "Availability",
    key: "availability",
  },
});
function Appointments() {
  const [currentTab, setCurrentTab] = useState(Tabs.upcoming);
  const [appointments, setAppointments] = useState({});
  const [appointmentClick, setAppointmentClick] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const user = useSelector((state) => state.user.user);
  const [modalAppointment, setModalAppointment] = useState({});
  const { onAuthStateChanged, role, profileId } = useAuth();
  const [pendingAppointmentCount, setPendingAppointmentCount] = useState(0);
  const dispatch = useDispatch();

  useEffect(() => {
    async function getAppointments() {
      const mentorID = await getMentorID();
      const appointmentsResponse = await fetchAppointmentsByMentorId(mentorID);

      const formattedAppointments = formatAppointments(
        appointmentsResponse,
        ACCOUNT_TYPE.MENTOR
      );
      if (formattedAppointments) {
        setAppointments(formattedAppointments);
        if (formattedAppointments["pending"][0]) {
          setPendingAppointmentCount(
            formattedAppointments["pending"][0]["appointments"].length
          );
        }
      }
    }

    onAuthStateChanged(getAppointments);
  }, [appointmentClick]);

  useEffect(() => {
    async function addTakingAppointments() {
      if (user && user.taking_appointments === undefined) {
        const new_user = { ...user, taking_appointments: false };
        await editMentorProfile(new_user, profileId);
        dispatch(fetchUser({ id: profileId, role }));
      }
    }
    addTakingAppointments();
  }, [user]);

  async function handleTakeAppointments(e) {
    const new_user = { ...user, taking_appointments: e };
    await editMentorProfile(new_user, profileId);
    dispatch(fetchUser({ id: profileId, role }));
  }

  async function handleAppointmentClick(id, didAccept) {
    if (didAccept) {
      await acceptAppointment(id);
    } else {
      await deleteAppointment(id);
    }
    setAppointmentClick(!appointmentClick);
    setModalVisible(false);
  }
  const getButtonStyle = (tab) => {
    const active = "#E4BB4F";
    const inactive = "#FFECBD";
    return {
      borderRadius: 13,
      marginRight: 15,
      borderWidth: 0,
      backgroundColor: currentTab === tab ? active : inactive,
    };
  };
  const getButtonTextStyle = (tab) => {
    const active = "#FFF7E2";
    const inactive = "#A58123";
    return {
      fontWeight: 700,
      color: currentTab === tab ? active : inactive,
    };
  };
  const Tab = (props) => {
    if (props.text == "All Pending") {
      return (
        <Button
          type="default"
          shape="round"
          style={getButtonStyle(props.tab)}
          onClick={() => setCurrentTab(props.tab)}
        >
          <Badge count={pendingAppointmentCount ?? 0} size="small">
            <div style={getButtonTextStyle(props.tab)}>{props.text}</div>
          </Badge>
        </Button>
      );
    } else {
      return (
        <Button
          type="default"
          shape="round"
          style={getButtonStyle(props.tab)}
          onClick={() => setCurrentTab(props.tab)}
        >
          <div style={getButtonTextStyle(props.tab)}>{props.text}</div>
        </Button>
      );
    }
  };
  const getAppointmentButton = (tab, info) => {
    if (tab === Tabs.upcoming) {
      return (
        <Button
          className="appointment-more-details"
          icon={
            <InfoCircleFilled
              style={{ ...styles.appointment_buttons, color: "#A58123" }}
            />
          }
          type="text"
          onClick={() => ViewAppointmentDetails(info)}
        ></Button>
      );
    } else if (tab === Tabs.pending) {
      return (
        <MenteeButton
          content={<b>Review</b>}
          onClick={() => AcceptRejectAppointment(info)}
        ></MenteeButton>
      );
    }
  };
  const Appointment = ({ info }) => {
    return (
      <div className="appointment-card">
        <div>
          <div className="appointment-mentee-name">
            <b>{info.name}</b>
          </div>
          <div className="appointment-time">
            <ClockCircleOutlined /> {info.time}
          </div>
          <div className="appointment-description">{info.topic}</div>
        </div>
        {getAppointmentButton(currentTab, info)}
      </div>
    );
  };
  const AcceptRejectAppointment = (props) => {
    setModalVisible(true);
    setModalAppointment(props);
  };
  const ViewAppointmentDetails = (props) => {
    setModalVisible(true);
    setModalAppointment(props);
  };
  const AvailabilityTab = ({ data }) => {
    return (
      <div>
        <div className="availability-container"></div>
        <div
          className="availability-container"
          style={{
            opacity: user?.taking_appointments ? 1 : 0.25,
            pointerEvents: user?.taking_appointments ? "initial" : "none",
          }}
        >
          <div className="calendar-header">
            Set available hours by specific date
          </div>
          <div className="calendar-container">
            <AvailabilityCalendar appointmentdata={data} />
          </div>
        </div>
      </div>
    );
  };
  const Appointments = ({ data }) => {
    if (!data || !data.length) {
      return (
        <div className="empty-appointments-list appointments-background">
          <Result
            icon={<SmileOutlined style={{ color: "#A58123" }} />}
            title="There are currently no appointments"
          />
        </div>
      );
    }
    return (
      <div>
        <b className="appointment-tabs-title">{currentTab.title}</b>
        <div className="appointments-background">
          {data.map((appointmentsObject, index) => (
            <div key={index} className="appointments-date-block">
              <div className="appointments-date-text-block">
                <h1 className="appointments-date-number">
                  {appointmentsObject.date}
                </h1>
                <p>{appointmentsObject.date_name}</p>
              </div>
              <div className="appointments-row">
                {/* TODO: Change the appointment component to fetch mentee info */}
                {appointmentsObject.appointments.map((appointment, index) => (
                  <Appointment key={index} info={appointment} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  function renderTab(tab) {
    switch (tab) {
      case Tabs.upcoming: // Fall through
      case Tabs.pending: // Fall through
      case Tabs.past:
        return <Appointments data={appointments[currentTab.key]} />;
      case Tabs.availability:
        return <AvailabilityTab data={appointments["upcoming"]} />;
      default:
        return <div />;
    }
  }

  return (
    <div>
      <AppointmentInfo
        setModalVisible={setModalVisible}
        modalVisible={modalVisible}
        needButtons={currentTab == Tabs.pending}
        handleAppointmentClick={handleAppointmentClick}
        modalAppointment={modalAppointment}
      />
      <Row>
        <Col span={18} className="appointments-column">
          <div className="appointments-welcome-box">
            <div className="appointments-welcome-text">
              Welcome, {user?.name}
            </div>
            <div className="appointments-tabs">
              {Object.values(Tabs).map((tab, index) => (
                <Tab tab={tab} text={tab.title} key={index} />
              ))}
            </div>
          </div>
          {renderTab(currentTab)}
        </Col>
      </Row>
    </div>
  );
}
const styles = {
  calendar: {
    borderLeft: "3px solid #E5E5E5",
  },
  appointment_buttons: {
    fontSize: "24px",
  },
};
export default Appointments;
