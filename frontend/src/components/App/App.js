import React from "react";
import { Route, BrowserRouter as Router } from "react-router-dom";
import Appointments from "components/pages/Appointments";
import Home from "components/pages/Home";
import Videos from "components/pages/Videos";
import Profile from "components/pages/Profile";
import Navigation from "components/Navigation";
import Gallery from "components/pages/Gallery";

function App() {
  return (
    <Router>
      <Route
        path="/"
        exact
        component={() => (
          <Navigation content={<Home />} page="home" needsAuth={false} />
        )}
      />
      <Route
        path="/appointments"
        component={() => (
          <Navigation
            content={<Appointments />}
            page="appointments"
            needsAuth={true}
          />
        )}
      />
      <Route
        path="/videos"
        component={() => (
          <Navigation content={<Videos />} page="videos" needsAuth={true} />
        )}
      />
      <Route
        path="/profile"
        component={() => (
          <Navigation content={<Profile />} page="profile" needsAuth={true} />
        )}
      />
      <Route
        path="/gallery"
        component={() => (
          <Navigation
            content={<Gallery />}
            page="gallery"
            needsAuth={false}
          />
        )}
      />
    </Router>
  );
}

export default App;
