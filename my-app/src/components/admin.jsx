// src/components/admin.jsx
import { useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import "../admin.style.css";

export default function Admin() {
    return (
        <div className="wrap">
            <div className="admin-page">
                <h2>Administration</h2>
                <div className="buttons">
                    <button id="add-data" onClick={() => navigate("/add-data")}>
                        Add to Data
                    </button>
                    <button id="manage-employees" onClick={() => navigate("/manage-employees")}>
                        Manage Employees
                    </button>
                    <button
                        id="return-to-home"
                        onClick={() => navigate("/Homepage")}
                        disabled={locked}
                    >
                        Return to Homepage
                    </button>
                </div>
            </div>
          </div>
    );
}
