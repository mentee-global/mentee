import React, { useState } from "react";
import { Button, Calendar, Col, Row } from "antd";
import Icon, { ClockCircleOutlined } from "@ant-design/icons";
import "../css/Appointments.scss";
import AppointmentUpcoming from "../../resources/upcomingInfo.svg";
import AcceptIcon from "../../resources/accept.svg";
import DeclineIcon from "../../resources/decline.svg";
import appointmentData from "../../resources/appointments.json";

const upcomingIcon = () => <img src={AppointmentUpcoming} />;
const acceptIcon = () => <img src={AcceptIcon} />;
const declineIcon = () => <img src={DeclineIcon} />;

const Tabs = Object.freeze({
  upcoming: {
    id: 1,
    title: "All Upcoming",
    key: "upcoming",
  },
  pending: {
    id: 2,
    title: "All Pending",
    key: "pending",
  },
  past: {
    id: 3,
    title: "All Past",
    key: "past",
  },
  appointments: {
    id: 4,
    title: "TBD",
    key: "appointments",
  },
});

// TODO: Clean this make it easy for people to figure out and remove certain elements

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
      color: currentTab === tab ? active : inactive,
      fontWeight: "bold",
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
    if (tab.id === 1) {
      return (
        <Button
          className="appointment-more-details"
          icon={<Icon component={upcomingIcon} />}
          type="text"
        ></Button>
      );
    } else if (tab.id === 2) {
      return (
        <div className="appointment-pending-buttons">
          <Button
            className="appointment-accept"
            icon={<Icon component={acceptIcon} />}
            type="text"
            shape="circle"
          ></Button>
          <Button
            className="appointment-accept"
            icon={<Icon component={declineIcon} />}
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

  const FetchedAppointments = appointmentData[currentTab.key].map(
    (appointmentsObject, index) => (
      <div key={index} className="appointments-date-block">
        <div className="appointments-date-text-block">
          <h1 className="appointments-date-number">
            {appointmentsObject["date"]}
          </h1>
          <p>{appointmentsObject["date_name"]}</p>
        </div>
        <div className="appointments-row">
          {appointmentsObject["appointments"].map((appointment, index) => (
            <Appointment
              key={index}
              name={appointment["name"]}
              time={appointment["time"]}
              description={appointment["description"]}
            />
          ))}
        </div>
      </div>
    )
  );

  return (
    <div>
      <Row>
        <Col span={18} className="appointments-column" scroll="y">
          <div className="appointments-welcome-box">
            <div className="appointments-welcome-text">Welcome, Bernie</div>
            <div className="appointments-tabs">
              <Tab tab={Tabs.upcoming} text="Upcoming" />
              <Tab tab={Tabs.pending} text="Pending" />
              <Tab tab={Tabs.past} text="Past" />
              <Tab tab={Tabs.appointments} text="Appointments" />
            </div>
            <b
              style={{
                fontSize: "18px",
              }}
            >
              {currentTab.title}
            </b>
          </div>
          <div className="appointments-background">{FetchedAppointments}</div>
        </Col>
        <Col
          span={6}
          style={{
            borderLeft: "3px solid #E5E5E5",
          }}
        >
          <Calendar></Calendar>
        </Col>
      </Row>
    </div>
  );
}

export default Appointments;
