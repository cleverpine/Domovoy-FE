import { useMsal } from '@azure/msal-react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import HomePage from "./components/HomePage";
import { LoginPage } from "./components/LoginPage";

const App = () => {
  const { accounts } = useMsal();

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            accounts.length > 0 ? (
              <HomePage />
            ) : (
              <LoginPage />
            )
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
