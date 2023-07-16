import React, { useEffect, useState } from "react";
import { Route, BrowserRouter as Router } from "react-router-dom";
import { ProvideAuth } from "utils/hooks/useAuth";
import { ConfigProvider, Layout } from "antd";
import { useTranslation } from "react-i18next";
import { getAntdLocale } from "utils/translations";
import Appointments from "components/pages/Appointments";
import MenteeAppointments from "components/pages/MenteeAppointments";
import HomeRemove from "components/pages/HomeRemove";
import Videos from "components/pages/Videos";
import Profile from "components/pages/Profile";
import Gallery from "components/pages/Gallery";
import PublicProfile from "components/pages/PublicProfile";
import NewTrainingConfirm from "components/pages/NewTrainingConfirm";
import Home from "components/pages/Home";
import AdminLogin from "components/pages/AdminLogin";
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
import NavigationHeader from "components/NavigationHeader";
import NavigationSider from "components/NavigationSider";
import Initiator from "components/Initiator";
import { useSelector } from "react-redux";
import PrivateRoute from "components/PrivateRoute";

const { Content } = Layout;

function App() {
  const { i18n } = useTranslation();
  const [antdLocale, setAntdLocale] = useState(getAntdLocale(i18n.language));
  const { user } = useSelector((state) => state.user);

  useEffect(() => {
    setAntdLocale(getAntdLocale(i18n.language));
  }, [i18n.language]);

  return (
    <ProvideAuth>
      <ConfigProvider
        locale={antdLocale}
        theme={{
          token: {
            colorPrimary: "#f57600",
          },
        }}
      >
        <Router>
          <SocketComponent />
          <Initiator />
          <Layout hasSider>
            {user && <NavigationSider />}
            <Content>
              {user && <NavigationHeader />}
              <Route exact path="/" component={() => <Home />} />
              <Route path="/admin" component={() => <AdminLogin />} />
              <Route path="/register" component={() => <Register />} />
              <Route path="/verify" component={() => <Verify />} />
              <Route
                path="/forgot-password"
                component={() => <ForgotPassword />}
              />
              <Route path="/not-found" component={() => <NotFound />} />
              <PrivateRoute
                path="/appointments"
                component={() => <Appointments />}
              />
              <PrivateRoute
                path="/mentee-appointments"
                component={() => <MenteeAppointments />}
              />
              <PrivateRoute path="/videos" component={() => <Videos />} />
              <PrivateRoute path="/profile" component={() => <Profile />} />
              <PrivateRoute
                path="/gallery"
                exact
                component={() => <Gallery />}
              />
              <PrivateRoute
                path="/partner-gallery"
                exact
                component={() => <PartnerGallery />}
              />

              <PrivateRoute
                path="/application-page"
                exact
                component={() => <Apply />}
              />

              <PrivateRoute
                path="/mentee-gallery"
                exact
                component={() => <MenteeGallery />}
              />

              <PrivateRoute
                path="/gallery/:type/:id"
                component={(props) => (
                  <PublicProfile
                    id={props.match.params.id}
                    accountType={props.match.params.type}
                  />
                )}
              />
              <PrivateRoute
                path="/new_training/:type/:id"
                component={(props) => (
                  <NewTrainingConfirm
                    id={props.match.params.id}
                    accountType={props.match.params.type}
                  />
                )}
              />
              <PrivateRoute
                path="/organizer"
                component={() => <ApplicationOrganizer isMentor={true} />}
              />
              <PrivateRoute
                path="/menteeOrganizer"
                component={() => <ApplicationOrganizer isMentor={false} />}
              />
              <PrivateRoute
                path="/account-data"
                component={() => <AdminAccountData />}
              />
              <PrivateRoute
                path="/all-appointments"
                component={() => <AdminAppointmentData />}
              />
              <PrivateRoute path="/trainings" component={() => <Trainings />} />
              <PrivateRoute path="/languages" component={() => <Languages />} />
              <PrivateRoute
                path="/specializations"
                component={() => <Specializations />}
              />
              <PrivateRoute
                path="/messages-details"
                component={() => <AdminMessages />}
              />
              <PrivateRoute
                path="/verified-emails"
                component={() => <AdminVerifiedEmails />}
              />
              {/* <PrivateRoute path="/messages" component={() => <Messages />} /> */}
              <PrivateRoute
                path="/messages/:receiverId"
                component={() => <Messages />}
              />
            </Content>
          </Layout>
        </Router>
      </ConfigProvider>
    </ProvideAuth>
  );
}

export default App;
