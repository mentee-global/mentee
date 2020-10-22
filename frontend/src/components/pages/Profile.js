import React from "react";
import { Link } from "react-router-dom";
import { UserOutlined } from "@ant-design/icons";

import "../css/Profile.scss";

function Profile() {
  return (
      <div className="background-color-strip">
        {/* <div className="profile-content"> */}
            <UserOutlined style={{ fontSize: "100px" }} />
        {/* </div> */}
    </div>
  );
}

export default Profile;
