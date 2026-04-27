// src/components/Homepage.jsx
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import "../homepage.style.css";

const supabase = createClient(
  "https://xidjslcicqwbgcyjkbnj.supabase.co",
  "sb_publishable_vbSoXWaeZgXTtr56mGn5ig_UFivSe5r"
);

export default function Homepage() {
  const [sensor1, setSensor1] = useState(null);
  const [sensor2, setSensor2] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    // Query both tables separately
    const { data: data1, error: error1 } = await supabase
      .from("Toilet Sensor 1")
      .select("*")
      .order("date", { ascending: false })
      .limit(1)
      .single();

    const { data: data2, error: error2 } = await supabase
      .from("Toilet Sensor 2")
      .select("*")
      .order("date", { ascending: false })
      .limit(1)
      .single();

    if (error1 || error2) {
      setError("Failed to load sensor data.");
      console.error(error1 || error2);
      return;
    }

    setSensor1(data1);
    setSensor2(data2);
  }

  return (
    <div className="wrap">
      <div className="dashboard">
        <h2>Dashboard</h2>
        <div className="buttons">
          <button>Graph Data</button>
          <button>Analyse Data</button>
          <button>Admin Panel</button>
        </div>
      </div>

      <div className="panels">
        <div className="Graph">
          <h3>Graph Data</h3>
          <div className="box-graph"></div>
        </div>

        <div className="bottom-grid">
          <div className="left-col">

            <div className="panel">
              <h3>Toilet Sensor Data 1</h3>
              <div className="sensor1">
                {error ? (
                  <p style={{ color: "red" }}>{error}</p>
                ) : sensor1 ? (
                  <>
                    <div className="data-row"><span>Total Count</span><span className="data-val">{sensor1.totalcount}</span></div>
                    <div className="data-row"><span>Battery Status</span><span className="data-val">{sensor1.batterystatus}</span></div>
                    <div className="data-row"><span>People Count</span><span className="data-val">{sensor1.peoplecount}</span></div>
                    <div className="data-row"><span>Date</span><span className="data-val">{sensor1.date}</span></div>
                  </>
                ) : (
                  <p>Loading...</p>
                )}
              </div>
            </div>

            <div className="panel">
              <h3>Toilet Sensor Data 2</h3>
              <div className="sensor2">
                {error ? (
                  <p style={{ color: "red" }}>{error}</p>
                ) : sensor2 ? (
                  <>
                    <div className="data-row"><span>Total Count</span><span className="data-val">{sensor2.totalcount}</span></div>
                    <div className="data-row"><span>Battery Status</span><span className="data-val">{sensor2.batterystatus}</span></div>
                    <div className="data-row"><span>People Count</span><span className="data-val">{sensor2.peoplecount}</span></div>
                    <div className="data-row"><span>Date</span><span className="data-val">{sensor2.date}</span></div>
                  </>
                ) : (
                  <p>Loading...</p>
                )}
              </div>
            </div>

          </div>

          <div className="panel">
            <h3>Cleaning Schedule</h3>
            <div className="cleaning-schedule">
              {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(day => (
                <div className="schedule" key={day}>
                  <span>{day}</span>
                  <span className="times">Clean 12pm-2am</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
