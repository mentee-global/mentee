import React, { useState } from "react";
import { Button, Calendar } from "antd";
import "../css/Appointments.scss";

const Tabs = Object.freeze({
  upcoming: "Upcoming",
  pending: "Pending",
  past: "Past",
  availability: "Appointments",
});

function Appointments() {
  const [currentTab, setCurrentTab] = useState(Tabs.upcoming);

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
      fontWeight: 700,
      color: currentTab === tab ? active : inactive,
    };
  };

  const Tab = (props) => {
    return (
      <Button
        type="default"
        shape="round"
        style={getButtonStyle(props.title)}
        onClick={() => setCurrentTab(props.title)}
      >
        <div style={getButtonTextStyle(props.title)}>{props.title}</div>
      </Button>
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
            <Calendar />
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

  const UpcomingTab = () => {
    // Example, feel free to remove or change
    return null;
  };

  function renderTab(tab) {
    switch (tab) {
      case Tabs.upcoming:
        return <UpcomingTab />;
      case Tabs.pending:
        return null;
      case Tabs.past:
        return null;
      case Tabs.availability:
        return <AvailabilityTab />;
      default:
        return <div />;
    }
  }

  return (
    <div>
      <div className="appointments-welcome-text">Welcome, MENTOR_NAME [TODO] </div>
      <div className="appointments-tabs">
        {Object.values(Tabs).map((tab, index) => <Tab title={tab} key={index} />)}
      </div>
      {renderTab(currentTab)}
    </div>
  );
}

export default Appointments;
