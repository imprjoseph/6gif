const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");

menuToggle?.addEventListener("click", () => mainNav.classList.toggle("open"));
document.querySelectorAll(".main-nav a").forEach((link) => {
  link.addEventListener("click", () => mainNav.classList.remove("open"));
});

document.querySelectorAll(".day-tab").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".day-tab").forEach((tab) => {
      tab.classList.toggle("active", tab === button);
    });
    document.querySelectorAll(".agenda-day").forEach((day) => {
      day.classList.toggle("active", day.id === button.dataset.day);
    });
  });
});

const membershipSelect = document.getElementById("membership");
const registrationOption = document.getElementById("registration-option");
const subtotalAmount = document.getElementById("subtotalAmount");
const subtotalNote = document.getElementById("subtotalNote");

function updateSubtotal() {
  if (!membershipSelect || !registrationOption || !subtotalAmount || !subtotalNote) return;

  const membership = membershipSelect.value;
  const option = registrationOption.value;

  if (!membership || !option) {
    subtotalAmount.textContent = "NT$—";
    subtotalNote.textContent = "Select membership status and registration option / 請選擇會員身分及報名方案";
    return;
  }

  const earlyBird = isEarlyBirdPeriod();
  const baseAmount = earlyBird || membership === "member" ? 8000 : 10000;
  const includesDinner = option === "conference-and-gala";
  const specialDinnerPackage = includesDinner && (earlyBird || membership === "member");
  const amount = specialDinnerPackage ? 10000 : baseAmount + (includesDinner ? 3500 : 0);

  subtotalAmount.textContent = `NT$${amount.toLocaleString("en-US")}`;
  const rateLabel = earlyBird
    ? "Early-bird rate · valid through 31 August 2026 / 早鳥價，有效至 2026 年 8 月 31 日"
    : membership === "member"
      ? "6GIF member rate / 6GIF 會員優惠價"
      : "Regular rate / 一般定價";
  const dinnerLabel = specialDinnerPackage
    ? " · Conference + VIP Gala Dinner special total NT$10,000 / 會議及 VIP 晚宴優惠總價 NT$10,000"
    : includesDinner
      ? " · VIP Gala Dinner add-on NT$3,500 / 晚宴加購 NT$3,500"
    : " · No Gala Dinner / 不參加晚宴";
  subtotalNote.textContent = rateLabel + dinnerLabel;
}

function isEarlyBirdPeriod() {
  const dateParts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(dateParts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}` <= "2026-08-31";
}

membershipSelect?.addEventListener("change", updateSubtotal);
registrationOption?.addEventListener("change", updateSubtotal);
updateSubtotal();

const registrationForm = document.getElementById("registration-form");
const registrationSubmit = document.getElementById("registration-submit");
const registrationStatus = document.getElementById("registration-status");
let submissionPending = false;
let submissionTimer;

function setRegistrationStatus(type, message) {
  if (!registrationStatus) return;
  registrationStatus.className = `registration-status${type ? ` is-${type}` : ""}`;
  registrationStatus.textContent = message;
}

registrationForm?.addEventListener("submit", () => {
  submissionPending = true;
  registrationSubmit.disabled = true;
  setRegistrationStatus("pending", "Submitting registration… / 正在送出報名資料…");

  clearTimeout(submissionTimer);
  submissionTimer = window.setTimeout(() => {
    if (!submissionPending) return;
    submissionPending = false;
    registrationSubmit.disabled = false;
    setRegistrationStatus("error", "The request timed out. Please try again. / 連線逾時，請重新送出。");
  }, 45000);
});

window.addEventListener("message", (event) => {
  if (!submissionPending || event.data?.source !== "6gif-registration") return;

  const trustedOrigin = event.origin === "https://script.google.com"
    || event.origin.endsWith(".googleusercontent.com");
  if (!trustedOrigin) return;

  clearTimeout(submissionTimer);
  submissionPending = false;
  registrationSubmit.disabled = false;

  if (event.data.ok) {
    const registrationId = event.data.registrationId
      ? ` (${event.data.registrationId})`
      : "";
    setRegistrationStatus(
      "success",
      `Registration completed${registrationId}. A confirmation email has been sent. / 報名完成，確認信已寄出。`,
    );
    registrationForm.reset();
    updateSubtotal();
    return;
  }

  setRegistrationStatus(
    "error",
    "Registration could not be completed. Please try again. / 報名未完成，請重新送出。",
  );
});
