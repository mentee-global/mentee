import React, { useState, useEffect, Fragment } from "react";
import moment from "moment";
import { Calendar, Modal, Badge, DatePicker } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import TextField from "@material-ui/core/TextField";
import { Input } from "antd";

import MenteeButton from "./MenteeButton.js";
import "./css/AvailabilityCalendar.scss";
import { getMentorID } from "utils/auth.service";
import { fetchAvailability, editAvailability } from "../utils/api";

/**
 * Moment.js documentation: {@link https://momentjs.com/docs/}
 */
function AvailabilityCalendar() {
  const mentorID = getMentorID();
  const [saved, setSaved] = useState({}); //  Days with set appointments
  const [value, setValue] = useState(moment());
  const [date, setDate] = useState(moment());
  const [visible, setVisible] = useState(false);
  const [lockmodal, setLockModal] = useState(false); // Locks modal when panel changes
  const [timeSlots, setTimeSlots] = useState([]);
  const [trigger, setTrigger] = useState(false); // Trigger for getSetdays UseEffect
  const format = "YYYY-MM-DDTHH:mm:ss.SSSZ";
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone; // Gives timezone of browser

  /**
   * Gets appointments from backend and finds the days in format "YYYY-MM-DD"
   * Changes setDays UseState when trigger variable is changed
   */
  useEffect(() => {
    async function getSetDays() {
      const availability_data = await fetchAvailability(mentorID);
      const set = [];
      if (availability_data) {
        const availability = availability_data.availability;
        availability.forEach((time) => {
          // Checking if saved or set have date already
          if (
            !saved.hasOwnProperty(moment.parseZone(time.start_time.$date)) &&
            !set.hasOwnProperty(time.start_time.$date)
          ) {
            // .format strips data to find just year, month, and day
            set[
              moment.parseZone(time.start_time.$date).format("YYYY-MM-DD")
            ] = true;
          }
        });
      }
      setSaved(set);
    }
    getSetDays();
  }, [trigger]);

  /**
   * Gets availability from backend and changes clientside timeslots
   */
  async function getAvailability() {
    const availability_data = await fetchAvailability(mentorID);
    if (availability_data) {
      const availability = availability_data.availability;
      const times = [];

      availability.forEach((element) => {
        times.push([
          moment.parseZone(element.start_time.$date),
          moment.parseZone(element.end_time.$date),
        ]);
      });

      setTimeSlots(times);
    }
  }

  /**
   * Handles time changes on textfields
   * @param {int} index Which timeSlot was changed
   * @param {String} event User input values
   * @param {int} timeslot Which of the two textfields was changed
   */
  const handleTimeChange = (index, value, timeslot) => {
    let times = [...timeSlots];
    times[index][timeslot] = moment(value);

    //date.format("YYYY-MM-DD") + " " + value
    setTimeSlots(times);
  };

  const addTimeSlots = () => {
    let times = [...timeSlots];
    times.push([
      moment(date.format("YYYY-MM-DD")),
      moment(date.format("YYYY-MM-DD")),
    ]);
    setTimeSlots(times);
  };

  const removeTimeSlots = (index) => {
    let times = [...timeSlots];
    times.splice(index, 1);
    setTimeSlots(times);
  };

  const onPanelChange = (value) => {
    setValue(value);
    setLockModal(true); // Locks modal on panel changes
  };

  /**
   * When a date on calendar is selected open modal
   * @param {String} value Date value from calendar
   */
  const onSelect = (value) => {
    // Workaround that prevents modal from popping up when
    // panels are changed by checking state value of lockmodal
    setLockModal((state) => {
      setDate(value);
      setValue(value);
      getAvailability();
      if (!state) {
        setVisible(true);
      } else {
        setLockModal(false);
      }
      return state;
    });
  };

  async function handleOk() {
    let toSend = [];

    // Fills toSend with current timeSlots
    timeSlots.map((timeSlot) =>
      toSend.push({
        start_time: { $date: moment.parseZone(timeSlot[0].format(format)) },
        end_time: { $date: moment.parseZone(timeSlot[1].format(format)) },
      })
    );

    // Sends toSend to backend to update availability
    await editAvailability(toSend, mentorID);

    // Change trigger to update green dots on calendar
    setTrigger(!trigger);
    setVisible(false);
  }

  // Clears set appointments in modal
  const handleClear = () => {
    // Filters timeSlots for appointments on current day
    let cleared = timeSlots.filter(function (value) {
      return !(value[0].format("YYYY-MM-DD") === date.format("YYYY-MM-DD"));
    });
    setTimeSlots(cleared);
  };

  /**
   * Checks if day in calendar has appointments set
   * @param {moment} value moment value of day
   */
  const getListData = (value) => {
    if (saved[value.format("YYYY-MM-DD")]) {
      return [{ content: "Appointment Set" }];
    } else {
      return [];
    }
  };

  /**
   * Gets timeSlots from a certain day for modal
   * @param {String} day Day to get timeSlots from
   * @return {Array} Timeslots from a specific day
   */
  const getTimeSlots = (day) => {
    let returnSlots = [];
    for (let i = 0; i < timeSlots.length; i++) {
      if (day === timeSlots[i][0].format("YYYY-MM-DD")) {
        returnSlots.push([timeSlots[i], i]);
      }
    }
    return returnSlots;
  };

  /**
   * Renders each cell of calendar
   * @param {moment} value
   * @returns {*} Content of the cell
   */
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
        onPanelChange={onPanelChange}
        onSelect={onSelect}
        dateCellRender={dateCellRender}
      />
      <Modal
        title="Select times for each available session per day"
        visible={visible}
        onCancel={() => setVisible(false)}
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
        <h3 className="hours">
          <b>Hours </b> | <i>{tz.replace("_", " ")}</i>
        </h3>
        <br></br>
        <div className="date-header">
          <h2 className="date">{date && date.format("MM/DD")} </h2>
          <h5 className="date">{date.format("dddd")}</h5>
        </div>
        <div className="all-timeslots-wrapper">
          {getTimeSlots(date.format("YYYY-MM-DD")).map((timeSlot, index) => (
            <Fragment key={`${index}`}>
              <div className="timeslot-wrapper">
                <Input
                  value={timeSlot[0][0].format("HH:mm")}
                  onChange={(event) => handleTimeChange(timeSlot[1], event, 0)}
                />
                <h1 className="timeslot"> - </h1>
                <Input
                  value={timeSlot[0][1].format("HH:mm")}
                  onChange={(event) => handleTimeChange(timeSlot[1], event, 1)}
                />
                <CloseOutlined
                  className="close-icon"
                  onClick={() => removeTimeSlots(timeSlot[1])}
                />
              </div>
            </Fragment>
          ))}
        </div>
        <div className="add-times">
          <MenteeButton onClick={addTimeSlots} content="Add hours" />
        </div>
      </Modal>
    </>
  );
}

export default AvailabilityCalendar;
