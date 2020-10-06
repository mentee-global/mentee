import React from "react";
import { Link } from "react-router-dom";

function Appointments() {
  return (
    <div>
      <header>
        <p>This is the appointments page</p>
        <Link to="/">Back to Home</Link>
      </header>
    </div>
  );
}

export default Appointments;
