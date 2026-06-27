import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import SuperAdmin from './pages/SuperAdmin';
import OrgAdmin from './pages/OrgAdmin';
import RegisterOrg from './pages/RegisterOrg';

import Landing from './pages/Landing';
import About from './pages/About';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register-org" element={<RegisterOrg />} />
        <Route path="/super-admin" element={<SuperAdmin />} />
        <Route path="/org-admin" element={<OrgAdmin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
