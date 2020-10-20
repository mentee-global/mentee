import React, { useState } from "react";
import moment from 'moment';
import { Calendar, Card } from "antd";
import "antd/dist/antd.css";
import "./css/MentorCalendar.scss";





function MentorCalendar() {
    const [date, setDate] = useState(moment('2017-01-25'));
    const [value, setValue] = useState(moment('2017-01-25'));
    

    const sampleJSON = {
                        'mentee' : "John Doe", 
                        'timeslot': "12-1PM", 
                        'description':"Programming session"
    };
    const [events, setEvents] = useState([sampleJSON, sampleJSON]);
    const onSelect = value => {
        setDate(value);
        setValue(value);
    }
    return (
        <div className="mentor-portal-calendar">
            <Calendar value = { value } fullscreen={false} onPanelChange={(value) => setValue(value)} onSelect={onSelect}/>
            <div className="view-events">
                <h2>{ date && date.format('MM/DD') }</h2>
                {events.map((data, key) => {
                    return (
                        <div key={key}>
                            <EventCard
                                key = {key}
                                mentee = {data.mentee}
                                timeslot = {data.timeslot}
                                description = {data.description}
                           />
                        </div>
                    );
                })}
            </div>
        </div>
    );

};

const EventCard = ({mentee, timeslot, description}) =>  {
    return (
        <div>
            <Card style={{width: 300}}>
                <p><strong>{mentee}</strong></p>
                <p className="light">{timeslot}</p>
                <p className="light">{description}</p>
            </Card>
        </div>
    );
}

export default MentorCalendar;