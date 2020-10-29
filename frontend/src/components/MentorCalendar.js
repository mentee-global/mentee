import React, { useState } from "react";
import moment from 'moment';
import { Calendar, Card, Typography, Space } from "antd";
import "antd/dist/antd.css";
import "./css/MentorCalendar.scss";
const {Text} = Typography;




function MentorCalendar() {
    var days = ['Sunday','Monday','Tuesday','Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const [date, setDate] = useState(moment());
    const [value, setValue] = useState(moment());
    

    const sampleJSON = {
                        'date': '2020-02-24',
                        'mentee' : "John Smith", 
                        'timeslot': "12-1PM", 
                        'description':"Programming session"
    };

    const sampleJSON1= {
        'date': '2020-03-10',
        'mentee': 'Jane Doe',
        'timeslot': '12-1PM',
        'description': "more programming"
    }


    const [events, setEvents] = useState([sampleJSON, sampleJSON, sampleJSON1]);
    const [dayevents, setDayEvents] = useState([])
    const onSelect = value => {
        setDayEvents([]);
        for(const element of events) {
            if (element.date == value.format("YYYY-MM-DD")) {
                setDayEvents(oldEvents => [...oldEvents, element])
            }
        }
        
        setDate(value);
        setValue(value);
    }
    return (
        <div className="mentor-portal-calendar">
            <Calendar value = { value } fullscreen={false} onPanelChange={(value) => setValue(value)} onSelect={onSelect}/>
            <div className="view-events">
                <h4 id="event-header">{ date && date.format('MM/DD')} <span id="day-color"> {" " + days[date.day()]}</span></h4>
                {dayevents.map((data, key) => {
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
                <Card>
                    <Text className="italics" id="day-color" strong>You have no other appointments</Text>
                </Card>
            </div>
        </div>
    );

};

const EventCard = ({mentee, timeslot, description}) =>  {
    return (
        <div>
            <Card id="events" style={{width: 300}}>
                <Space direction="vertical">
                <Text strong>{mentee}</Text>
                <Text type="secondary">{timeslot}</Text>
                <Text type="secondary">{description}</Text>
                </Space>               
            </Card>
        </div>
    );
}

export default MentorCalendar;