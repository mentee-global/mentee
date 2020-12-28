import React, { useState, useEffect } from "react";
import { Button, Calendar, Col, Row, Modal } from "antd";
import {
  ClockCircleOutlined,
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  InfoCircleFilled,
  EnvironmentOutlined,
  CommentOutlined,
} from "@ant-design/icons";
import "../css/Appointments.scss";
import { formatAppointments } from "../../utils/dateFormatting";
import {
  acceptAppointment,
  getAppointmentsByMentorID,
  deleteAppointment,
} from "../../utils/api";
import { getMentorID } from "utils/auth.service";
import AppointmentInfo from "../AppointmentInfo";
import MenteeButton from "../MenteeButton.js";

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
  const [modalAppointment, setModalAppointment] = useState({});
  useEffect(() => {
    const mentorID = getMentorID();
    async function getAppointments() {
      const appointmentsResponse = await getAppointmentsByMentorID(mentorID);
      const formattedAppointments = formatAppointments(appointmentsResponse);
      if (formattedAppointments) {
        setAppointments(formattedAppointments);
      }
    }
    getAppointments();
  }, [appointmentClick]);
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
  };
  const getAppointmentButton = (tab, props) => {
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
          onClick={() => ViewAppointmentDetails(props)}
        ></Button>
      );
    } else if (tab === Tabs.pending) {
      return (
        <MenteeButton
          content={<b>Review</b>}
          onClick={() => AcceptRejectAppointment(props)}
        ></MenteeButton>
      );
    }
  };
  const Appointment = (props) => {
    return (
      <div className="appointment-card">
        <div>
          <b className="appointment-mentee-name">{props.name}</b>
          <div className="appointment-time">
            <ClockCircleOutlined /> {props.time}
          </div>
          <div className="appointment-description">{props.description}</div>
        </div>
        {getAppointmentButton(currentTab, props)}
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
  const AvailabilityTab = () => {
    return (
      <div>
        <div className="availability-container">
          <div className="calendar-header">
            Set available hours by specific date
          </div>
          <div className="calendar-container">
            <Calendar />
          </div>
        </div>
        <div className="save-container">
          <Button
            type="default"
            shape="round"
            style={getButtonStyle(currentTab)}
          >
            <div style={getButtonTextStyle(currentTab)}>Save</div>
          </Button>
        </div>
      </div>
    );
  };
  const Appointments = ({ data }) => {
    if (!data) {
      return <div></div>;
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
                {appointmentsObject.appointments.map((appointment, index) => (
                  <Appointment
                    key={index}
                    name={appointment.name}
                    date={appointment.date}
                    time={appointment.time}
                    description={appointment.description}
                    id={appointment.id}
                    email={appointment.email}
                    age={appointment.age}
                    phone_number={appointment.phone_number}
                    languages={appointment.languages}
                    gender={appointment.gender}
                    ethnicity={appointment.ethnicity}
                    location={appointment.location}
                    specialist_categories={appointment.specialist_categories}
                    organization={appointment.organization}
                  />
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
        return <AvailabilityTab />;
      default:
        return <div />;
    }
  }

  return (
    <div>
      <AppointmentInfo
        setModalVisible={setModalVisible}
        modalVisible={modalVisible}
        needButtons = {currentTab == Tabs.pending}
        handleAppointmentClick={handleAppointmentClick}
        modalAppointment={modalAppointment}
      />
      <Row>
        <Col span={18} className="appointments-column">
          <div className="appointments-welcome-box">
            <div className="appointments-welcome-text">
              Welcome, {appointments.mentor_name}
            </div>
            <div className="appointments-tabs">
              {Object.values(Tabs).map((tab, index) => (
                <Tab tab={tab} text={tab.title} key={index} />
              ))}
            </div>
          </div>
          {renderTab(currentTab)}
        </Col>
        <Col span={6} style={styles.calendar}>
          <Calendar></Calendar>
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
