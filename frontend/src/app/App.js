import React from "react";
import { Route, BrowserRouter as Router, Redirect } from "react-router-dom";
import { Layout } from "antd";
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
import AdminLogin from "components/pages/AdminLogin";
import Register from "components/pages/Register";
import Verify from "components/pages/Verify";
import RegisterForm from "components/pages/MentorProfileForm";
import ForgotPassword from "components/pages/ForgotPassword";
import ApplicationOrganizer from "components/pages/ApplicationOrganizer";
import AdminAccountData from "components/pages/AdminAccountData";
import MentorApplication from "components/pages/MentorApplication";
import AdminAppointmentData from "components/pages/AdminAppointmentData";
import AdminVerifiedEmails from "components/pages/AdminVerifiedEmails";
import MenteeGallery from "components/pages/MenteeGallery";
import NotFound from "components/pages/NotFound";
import NavHeader from "components/NavHeader";
import { ACCOUNT_TYPE } from "utils/consts";
import Messages from "components/pages/Messages";
import Apply from "../components/pages/Apply";
import "components/css/Navigation.scss";
import SocketComponent from "components/SocketComponent";
import MentorProfileForm from "components/pages/MentorProfileForm";
import { Trainings } from "components/Trainings";
import { AdminMessages } from "components/pages/AdminSeeMessages";
import PartnerGallery from "components/pages/PartnerGallery";

function App() {
  return (
    <Router>
      <NavHeader />
      <SocketComponent />
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
        path="/partner-gallery"
        exact
        component={() => (
          <Navigation content={<PartnerGallery />} needsAuth={false} />
        )}
      />

      <Route
        path="/application-page"
        exact
        component={() => <Navigation content={<Apply />} needsAuth={false} />}
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
        path="/login"
        component={() => <Navigation content={<Login />} needsAuth={false} />}
      />
      <Route
        path="/admin"
        component={() => (
          <Navigation content={<AdminLogin />} needsAuth={false} />
        )}
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
        path="/organizer"
        component={() => (
          <Navigation
            content={<ApplicationOrganizer isMentor={true} />}
            needsAuth={true}
            page="applications"
          />
        )}
      />
      <Route
        path="/menteeOrganizer"
        component={() => (
          <Navigation
            content={<ApplicationOrganizer isMentor={false} />}
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
        path="/trainings"
        component={() => (
          <Navigation
            content={<Trainings />}
            needsAuth={true}
            page="trainings"
          />
        )}
      />
      <Route
        path="/messages-details"
        component={() => (
          <Navigation
            content={<AdminMessages />}
            needsAuth={true}
            page="messages"
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
      {/* <Route
        path="/messages"
        component={() => (
          <Navigation content={<Messages />} page="messages" needsAuth={true} ignoreSidebar={true} />
        )}
      /> */}
      <Route
        path="/messages/:receiverId"
        component={() => (
          <Navigation
            content={<Messages />}
            page="messages"
            needsAuth={true}
            ignoreSidebar={true}
          />
        )}
      />
    </Router>
  );
}

export default App;
