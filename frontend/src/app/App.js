import React from "react";
import { Route, BrowserRouter as Router, Redirect } from "react-router-dom";
import Appointments from "components/pages/Appointments";
import MenteeAppointments from "components/pages/MenteeAppointments";
import Home from "components/pages/Home";
import Videos from "components/pages/Videos";
import Profile from "components/pages/Profile";
import Navigation from "components/Navigation";
import Gallery from "components/pages/Gallery";
import PublicProfile from "components/pages/PublicProfile";
import SelectLogin from "components/pages/SelectLogin";
import Login from "components/pages/Login";
import Register from "components/pages/Register";
import Verify from "components/pages/Verify";
import RegisterForm from "components/pages/RegisterForm";
import ForgotPassword from "components/pages/ForgotPassword";
import ApplicationOrganizer from "components/pages/ApplicationOrganizer";
import AdminAccountData from "components/pages/AdminAccountData";
import MentorApplication from "components/pages/MentorApplication";
import AdminAppointmentData from "components/pages/AdminAppointmentData";
import AdminVerifiedEmails from "components/pages/AdminVerifiedEmails";
import MenteeGallery from "components/pages/MenteeGallery";
import NotFound from "components/pages/NotFound";
import MenteeRegisterForm from "components/pages/MenteeRegisterForm";
import { ACCOUNT_TYPE } from "utils/consts";

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
        path="/mentee-appointments"
        component={() => (
          <Navigation
            content={<MenteeAppointments />}
            page="mentee-appointments"
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
        path="/application-page"
        exact
        component={() => (
          <Navigation content={<MentorApplication />} needsAuth={false} />
        )}
      />

      <Route
        path="/mentee-gallery"
        exact
        component={() => (
          <Navigation content={<MenteeGallery />} needsAuth={false} />
        )}
      />

      <Route
        path="/gallery/:type/:id"
        component={(props) => (
          <Navigation
            content={
              <PublicProfile
                id={props.match.params.id}
                accountType={props.match.params.type}
              />
            }
            needsAuth={false}
          />
        )}
      />
      <Route
        path="/select-login"
        component={() => (
          <Navigation content={<SelectLogin />} needsAuth={false} />
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
        path="/forgot-password"
        component={() => (
          <Navigation content={<ForgotPassword />} needsAuth={false} />
        )}
      />
      <Route
        path="/create-profile/:type"
        component={(props) => {
          const type = parseInt(props.match.params.type, 10);
          return (
            <Navigation
              content={
                type === ACCOUNT_TYPE.MENTOR ? (
                  <RegisterForm />
                ) : type === ACCOUNT_TYPE.MENTEE ? (
                  <MenteeRegisterForm />
                ) : (
                  <Redirect to="/" />
                )
              }
              needsAuth={false}
            />
          );
        }}
      />
      <Route
        path="/organizer"
        component={() => (
          <Navigation
            content={<ApplicationOrganizer />}
            needsAuth={true}
            page="applications"
          />
        )}
      />
      <Route
        path="/account-data"
        component={() => (
          <Navigation
            content={<AdminAccountData />}
            needsAuth={true}
            page="accountData"
          />
        )}
      />
      <Route
        path="/all-appointments"
        component={() => (
          <Navigation
            content={<AdminAppointmentData />}
            needsAuth={true}
            page="allAppointments"
          />
        )}
      />
      <Route
        path="/verified-emails"
        component={() => (
          <Navigation
            content={<AdminVerifiedEmails />}
            needsAuth={true}
            page="verifiedEmails"
          />
        )}
      />
      <Route
        path="/not-found"
        component={() => (
          <Navigation content={<NotFound />} needsAuth={false} />
        )}
      />
    </Router>
  );
}

export default App;
