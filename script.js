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
  const memberRate = membership === "member";
  const includesDinner = option === "conference-and-gala";
  const amount = includesDinner
    ? (earlyBird || memberRate ? 10000 : 13000)
    : (earlyBird || memberRate ? 8000 : 10000);

  subtotalAmount.textContent = `NT$${amount.toLocaleString("en-US")}`;
  const rateLabel = memberRate
    ? "6GIF member rate · available at all times / 6GIF 會員優惠價（全期間適用）"
    : earlyBird
      ? "Early-bird rate · valid through 31 August 2026 / 早鳥價，有效至 2026 年 8 月 31 日"
      : "Regular rate / 一般定價";
  const dinnerLabel = includesDinner
    ? (earlyBird || memberRate
      ? " · Conference + VIP Gala Dinner total NT$10,000 / 會議及 VIP 晚宴總價 NT$10,000"
      : " · Conference + VIP Gala Dinner total NT$13,000 / 會議及 VIP 晚宴總價 NT$13,000")
    : " · Conference Only / 僅參加會議";
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

function clearFieldError(field) {
  const wrapper = field.closest(".field, .privacy-box");
  wrapper?.classList.remove("has-error");
  wrapper?.querySelector(".field-error")?.remove();
  field.removeAttribute("aria-invalid");
}

function showFieldError(field) {
  const wrapper = field.closest(".field, .privacy-box");
  if (!wrapper) return;
  clearFieldError(field);
  wrapper.classList.add("has-error");
  field.setAttribute("aria-invalid", "true");
  const message = document.createElement("span");
  message.className = "field-error";
  message.textContent = field.validity.valueMissing
    ? "This field is required / 此欄位為必填"
    : "Please enter a valid format / 請輸入正確格式";
  wrapper.append(message);
}

const validationFields = registrationForm
  ? [...registrationForm.querySelectorAll("input, select, textarea")].filter((field) => !field.closest(".website-field"))
  : [];

validationFields.forEach((field) => {
  field.addEventListener("input", () => {
    if (field.validity.valid) clearFieldError(field);
  });
  field.addEventListener("change", () => {
    if (field.validity.valid) clearFieldError(field);
  });
});

