// src/components/admin.jsx
import { useState, useEffect, useNavigate } from "react";
import { createClient } from "@supabase/supabase-js";
import "../admin.style.css";

const supabase = createClient(
    "https://xidjslcicqwbgcyjkbnj.supabase.co",
    "sb_publishable_vbSoXWaeZgXTtr56mGn5ig_UFivSe5r"
);

export default function Admin() {
    const navigate = useNavigate();
    const [sensor1, setSensor1] = useState(null);
    const [sensor2, setSensor2] = useState(null);
    const [error, setError] = useState(null);
//below lines have questionable depenancy. Figure out if needed and if not curate.
    //useEffect(() => {
    //    loadData();
    //}, []);

    //async function loadData() {
        // Query both tables separately
      //  const { data: data1, error: error1 } = await supabase
        //    .from("Toilet Sensor 1")
          //  .select("*")
            //.order("date", { ascending: false })
            //.limit(1)
            //.single();

//        const { data: data2, error: error2 } = await supabase
  //          .from("Toilet Sensor 2")
    //        .select("*")
      //      .order("date", { ascending: false })
        //    .limit(1)
          //  .single();

//        if (error1 || error2) {
  //          setError("Failed to load sensor data.");
    //        console.error(error1 || error2);
      //      return;
        //}

  //      setSensor1(data1);
//        setSensor2(data2);
    }

    return (
        <div className="wrap">
            <div className="dashboard">
                <h2>Dashboard</h2>
                <div className="buttons">
                    <button>Add to Data</button>
                    <button>Manage Employees</button>
                    <button
                        id="return-to-home"
                        onClick={navigate("/Homepage")}
                        disabled={locked}
                    >
                        Return to Homepage
                    </button>
                </div>
            </div>
            </div>
       
    );
