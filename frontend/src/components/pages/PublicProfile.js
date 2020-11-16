import React, { useEffect, useState } from "react";
import { UserOutlined } from "@ant-design/icons";
import { Avatar } from "antd";

import ProfileContent from "../ProfileContent";
import ProfileVideos from "../ProfileVideos";
import { fetchMentorByID } from "../../utils/api";

import "../css/PublicProfile.scss";

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
  }, [props.id]);

  return (
    <div className="mentor-profile-flexbox">
      <div className="mentor-profile-content-public">
        <Avatar
          size={120}
          src={mentor.image && mentor.image.url}
          icon={<UserOutlined />}
        />
        <ProfileContent mentor={mentor} />
      </div>
      <div className="mentor-profile-videos">
        <ProfileVideos mentor={mentor} />
      </div>
    </div>
  );
}

export default PublicProfile;
