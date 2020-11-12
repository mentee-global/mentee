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
  
  const day = {};
  const [timeslots, setTimeSlots] = useState([]);
  //TODO store and find previously set dates
  //TODO set symbol on calendar when appointments are set
  const saveValues = (times) => {
    
  }
  
  const onSelect = (value) => {
    setTimeSlotCount(1);
    setDate(value);
    setValue(value);
    setVisible(true);
  };

  const handleOk = (e) => {
    days.push({
      date: {
        timeslots: []
      }
    })
    setVisible(false);
  };

  const handleCancel = (e) => {
    setVisible(false);
  };

  const getPickTimes = (date) => {
    let times = [];
    for (let i = 0; i < timeslotcount; i++) {
      times.push(<TimeSlots date={date} parentCallback={saveValues} newtime1 = {moment()} newtime2={moment()}/>);
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
        {getPickTimes(date)}
        <Button onClick={addTimeSlot}>Add</Button>
      </Modal>
    </>
  );
}

function TimeSlots({ parentCallback, date, newtime1, newtime2 }) {
  //TODO add x button to remove time slots
  const [times, setTimes] = useState([moment(),moment()]);
  const [time1, setTime1] = useState(newtime1);
  const [time2, setTime2] = useState(newtime2);


  const updateTimes = () => {
    parentCallback(times);
    setTimes([time1, time2]);
    console.log(times);
  }
  const updateTime1 = (time, timeString) => {
    console.log("Was called 1")
    const newtime = time;
    newtime.year(date.year());
    newtime.month(date.month());
    newtime.day(date.day());
    setTime1(time);
    updateTimes();
  }

  const updateTime2 = (time, timeString) => {
    console.log("Was called 2");
    time.year(date.year());
    time.month(date.month());
    time.day(date.day());
    setTime2(time);
    console.log(time2);
    updateTimes();
  }

  return (
    <div>
      <TimePicker value={time1} onChange={updateTime1} className="timeslot" format={"HH:mm"} />
      <h1 className="timeslot"> - </h1>
      <TimePicker value={time2} onChange={updateTime2} className="timeslots" format={"HH:mm"} />
    </div>
  );
}

export default AvailabilityCalendar;
