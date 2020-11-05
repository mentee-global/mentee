import React, { useState } from "react";
import moment from "moment";
import { Calendar, Modal, TimePicker, Button } from "antd";
import "./css/AvailabilityCalendar.scss";

function AvailabilityCalendar() {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const [value, setValue] = useState(moment());
  const [date, setDate] = useState(moment());
  const [visible, setVisible] = useState(false);
  const [timeslotcount, setTimeSlotCount] = useState(1);

  //TODO store and find previously set dates
  //TODO set symbol on calendar when appointments are set
  const onSelect = (value) => {
    setTimeSlotCount(1);
    setDate(value);
    setValue(value);
    setVisible(true);
  };

  const handleOk = (e) => {
    setVisible(false);
  };

  const handleCancel = (e) => {
    setVisible(false);
  };

  const getPickTimes = () => {
    let times = [];
    for (let i = 0; i < timeslotcount; i++) {
      times.push(<TimeSlots />);
    }
    return times;
  };

  const addTimeSlot = () => {
    setTimeSlotCount(timeslotcount + 1);
  };

  return (
    <>
      <Calendar
        value={value}
        onPanelChange={(value) => setValue(value)}
        onSelect={onSelect}
      />
      <Modal
        title="Select times for each available session per day"
        visible={visible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <div className="date-header">
          <h2 className="date">{date && date.format("MM/DD")} </h2>
          <h5 className="date">{days[date.day()]}</h5>
        </div>
        {getPickTimes()}
        <Button onClick={addTimeSlot}>Add</Button>
      </Modal>
    </>
  );
}

function TimeSlots() {
  //TODO add x button to remove time slots
  return (
    <div>
      <TimePicker className="timeslot" format={"HH:mm"} />
      <h1 className="timeslot"> - </h1>
      <TimePicker className="timeslots" format={"HH:mm"} />
    </div>
  );
}

export default AvailabilityCalendar;