registrationForm?.addEventListener("submit", (event) => {
  const invalidFields = validationFields.filter((field) => !field.validity.valid);
  validationFields.forEach((field) => clearFieldError(field));

  if (invalidFields.length) {
    event.preventDefault();
    invalidFields.forEach(showFieldError);
    setRegistrationStatus("error", "Please complete all required fields shown below. / 請完成下方所有必填欄位。");
    invalidFields[0].focus({ preventScroll: true });
    invalidFields[0].scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

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

const speakerProfiles = {
  "kentaro-sakata": {
    name: "Kentaro Sakata",
    role: "Manager, Global Standardization Section · SoftBank Corp.",
    paragraphs: [
      "Kentaro Sakata is Manager of the Global Standardization Section at SoftBank Corp. Since 2015, he has represented Japan in international standardization activities at ITU-R and APT, contributing to spectrum discussions for terrestrial systems, IMT, high-altitude platform stations (HAPS), and HIBS. His work also supports the development of IMT-2030 (6G) radio interfaces and the technical framework required for resilient, extended connectivity.",
      "He contributed to WRC-23 Agenda Item 1.4, which identified the 700–900 MHz, 1.7–2.1 GHz, and 2.6 GHz frequency bands for HIBS. Within ITU-R Working Party 5D, he participates in defining minimum technical performance requirements for IMT-2030, including “Resilience and Extended Connectivity.” His experience connects spectrum planning, regulatory coordination, and technology standardization, with particular focus on how high-altitude platform systems can complement terrestrial networks and extend mobile coverage. He also brings sustained experience from Japan’s delegation to international consensus-building processes.",
    ],
  },
  "james-shue": {
    name: "James Shue",
    role: "Senior Vice President & CTO · Pegatron",
    paragraphs: [
      "James Shue serves as Senior Vice President and Chief Technology Officer at Pegatron Corporation. He earned his Ph.D. in Electrical Engineering from the University of Florida and currently oversees Pegatron’s Research and Technology Center, which plays a central role in the company’s exploration of next-generation communications and computing technologies.",
      "His work covers 5G and emerging 6G technologies, All-Photonics Network architectures, and Data Center Interconnect development. Through these activities, he helps connect advanced research with practical technology planning and future product development. He also participates actively in industry events and technical exchanges related to next-generation networks. His current focus is on the technologies and system capabilities required to support faster, more flexible, and more sustainable global connectivity, while preparing Pegatron to respond to the evolving infrastructure and application requirements of the 6G era. This work helps Pegatron prepare for worldwide changes in communications and data systems.",
    ],
  },
  "harald-haas": {
    name: "Harald Haas",
    role: "Van Eck Professor, University of Cambridge · Founder & CSO, pureLiFi Ltd.",
    paragraphs: [
      "Harald Haas is the Van Eck Professor of Engineering at the University of Cambridge, where he leads the LiFi Research and Development Centre. He also directs the UK National Future Connectivity Hub on the Network of Networks, TITAN, and serves as lead co-director of the Federated Telecoms Hub. He received his Ph.D. from the University of Edinburgh in 2001 and co-founded pureLiFi Ltd.",
      "His research combines photonics, communication theory, and signal processing to advance optical wireless communications. He has co-authored more than 850 journal and conference papers, received over 71,000 Google Scholar citations, and holds more than 50 patents. His TED and TEDx talks have attracted over 5.7 million views. His honours include the Royal Society Wolfson Research Merit Award, the IEEE VTS James Evans Avant Garde Award, and the Humboldt Research Award. He is a Fellow of the IEEE and several leading UK engineering and scientific institutions.",
    ],
  },
  "i-kang-fu": {
    name: "I-Kang Fu",
    role: "Senior Director · MediaTek",
    paragraphs: [
      "I-Kang Fu is Senior Director of Technology in MediaTek’s Advanced Communication Technology Division. He leads research, prototyping, and standardization programs for next-generation mobile communications, while contributing to technology strategy, partnerships, and product planning. His expertise spans WiMAX, LTE, 5G NR, non-terrestrial networks, and emerging 6G systems.",
      "He spearheaded MediaTek’s NTN satellite communications program from initial concepts and proof-of-concept prototypes through system engineering and commercial evaluation. This work supported MediaTek’s contributions to 3GPP Releases 17 through 20 and several early field demonstrations using operational GEO and LEO satellite constellations. Fu joined MediaTek in 2008 after earning his doctorate from National Chiao Tung University. Since 2018, he has chaired the TAICS Advanced Mobile Communication Technical Committee. He received the MediaTek Innovation Award in 2023 and represented MediaTek in receiving Taiwan’s National Industrial Innovation Award in 2025. He currently supports MediaTek’s 6G research, prototyping, and standardization toward commercialization in the 2030s.",
    ],
  },
  "hyeonwoo-lee": {
    name: "HyeonWoo Lee",
    role: "Vice Chair, 6G Forum · Professor, Dankook University",
    paragraphs: [
      "HyeonWoo Lee is a Professor at Dankook University in Korea, Vice Chair of the TTA Mobile Standard Committee, and Vice Chair of the 6G Forum Executive Committee. His work focuses on 5G and 6G mobile communications, international standards, and research and development strategy.",
      "From 2009 to 2013, he served as a National R&D Program Director under Korea’s Ministry of Knowledge Economy, helping guide national technology programs and industry research priorities. Before entering academia and public program leadership, he worked at Samsung Electronics from 1984 to 2009 and led its Global Standard and Research Laboratory. Lee received his B.S.E.E. from Seoul National University in 1985 and his M.B.A. from Sogang University in 1989. He later earned his M.E. and Ph.D. from KAIST in 1994 and 2003, respectively. He is a member of KICS, IEEE, and IEICE.",
    ],
  },
  "pang-an-ting": {
    name: "Pang-An Ting",
    role: "Vice President, ITRI · General Director, ICL, ITRI",
    paragraphs: [
      "Pang-An Ting is Vice President of ITRI and General Director of its Information and Communications Research Laboratories in Hsinchu, Taiwan. He received his B.S. from National Taiwan University of Science and Technology, and his M.S. and Ph.D. in electrical engineering from National Tsing Hua University. He also earned an EMBA from National Chiao Tung University in 2017.",
      "His research interests include wireless communications, statistical signal processing, and VLSI signal processing. He has contributed to chipset development for Wi-Fi, WCDMA, WiMAX, LTE-Advanced, and 5G NR systems. At ITRI, he leads research and development in LTE-Advanced and 5G NR base-station technologies, including baseband processing, protocol stacks, and participation in 3GPP RAN1 and RAN2 standardization. Ting also leads Taiwan’s national 6G technology research and development project, coordinating work that advances next-generation wireless technologies and strengthens Taiwan’s role in international communications innovation.",
    ],
  },
};

const speakerProfileModal = document.getElementById("speaker-profile-modal");
const speakerProfileName = document.getElementById("speaker-profile-name");
const speakerProfileRole = document.getElementById("speaker-profile-role");
const speakerProfileCopy = document.getElementById("speaker-profile-copy");
let lastProfileTrigger = null;

function closeSpeakerProfile() {
  if (!speakerProfileModal) return;
  speakerProfileModal.hidden = true;
  document.body.classList.remove("profile-modal-open");
  lastProfileTrigger?.focus();
}

document.querySelectorAll("[data-speaker-profile]").forEach((button) => {
  button.addEventListener("click", () => {
    const profile = speakerProfiles[button.dataset.speakerProfile];
    if (!profile || !speakerProfileModal || !speakerProfileName || !speakerProfileRole || !speakerProfileCopy) return;

    lastProfileTrigger = button;
    speakerProfileName.textContent = profile.name;
    speakerProfileRole.textContent = profile.role;
    speakerProfileCopy.replaceChildren(...profile.paragraphs.map((text) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      return paragraph;
    }));
    speakerProfileModal.hidden = false;
    document.body.classList.add("profile-modal-open");
    speakerProfileModal.querySelector(".speaker-profile-close")?.focus();
  });
});

document.querySelectorAll("[data-close-speaker-profile]").forEach((button) => {
  button.addEventListener("click", closeSpeakerProfile);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && speakerProfileModal && !speakerProfileModal.hidden) {
    closeSpeakerProfile();
  }
});
