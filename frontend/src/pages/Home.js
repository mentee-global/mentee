import React from "react";
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div>
      <header>
        <p>
          This is the home page. Playing around with React router.
        </p>
        <Link to="/appointments">Appointments Page</Link>
      </header>
    </div>
  );
}

export default Home;
