// src/components/AddData.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import "../admin.style.css";

const supabase = createClient(
    "https://xidjslcicqwbgcyjkbnj.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpZGpzbGNpY3F3YmdjeWprYm5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDAzMTQxNCwiZXhwIjoyMDg5NjA3NDE0fQ.fXhs8bVa_mKGICqpFWpGE0EV_II2LP-K-YJhUU31PB4" //NOTE THIS IS A SECRET KEY
);


const TABLES = ["Toilet Sensor 1", "Toilet Sensor 2"];

const CSV_COLUMN_MAP = {
    totalcount:    "totalcount",
    batterystatus: "batterystatus",
    peoplecount:   "peoplecount",
    date:          "date",
};

function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row.");

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());

    return lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.trim());
        const row = {};
        headers.forEach((header, idx) => {
            const col = CSV_COLUMN_MAP[header];
            if (col) row[col] = values[idx] ?? null;
        });
        return row;
    });
}

export default function AddData() {
    const navigate = useNavigate();

    const [selectedTable, setSelectedTable] = useState(null);  // null until chosen
    const [csvFile, setCsvFile]             = useState(null);
    const [uploadStatus, setUploadStatus]   = useState(null);  // null | "loading" | "success" | "error"
    const [uploadMessage, setUploadMessage] = useState("");

    async function handleUpload() {
        if (!csvFile) {
            setUploadStatus("error");
            setUploadMessage("Please select a CSV file first.");
            return;
        }

        setUploadStatus("loading");
        setUploadMessage("Uploading...");

        try {
            const text = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload  = e => resolve(e.target.result);
                reader.onerror = () => reject(new Error("Failed to read file."));
                reader.readAsText(csvFile);
            });

            const rows = parseCSV(text);
            if (rows.length === 0) throw new Error("No valid data rows found in CSV.");

            // Delete all existing rows in the target table
            const { error: deleteError } = await supabase
                .from(selectedTable)
                .delete()
                .gt("date", "1970-01-01T00:00:00.000Z");

            if (deleteError) throw new Error(`Failed to clear table: ${deleteError.message}`);

            // Insert the new rows
            const { error: insertError } = await supabase
                .from(selectedTable)
                .insert(rows);

            if (insertError) throw new Error(`Failed to insert data: ${insertError.message}`);

            setUploadStatus("success");
            setUploadMessage(`"${selectedTable}" replaced with ${rows.length} row(s) successfully.`);
            setCsvFile(null);
            document.getElementById("csv-file-input").value = "";

        } catch (err) {
            setUploadStatus("error");
            setUploadMessage(err.message);
        }
    }

    return (
        <div className="wrap">

            {/* Header bar — matches admin/homepage style */}
            <div className="dashboard">
                <h2>Add Data</h2>
                <div className="buttons">
                    <button onClick={() => navigate("/admin")}>
                        Back to Admin
                    </button>
                </div>
            </div>

            {/* Step 1 — pick a sensor */}
            <div className="panel" style={{ marginTop: "1rem" }}>
                <h3>Step 1 — Select Target Sensor</h3>
                <div style={{ display: "flex", gap: "1rem", marginTop: "0.75rem" }}>
                    {TABLES.map(table => (
                        <button
                            key={table}
                            onClick={() => {
                                setSelectedTable(table);
                                setUploadStatus(null);
                                setUploadMessage("");
                                setCsvFile(null);
                            }}
                            style={{
                                flex: 1,
                                padding: "1rem",
                                borderRadius: "8px",
                                border: selectedTable === table
                                    ? "2px solid #1a1a2e"
                                    : "2px solid #ddd",
                                background: selectedTable === table ? "#1a1a2e" : "#f5f5f5",
                                color: selectedTable === table ? "#fff" : "#333",
                                fontWeight: "bold",
                                fontSize: "14px",
                                cursor: "pointer",
                                transition: "all 0.15s",
                            }}
                        >
                            {table}
                        </button>
                    ))}
                </div>
            </div>

            {/* Step 2 — upload CSV (only shown once a sensor is chosen) */}
            {selectedTable && (
                <div className="panel" style={{ marginTop: "1rem" }}>
                    <h3>Step 2 — Upload CSV for {selectedTable}</h3>
                    <p style={{ fontSize: "0.8rem", color: "#888", marginTop: "0.25rem" }}>
                        Expected columns: <code>totalcount, batterystatus, peoplecount, date</code>
                        <br />
                        Uploading will <strong>replace all existing data</strong> in this table.
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
                        <input
                            id="csv-file-input"
                            type="file"
                            accept=".csv"
                            onChange={e => {
                                setCsvFile(e.target.files[0] ?? null);
                                setUploadStatus(null);
                                setUploadMessage("");
                            }}
                        />

                        <button
                            id="add-data"
                            onClick={handleUpload}
                            disabled={uploadStatus === "loading" || !csvFile}
                        >
                            {uploadStatus === "loading" ? "Uploading…" : `Replace ${selectedTable} Data`}
                        </button>

                        {uploadStatus && uploadStatus !== "loading" && (
                            <p style={{
                                color: uploadStatus === "success" ? "green" : "red",
                                fontSize: "0.875rem",
                            }}>
                                {uploadMessage}
                            </p>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}