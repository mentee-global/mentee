import React, { useEffect, useState } from "react";
import { UserOutlined } from "@ant-design/icons";
import { Avatar } from "antd";
import ProfileContent from "../ProfileContent";

import "../css/Profile.scss";
import { fetchMentorByID } from "../../utils/api";

function PublicProfile(props) {
  const [mentor, setMentor] = useState({});

  useEffect(() => {
    async function getMentor() {
      const mentor_data = await fetchMentorByID(props.id);
      if (mentor_data) {
        setMentor(mentor_data);
      }
    }
    getMentor();
  }, []);

  return (
    <div className="background-color-strip">
      <div className="mentor-profile-content">
        <Avatar size={120} src={mentor.picture} icon={<UserOutlined />} />
        <div className="mentor-profile-content-flexbox">
          <ProfileContent mentor={mentor} />
          <div>videos go here</div>
        </div>
      </div>
    </div>
  );
}

export default PublicProfile;
