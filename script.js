const menuToggle=document.querySelector(".menu-toggle"),mainNav=document.querySelector(".main-nav");menuToggle?.addEventListener("click",()=>mainNav.classList.toggle("open"));
document.querySelectorAll(".main-nav a").forEach(a=>a.addEventListener("click",()=>mainNav.classList.remove("open")));
document.querySelectorAll(".day-tab").forEach(button=>button.addEventListener("click",()=>{document.querySelectorAll(".day-tab").forEach(tab=>tab.classList.toggle("active",tab===button));document.querySelectorAll(".agenda-day").forEach(day=>day.classList.toggle("active",day.id===button.dataset.day))}));
