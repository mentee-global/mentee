import React from "react";
import { Link } from "react-router-dom";

function Videos() {
  return (
    <div>
      <header>
        <p>This is the videos page</p>
        <Link to="/appointments">Appointments Page</Link>
      </header>
    </div>
  );
}

export default Videos;
