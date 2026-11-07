let chatThread = null;
const chatForm = document.getElementById("chat"),
  chatLog = document.getElementById("chat-log");
function chatLine(who, text) {
  const p = document.createElement("p");
  const strong = document.createElement("strong");
  strong.textContent = who + ": ";
  p.append(strong, document.createTextNode(text));
  chatLog.append(p);
  chatLog.scrollTop = chatLog.scrollHeight;
}
document.getElementById("new-chat").onclick = () => {
  chatThread = null;
  chatLog.replaceChildren();
};
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = chatForm.elements.message;
  const message = input.value.trim();
  if (!message) return;
  const button = chatForm.querySelector("button");
  button.disabled = true;
  chatLine("You", message);
  input.value = "";
  try {
    const role = window.staffUser?.role;
    const endpoint =
      role === "doctor" || role === "receptionist" ? role : "public";
    const data = await SafeSight.request(`/ai/${endpoint}/chat`, {
      method: "POST",
      body: JSON.stringify({ message, threadId: chatThread }),
    });
    chatThread = data.threadId;
    chatLine("Assistant", data.response);
  } catch (error) {
    chatLine("Notice", error.message);
  } finally {
    button.disabled = false;
  }
});
