import React, { useEffect } from "react";
import { Route, BrowserRouter as Router } from "react-router-dom";
import Appointments from "components/pages/Appointments";
import MenteeAppointments from "components/pages/MenteeAppointments";
import Home from "components/pages/Home";
import Videos from "components/pages/Videos";
import Profile from "components/pages/Profile";
import Navigation from "components/Navigation";
import Gallery from "components/pages/Gallery";
import PublicProfile from "components/pages/PublicProfile";
import NewTrainingConfirm from "components/pages/NewTrainingConfirm";
import Login from "components/pages/Login";
import AdminLogin from "components/pages/AdminLogin";
import GuestLogin from "components/pages/GuestLogin";
import Register from "components/pages/Register";
import Verify from "components/pages/Verify";
import ForgotPassword from "components/pages/ForgotPassword";
import ApplicationOrganizer from "components/pages/ApplicationOrganizer";
import AdminAccountData from "components/pages/AdminAccountData";
import AdminAppointmentData from "components/pages/AdminAppointmentData";
import AdminVerifiedEmails from "components/pages/AdminVerifiedEmails";
import MenteeGallery from "components/pages/MenteeGallery";
import NotFound from "components/pages/NotFound";
import NavHeader from "components/NavHeader";
import Messages from "components/pages/Messages";
import Apply from "../components/pages/Apply";
import "components/css/Navigation.scss";
import SocketComponent from "components/SocketComponent";
import { Trainings } from "components/Trainings";
import { Languages } from "components/Languages";
import { Specializations } from "components/Specializations";
import { AdminMessages } from "components/pages/AdminSeeMessages";
import PartnerGallery from "components/pages/PartnerGallery";
import { ProvideAuth } from "utils/hooks/useAuth";
import { ConfigProvider } from "antd";
import { useTranslation } from "react-i18next";
import { getAntdLocale } from "utils/translations";

function App() {
  const { i18n } = useTranslation();
  const [antdLocale, setAntdLocale] = React.useState(
    getAntdLocale(i18n.language)
  );

  useEffect(() => {
    setAntdLocale(getAntdLocale(i18n.language));
  }, [i18n.language]);

  return (
    <ProvideAuth>
      <ConfigProvider locale={antdLocale}>
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
              <Navigation
                content={<Profile />}
                page="profile"
                needsAuth={true}
              />
            )}
          />
          <Route
            path="/gallery"
            exact
            component={() => (
              <Navigation content={<Gallery />} needsAuth={false} />
            )}
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
            component={() => (
              <Navigation content={<Apply />} needsAuth={false} />
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
            path="/new_training/:type/:id"
            component={(props) => (
              <Navigation
                content={
                  <NewTrainingConfirm
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
            component={() => (
              <Navigation content={<Login />} needsAuth={false} />
            )}
          />
          <Route
            path="/admin"
            component={() => (
              <Navigation content={<AdminLogin />} needsAuth={false} />
            )}
          />
          <Route
            path="/readonly"
            component={() => (
              <Navigation content={<GuestLogin />} needsAuth={false} />
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
            component={() => (
              <Navigation content={<Verify />} needsAuth={false} />
            )}
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
            path="/languages"
            component={() => (
              <Navigation
                content={<Languages />}
                needsAuth={true}
                page="languages"
              />
            )}
          />
          <Route
            path="/specializations"
            component={() => (
              <Navigation
                content={<Specializations />}
                needsAuth={true}
                page="specializations"
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
      </ConfigProvider>
    </ProvideAuth>
  );
}

export default App;
