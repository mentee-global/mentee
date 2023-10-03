import React, { useEffect, useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { Layout, ConfigProvider } from "antd";
import { useTranslation } from "react-i18next";
import { getAntdLocale } from "utils/translations";
import Appointments from "components/pages/Appointments";
import MenteeAppointments from "components/pages/MenteeAppointments";
import Videos from "components/pages/Videos";
import Profile from "components/pages/Profile";
import Gallery from "components/pages/Gallery";
import PublicProfile from "components/pages/PublicProfile";
import NewTrainingConfirm from "components/pages/NewTrainingConfirm";
import Login from "components/pages/Login";
import AdminLogin from "components/pages/AdminLogin";
import ForgotPassword from "components/pages/ForgotPassword";
import ApplicationOrganizer from "components/pages/ApplicationOrganizer";
import AdminAccountData from "components/pages/AdminAccountData";
import AdminAppointmentData from "components/pages/AdminAppointmentData";
import AdminVerifiedEmails from "components/pages/AdminVerifiedEmails";
import MenteeGallery from "components/pages/MenteeGallery";
import Messages from "components/pages/Messages";
import ApplicationForm from "components/pages/ApplicationForm";
import SocketComponent from "components/SocketComponent";
import AdminTraining from "components/pages/AdminTraining";
import EventDetail from "components/pages/EventDetail";
import { Languages } from "components/Languages";
import { Specializations } from "components/Specializations";
import { AdminMessages } from "components/pages/AdminSeeMessages";
import PartnerGallery from "components/pages/PartnerGallery";
import NavigationHeader from "components/NavigationHeader";
import NavigationSider from "components/NavigationSider";
import Initiator from "components/Initiator";
import PrivateRoute from "components/PrivateRoute";
import HomeLayout from "components/pages/HomeLayout";
import Home from "components/pages/Home";
import Apply from "components/pages/Apply";
import { getRole } from "utils/auth.service";
import PublicRoute from "components/PublicRoute";
import Training from "components/pages/Training";
import BuildProfile from "components/pages/BuildProfile";
import Events from "components/pages/Events";
import { useSelector } from "react-redux";

const { Content } = Layout;

function App() {
  const { i18n } = useTranslation();
  const [antdLocale, setAntdLocale] = useState(getAntdLocale(i18n.language));
  const { user } = useSelector((state) => state.user);
  const [role, setRole] = useState(getRole());

  // TODO: Remove this when we have a proper solution for this
  // some kind of cached method of updating on login status change
  useEffect(() => {
    setRole(getRole());
  }, [user]);

  useEffect(() => {
    setAntdLocale(getAntdLocale(i18n.language));
  }, [i18n.language]);

  return (
    <ConfigProvider
      locale={antdLocale}
      // TODO: Move this to a theme file
      theme={{
        token: {
          colorPrimary: "#800020",
          colorBgLayout: "#ffffff",
        },
      }}
    >
      <Router>
        <SocketComponent />
        <Initiator />
        <Layout hasSider>
          {role && <NavigationSider />}
          <Content>
            {role && <NavigationHeader />}
            <HomeLayout ignoreHomeLayout={role}>
              <PublicRoute exact path="/">
                <Home />
              </PublicRoute>
              <PublicRoute path="/login">
                <Login />
              </PublicRoute>
              <PublicRoute path="/admin">
                <AdminLogin />
              </PublicRoute>
              <PublicRoute path="/apply">
                <Apply />
              </PublicRoute>
              <PublicRoute path="/application-form">
                <ApplicationForm />
              </PublicRoute>
              <PublicRoute path="/application-training">
                <Training />
              </PublicRoute>
              <PublicRoute path="/build-profile">
                <BuildProfile />
              </PublicRoute>
              <PublicRoute path="/forgot-password">
                <ForgotPassword />
              </PublicRoute>
            </HomeLayout>
            <PrivateRoute path="/appointments">
              <Appointments />
            </PrivateRoute>
            <PrivateRoute path="/mentee-appointments">
              <MenteeAppointments />
            </PrivateRoute>
            <PrivateRoute path="/videos">
              <Videos />
            </PrivateRoute>
            <PrivateRoute path="/profile">
              <Profile />
            </PrivateRoute>
            <PrivateRoute path="/gallery" exact>
              <Gallery />
            </PrivateRoute>
            <PrivateRoute path="/partner-gallery" exact>
              <PartnerGallery />
            </PrivateRoute>
            <PrivateRoute path="/mentee-gallery" exact>
              <MenteeGallery />
            </PrivateRoute>
            <PrivateRoute path="/gallery/:type/:id">
              <PublicProfile />
            </PrivateRoute>
            <PrivateRoute path="/new_training/:type/:id">
              <NewTrainingConfirm />
            </PrivateRoute>
            <PrivateRoute path="/organizer">
              <ApplicationOrganizer isMentor={true} />
            </PrivateRoute>
            <PrivateRoute path="/menteeOrganizer">
              <ApplicationOrganizer isMentor={false} />
            </PrivateRoute>
            <PrivateRoute path="/account-data">
              <AdminAccountData />
            </PrivateRoute>
            <PrivateRoute path="/all-appointments">
              <AdminAppointmentData />
            </PrivateRoute>
            <PrivateRoute path="/admin-training">
              <AdminTraining />
            </PrivateRoute>
            <PrivateRoute path="/languages">
              <Languages />
            </PrivateRoute>
            <PrivateRoute path="/specializations">
              <Specializations />
            </PrivateRoute>
            <PrivateRoute path="/messages-details">
              <AdminMessages />
            </PrivateRoute>
            <PrivateRoute path="/verified-emails">
              <AdminVerifiedEmails />
            </PrivateRoute>
            <PrivateRoute path="/messages/:receiverId">
              <Messages />
            </PrivateRoute>
            <PrivateRoute path="/events">
              <Events />
            </PrivateRoute>
            <PrivateRoute path="/event/:id">
              <EventDetail />
            </PrivateRoute>
          </Content>
        </Layout>
      </Router>
    </ConfigProvider>
  );
}

export default App;
