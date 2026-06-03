// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Homepage from "./components/Homepage";
import Admin from "./components/admin";
import AddData from "./components/AddData";
import ManageEmployees from "./components/ManageEmployees";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/homepage" element={<Homepage />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/add-data" element={<AddData />} /> 
                <Route path="/manage-employees" element={<ManageEmployees />} />
            </Routes>
        </BrowserRouter>
    );
}
