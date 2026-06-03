/// src/components/ManageEmployees.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../admin.style.css";

const FUNCTION_URL = "https://xidjslcicqwbgcyjkbnj.supabase.co/functions/v1/manage-users";

async function callFunction(action, payload = {}) {
    const res = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload }),
    });
    return res.json();
}

const EMPTY_FORM = { email: "", password: "" };

export default function ManageEmployees() {
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [loadError, setLoadError] = useState(null);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState(EMPTY_FORM);
    const [formStatus, setFormStatus] = useState(null);
    const [formMessage, setFormMessage] = useState("");

    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState(EMPTY_FORM);
    const [editStatus, setEditStatus] = useState(null);
    const [editMessage, setEditMessage] = useState("");

    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => { fetchUsers(); }, []);

    async function fetchUsers() {
        setLoading(true);
        setLoadError(null);
        const { data, error } = await callFunction("list");
        if (error) {
            setLoadError(error.message);
        } else {
            setUsers(data.users);
        }
        setLoading(false);
    }

    async function handleCreate() {
        if (!form.email || !form.password) {
            setFormStatus("error");
            setFormMessage("Email and password are required.");
            return;
        }
        setFormStatus("loading");
        const { data, error } = await callFunction("create", {
            email: form.email,
            password: form.password,
        });
        if (error) {
            setFormStatus("error");
            setFormMessage(error.message);
        } else {
            setFormStatus("success");
            setFormMessage(`User "${form.email}" created.`);
            setForm(EMPTY_FORM);
            fetchUsers();
        }
    }

    async function handleUpdate() {
        setEditStatus("loading");
        const { error } = await callFunction("update", {
            id: editingUser.id,
            email: editForm.email,
            password: editForm.password || undefined,
        });
        if (error) {
            setEditStatus("error");
            setEditMessage(error.message);
        } else {
            setEditStatus("success");
            setEditMessage("User updated.");
            fetchUsers();
            setTimeout(() => { setEditingUser(null); setEditStatus(null); }, 1000);
        }
    }

    async function handleDelete(id) {
        const { error } = await callFunction("delete", { id });
        if (!error) {
            setDeletingId(null);
            fetchUsers();
        }
    }

    return (
        <div className="wrap">

            <div className="dashboard">
                <h2>Manage Employees</h2>
                <div className="buttons">
                    <button onClick={() => navigate("/admin")}>Back to Admin</button>
                </div>
            </div>

            {/* Create user */}
            <div className="panel" style={{ marginTop: "1rem" }}>
                <h3>Create New User</h3>
                <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        style={inputStyle}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                        style={inputStyle}
                    />
                    <button
                        id="add-data"
                        onClick={handleCreate}
                        disabled={formStatus === "loading"}
                    >
                        {formStatus === "loading" ? "Creating…" : "Create User"}
                    </button>
                </div>
                {formStatus && formStatus !== "loading" && (
                    <p style={{ color: formStatus === "success" ? "green" : "red", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                        {formMessage}
                    </p>
                )}
            </div>

            {/* Users table */}
            <div className="panel" style={{ marginTop: "1rem" }}>
                <h3>All Users</h3>
                {loading && <p style={{ fontSize: "0.85rem", color: "#888", marginTop: "0.5rem" }}>Loading…</p>}
                {loadError && <p style={{ color: "red", fontSize: "0.85rem", marginTop: "0.5rem" }}>{loadError}</p>}
                {!loading && !loadError && (
                    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "0.75rem", fontSize: "13px" }}>
                        <thead>
                            <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
                                <th style={thStyle}>Email</th>
                                <th style={thStyle}>Created</th>
                                <th style={thStyle}>Last Sign In</th>
                                <th style={thStyle}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} style={{ borderBottom: "1px solid #eee" }}>
                                    <td style={tdStyle}>{user.email}</td>
                                    <td style={tdStyle}>{new Date(user.created_at).toLocaleDateString()}</td>
                                    <td style={tdStyle}>
                                        {user.last_sign_in_at
                                            ? new Date(user.last_sign_in_at).toLocaleDateString()
                                            : "Never"}
                                    </td>
                                    <td style={tdStyle}>
                                        <button
                                            onClick={() => {
                                                setEditingUser(user);
                                                setEditForm({ email: user.email, password: "" });
                                                setEditStatus(null);
                                            }}
                                            style={actionBtn}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => setDeletingId(user.id)}
                                            style={{ ...actionBtn, color: "#c00" }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Edit modal */}
            {editingUser && (
                <div style={overlayStyle}>
                    <div style={modalStyle}>
                        <h3 style={{ marginBottom: "0.75rem" }}>Edit User</h3>
                        <input
                            type="email"
                            placeholder="Email"
                            value={editForm.email}
                            onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                            style={{ ...inputStyle, marginBottom: "0.5rem" }}
                        />
                        <input
                            type="password"
                            placeholder="New password (leave blank to keep)"
                            value={editForm.password}
                            onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
                            style={{ ...inputStyle, marginBottom: "0.75rem" }}
                        />
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button id="add-data" onClick={handleUpdate} disabled={editStatus === "loading"}>
                                {editStatus === "loading" ? "Saving…" : "Save Changes"}
                            </button>
                            <button onClick={() => setEditingUser(null)} style={actionBtn}>Cancel</button>
                        </div>
                        {editStatus && editStatus !== "loading" && (
                            <p style={{ color: editStatus === "success" ? "green" : "red", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                                {editMessage}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Delete confirmation modal */}
            {deletingId && (
                <div style={overlayStyle}>
                    <div style={modalStyle}>
                        <h3 style={{ marginBottom: "0.5rem" }}>Confirm Delete</h3>
                        <p style={{ fontSize: "0.875rem", marginBottom: "1rem" }}>
                            This will permanently delete the user. This cannot be undone.
                        </p>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                                id="add-data"
                                onClick={() => handleDelete(deletingId)}
                                style={{ background: "#c00" }}
                            >
                                Delete
                            </button>
                            <button onClick={() => setDeletingId(null)} style={actionBtn}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

const inputStyle = {
    padding: "8px 10px",
    borderRadius: "6px",
    border: "1px solid #ddd",
    fontSize: "13px",
    flex: 1,
    minWidth: "180px",
};
const thStyle = { padding: "8px 6px", color: "#555", fontWeight: "600" };
const tdStyle = { padding: "8px 6px", color: "#333" };
const actionBtn = {
    padding: "4px 10px",
    borderRadius: "4px",
    border: "1px solid #ddd",
    background: "#f5f5f5",
    cursor: "pointer",
    fontSize: "12px",
    marginRight: "4px",
};
const overlayStyle = {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 100,
};
const modalStyle = {
    background: "white",
    borderRadius: "10px",
    padding: "1.5rem",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
};