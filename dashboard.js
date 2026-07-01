const tableBody = document.getElementById("appointmentTable");

let allAppointments = [];

// Load all appointments
async function loadAppointments() {

    try {

        const response = await fetch(
            "https://safesight-backend-leby.onrender.com"
        );

        const data = await response.json();

        allAppointments = data.appointments || [];

        // Sort appointments:
        // 1. Today
        // 2. Future dates
        // 3. Past dates
        allAppointments.sort((a, b) => {

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const dateA = new Date(a.dateChoose);
            dateA.setHours(0, 0, 0, 0);

            const dateB = new Date(b.dateChoose);
            dateB.setHours(0, 0, 0, 0);

            const isPastA = dateA < today;
            const isPastB = dateB < today;

            // Past appointments go to the bottom
            if (isPastA !== isPastB) {
                return isPastA ? 1 : -1;
            }

            // Same category -> sort by date
            if (dateA.getTime() !== dateB.getTime()) {
                return dateA - dateB;
            }

            // Same date -> sort by time
            return a.timeChoose.localeCompare(b.timeChoose);

        });

        document.getElementById(
            "totalAppointments"
        ).textContent = allAppointments.length;

        renderTable(allAppointments);

    } catch (error) {

        console.error("Error loading appointments:", error);

    }

}

// Render table
function renderTable(appointments) {

    tableBody.innerHTML = "";

    if (appointments.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;">
                    No appointments found
                </td>
            </tr>
        `;

        return;
    }

    appointments.forEach((appointment) => {

        const row = document.createElement("tr");

        // Format Date
        const formattedDate = new Date(
            appointment.dateChoose
        ).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });

        // Format Time
        const formattedTime = new Date(
            `2000-01-01T${appointment.timeChoose}`
        ).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        });

        // Format Created Date
        const createdDate = appointment.createdAt
            ? new Date(appointment.createdAt).toLocaleString("en-GB")
            : "";

        row.innerHTML = `
            <td>${createdDate}</td>
            <td>${appointment.name || ""}</td>
            <td>${appointment.address || ""}</td>
            <td>${appointment.phone || ""}</td>
            <td>${formattedDate}</td>
            <td>${formattedTime}</td>
            <td>${appointment.call || ""}</td>
            <td>${appointment.confirm || ""}</td>
        `;

        row.style.cursor = "pointer";

        row.addEventListener("click", () => {

            window.location.href =
                `appointment-details.html?id=${appointment._id}`;

        });

        tableBody.appendChild(row);

    });

}

// Search by patient name
document.getElementById("searchInput")
.addEventListener("input", (e) => {

    const value = e.target.value
        .toLowerCase()
        .trim();

    const filtered = allAppointments.filter(app =>
        app.name &&
        app.name.toLowerCase().includes(value)
    );

    renderTable(filtered);

});

// Initial load
loadAppointments();

// Home button
function goHome() {

    window.location.href = "index.html";

}
