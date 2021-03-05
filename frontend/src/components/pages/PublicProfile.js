import React, { useEffect, useState } from "react";
import { UserOutlined } from "@ant-design/icons";
import { Avatar } from "antd";

import ProfileContent from "../ProfileContent";
import ProfileVideos from "../ProfileVideos";
import { fetchMentorByID } from "../../utils/apiHelper";

import "../css/PublicProfile.scss";

function PublicProfile(props) {
  const [mentor, setMentor] = useState({});
  const [updateContent, setUpdateContent] = useState(false);

  useEffect(() => {
    async function getMentor() {
      const mentor_data = await fetchMentorByID(props.id);
      if (mentor_data) {
        setMentor(mentor_data);
      }
    }
    getMentor();
  }, [updateContent, props.id]);

  const handleUpdateMentor = () => {
    setUpdateContent(!updateContent);
  };

  return (
    <div className="mentor-profile-flexbox">
      <div className="mentor-profile-content-public">
        <Avatar
          size={120}
          src={mentor.image && mentor.image.url}
          icon={<UserOutlined />}
        />
        <ProfileContent
          mentor={mentor}
          id={props.id}
          handleUpdateMentor={handleUpdateMentor}
        />
      </div>
      <div className="mentor-profile-videos">
        <ProfileVideos videos={mentor.videos} />
      </div>
    </div>
  );
}

export default PublicProfile;
