import React, { useState } from "react";
import { Button, Calendar, Col, Divider, Row } from "antd";
import { MenuOutlined } from "@ant-design/icons";
import "../css/Appointments.scss";
import { isCompositeComponent } from "react-dom/test-utils";

const Tabs = Object.freeze({
  upcoming: {
    id: 1,
    title: "All Upcoming",
  },
  pending: {
    id: 2,
    title: "All Pending",
  },
  past: {
    id: 3,
    title: "All Past",
  },
  appointments: {
    id: 4,
    title: "TBD",
  },
});

// TODO: Clean this horrendous CSS code :((( make it easy for people to figure out and remove certain elements

function Appointments() {
  const [currentTab, setCurrentTab] = useState(Tabs.upcoming);

  // className doesn't work for some reason, explore later
  /** const getTabStyle = (tab) => {
    return currentTab === tab
      ? "appointments-tab-item-selected"
      : "appointments-tab-item";
  }; */

  const getButtonStyle = (tab) => {
    const active = "#E4BB4F";
    const inactive = "#FFECBD";
    return {
      borderRadius: 13,
      marginRight: 15,
      backgroundColor: currentTab === tab ? active : inactive,
    };
  };

  const getButtonTextStyle = (tab) => {
    const active = "#FFF7E2";
    const inactive = "#A58123";
    return {
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

  const Appointment = (props) => {
    return (
      <div className="appointment-card">
        <div>
          <b className="appointment-mentee-name">{props.name}</b>
          <div className="appointment-time">{props.time}</div>
          <div className="appointment-description">{props.description}</div>
        </div>
        <Button
          className="appointment-more-details"
          icon={<MenuOutlined />}
          type="text"
        ></Button>
      </div>
    );
  };

  return (
    <div>
      <Row gutter={4}>
        <Col span={18}>
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

          <div className="appointments-background">
            <div className="appointments-date">
              <h1>10/6</h1>
              <div
                style={{
                  borderLeft: "solid",
                  borderColor: "#DBCA9E",
                  paddingLeft: "10px",
                  marginLeft: "10px",
                  borderWidth: "2px",
                  width: "100%",
                }}
              >
                <Appointment
                  name="Leo"
                  time="12pm - 2pm"
                  description="the watersJust testing the watersJust testing the waters"
                />
                <Appointment
                  name="Leo"
                  time="12pm - 2pm"
                  description="the watersJust testing the watersJust testing the waters"
                />
                <Appointment
                  name="Leo"
                  time="12pm - 2pm"
                  description="the watersJust testing the watersJust testing the waters"
                />
              </div>
            </div>
            <div className="appointments-date">
              <h1>10/6</h1>
              <div
                style={{
                  borderLeft: "solid",
                  borderColor: "#DBCA9E",
                  paddingLeft: "10px",
                  marginLeft: "10px",
                  borderWidth: "2px",
                  width: "100%",
                }}
              >
                <Appointment
                  name="Leo"
                  time="12pm - 2pm"
                  description="the watersJust testing the watersJust testing the waters"
                />
                <Appointment
                  name="Leo"
                  time="12pm - 2pm"
                  description="the watersJust testing the watersJust testing the waters"
                />
                <Appointment
                  name="Leo"
                  time="12pm - 2pm"
                  description="the watersJust testing the watersJust testing the waters"
                />
              </div>
            </div>
          </div>
        </Col>
        <Col span={6}>
          <Calendar></Calendar>
        </Col>
      </Row>
    </div>
  );
}

export default Appointments;
