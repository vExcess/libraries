var PJS_run_env = {};

PJS_run_env.code = document.getElementById("PJS_code");

if (PJS_run_env.code) {
  if (!PJS_run_env.code.dataset.width) {
    PJS_run_env.code.dataset.width = 400;
  }
  if (!PJS_run_env.code.dataset.height) {
    PJS_run_env.code.dataset.height = 400;
  }

  PJS_run_env.canvas = document.createElement("canvas");
  PJS_run_env.canvas.id = "PJS_canvas";
  document.body.appendChild(PJS_run_env.canvas);

  PJS_run_env.PJS_start = 
  "var canvas = document.getElementById('PJS_canvas');" +
  "var processing = new Processing(canvas, function(processing) {" +
  "  processing.size(" + PJS_run_env.code.dataset.width + ", " + PJS_run_env.code.dataset.height + ");" +
  "  processing.background(0xFFF);" +
  "  var mouseIsPressed = false;" +
  "  processing.mousePressed = function() {" +
  "    mouseIsPressed = true;" +
  "  };" +
  "  processing.mouseReleased = function() {" +
  "    mouseIsPressed = false;" +
  "  };" +
  "  var keyIsPressed = false;"+
  "  processing.keyPressed = function() {" +
  "    keyIsPressed = true;" +
  "  };" +
  "  processing.keyReleased = function() {" +
  "    keyIsPressed = false;" +
  "  };" +
  "  function getSound(s) {" +
  "    var url = 'sounds/' + s + '.mp3';" +
  "    return new Audio(url);" +
  "  }" +
  "  function playSound(s) {" +
  "    s.play();" +
  "  }" +
  "  function getImage(s) {" +
  "    var url = 'https://www.kasandbox.org/programming-images/' + s + '.png';" +
  "    processing.externals.sketch.imageCache.add(url);" +
  "    return processing.loadImage(url);" +
  "  }" +
  "  processing.angleMode = 'degrees';" +
  "  with(processing) {";
  PJS_run_env.PJS_end = 
  "  }" +
  "  if (typeof draw !== 'undefined') {" +
  "    processing.draw = draw;" +
  "  }" +
  "});";

  PJS_run_env.run = document.createElement("script");
  PJS_run_env.run.innerHTML = PJS_run_env.PJS_start + PJS_run_env.code.innerHTML + PJS_run_env.PJS_end;

  PJS_run_env.lib = document.createElement("script");
  PJS_run_env.lib.src = "https://cdn.jsdelivr.net/gh/Khan/processing-js@master/processing.js";
  document.body.appendChild(PJS_run_env.lib);

  PJS_run_env.loadLib = setInterval(function(){
    if(Processing){
      document.body.appendChild(PJS_run_env.run);
      clearInterval(PJS_run_env.loadLib);
    }
  }, 20);

} else {
  console.log("ERROR: PJS_code not found");
}
