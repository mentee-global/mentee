import React, { useState } from "react";
import { Button, Calendar } from "antd";
import "../css/Appointments.scss";

const Tabs = Object.freeze({ "upcoming": 1, "pending": 2, "past": 3, "availability": 4 })

function Appointments() {
  const [currentTab, setCurrentTab] = useState(Tabs.availability)

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
      backgroundColor: currentTab === tab ? active : inactive
    }
  }

  const getButtonTextStyle = (tab) => {
    const active = "#FFF7E2";
    const inactive = "#A58123";
    return {
      color: currentTab === tab ? active : inactive
    }
  }

  const Tab = (props) => {
    return (
      <Button
        type="default"
        shape="round"
        style={getButtonStyle(props.title)}
        onClick={() => setCurrentTab(props.title)}
      >
        <div style={getButtonTextStyle(props.title)}>
          {props.text}
        </div>
      </Button>
    )
  }

  return (
    <div>
      <div className="appointments-welcome-text">Welcome, Bernie</div>
      <div className="appointments-tabs">
        <Tab title={Tabs.upcoming} text="Upcoming" />
        <Tab title={Tabs.pending} text="Pending" />
        <Tab title={Tabs.past} text="Past" />
        <Tab title={Tabs.appointments} text="Appointments" />
        <Calendar>
        </Calendar>
      </div>
    </div>
  );
}


export default Appointments;