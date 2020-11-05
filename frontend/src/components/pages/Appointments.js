import React, { useState } from "react";
import { Button, Calendar, Col, Row } from "antd";
import {
  ClockCircleOutlined,
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  InfoCircleFilled,
} from "@ant-design/icons";
import "../css/Appointments.scss";
import AvailabilityCalendar from "../AvailabilityCalendar";

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

  const getAppointmentButton = (tab) => {
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
        ></Button>
      );
    } else if (tab === Tabs.pending) {
      return (
        <div className="appointment-pending-buttons">
          <Button
            className="appointment-accept"
            icon={
              <CheckCircleTwoTone
                style={styles.appointment_buttons}
                twoToneColor="#52c41a"
              />
            }
            type="text"
            shape="circle"
          ></Button>
          <Button
            className="appointment-accept"
            icon={
              <CloseCircleTwoTone
                style={styles.appointment_buttons}
                twoToneColor="#eb2f00"
              />
            }
            type="text"
            shape="circle"
          ></Button>
        </div>
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
        {getAppointmentButton(currentTab)}
      </div>
    );
  };

  const AvailabilityTab = () => {
    return (
      <div>
        <div className="availability-container">
          <div className="calendar-header">
            Set available hours by specific date
          </div>
          <div className="calendar-container">
            <AvailabilityCalendar />
          </div>
        </div>
        <div className="save-container">
          <Button
            type="default"
            shape="round"
            style={getButtonStyle(currentTab)}
            onClick={() => console.log("TODO: save!")}
          >
            <div style={getButtonTextStyle(currentTab)}>Save</div>
          </Button>
        </div>
      </div>
    );
  };

  const Appointments = ({ data }) => {
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
                    time={appointment.time}
                    description={appointment.description}
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
        return <Appointments data={[]} />;
      case Tabs.availability:
        return <AvailabilityTab />;
      default:
        return <div />;
    }
  }

  return (
    <Row>
      <Col span={18} className="appointments-column">
        <div className="appointments-welcome-box">
          <div className="appointments-welcome-text">Welcome, {"TODO"}</div>
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
