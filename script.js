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
  "sarah-skaluba": {
    name: "Sarah Skaluba",
    role: "6G Policy Lead in the Office of Policy and International Affairs · NTIA",
    paragraphs: [
      "Sarah Skaluba serves as the 6G Policy Lead in the Office of Policy and International Affairs, Analysis and Development at NTIA. In this capacity, she is focused on advancing NTIA’s Mission 6G initiative, as well as developing and executing NTIA’s broader 6G strategy. She previously served as Special Policy Advisor detailed to the Office of the Assistant Secretary, where she supported policy matters spanning 5G and Open RAN, the Public Wireless Supply Chain Innovation Fund, and the First Responder Network Authority. From 2022 through 2024, she served as Policy Director for the Innovation Fund, where she led policy development for the US$1.5 billion grant program.",
      "Prior to joining the Department of Commerce, Sarah advised public- and private-sector clients on telecommunications issues as a manager with Access Partnership and advanced a range of digital policies as a Policy Associate with BSA | The Software Alliance. Sarah holds a B.A. in International Studies from the University of Michigan and an M.A. from the Walsh School of Foreign Service at Georgetown. In her free time, she loves to sail in Annapolis and run with Achilles International.",
    ],
  },
  "abhumanyu-gosain": {
    name: "Abhumanyu Gosain",
    role: "Senior Technical Advisor · US Department of Defense Research and Engineering FutureG Office",
    paragraphs: [
      "Abhumanyu Gosain is a Senior Technical Advisor for the U.S. Department of Defense Research and Engineering FutureG Office. He is also a Senior Director for the Institute for Intelligent Networked Systems at Northeastern University, co-Chair of the U.S. FCC 6G Technology Advisory Council, a member of the FCC World Radiocommunication Conference Advisory Committee, and a Senior Advisor for the NTIA Innovation Fund.",
      "He is the Co-PI for the NSF NRDZ EEL program, POSE Open6G and Colosseum program. He is a founding member of the Magma Core Foundation and a university representative to the O-RAN Alliance, AI-RAN Alliance and Next G Alliance. He serves on international project and organizing committees including Japan XGMF, SLICES-EU, OpenRIT6G, 6G Symposium, EuCNC, IEEE INFOCOM, IEEE GLOBECOM and ACM WinTech. He is a U.S. government 3GPP and ITU-R delegate and an IEEE Senior Member. His publications and experience span 5G, 6G, AI and machine learning, edge computing, and the Internet of Things.",
    ],
  },
  "kentaro-sakata": {
    name: "Kentaro Sakata",
    role: "Manager, Global Standardization Section · SoftBank Corp.",
    paragraphs: [
      "Since 2015, Mr. Kentaro Sakata has been actively engaged in international standardization activities at ITU-R and APT as a member of the Japanese delegation. He has contributed to spectrum-related discussions for terrestrial systems, including IMT and HAPS/HIBS, and to the development of IMT-2030 (6G) radio interfaces.",
      "He contributed to the identification of the 700–900 MHz, 1.7–2.1 GHz, and 2.6 GHz frequency bands for HIBS under WRC-23 Agenda Item 1.4. He is also involved in ITU-R WP 5D activities on IMT-2030 minimum technical performance requirements, including “Resilience and Extended Connectivity,” a key element relevant to HAPS/HIBS.",
    ],
  },
  "james-shue": {
    name: "James Shue",
    role: "Senior Vice President & CTO · Pegatron",
    paragraphs: [
      "James Shue serves as Senior Vice President and CTO at Pegatron Corporation. He earned his Ph.D. in Electrical Engineering from the University of Florida. Currently, James Shue oversees Pegatron's Research and Technology Center, which acts as a pivotal role in advancing next-generation communication technologies.",
      "James Shue proactively participates in 5G and 6G events, All-Photonics Network technologies, and Data Center Interconnect (DCI) development. He hopes to cope with the future of global connectivity.",
    ],
  },
  "harald-haas": {
    name: "Harald Haas",
    role: "Van Eck Professor, University of Cambridge · Founder & CSO, pureLiFi Ltd.",
    paragraphs: [
      "Professor Harald Haas received his PhD from the University of Edinburgh, UK, in 2001. He is the Van Eck Professor of Engineering at the University of Cambridge, where he leads the LiFi Research and Development Centre (LRDC). He is the Director of the National Future Connectivity Hub on the Network of Networks, TITAN, and the lead co-director of the Federated Telecoms Hub (FTH). He co-founded pureLiFi Ltd and is a member of the Board.",
      "His research spans photonics, communication theory and signal processing to advance optical wireless communications. He has co-authored over 850 journal and conference papers, with more than 71,000 citations according to Google Scholar, and holds over 50 patents. His two TED talks and one TEDx talk have attracted over 5.7 million views.",
      "His honours include the Royal Society Wolfson Research Merit Award, the IEEE VTS James Evans Avant Garde Award, and the Humboldt Research Award. He is a co-recipient of the IEEE/VTS Neal Shepherd Memorial Best Propagation Award 2026. Haas is an Ambassador of Friedrich-Alexander University Erlangen–Nürnberg. He is a Fellow of the Royal Academy of Engineering, the Royal Society of Edinburgh and the Institution of Engineering and Technology (IET), all in the UK, as well as a Fellow of the IEEE.",
    ],
  },
  "i-kang-fu": {
    name: "I-Kang Fu",
    role: "Senior Director · MediaTek",
    paragraphs: [
      "I-Kang Fu is the Senior Director of Technology in MediaTek Advanced Communication Technology Division. He leads the R&D teams for research, prototype, and standardization projects of next-generation mobile communication technologies. He also contributes to new technology strategy, partnership and product planning.",
      "He has spearheaded MediaTek research and development efforts in NTN satellite communication technology, leading the projects from concept to PoC prototype, and system engineering for commercial evaluation. This work culminated to MediaTek’s leadership and contributions to 3GPP Release-17/18/19/20 standardization of NTN technology, where MediaTek also demonstrated several world’s 1st NTN field experiment success over in-orbit GEO and LEO constellations with partners.",
      "I-Kang Fu’s expertise spans wireless technologies such as 4G WiMAX, 4G LTE, and 5G NR. He is currently contributing MediaTek’s commitment to 6G technology research, prototype and standardization, with commercialization expected in the 2030s.",
      "I-Kang Fu joined MediaTek in 2008 after earning his doctorate from National Chiao-Tung University, Taiwan. He has served as Chairman position of TAICS (Taiwan Association of Information and Communication Standards) Advanced Mobile Communication Technical Committee since 2018. He received MediaTek Innovation Award in 2023. He also represents MediaTek to receive Nation Industrial Innovation Award in 2025.",
    ],
  },
  "hyeonwoo-lee": {
    name: "HyeonWoo Lee",
    role: "Vice Chair, 6G Forum · Professor, Dankook University",
    paragraphs: [
      "LEE, Hyeon Woo is a Professor at DanKook University in Korea, a TTA Mobile Standard Committee vice chair, and a 6G forum executive committee vice chair.",
      "He served as a National R&D Program Director under Ministry of Knowledge Economy of Korea from 2009 until 2013. He was a head of Global Standard & Research Lab. of Samsung Electronics from 1984 until 2009.",
      "He received BSEE from Seoul National University in 1985, MBA from Sogang University in 1989, ME and Ph.D degree at KAIST in 1994 and 2003 respectively.",
      "He works on 5G/6G mobile communication, international standards, and R&D strategy planning. He is a member of KICS, IEEE and IEICE.",
    ],
  },
  "pang-an-ting": {
    name: "Pang-An Ting",
    role: "Vice President, ITRI · General Director, ICL, ITRI",
    paragraphs: [
      "Pang-An Ting is a Taiwanese electrical engineer and researcher, currently serving as the General Director of Information and Communications Labs (ICL) at the Industrial Technology Research Institute (ITRI) in Hsinchu, Taiwan. He received his B.S. degree from the National Taiwan University of Science and Technology in 1991, followed by an M.S. degree and Ph.D. degree in electrical engineering from the Institute of Electrical Engineering at National Tsing Hua University in 1994 and 2006, respectively. In 2017, he also received an EMBA degree from the National Chiao Tung University.",
      "Pang-An Ting's research interests include wireless communications, statistical signal processing, and VLSI signal processing. He has been involved in the design of chipsets for various wireless communication standards, such as WiFi, WCDMA, WiMAX, LTE-A, and 5GNR. He is currently leading ITRI's R&D activities related to LTE-A and 5GNR base station technologies, including baseband and protocol stack, as well as 3GPP RAN1/RAN2 standard participation.",
      "In addition, Pang-An Ting is also the leader of Taiwan's national 6G technology research and development project, further advancing his contributions to the field of wireless communication technology.",
    ],
  },
  "hungyu-wei": {
    name: "Hungyu Wei",
    role: "Professor · National Taiwan University",
    paragraphs: [
      "Hungyu Wei is a Professor in the Department of Electrical Engineering and Graduate Institute of Communications Engineering at National Taiwan University, where he serves as Director of the Graduate Institute of Communications Engineering. He served as Associate Department Chair and Interim Department Chair from 2019 to 2022.",
      "He received his B.S. degree in electrical engineering from National Taiwan University and his M.S. and Ph.D. degrees in electrical engineering from Columbia University. He joined National Taiwan University in 2005. His research interests include next-generation wireless networks, the Internet of Things, and fog and edge computing. He is the Chair of the IEEE 1935 working group for the edge and fog management and orchestration standard.",
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
