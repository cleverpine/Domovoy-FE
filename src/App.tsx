import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import HomePage from "./components/HomePage";
import { LoginPage } from './components/LoginPage';

const App = () => {
    const token = sessionStorage.getItem('token');
    const isAuthenticated = !!token;

    return (
        <Router>
            <Routes>
                <Route
                    path="/login"
                    element={isAuthenticated ? <Navigate to="/home" /> : <LoginPage />} />
                <Route
                    path="/home"
                    element={<HomePage />} />
                <Route
                    path="*"
                    element={<Navigate to={isAuthenticated ? "/home" : "/login"} />} />
            </Routes>
        </Router>);
};

export default App;
