const id = new URLSearchParams(location.search).get("id"),
  examForm = document.getElementById("examination"),
  rxForm = document.getElementById("prescription");
let visit,
  savedRx = null;
function populate(form, data) {
  for (const el of form.elements) {
    if (!el.name) continue;
    const keys = el.name.split(".");
    const value = keys.reduce((v, k) => v?.[k], data);
    if (value !== undefined) el.value = value;
  }
}
async function load() {
  visit = (await SafeSight.request(`/visits/${encodeURIComponent(id)}`)).visit;
  document.getElementById("patient").textContent = visit.patient.name;
  document.getElementById("visit-summary").textContent =
    `${visit.doctor.name || "Doctor"} · ${visit.status} · ${visit.patient.phone}`;
  document.getElementById("start").hidden = visit.status !== "Waiting";
  document.getElementById("clinical").hidden = visit.status === "Waiting";
  const ex = (await SafeSight.request(`/visits/${id}/examination`)).examination;
  if (ex) populate(examForm, ex);
  try {
    savedRx = (await SafeSight.request(`/prescriptions/visit/${id}`))
      .prescription;
    populate(rxForm, {
      ...savedRx,
      disease: savedRx.diagnosis.map((d) => d.disease).join("; "),
      eye: savedRx.diagnosis[0]?.eye,
      ...savedRx.glassPrescription,
      followUpDate: savedRx.followUp?.date?.slice(0, 10),
      medicationLines: savedRx.medications
        .map((m) =>
          [m.medicine, m.dose, m.frequency, m.duration, m.eye].join(" | "),
        )
        .join("\n"),
    });
    document.getElementById("print").disabled = false;
  } catch (error) {
    if (!error.message.includes("not found")) throw error;
  }
  if (visit.status === "Completed") {
    examForm.querySelector("button").disabled = true;
    document.getElementById("complete").disabled = true;
  }
}
async function action(button, fn) {
  button.disabled = true;
  try {
    await fn();
  } catch (error) {
    SafeSight.message(error.message, true);
  } finally {
    button.disabled = false;
  }
}
document.getElementById("start").onclick = (e) =>
  action(e.target, async () => {
    await SafeSight.request(`/visits/${id}/start`, {
      method: "PATCH",
      body: "{}",
    });
    await load();
  });
examForm.onsubmit = (e) => {
  e.preventDefault();
  action(e.target.querySelector("button"), async () => {
    const data = {};
    for (const [key, value] of new FormData(examForm)) {
      const [a, b] = key.split(".");
      if (b) (data[a] ??= {})[b] = value;
      else data[a] = value;
    }
    await SafeSight.request(`/visits/${id}/examination`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    SafeSight.message("Examination saved.");
  });
};
rxForm.onsubmit = (e) => {
  e.preventDefault();
  action(e.target.querySelector("button"), async () => {
    const fields = Object.fromEntries(new FormData(rxForm));
    const glassPrescription = { rightEye: {}, leftEye: {} };
    for (const [key, value] of Object.entries(fields)) {
      const [eye, field] = key.split(".");
      if (field) glassPrescription[eye][field] = value;
    }
    const medications = fields.medicationLines
      .split("\n")
      .filter((s) => s.trim())
      .map((line) => {
        const [medicine, dose, frequency, duration, eye = "Both Eyes"] = line
          .split("|")
          .map((s) => s.trim());
        return { medicine, dose, frequency, duration, eye };
      });
    const data = {
      visit: id,
      diagnosis: [{ eye: fields.eye, disease: fields.disease }],
      clinicalComments: fields.clinicalComments,
      glassPrescription,
      medications,
      actionPlan: fields.actionPlan,
      followUp: fields.followUpDate ? { date: fields.followUpDate } : {},
    };
    savedRx = (
      await SafeSight.request(
        savedRx ? `/prescriptions/${savedRx.id}` : "/prescriptions",
        { method: savedRx ? "PATCH" : "POST", body: JSON.stringify(data) },
      )
    ).prescription;
    document.getElementById("print").disabled = false;
    SafeSight.message("Prescription saved.");
  });
};
document.getElementById("complete").onclick = (e) =>
  action(e.target, async () => {
    if (
      !confirm(
        "Complete this consultation? Save examination and prescription changes first.",
      )
    )
      return;
    await SafeSight.request(`/visits/${id}/complete`, {
      method: "PATCH",
      body: JSON.stringify({
        notes: document.getElementById("completion-notes").value,
      }),
    });
    await load();
    SafeSight.message("Visit completed.");
  });
document.getElementById("print").onclick = () => {
  if (!savedRx) return;
  const esc = SafeSight.escape,
    area = document.getElementById("print-area");
  area.innerHTML = `<h1>SafeSight Eye Clinic</h1><h2>Prescription</h2><p>${esc(visit.patient.name)} · ${esc(visit.patient.phone)}</p><p>Doctor: ${esc(visit.doctor.name)} · ${esc(savedRx.updatedAt?.slice(0, 10))}</p><h3>Diagnosis</h3><p>${savedRx.diagnosis.map((d) => esc(d.eye + ": " + d.disease)).join("<br>")}</p><p>${esc(savedRx.clinicalComments)}</p><h3>Glasses</h3><table><tr><th>Eye</th><th>SPH</th><th>CYL</th><th>Axis</th><th>ADD</th><th>BCVA</th></tr>${["rightEye", "leftEye"].map((eye) => `<tr><td>${eye === "rightEye" ? "Right" : "Left"}</td>${["dsph", "dcyl", "axis", "add", "bcva"].map((k) => `<td>${esc(savedRx.glassPrescription?.[eye]?.[k])}</td>`).join("")}</tr>`).join("")}</table><h3>Medications</h3>${savedRx.medications.map((m) => `<p>${esc([m.medicine, m.dose, m.frequency, m.duration, m.eye].filter(Boolean).join(" · "))}</p>`).join("")}<h3>Plan</h3><p>${esc(savedRx.actionPlan)}</p><p>Follow-up: ${esc(savedRx.followUp?.date?.slice(0, 10) || "As advised")}</p><p>Treating clinician signature: ____________________</p>`;
  document.getElementById("clinical").hidden = true;
  area.hidden = false;
  window.print();
  area.hidden = true;
  document.getElementById("clinical").hidden = false;
};
load().catch((e) => SafeSight.message(e.message, true));
