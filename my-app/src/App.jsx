// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/login";
import Homepage from "./components/Homepage";
import Admin from "./components/admin";
import ReplaceData from "./components/ReplaceData";
import ManageEmployees from "./components/ManageEmployees";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/homepage" element={<Homepage />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/replace-data" element={<ReplaceData />} /> 
                <Route path="/manage-employees" element={<ManageEmployees />} />
            </Routes>
        </BrowserRouter>
    );
}
