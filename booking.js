const doctor = document.getElementById("doctor"),
  date = document.getElementById("date"),
  slot = document.getElementById("slot"),
  book = document.getElementById("book");
date.min = SafeSight.today();
document.querySelector('[name="dateOfBirth"]').max = SafeSight.today();
let slotVersion = 0;
async function loadSlots() {
  const version = ++slotVersion;
  slot.disabled = true;
  book.disabled = true;
  slot.replaceChildren(new Option("Select doctor and date", ""));
  if (!doctor.value || !date.value) return;
  try {
    const data = await SafeSight.request(
      `/public/appointments/slots?doctorId=${encodeURIComponent(doctor.value)}&date=${encodeURIComponent(date.value)}`,
    );
    if (version !== slotVersion) return;
    slot.replaceChildren(
      new Option(
        data.availableSlots.length
          ? "Choose a time"
          : "No slots available on this date",
        "",
      ),
      ...data.availableSlots.map((t) => new Option(t, t)),
    );
    slot.disabled = !data.availableSlots.length;
    book.disabled = !data.availableSlots.length;
  } catch (error) {
    if (version === slotVersion) SafeSight.message(error.message, true);
  }
}
doctor.addEventListener("change", loadSlots);
date.addEventListener("change", loadSlots);
(async () => {
  try {
    const data = await SafeSight.request("/public/doctors");
    doctor.replaceChildren(
      new Option(
        data.doctors.length
          ? "Choose a doctor"
          : "No doctors are currently available",
        "",
      ),
      ...data.doctors.map(
        (d) =>
          new Option(
            `${d.name} · ${d.specialization} · ₹${d.consultationFee}`,
            d.id,
          ),
      ),
    );
    doctor.disabled = !data.doctors.length;
  } catch (error) {
    doctor.replaceChildren(new Option("Unable to load doctors", ""));
    SafeSight.message(error.message, true);
  }
})();
document.getElementById("booking").addEventListener("submit", async (e) => {
  e.preventDefault();
  book.disabled = true;
  SafeSight.message("");
  try {
    const body = Object.fromEntries(new FormData(e.target));
    if (!body.dateOfBirth) delete body.dateOfBirth;
    const data = await SafeSight.request("/public/appointments", {
      method: "POST",
      body: JSON.stringify(body),
    });
    e.target.reset();
    slot.disabled = true;
    slot.replaceChildren(new Option("Select doctor and date", ""));
    SafeSight.message(
      `Request received for ${data.appointment.appointmentDate.slice(0, 10)} at ${data.appointment.appointmentTime} IST. Status: ${data.appointment.status}. Reference: ${data.appointment.id}. Please contact the clinic for confirmation or changes.`,
    );
  } catch (error) {
    await loadSlots();
    SafeSight.message(error.message, true);
  }
});
