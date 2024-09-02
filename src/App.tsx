import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import HomePage from "./components/HomePage";
import { LoginPage } from './components/LoginPage';
console.log(localStorage);
const ProtHome = () => {
    const token = localStorage.getItem('token');
    const isAuthenticated = !!token; 

    return isAuthenticated ? <HomePage /> : <Navigate to="/login" />;
};

const App = () => {
    const token = localStorage.getItem('token');
    const isAuthenticated = !!token;

    return (
        <Router>
            <Routes>
                <Route 
                    path="/login" 
                    element={isAuthenticated ? <Navigate to="/home" /> : <LoginPage />}/>
                <Route 
                    path= "/home"  
                    element={<ProtHome/>}/>
                <Route 
                    path="*" 
                    element={isAuthenticated ? <Navigate to="/home" /> : <Navigate to="/login" />}/>
            </Routes>
        </Router>);};

export default App;
