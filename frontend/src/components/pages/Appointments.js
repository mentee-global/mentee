import React, { useState } from "react";
import { Button, Calendar } from "antd";
import "../css/Appointments.scss";

const Tabs = Object.freeze({
  upcoming: 1,
  pending: 2,
  past: 3,
  availability: 4,
});

function Appointments() {
  const [currentTab, setCurrentTab] = useState(Tabs.availability);

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
        <div style={getButtonTextStyle(props.title)}>{props.text}</div>
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
            <Calendar></Calendar>
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
      <div className="appointments-welcome-text">Welcome, Bernie</div>
      <div className="appointments-tabs">
        <Tab title={Tabs.upcoming} text="Upcoming" />
        <Tab title={Tabs.pending} text="Pending" />
        <Tab title={Tabs.past} text="Past" />
        <Tab title={Tabs.availability} text="Appointments" />
      </div>
      {renderTab(currentTab)}
    </div>
  );
}

export default Appointments;
