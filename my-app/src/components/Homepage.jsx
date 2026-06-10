// src/components/Homepage.jsx
import { useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend} from "chart.js";
import "../homepage.style.css";


ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function Homepage() {
  const navigate = useNavigate();
  const [sensor1, setSensor1] = useState(null);
  const [sensor2, setSensor2] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [rawHistory1, setRawHistory1] = useState([]);
  const [rawHistory2, setRawHistory2] = useState([]);
  const [error, setError] = useState(null);
  const [locked, setlocked] = useState(false);
  const [schedule, setSchedule] = useState([]);
  const [dbDateRange, setDbDateRange] = useState({ first: null, last: null });

  const [activeView, setActiveView] = useState("graph");
  const [preset, setPreset] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
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

    // Paginate through all rows 1000 at a time to bypass Supabase default cap
    async function fetchAll(table) {
      const pageSize = 1000;
      let page = 0;
      let allRows = [];
      while (true) {
        const { data, error } = await supabase
          .from(table)
          .select("date, totalcount, peoplecount, batterystatus")
          .order("date", { ascending: true })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        if (error || !data || data.length === 0) break;
        allRows = [...allRows, ...data];
        if (data.length < pageSize) break;
        page++;
      }
      return allRows;
    }

    const history1 = await fetchAll("Toilet Sensor 1");
    const history2 = await fetchAll("Toilet Sensor 2");

    setRawHistory1(history1 || []);
    setRawHistory2(history2 || []);

    // Store the actual date range from the DB so presets can use it
    if (history1 && history1.length > 0) {
      const firstDate = history1[0].date.split("T")[0];
      const lastDate  = history1[history1.length - 1].date.split("T")[0];
      setDbDateRange({ first: firstDate, last: lastDate });
      // Default the custom range inputs to the full data range
      setStartDate(firstDate);
      setEndDate(lastDate);
    }

    function aggregateByDate(data) {
      const days = {};
      (data || []).forEach(row => {
        const d = new Date(row.date);
        const day = d.toLocaleDateString("en-AU", { month: "short", day: "numeric", timeZone: "UTC" });
        const count = row.peoplecount ?? 0;
        if (!days[day]) days[day] = { total: 0, entries: 0, maxtotal: 0 };
        days[day].total += count;
        days[day].entries += 1;
        days[day].maxtotal = Math.max(days[day].maxtotal, row.totalcount ?? 0);
      });
      return days;
    }

    const days1 = aggregateByDate(history1);
    const days2 = aggregateByDate(history2);
    const allDayKeys = Object.keys(days1);
    const last14days = allDayKeys.slice(-14);

    const Merged = last14days.map(day => ({
      date: day,
      "Sensor 1": days1[day]?.total ?? 0,
      "Sensor 2": days2[day]?.total ?? 0,
    }));
    setChartData(Merged);

    const { data: scheduleData } = await supabase
      .from("cleaning_schedule")
      .select("*")
      .order("id", { ascending: true });
    if (scheduleData) setSchedule(scheduleData);
  }

  // Presets are now relative to the last date in the DB, not today
  function applyPreset(days) {
    setPreset(days);
    if (!dbDateRange.last) return;
    const end = new Date(dbDateRange.last + "T00:00:00.000Z");
    const start = new Date(end);
    start.setUTCDate(end.getUTCDate() - days);
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(dbDateRange.last);
  }

  function runAnalysis() {
    if (!startDate || !endDate) return;

    const [sy, sm, sd] = startDate.split("-").map(Number);
    const [ey, em, ed] = endDate.split("-").map(Number);
    const startMs = Date.UTC(sy, sm - 1, sd, 0, 0, 0, 0);
    const endMs   = Date.UTC(ey, em - 1, ed, 23, 59, 59, 999);

    function filterAndAggregate(data) {
      const days = {};
      (data || []).forEach((row) => {
        const rowMs = new Date(row.date).getTime();
        if (rowMs < startMs || rowMs > endMs) return;
        const day = new Date(row.date).toLocaleDateString("en-AU", { month: "short", day: "numeric", timeZone: "UTC" });
        const count = row.peoplecount ?? 0;
        if (count > 0 && count <= 20) {
          if (!days[day]) days[day] = { total: 0, entries: 0 };
          days[day].total += count;
          days[day].entries += 1;
        }
      });
      return days;
    }

    const days1 = filterAndAggregate(rawHistory1);
    const days2 = filterAndAggregate(rawHistory2);
    const allDays = Array.from(
      new Set([...Object.keys(days1), ...Object.keys(days2)])
    ).sort((a, b) => new Date(a) - new Date(b));

    const filtered = allDays.map(day => ({
      date: day,
      s1: days1[day]?.total ?? 0,
      s2: days2[day]?.total ?? 0,
    }));

    const s1vals = filtered.map((d) => d.s1);
    const s2vals = filtered.map((d) => d.s2);

    function stats(vals) {
      if (!vals.length) return { avg: 0, max: 0, min: 0, total: 0 };
      return {
        avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
        min: Math.min(...vals),
        max: Math.max(...vals),
        total: vals.reduce((a, b) => a + b, 0),
      };
    }

    const busiest = [...filtered]
      .map((d) => ({ date: d.date, combined: d.s1 + d.s2 }))
      .sort((a, b) => b.combined - a.combined)
      .slice(0, 5);

    setAnalysisResult({ filtered, stats1: stats(s1vals), stats2: stats(s2vals), busiest });
  }

  return (
    <div className="wrap">
      <div className="dashboard">
        <h2>Dashboard</h2>
        <div className="buttons">
          <button className={activeView === "graph" ? "btn-active" : ""} onClick={() => setActiveView("graph")}>
            Graph Data
          </button>
          <button className={activeView === "analyse" ? "btn-active" : ""} onClick={() => setActiveView("analyse")}>
            Analyse Data
          </button>
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
        {activeView === "graph" && (
          <div className="Graph">
            <h3>Graph Data</h3>
            <div className="box-graph">
              {chartData.length > 0 ? (
                <Bar
                  data={{
                    labels: chartData.map(d => d.date),
                    datasets: [
                      { label: "Sensor 1", data: chartData.map(d => d["Sensor 1"]), backgroundColor: "#2563eb", borderRadius: 4 },
                      { label: "Sensor 2", data: chartData.map(d => d["Sensor 2"]), backgroundColor: "#16a34a", borderRadius: 4 },
                    ],
                  }}
                  options={{responsive: true, maintainAspectRatio: false, layout: {padding: 0}, plugins: { legend: { position: "top" } },scales: { y: { beginAtZero: true }, x: {grid: { offset: false}} },
                  }}
                />
              ) : (
                <p>Loading Graph...</p>
              )}
            </div>
          </div>
        )}

        {activeView === "analyse" && (
          <div className="Graph">
            <h3>Analyse Data</h3>
            {dbDateRange.first && (
              <p className="analyse-placeholder" style={{ padding: "4px 0 12px", fontSize: "0.8rem", color: "#64748b" }}>
                Data available: <strong>{dbDateRange.first}</strong> → <strong>{dbDateRange.last}</strong>
              </p>
            )}
            <div className="analyse-filters">
              <div className="preset-buttons">
                <span className="filter-label">Quick range:</span>
                {[7, 14, 30].map((d) => (
                  <button key={d}
                    className={`preset-btn ${preset === d ? "preset-active" : ""}`}
                    onClick={() => applyPreset(d)}
                  >Last {d} days</button>
                ))}
              </div>
              <div className="custom-range">
                <span className="filter-label">Custom range:</span>
                <label>From
                  <input type="date" value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); setPreset(null); }}
                  />
                </label>
                <label>To
                  <input type="date" value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); setPreset(null); }}
                  />
                </label>
                <button className="apply-btn" onClick={runAnalysis}>Apply</button>
              </div>
            </div>

            {analysisResult ? (
              <div className="analyse-results">
                <div className="box-graph">
                  {analysisResult.filtered.length > 0 ? (
                    <Bar data={{ labels: analysisResult.filtered.map((d) => d.date),
                      datasets: [
                        { label: "Sensor 1", data: analysisResult.filtered.map((d) => d.s1), backgroundColor: "#2563eb", borderRadius: 4 },
                        { label: "Sensor 2", data: analysisResult.filtered.map((d) => d.s2), backgroundColor: "#16a34a", borderRadius: 4 },
                      ]}}
                      options={{ responsive: true, maintainAspectRatio: false, layout: {padding: 0}, plugins: { legend: { position: "top" } }, scales: { y: { beginAtZero: true }, x: {grid: { offset: false}} } }}
                    />
                  ) : ( <p>No data in selected range.</p> )}
                </div>

                <div className="analyse-bottom-grid">
                  <div className="panel">
                    <h4>Summary Stats</h4>
                    <table className="stats-table">
                      <thead><tr><th></th><th>Sensor 1</th><th>Sensor 2</th></tr></thead>
                      <tbody>
                        <tr><td>Total</td><td>{analysisResult.stats1.total}</td><td>{analysisResult.stats2.total}</td></tr>
                        <tr><td>Avg / day</td><td>{analysisResult.stats1.avg}</td><td>{analysisResult.stats2.avg}</td></tr>
                        <tr><td>Min day</td><td>{analysisResult.stats1.min}</td><td>{analysisResult.stats2.min}</td></tr>
                        <tr><td>Max day</td><td>{analysisResult.stats1.max}</td><td>{analysisResult.stats2.max}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="panel">
                    <h4>Sensor Comparison</h4>
                    {(() => {
                      const t1 = analysisResult.stats1.total;
                      const t2 = analysisResult.stats2.total;
                      const total = t1 + t2 || 1;
                      const pct1 = Math.round((t1 / total) * 100);
                      const pct2 = 100 - pct1;
                      return (
                        <div className="comparison">
                          <div className="comparison-bar">
                            <div className="bar-s1" style={{ width: `${pct1}%` }} />
                            <div className="bar-s2" style={{ width: `${pct2}%` }} />
                          </div>
                          <div className="comparison-labels">
                            <span className="s1-label">Sensor 1 — {pct1}% ({t1})</span>
                            <span className="s2-label">Sensor 2 — {pct2}% ({t2})</span>
                          </div>
                          <p className="comparison-note">
                            {t1 > t2 ? `Sensor 1 had ${t1 - t2} more records.`
                              : t2 > t1 ? `Sensor 2 had ${t2 - t1} more records.`
                              : "Both sensors had equal usage."}
                          </p>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="panel">
                    <h4>Busiest Days</h4>
                    <div className="busiest-list">
                      {analysisResult.busiest.map((d, i) => (
                        <div className="busiest-row" key={d.date}>
                          <span className="busiest-rank">#{i + 1}</span>
                          <span className="busiest-date">{d.date}</span>
                          <span className="busiest-count">{d.combined} uses</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="analyse-placeholder">
                Select a date range above and press <strong>Apply</strong> to see analysis.
              </p>
            )}
          </div>
        )}

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
                    <div className="data-row"><span>Date</span><span className="data-val">{new Date(sensor1.date).toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}</span></div>
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
                    <div className="data-row"><span>Date</span><span className="data-val">{new Date(sensor2.date).toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}</span></div>
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
              {schedule.map(item => (
                <div className="schedule" key={item.id}>
                  <span>{item.day}</span>
                  <span className="times">Clean{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
