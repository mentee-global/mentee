import React, { useEffect, useState } from "react";
import OverlaySelect from "components/OverlaySelect";

const appointmentTabs = Object.freeze({
  upcoming: {
    text: "All Upcoming",
    key: "upcoming",
  },
  pending: {
    text: "All Pending",
    key: "pending",
  },
  past: {
    text: "All Past",
    key: "past",
  },
});

function MenteeAppointments() {
  return (
    <>
      <div className="appointments-section">
        <div className="appointments-header">Welcome John!</div>
        <div className="appointments-container">
          <OverlaySelect
            options={appointmentTabs}
            defaultValue={appointmentTabs.upcoming}
          />
        </div>
      </div>
    </>
  );
}

export default MenteeAppointments;
