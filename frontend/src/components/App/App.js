import React from "react";
import { Route, BrowserRouter as Router } from "react-router-dom";
import Appointments from "components/pages/Appointments";
import Home from "components/pages/Home";
import Videos from "components/pages/Videos";
import Profile from "components/pages/Profile";
import Navigation from "components/Navigation";

function App() {
  return (
    <>
      <Router>
        <Route
          path="/"
          exact
          component={() => <Navigation content={<Home />} page="home" />}
        />
        <Route
          path="/appointments"
          component={() => (
            <Navigation content={<Appointments />} page="appointments" />
          )}
        />
        <Route
          path="/videos"
          component={() => <Navigation content={<Videos />} page="videos" />}
        />
        <Route
          path="/profile"
          component={() => <Navigation content={<Profile />} page="profile" />}
        />
      </Router>
    </>
  );
}

export default App;
