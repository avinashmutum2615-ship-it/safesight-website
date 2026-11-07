const { test } = require("node:test");
const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");
const fs = require("node:fs");
const tick = () => new Promise((resolve) => setImmediate(resolve));
function screen(file, request) {
  const dom = new JSDOM(fs.readFileSync(file, "utf8"), {
    url: "http://localhost/" + file,
    runScripts: "outside-only",
  });
  const w = dom.window;
  w.AbortController = AbortController;
  w.fetch = async (url, options) => ({
    ok: true,
    status: 200,
    json: () => request(url, options),
  });
  for (const script of ["config.js", "api.js"])
    w.eval(fs.readFileSync(script, "utf8"));
  return dom;
}
test("booking loads doctors, slots and sends backend-compatible fields", async () => {
  let posted;
  const dom = screen("Appointment.html", async (url, options) => {
    if (url.endsWith("/public/doctors"))
      return {
        success: true,
        doctors: [
          {
            id: "doc1",
            name: "Dr Test",
            specialization: "Eye Care",
            consultationFee: 500,
          },
        ],
      };
    if (url.includes("/slots?"))
      return { success: true, availableSlots: ["09:00", "09:30"] };
    posted = JSON.parse(options.body);
    return {
      success: true,
      appointment: { id: "apt1", ...posted, status: "Pending Confirmation" },
    };
  });
  const w = dom.window,
    d = w.document;
  w.eval(fs.readFileSync("booking.js", "utf8"));
  await tick();
  assert.equal(d.querySelector("#doctor").options.length, 2);
  d.querySelector("#doctor").value = "doc1";
  d.querySelector("#date").value = "2030-01-07";
  d.querySelector("#date").dispatchEvent(new w.Event("change"));
  await tick();
  assert.equal(d.querySelector("#slot").disabled, false);
  d.querySelector("#slot").value = "09:30";
  d.querySelector("[name=name]").value = "Patient";
  d.querySelector("[name=phone]").value = "9000000000";
  d.querySelector("[name=gender]").value = "female";
  d.querySelector("#booking").dispatchEvent(
    new w.Event("submit", { cancelable: true }),
  );
  await tick();
  assert.equal(posted.doctor, "doc1");
  assert.equal(posted.appointmentTime, "09:30");
  assert.equal(posted.phone, "9000000000");
  assert.match(d.querySelector("#message").textContent, /Request received/);
  assert.equal(d.querySelector("#slot").disabled, true);
  dom.window.close();
});
test("API errors are visible and never shown as successful bookings", async () => {
  const dom = screen("Appointment.html", async () => ({
    success: false,
    message: "Database unavailable",
  }));
  const w = dom.window;
  w.eval(fs.readFileSync("booking.js", "utf8"));
  await tick();
  assert.match(
    w.document.querySelector("#message").textContent,
    /Database unavailable/,
  );
  assert.equal(w.document.querySelector("#book").disabled, true);
  dom.window.close();
});
test("dashboard loads staff, renders escaped values and switches tabs", async () => {
  const dom = screen("dashboard.html", async (url) => {
    if (url.endsWith("/auth/me"))
      return { success: true, user: { name: "Admin", role: "admin" } };
    if (url.endsWith("/appointments"))
      return {
        success: true,
        appointments: [
          {
            id: "a1",
            patient: { name: "<script>bad()</script>", phone: "9000000000" },
            doctor: { name: "Doctor" },
            appointmentDate: "2030-01-07T00:00:00Z",
            appointmentTime: "09:00",
            status: "Confirmed",
          },
        ],
      };
    if (url.endsWith("/patients"))
      return {
        success: true,
        patients: [
          { name: "Patient One", patientId: "PAT-1", gender: "female" },
        ],
      };
    if (url.endsWith("/admin/staff"))
      return {
        success: true,
        staff: [
          { name: "Doctor", email: "doctor@example.com", role: "doctor" },
        ],
      };
    return { success: true, visits: [] };
  });
  const w = dom.window,
    d = w.document;
  w.sessionStorage.setItem("safesight.token", "fixture");
  w.eval(fs.readFileSync("dashboard.js", "utf8"));
  await tick();
  assert.equal(d.querySelector("#welcome").textContent, "Hello, Admin.");
  assert.equal(d.querySelector("#appointment-list script"), null);
  assert.match(d.querySelector("#appointment-list").textContent, /<script>bad/);
  d.querySelector("[data-tab=patients]").click();
  await tick();
  assert.match(d.querySelector("#patient-list").textContent, /Patient One/);
  d.querySelector("[data-tab=staff]").click();
  await tick();
  assert.match(
    d.querySelector("#staff-list").textContent,
    /doctor@example.com/,
  );
  dom.window.close();
});
test("chat renders unavailable response as text", async () => {
  const dom = screen("Appointment.html", async () => ({
    success: false,
    message: "AI not configured",
  }));
  const w = dom.window,
    d = w.document;
  w.eval(fs.readFileSync("chat.js", "utf8"));
  d.querySelector("#chat input").value = "Hello";
  d.querySelector("#chat").dispatchEvent(
    new w.Event("submit", { cancelable: true }),
  );
  await tick();
  assert.match(d.querySelector("#chat-log").textContent, /AI not configured/);
  assert.equal(d.querySelector("#chat button").disabled, false);
  dom.window.close();
});
