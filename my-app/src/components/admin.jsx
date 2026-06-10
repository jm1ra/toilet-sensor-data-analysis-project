// src/components/admin.jsx
import { useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../admin.style.css";

export default function Admin() {
    const navigate = useNavigate();
    const [schedule, setSchedule] = useState([]);
    const [savemessage, setSavemessage] = useState("");

    useEffect(() => {
        loadSchedule();
    }, []);

// loads cleaning schedule from the database and allows for editing and saving back to the database via the Admin Panel.
    async function loadSchedule() {
        const { data: scheduleData, error } = await supabase
        .from("cleaning_schedule")
        .select("*")
        .order("id", { ascending: true });
    
    if (scheduleData) {
        setSchedule(scheduleData);
    }
}

    // Handlesave function allows the Admin to update the cleaning schedule in the database based on the changes made by the Admin.
    async function handleSave() {
        for (const item of schedule) {
            await supabase
            .from("cleaning_schedule")
            .update({ time: item.time})
            .eq("id", item.id);
        }
        setSavemessage("Schedule saved successfully!");
        setTimeout(() => setSavemessage(""), 3000);
    }

    
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
                        onClick={() => navigate("/homepage", { replace: true })}
                    >
                        Return to Homepage
                    </button>
                </div>

                <div className="schedule-editor">
                    <h3>Cleaning Schedule</h3>
                    {schedule.map((item, index) => (
                        <div key={item.id} className="schedule-row">
                            <span className="schedule-day">{item.day}</span>
                                <input
                                    type="text"
                                    value={item.time}
                                    onChange={(e) => {
                                        const updated = [...schedule];
                                        updated[index] = {...item, time: e.target.value};
                                        setSchedule(updated);
                                    }}
                                />
                        </div>
                    ))}
                    <button id="save-schedule" onClick={handleSave}>
                        Save Schedule
                    </button>
                    {savemessage && <p className="save-message">{savemessage}</p>}
                </div>
            </div>
          </div>
    );
}
