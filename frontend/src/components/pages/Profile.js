import React from "react";
import { Link } from "react-router-dom";

function Profile() {
  return (
    <div>
      <header>
        <p>This is the profile page</p>
        <Link to="/appointments">Appointments Page</Link>
      </header>
    </div>
  );
}

export default Profile;
