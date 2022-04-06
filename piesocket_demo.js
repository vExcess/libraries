var piesocket = new WebSocket("wss://demo.piesocket.com/v3/channel_1?api_key=oCdCMcMPQpbvNjUIzqtvF1d2X2okWpDQj4AwARJuAgtjhzKxVEjQU6IdCjwm&notify_self");

piesocket.onopen = function() {
  alert("Websocket connected");
  piesocket.send(JSON.stringify({
    target: "kasandbox",
    event: "new_joining",
    sender: "SERVER",
    text: "A new user has joined"
  }));
};
piesocket.onmessage = function(message) {
  var payload;
  try {
    payload = JSON.parse(message.data);
  } catch (err) {
    payload = false;
  }
  
  if (payload && payload.target === "kasandbox") {
    document.getElementById("output-frame").contentWindow.postMessage(payload, "*");
  }
};

window.addEventListener("message", function (msg) {
  msg = msg.data;
  
  if (msg.target === "piesocket") {
    msg.target = "kasandbox";
    piesocket.send(JSON.stringify(msg));
    console.log("server pinged");
  }
});
