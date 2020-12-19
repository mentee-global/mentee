import React, { useState, useEffect, Fragment } from "react";
import moment from "moment";
import { Calendar, Modal, Button, Badge } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import TextField from "@material-ui/core/TextField";
import MenteeButton from "./MenteeButton.js";
import "./css/AvailabilityCalendar.scss";
import { getMentorID } from "utils/auth.service";
import {
  fetchAvailability,
  editAvailability,
  fetchSetDays,
} from "../utils/api";

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

  const mentorID = getMentorID();
  const [saved, setSaved] = useState({});
  const [value, setValue] = useState(moment());
  const [date, setDate] = useState(moment());
  const [visible, setVisible] = useState(false);
  const [timeSlots, setTimeSlots] = useState([]);
  const format = "YYYY-MM-DDTHH:mm:ss.SSSZ";
  // var tz = moment.tz.guess();
  useEffect(() => {
    async function getSetDays() {
      const availability_data = await fetchAvailability(mentorID);
      const set = [];
      if (availability_data) {
        const availability = availability_data.availability;
        availability.forEach((time) => {
          if (
            !saved.hasOwnProperty(moment.parseZone(time.start_time.$date)) &&
            !set.hasOwnProperty(time.start_time.$date)
          ) {
            set[
              moment.parseZone(time.start_time.$date).format("YYYY-MM-DD")
            ] = true;
          }
        });
      }
      setSaved(set);
    }
    getSetDays();
  }, [timeSlots]);

  async function getAvailability() {
    const availability_data = await fetchAvailability(mentorID);
    if (availability_data) {
      const availability = availability_data.availability;
      const times = [];

      for (let i = 0; i < availability.length; i++) {
        times.push([
          moment.parseZone(availability[i].start_time.$date),
          moment.parseZone(availability[i].end_time.$date),
        ]);
      }

      setTimeSlots(times);
      console.log(timeSlots);
    }
  }

  const handleTimeChange = (index, event, num) => {
    const times = [...timeSlots];
    times[index][num] = moment(
      date.format("YYYY-MM-DD") + " " + event.target.value
    );
    setTimeSlots(times);
  };

  const addTimeSlots = () => {
    const times = [...timeSlots];
    times.push([
      moment(date.format("YYYY-MM-DD")),
      moment(date.format("YYYY-MM-DD")),
    ]);
    setTimeSlots(times);
  };

  const removeTimeSlots = (index) => {
    const times = [...timeSlots];
    times.splice(index, 1);
    setTimeSlots(times);
  };

  const onSelect = (value) => {
    setValue(value);
    setVisible(true);
    setDate(value);
    getAvailability();
  };

  const handleOk = () => {
    let json_data = [];
    timeSlots.map((timeSlot) =>
      json_data.push({
        start_time: { $date: moment.parseZone(timeSlot[0].format(format)) },
        end_time: { $date: moment.parseZone(timeSlot[1].format(format)) },
      })
    );
    timeSlots.map((timeSlot) =>
      console.log(
        moment.parseZone(timeSlot[0].format(format)).utc(true).format(format)
      )
    );

    timeSlots.map((timeSlot) =>
      console.log(
        moment.parseZone(timeSlot[1].format(format)).utc(true).format(format)
      )
    );

    editAvailability(json_data, mentorID);
    setVisible(false);
  };

  const handleCancel = () => {
    setVisible(false);
  };
  const handleClear = () => {
    let cleared = timeSlots.filter(function (value, index, arr) {
      return !(value[0].format("YYYY-MM-DD") === date.format("YYYY-MM-DD"));
    });
    setTimeSlots(cleared);
  };

  const getListData = (value) => {
    if (saved[value.format("YYYY-MM-DD")]) {
      return [{ content: "test" }];
    } else {
      return [];
    }
  };

  const getTimeSlots = (day) => {
    let returnSlots = [];
    for (let i = 0; i < timeSlots.length; i++) {
      if (day === timeSlots[i][0].format("YYYY-MM-DD")) {
        returnSlots.push(timeSlots[i]);
      }
    }
    return returnSlots;
  };
  const monthCellRender = (value) => {};

  const dateCellRender = (value) => {
    const listData = getListData(value);

    return (
      <ul className="status">
        {listData.map((item) => (
          <li key={item.content}>
            <Badge status="success" />
          </li>
        ))}
      </ul>
    );
  };
  return (
    <>
      <Calendar
        value={value}
        onPanelChange={(value) => setValue(value)}
        onSelect={onSelect}
        dateCellRender={dateCellRender}
        monthCellRender={monthCellRender}
      />
      <Modal
        title="Select times for each available session per day"
        visible={visible}
        onCancel={handleCancel}
        footer={[
          <MenteeButton
            key="clear"
            type="back"
            onClick={handleClear}
            content="Clear all"
          />,
          <MenteeButton
            key="save"
            type="primary"
            onClick={handleOk}
            content="Save"
          />,
        ]}
      >
        <div className="date-header">
          <h2 className="date">{date && date.format("MM/DD")} </h2>
          <h5 className="date">{days[date.day()]}</h5>
        </div>
        {getTimeSlots(date.format("YYYY-MM-DD")).map((timeSlot, index) => (
          <Fragment key={`${index}`}>
            <div className="timeslot-wrapper">
              <TextField
                value={timeSlot[0].format("HH:mm")}
                onChange={(event) => handleTimeChange(index, event, 0)}
                className="timeslot"
                type="time"
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  step: 300,
                }}
              />
              <h1 className="timeslot"> - </h1>
              <TextField
                value={timeSlot[1].format("HH:mm")}
                onChange={(event) => handleTimeChange(index, event, 1)}
                className="timeslots"
                type="time"
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  step: 300,
                }}
              />
              <CloseOutlined
                className="close-icon"
                onClick={() => removeTimeSlots(index)}
              />
            </div>
          </Fragment>
        ))}
        <div className="add-times">
          <MenteeButton onClick={addTimeSlots} content="Add hours" />
        </div>
      </Modal>
    </>
  );
}

export default AvailabilityCalendar;
