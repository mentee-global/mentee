import React from "react";
import { Route, BrowserRouter as Router } from "react-router-dom";
import Appointments from "components/pages/Appointments";
import Home from "components/pages/Home";
import Videos from "components/pages/Videos";
import Profile from "components/pages/Profile";
import Navigation from "components/Navigation";
import Gallery from "components/pages/Gallery";
import PublicProfile from "components/pages/PublicProfile";
import Login from "components/pages/Login";
import Register from "components/pages/Register";
import Verify from "components/pages/Verify";
import RegisterForm from "components/pages/RegisterForm";
import ForgotPassword from "components/pages/ForgotPassword";
import AdminAccountData from "components/pages/AdminAccountData";

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
        exact
        component={() => <Navigation content={<Gallery />} needsAuth={false} />}
      />
      <Route
        path="/gallery/:id"
        component={(props) => (
          <Navigation
            content={<PublicProfile id={props.match.params.id} />}
            needsAuth={false}
          />
        )}
      />
      <Route
        path="/login"
        component={() => <Navigation content={<Login />} needsAuth={false} />}
      />
      <Route
        path="/register"
        component={() => (
          <Navigation content={<Register />} needsAuth={false} />
        )}
      />
      <Route
        path="/verify"
        component={() => <Navigation content={<Verify />} needsAuth={false} />}
      />
      <Route
        path="/forgotPassword"
        component={() => (
          <Navigation content={<ForgotPassword />} needsAuth={false} />
        )}
      />
      <Route
        path="/create-profile"
        component={() => (
          <Navigation content={<RegisterForm />} needsAuth={false} />
        )}
      />
      <Route
        path="/manage-users"
        component={() => <Navigation content={<div />} needsAuth={true} />}
      />
      <Route
        path="/account-data"
        component={() => (
          <Navigation content={<AdminAccountData />} needsAuth={true} />
        )}
      />
      <Route
        path="/all-appointments"
        component={() => <Navigation content={<div />} needsAuth={true} />}
      />
    </Router>
  );
}

export default App;
