const id = new URLSearchParams(location.search).get("id"),
  form = document.getElementById("edit");
let appointment;
async function slots() {
  const data = await SafeSight.request(
    `/appointments/available-slots?doctorId=${encodeURIComponent(appointment.doctor.id)}&date=${form.elements.appointmentDate.value}`,
  );
  const times = data.availableSlots;
  if (
    form.elements.appointmentDate.value ===
    appointment.appointmentDate.slice(0, 10)
  )
    times.push(appointment.appointmentTime);
  form.elements.appointmentTime.replaceChildren(
    ...[...new Set(times)].sort().map((t) => new Option(t, t)),
  );
  form.elements.appointmentTime.value = appointment.appointmentTime;
}
async function load() {
  const user = (await SafeSight.request("/auth/me")).user;
  appointment = (
    await SafeSight.request(`/appointments/${encodeURIComponent(id)}`)
  ).appointment;
  document.getElementById("details").hidden = false;
  document.getElementById("patient").textContent = appointment.patient.name;
  document.getElementById("summary").textContent =
    `${appointment.patient.phone} · ${appointment.doctor.name} · ${appointment.status}`;
  for (const key of ["status", "reason", "notes"])
    form.elements[key].value = appointment[key] || "";
  form.elements.appointmentDate.value = appointment.appointmentDate.slice(
    0,
    10,
  );
  form.elements.appointmentDate.min = SafeSight.today();
  const editable =
    ["admin", "receptionist"].includes(user.role) &&
    !["Checked In", "In Consultation", "Completed"].includes(
      appointment.status,
    );
  form.hidden = !editable;
  if (editable) await slots();
  document.getElementById("check-in").hidden =
    !editable || appointment.status !== "Confirmed";
}
form.elements.appointmentDate.onchange = () =>
  slots().catch((e) => SafeSight.message(e.message, true));
form.onsubmit = async (e) => {
  e.preventDefault();
  const button = form.querySelector("button");
  button.disabled = true;
  try {
    await SafeSight.request(`/appointments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    SafeSight.message("Appointment updated.");
    await load();
  } catch (error) {
    SafeSight.message(error.message, true);
  } finally {
    button.disabled = false;
  }
};
document.getElementById("check-in").onclick = async (e) => {
  e.target.disabled = true;
  try {
    await SafeSight.request(`/appointments/${id}/check-in`, {
      method: "POST",
      body: "{}",
    });
    SafeSight.message(
      "Patient checked in and added to the consultation queue.",
    );
    await load();
  } catch (error) {
    SafeSight.message(error.message, true);
  } finally {
    e.target.disabled = false;
  }
};
load().catch((e) => SafeSight.message(e.message, true));
