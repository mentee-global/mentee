import React from "react";
import { Route, BrowserRouter as Router } from "react-router-dom";
import Appointments from "components/pages/Appointments";
import Home from "components/pages/Home";
import Videos from "components/pages/Videos";
import Profile from "components/pages/Profile";

function App() {
  return (
    <>
      <Router>
        <Route path="/" exact component={Home} />
        <Route path="/appointments" component={Appointments} />
        <Route path="/videos" component={Videos} />
        <Route path="/profile" component={Profile} />
      </Router>
    </>
  );
}

export default App;
