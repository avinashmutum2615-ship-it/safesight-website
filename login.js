document.getElementById("login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const button = e.target.querySelector("button");
  button.disabled = true;
  SafeSight.message("");
  try {
    const data = await SafeSight.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(new FormData(e.target))),
    });
    sessionStorage.setItem("safesight.token", data.token);
    location.href = "dashboard.html";
  } catch (error) {
    SafeSight.message(error.message, true);
  } finally {
    button.disabled = false;
  }
});
