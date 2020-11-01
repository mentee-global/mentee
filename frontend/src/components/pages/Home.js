import React from "react";
import { NavLink } from "react-router-dom";

function Home() {
  return (
    <div>
      Home
      <br />
      <NavLink to="/profile">Mentor Portal</NavLink>
    </div>
  );
}

export default Home;
