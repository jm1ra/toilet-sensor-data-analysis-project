// src/components/Homepage.jsx
import { useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend} from "chart.js";
import "../homepage.style.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const supabase = createClient(
  "https://xidjslcicqwbgcyjkbnj.supabase.co",
  "sb_publishable_vbSoXWaeZgXTtr56mGn5ig_UFivSe5r"
);
// Export data from supabase database
export default function Homepage() {
  const navigate = useNavigate();
  const [sensor1, setSensor1] = useState(null);
  const [sensor2, setSensor2] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState(null);
  const [locked, setlocked] = useState(false);

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
// Failsafe creation if data cannot be located or sourced
    if (error1 || error2) {
      setError("Failed to load sensor data.");
      console.error(error1 || error2);
      return;
    }

    setSensor1(data1);
    setSensor2(data2);

    //Data for the graph (Last 14 rows from each sensor)
    const {data: history1 } = await supabase
    .from("Toilet Sensor 1")
    .select("date, Totalcount, peoplecount")
    .order("date, { ascending: true }")
    .limit(14);

    const {data: history2 } = await supabase
    .from("Toilet Sensor 2")
    .select("date, Totalcount, peoplecount")
    .order("date, { ascending: true }")
    .limit(14);

    console.log("history1:", history1);
    console.log("history1 error:", histError1);
    console.log("history2:", history2);
    console.log("history2 error:", histError2);
    console.log("merged:", merged);



    const merged = (history1 || []).map((row, i) => {
      return {
      date: new Date(row.date).toLocaleDateString("en-AU", { month: "short", day: "numeric "}),
      "Sensor 1": row.totalcount ?? row.peoplecount,
      "Sensor 2": history2?.[i]?.totalcount ?? history2?.[i]?.peoplecount ?? 0,
      };
    });

    setChartData(merged);
  }

  const avg = 
    chartData.length > 0
    ? Math.round(
      chartData.reduce((sum, d) => sum + (d["Sensor 1"] || 0), 0) / chartData.length
  
    )
    : 0;
/* The following code below is the visuals that will be displayed on the homepage; buttons, data fields and cleaning schedule times will all be displayed. */
  return (
    <div className="wrap">
      <div className="dashboard">
        <h2>Dashboard</h2>
        <div className="buttons">
          <button>Graph Data</button>
          <button>Analyse Data</button>
          <button
                 id="admin-panel"
                 onClick={() => navigate("/admin")}
                 disabled={locked}
          >
          Admin Panel
          </button>
        </div>
      </div>
      
      <div className="panels"> 
        <div className="Graph">
          <h3>Graph Data</h3>
          <div className="box-graph">
            {chartData.length > 0 ? (
              <Bar
                data={{
                  labels: chartData.map(d => d.date),
                  datasets: [
                    {
                      label: "Sensor 1",
                      data: chartData.map(d => d["Sensor 1"]),
                      backgroundColor: "#2563eb",
                      borderRadius: 4, 
                    },
                    {
                      label: "Sensor 2",
                      data: chartData.map(d => d["Sensor 2"]),
                      backgroundColor: "#16a34a",
                      borderRadius: 4,
                    },
                  ],
                }}
                options={{
                  responsive: true, 
                  plugins: { legend: { position: "top"}},
                  scales: { y: {beginAtZero: true}},
                }}
                />
              ) : (
                <p>Loading Graph...</p>
              )}
          </div>
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
