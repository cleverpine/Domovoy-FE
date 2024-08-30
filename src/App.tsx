import { useMsal } from '@azure/msal-react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import HomePage from "./components/HomePage";
import { LoginPage } from './components/LoginPage';

const App = () => {
    const { accounts } = useMsal();

    return (
        <Router>
            <Routes>
                <Route 
                    path="/login" 
                    element={
                        accounts.length > 0 ? <Navigate to="/home" /> : <LoginPage />
                    } 
                />
                <Route 
                    path="/home" 
                    element={
                        accounts.length > 0 ? <HomePage /> : <Navigate to="/login" />
                    } 
                />
                <Route 
                    path="*" 
                    element={
                        accounts.length > 0 ? <Navigate to="/home" /> : <Navigate to="/login" />
                    } 
                />
            </Routes>
        </Router>
    );
};

export default App;
