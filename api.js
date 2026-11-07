window.SafeSight = {
  async request(path, options = {}) {
    const token = sessionStorage.getItem("safesight.token");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);
    try {
      const response = await fetch(
        (window.SAFESIGHT_API_BASE || "").replace(/\/$/, "") + "/api" + path,
        {
          ...options,
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
          },
        },
      );
      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The API could not be reached. Check the backend address in config.js.",
        );
      }
      if (response.status === 401 && token) {
        sessionStorage.removeItem("safesight.token");
        if (!location.pathname.endsWith("login.html"))
          location.href = "login.html";
      }
      if (!response.ok || data.success === false)
        throw new Error(data.message || "The request could not be completed.");
      return data;
    } catch (error) {
      if (error.name === "AbortError")
        throw new Error("The server took too long. Please try again.");
      throw error;
    } finally {
      clearTimeout(timer);
    }
  },
  escape(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  },
  today() {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  },
  logout() {
    sessionStorage.clear();
    location.href = "login.html";
  },
  message(text, error = false) {
    const el = document.getElementById("message");
    el.textContent = text;
    el.className = error ? "notice error" : "notice";
    el.hidden = !text;
  },
};
