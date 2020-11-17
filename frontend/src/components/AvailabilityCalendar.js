import React, { useState, Fragment } from "react";
import moment from "moment";
import { Calendar, Modal, TimePicker, Button } from "antd";
import { CloseCircleFilled } from "@ant-design/icons";
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
  const [time1, setTime1] = useState();
  const [time2, setTime2] = useState();
  const [timeSlots, setTimeSlots] = useState([]);
  //TODO store and find previously set dates
  //TODO set symbol on calendar when appointments are set
  const handleTime1Change = (index, event) => {
    const times = [...timeSlots];
    times[index][0] = event;
    setTimeSlots(times);
  };
  const handleTime2Change = (index, event) => {
    const times = [...timeSlots];
    times[index][1] = event;
    setTimeSlots(times);
  };

  const addTimeSlots = () => {
    const times = [...timeSlots];
    times.push([moment(), moment()]);
    setTimeSlots(times);
  };

  const removeTimeSlots = (index) => {
    const times = [...timeSlots];
    times.splice(index, 1);
    setTimeSlots(times);
  };

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
        {timeSlots.map((timeSlot, index) => (
          <Fragment key={`${index}`}>
            <div>
              <TimePicker
                value={timeSlot[0]}
                onChange={(event) => handleTime1Change(index, event)}
                className="timeslot"
                format={"HH:mm"}
              />
              <h1 className="timeslot"> - </h1>
              <TimePicker
                value={timeSlot[1]}
                onChange={(event) => handleTime2Change(index, event)}
                className="timeslots"
                format={"HH:mm"}
              />
              <CloseCircleFilled
                className="close-icon"
                onClick={() => removeTimeSlots(index)}
              />
            </div>
          </Fragment>
        ))}
        <Button onClick={addTimeSlots}>Add</Button>
      </Modal>
    </>
  );
}

export default AvailabilityCalendar;
