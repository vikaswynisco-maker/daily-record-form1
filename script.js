const API_URL =
  "https://script.google.com/macros/s/AKfycbxaYbcaTVjHmruTngOpbh6vM027P9SlNSi4MPM03SY6jsUkZh25siWb-mmvVNmK7mkp-Q/exec";

// ===== ADMIN PIN CONFIG =====
const ADMIN_PIN = "1234"; // 🔴 change PIN here
let isAuthorized = false;

// ===== ON PAGE LOAD =====
window.onload = function () {
  askForPin();
  loadAllData();
};

// ===== ASK FOR PIN =====
function askForPin() {
  const pin = prompt("Enter Admin PIN to submit records:");

  if (pin === ADMIN_PIN) {
    isAuthorized = true;
    enableForm(true);
  } else {
    alert("Invalid PIN ❌ Submission disabled");
    enableForm(false);
  }
}

// ===== ENABLE / DISABLE FORM =====
function enableForm(enable) {
  document.getElementById("date").disabled = !enable;
  document.getElementById("submittedBy").disabled = !enable;
  document.getElementById("file").disabled = !enable;

  const btn = document.querySelector("button");
  btn.disabled = !enable;
  btn.style.background = enable ? "#007bff" : "gray";
}

// ===== LOAD TABLE DATA =====
function loadAllData() {
  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      const tbody = document.querySelector("#dataTable tbody");
      tbody.innerHTML = "";

      data.reverse().forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${formatDate(row.date)}</td>
          <td>${row.submittedBy}</td>
          <td><a href="${row.screenshotLink}" target="_blank">View</a></td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch(() => {
      document.querySelector("#dataTable tbody").innerHTML =
        "<tr><td colspan='3'>Error loading data</td></tr>";
    });
}

// ===== DATE FORMAT =====
function formatDate(dateValue) {
  if (!dateValue) return "";
  return new Date(dateValue).toISOString().split("T")[0];
}

// ===== SUBMIT DATA =====
function submitData() {

  // 🔐 EXTRA SAFETY CHECK
  if (!isAuthorized) {
    alert("You are not authorized to submit ❌");
    return;
  }

  const date = document.getElementById("date").value;
  const submittedBy = document.getElementById("submittedBy").value;
  const file = document.getElementById("file").files[0];
  const status = document.getElementById("status");

  if (!date || !submittedBy || !file) {
    alert("Please fill all fields");
    return;
  }

  status.innerText = "Uploading...";

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.src = reader.result;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const MAX_WIDTH = 1400;
      const scale = Math.min(1, MAX_WIDTH / img.width);

      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const base64 = canvas
        .toDataURL("image/jpeg", 0.85)
        .split(",")[1];

      fetch(API_URL, {
        method: "POST",
        body: new URLSearchParams({
          date,
          submittedBy,
          screenshot: base64
        })
      }).then(() => {
        status.innerText = "Saved successfully ✅";
        document.getElementById("file").value = "";
        loadAllData();
      });
    };
  };
  reader.readAsDataURL(file);
}
