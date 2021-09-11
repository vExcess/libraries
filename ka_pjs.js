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
  "var canvas = document.getElementById('PJS_canvas');\n" +
  "var processing = new Processing(canvas, function(processing) {\n" +
  "  processing.size(" + PJS_run_env.code.dataset.width + ", " + PJS_run_env.code.dataset.height + ");\n" +
  "  processing.background(0xFFF);\n" +
  "  var mouseIsPressed = false;\n" +
  "  processing.mousePressed = function() {\n" +
  "    mouseIsPressed = true;\n" +
  "  };\n" +
  "  processing.mouseReleased = function() {\n" +
  "    mouseIsPressed = false;\n" +
  "  };\n" +
  "  var keyIsPressed = false;\n"+
  "  processing.keyPressed = function() {\n" +
  "    keyIsPressed = true;\n" +
  "  };\n" +
  "  processing.keyReleased = function() {\n" +
  "    keyIsPressed = false;\n" +
  "  };\n" +
  "  function getSound(s) {\n" +
  "    var url = 'sounds/' + s + '.mp3';\n" +
  "    return new Audio(url);\n" +
  "  }\n" +
  "  function playSound(s) {\n" +
  "    s.play();\n" +
  "  }\n" +
  "  function getImage(s) {\n" +
  "    var url = 'https://www.kasandbox.org/programming-images/' + s + '.png';\n" +
  "    processing.externals.sketch.imageCache.add(url);\n" +
  "    return processing.loadImage(url);\n" +
  "  }\n" +
  "  processing.angleMode = 'degrees';\n" +
  "  with(processing) {\n";
  PJS_run_env.PJS_end = 
  "  }\n" +
  "  if (typeof draw !== 'undefined') {\n" +
  "    processing.draw = draw;\n" +
  "  }\n" +
  "});";

  PJS_run_env.run = document.createElement("script");
  PJS_run_env.run.innerHTML = PJS_run_env.PJS_start + PJS_run_env.code.innerHTML + PJS_run_env.PJS_end;

  PJS_run_env.lib = document.createElement("script");
  PJS_run_env.lib.src = "https://cdn.jsdelivr.net/gh/Khan/processing-js@master/processing.js";
  document.body.appendChild(PJS_run_env.lib);

  PJS_run_env.loadLib = setInterval(function(){
    if (typeof Processing !== "undefined") {
      document.body.appendChild(PJS_run_env.run);
      clearInterval(PJS_run_env.loadLib);
    } else {
      console.log("Awaiting PJS Initialization");
    }
  }, 20);

} else {
  console.log("ERROR: PJS_code not found");
}
