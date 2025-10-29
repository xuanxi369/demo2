const $ = s => document.querySelector(s);
const API = "/api/auth";
const gotoApp = () => location.href = "index.html";

// Tab 切换
document.querySelectorAll(".tab").forEach(btn=>{
  btn.onclick = () => {
    document.querySelectorAll(".tab").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".panel").forEach(p=>p.classList.remove("show"));
    $("#panel-" + btn.dataset.tab).classList.add("show");
  };
});

// 登录 Step1：校验密码并发送验证码
$("#login-send").onclick = async () => {
  const email = $("#login-email").value.trim();
  const password = $("#login-password").value;
  $("#login-msg").textContent = "正在校验并发送验证码…";
  const res = await fetch(`${API}/login/start`, {
    method: "POST", credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok || !data.ok) { $("#login-msg").textContent = `失败：${data.error || res.status}`; return; }
  $("#login-msg").textContent = "验证码已发送到邮箱，请查收";
  $("#login-code-row").classList.remove("hidden");
};

// 登录 Step2：提交验证码完成登录
$("#login-verify").onclick = async () => {
  const email = $("#login-email").value.trim();
  const code = $("#login-code").value.trim();
  $("#login-msg").textContent = "正在验证验证码…";
  const res = await fetch(`${API}/login/verify`, {
    method: "POST", credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code })
  });
  const data = await res.json();
  if (!res.ok || !data.ok) { $("#login-msg").textContent = `失败：${data.error || res.status}`; return; }
  $("#login-msg").textContent = "登录成功，正在进入系统…";
  gotoApp();
};

// 注册：发送验证码
$("#reg-send").onclick = async () => {
  const email = $("#reg-email").value.trim();
  const res = await fetch(`${API}/send-code`, {
    method: "POST", credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, purpose: "register" })
  });
  const data = await res.json();
  $("#reg-msg").textContent = res.ok && data.ok ? "验证码已发送" : `失败：${data.error || res.status}`;
};

// 注册：提交注册
$("#reg-submit").onclick = async () => {
  const email = $("#reg-email").value.trim();
  const username = $("#reg-username").value.trim();
  const password = $("#reg-password").value;
  const code = $("#reg-code").value.trim();
  $("#reg-msg").textContent = "正在注册…";
  const res = await fetch(`${API}/register`, {
    method: "POST", credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password, code })
  });
  const data = await res.json();
  if (!res.ok || !data.ok) { $("#reg-msg").textContent = `失败：${data.error || res.status}`; return; }
  $("#reg-msg").textContent = "注册并登录成功，正在进入系统…";
  gotoApp();
};
