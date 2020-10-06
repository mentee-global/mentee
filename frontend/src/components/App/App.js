import React from "react";
import {Route, BrowserRouter as Router} from 'react-router-dom';
import Appointments from 'pages/Appointments';
import Home from 'pages/Home';

function App() {
  return (
    <>
      <Router>
        <Route path="/" exact component={Home} />
        <Route path="/appointments" component={Appointments} />
      </Router>
    </>
  );
}

export default App;
