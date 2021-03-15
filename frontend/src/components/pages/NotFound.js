import React from "react";
import { Link } from "react-router-dom";

import "../css/NotFound.scss";

import Puppy from "../../resources/puppy.png";

const NotFound = () => (
  <div class="background-color-strip">
    <div className="page-content">
      <img src={Puppy} alt="puppy" className="puppy-logo" />
      <h1>Uhh ohh page can't be found</h1>
      <Link to="/">Go Home</Link>
    </div>
  </div>
);

export default NotFound;
