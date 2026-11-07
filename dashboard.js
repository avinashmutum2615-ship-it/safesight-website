const esc = SafeSight.escape;
let appointments = [],
  patients = [];
function table(headers, rows) {
  return rows.length
    ? `<table><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table>`
    : '<p class="muted">No records found.</p>';
}
function renderAppointments() {
  const q = document.getElementById("search").value.toLowerCase(),
    status = document.getElementById("filter").value;
  const filtered = appointments.filter(
    (a) =>
      (!status || a.status === status) &&
      `${a.patient?.name} ${a.patient?.phone}`.toLowerCase().includes(q),
  );
  document.getElementById("appointment-list").innerHTML = table(
    ["Patient", "Doctor", "Date / time", "Status", ""],
    filtered.map(
      (a) =>
        `<tr><td>${esc(a.patient?.name)}<small>${esc(a.patient?.phone)}</small></td><td>${esc(a.doctor?.name)}</td><td>${esc(a.appointmentDate.slice(0, 10))}<small>${esc(a.appointmentTime)} IST</small></td><td><span class="pill">${esc(a.status)}</span></td><td><a href="appointment-details.html?id=${encodeURIComponent(a.id)}">Open →</a></td></tr>`,
    ),
  );
}
async function refresh() {
  appointments = (await SafeSight.request("/appointments")).appointments;
  renderAppointments();
  document.getElementById("stats").innerHTML = [
    [
      "Today's appointments",
      appointments.filter(
        (a) => a.appointmentDate.slice(0, 10) === SafeSight.today(),
      ).length,
    ],
    [
      "Awaiting confirmation",
      appointments.filter((a) => a.status === "Pending Confirmation").length,
    ],
    [
      "In consultation",
      appointments.filter((a) => a.status === "In Consultation").length,
    ],
  ]
    .map(
      ([name, n]) =>
        `<div class="stat">${esc(name)}<strong>${n}</strong></div>`,
    )
    .join("");
}
function renderPatients() {
  const q = document.getElementById("patient-search").value.toLowerCase();
  document.getElementById("patient-list").innerHTML = table(
    ["Patient", "Phone", "Gender", "Address"],
    patients
      .filter((p) =>
        `${p.name} ${p.phone} ${p.patientId}`.toLowerCase().includes(q),
      )
      .map(
        (p) =>
          `<tr><td>${esc(p.name)}<small>${esc(p.patientId)}</small></td><td>${esc(p.phone)}</td><td>${esc(p.gender)}</td><td>${esc(p.address)}</td></tr>`,
      ),
  );
}
async function loadTab(tab) {
  if (tab === "schedule") {
    const { availability } = await SafeSight.request("/doctors/availability");
    const form = document.getElementById("schedule-form");
    for (const key of ["status", "startTime", "endTime", "slotDuration"])
      form.elements[key].value = String(availability[key]);
    form.elements.workingDays.value = availability.workingDays.join(",");
    form.elements.breaks.value = availability.breaks
      .map((b) => b.start + " | " + b.end)
      .join("\n");
  }

  if (tab === "patients") {
    patients = (await SafeSight.request("/patients")).patients;
    renderPatients();
  }
  if (tab === "visits") {
    const data = await SafeSight.request("/visits/today");
    document.getElementById("visit-list").innerHTML = table(
      ["Patient", "Doctor", "Status", ""],
      data.visits.map(
        (v) =>
          `<tr><td>${esc(v.patient?.name)}</td><td>${esc(v.doctor?.name)}</td><td>${esc(v.status)}</td><td><a href="consultation.html?id=${encodeURIComponent(v.id)}">Open visit →</a></td></tr>`,
      ),
    );
  }
  if (tab === "staff") {
    const data = await SafeSight.request("/admin/staff");
    document.getElementById("staff-list").innerHTML = table(
      ["Name", "Role", "Email"],
      data.staff.map(
        (u) =>
          `<tr><td>${esc(u.name)}</td><td>${esc(u.role)}</td><td>${esc(u.email)}</td></tr>`,
      ),
    );
  }
}
document.querySelectorAll("[data-tab]").forEach(
  (button) =>
    (button.onclick = async () => {
      document
        .querySelectorAll(".tab")
        .forEach((el) => (el.hidden = el.id !== button.dataset.tab));
      document
        .querySelectorAll("[data-tab]")
        .forEach((el) => el.classList.toggle("active", el === button));
      try {
        await loadTab(button.dataset.tab);
      } catch (error) {
        SafeSight.message(error.message, true);
      }
    }),
);
document.getElementById("search").oninput = renderAppointments;
document.getElementById("filter").onchange = renderAppointments;
document.getElementById("patient-search").oninput = renderPatients;
document.getElementById("refresh").onclick = () =>
  refresh().catch((e) => SafeSight.message(e.message, true));
document.getElementById("staff-form").onsubmit = async (e) => {
  e.preventDefault();
  const button = e.target.querySelector("button");
  button.disabled = true;
  try {
    const data = Object.fromEntries(new FormData(e.target));
    const role = data.role;
    delete data.role;
    data.consultationFee = Number(data.consultationFee);
    await SafeSight.request(
      `/admin/${role === "doctor" ? "doctors" : "receptionists"}/new`,
      { method: "POST", body: JSON.stringify(data) },
    );
    e.target.reset();
    await loadTab("staff");
    SafeSight.message("Staff account created.");
  } catch (error) {
    SafeSight.message(error.message, true);
  } finally {
    button.disabled = false;
  }
};
(async () => {
  if (!sessionStorage.getItem("safesight.token")) {
    location.replace("login.html");
    return;
  }
  try {
    window.staffUser = (await SafeSight.request("/auth/me")).user;
    document.getElementById("welcome").textContent =
      `Hello, ${staffUser.name}.`;
    document.getElementById("role").textContent =
      `${staffUser.role[0].toUpperCase() + staffUser.role.slice(1)} workspace · ${SafeSight.today()}`;
    document
      .querySelectorAll("[data-role]")
      .forEach(
        (el) =>
          (el.hidden = !el.dataset.role.split(" ").includes(staffUser.role)),
      );
    document.getElementById("workspace").hidden = false;
    await refresh();
  } catch (error) {
    SafeSight.message(error.message, true);
  }
})();

document.getElementById("schedule-form").onsubmit = async (e) => {
  e.preventDefault();
  const button = e.target.querySelector("button");
  button.disabled = true;
  try {
    const fields = Object.fromEntries(new FormData(e.target));
    const data = {
      status: fields.status === "true",
      startTime: fields.startTime,
      endTime: fields.endTime,
      slotDuration: Number(fields.slotDuration),
      workingDays: fields.workingDays.split(",").map(Number),
      breaks: fields.breaks
        .split("\n")
        .filter((s) => s.trim())
        .map((line) => {
          const [start, end] = line.split("|").map((s) => s.trim());
          return { start, end };
        }),
    };
    await SafeSight.request("/doctors/availability", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    SafeSight.message("Availability saved.");
  } catch (error) {
    SafeSight.message(error.message, true);
  } finally {
    button.disabled = false;
  }
};
