// create environment object
var pjsEnv = {};

// get the PJS code
pjsEnv.codeElement = document.getElementById("PJS_code");

if (pjsEnv.codeElement) {
  // default the canvas width
  if (!pjsEnv.codeElement.dataset.width) {
    pjsEnv.codeElement.dataset.width = 400;
  }
  // default the canvas height
  if (!pjsEnv.codeElement.dataset.height) {
    pjsEnv.codeElement.dataset.height = 400;
  }
  
  // create canvas
  pjsEnv.canvas = document.createElement("canvas");
  pjsEnv.canvas.id = "pjs-canvas";
  pjsEnv.codeElement.parentNode.replaceChild(pjsEnv.canvas, pjsEnv.codeElement);
  
  // all the code
  pjsEnv.PJS_start = 
  "new Processing(pjsEnv.canvas, function(processingInstance) {\n" +
  "  processingInstance.size(" + pjsEnv.codeElement.dataset.width + ", " + pjsEnv.codeElement.dataset.height + ");\n" +
  "  processingInstance.background(0xFFF);\n" +
  "  var mouseIsPressed = false;\n" +
  "  processingInstance.mousePressed = function() {\n" +
  "    mouseIsPressed = true;\n" +
  "  };\n" +
  "  processingInstance.mouseClicked = function() {\n" +
  "    mouseIsPressed = false;\n" +
  "  };\n" +
  "  processingInstance.mouseReleased = function() {\n" +
  "    mouseIsPressed = false;\n" +
  "  };\n" +
  "  var keyIsPressed = false;\n"+
  "  processingInstance.keyPressed = function() {\n" +
  "    keyIsPressed = true;\n" +
  "  };\n" +
  "  processingInstance.keyReleased = function() {\n" +
  "    keyIsPressed = false;\n" +
  "  };\n" +
  "  function getSound(s) {\n" +
  "    var url = 'sounds/' + s + '.mp3';\n" +
  "    return new Audio(url);\n" +
  "  }\n" +
  "  function playSound(s) {\n" +
  "    s.play();\n" +
  "  }\n" +
  "  function getImage(s, type, callback) {\n" +
  "    s = 'https://www.kasandbox.org/programming-images/' + s + '.png';\n" +
  "    var img = processingInstance.loadImage(s, type, callback);\n" +
  "    processingInstance.externals.sketch.imageCache.add(s);\n" +
  "    return img\n" +
  "  }\n" +
  "  pjsEnv.canvas.onmousemove = function() {\n" +
  "    processingInstance.mouseY -= document.documentElement.scrollTop;\n" + 
  "  };\n" +
  "  processingInstance.angleMode = 'degrees';\n" +
  "  var getImageImages = ['animals/boxer-laying-down','animals/butterfly','animals/cat','animals/collies','animals/dog_sleeping-puppy','animals/fox','animals/kangaroos','animals/rabbit','animals/shark','animals/sleeping-puppy','creatures/Hopper-Jumping','avatars/aqualine-sapling','avatars/aqualine-seed','avatars/aqualine-seedling','avatars/aqualine-tree','avatars/aqualine-ultimate','avatars/avatar-team','avatars/cs-hopper-cool','avatars/cs-hopper-happy','avatars/cs-hopper-jumping','avatars/cs-ohnoes','avatars/cs-winston-baby','avatars/cs-winston','avatars/duskpin-sapling','avatars/duskpin-seed','avatars/duskpin-seedling','avatars/duskpin-tree','avatars/duskpin-ultimate','avatars/leaf-blue','avatars/leaf-green','avatars/leaf-grey','avatars/leaf-orange','avatars/leaf-red','avatars/leaf-yellow','avatars/leafers-sapling','avatars/leafers-seed','avatars/leafers-seedling','avatars/leafers-tree','avatars/leafers-ultimate','avatars/marcimus-orange','avatars/marcimus-purple','avatars/marcimus-red','avatars/marcimus','avatars/mr-pants-green','avatars/mr-pants-orange','avatars/mr-pants-pink','avatars/mr-pants-purple','avatars/mr-pants-with-hat','avatars/mr-pants','avatars/mr-pink-green','avatars/mr-pink-orange','avatars/mr-pink','avatars/mystery-2','avatars/old-spice-man-blue','avatars/old-spice-man','avatars/orange-juice-squid','avatars/piceratops-sapling','avatars/piceratops-seed','avatars/piceratops-seedling','avatars/piceratops-tree','avatars/piceratops-ultimate','avatars/primosaur-sapling','avatars/primosaur-seed','avatars/primosaur-seedling','avatars/primosaur-tree','avatars/primosaur-ultimate','avatars/purple-pi-pink','avatars/purple-pi-teal','avatars/purple-pi','avatars/questionmark','avatars/robot_female_1','avatars/robot_female_2','avatars/robot_female_3','avatars/robot_male_1','avatars/robot_male_2','avatars/robot_male_3','avatars/spunky-sam-green','avatars/spunky-sam-orange','avatars/spunky-sam-red','avatars/spunky-sam','avatars/starky-sapling','avatars/starky-seed','avatars/starky-seedling','avatars/starky-tree','avatars/starky-ultimate','creatures/BabyWinston','creatures/Hopper-Cool','creatures/Hopper-Happy','creatures/OhNoes-Happy','creatures/OhNoes-Hmm','creatures/OhNoes','creatures/Winston','cute/Blank','cute/BrownBlock','cute/CharacterBoy','cute/CharacterCatGirl','cute/CharacterHornGirl','cute/CharacterPinkGirl','cute/CharacterPrincessGirl','cute/ChestClosed','cute/ChestLid','cute/ChestOpen','cute/DirtBlock','cute/DoorTallClosed','cute/DoorTallOpen','cute/EnemyBug','cute/GemBlue','cute/GemGreen','cute/GemOrange','cute/GrassBlock','cute/Heart','cute/Key','cute/None','cute/PlainBlock','cute/RampEast','cute/RampNorth','cute/RampSouth','cute/RampWest','cute/Rock','cute/RoofEast','cute/RoofNorth','cute/RoofNorthEast','cute/RoofNorthWest','cute/RoofSouth','cute/RoofSouthEast','cute/RoofSouthWest','cute/RoofWest','cute/Selector','cute/ShadowEast','cute/ShadowNorth','cute/ShadowNorthEast','cute/ShadowNorthWest','cute/ShadowSideWest','cute/ShadowSouth','cute/ShadowSouthEast','cute/ShadowSouthWest','cute/ShadowWest','cute/Star','cute/StoneBlock','cute/StoneBlockTall','cute/TreeShort','cute/TreeTall','cute/TreeUgly','cute/WallBlock','cute/WallBlockTall','cute/WaterBlock','cute/WindowTall','cute/WoodBlock','food/berries','food/brussels-sprouts','food/coffee-beans','food/fish_grilled-snapper','food/grapes','food/ice-cream','food/oysters','food/potato-chips','food/shish-kebab','food/tomatoes','insideout/layer0blur0','insideout/layer0blur10','insideout/layer0blur20','insideout/layer0blur40','insideout/layer0blur80','insideout/layer1blur0','insideout/layer1blur10','insideout/layer1blur20','insideout/layer1blur40','insideout/layer1blur80','insideout/layer2blur0','insideout/layer2blur10','insideout/layer2blur20','insideout/layer2blur40','insideout/layer2blur80','insideout/layer3blur0','insideout/layer3blur10','insideout/layer3blur100','insideout/layer3blur20','insideout/layer3blur40','insideout/layer3blur80','insideout/shot1_layer0blur0','insideout/shot1_layer0blur10','insideout/shot1_layer0blur20','insideout/shot1_layer0blur40','insideout/shot1_layer0blur80','insideout/shot1_layer1blur0','insideout/shot1_layer1blur10','insideout/shot1_layer1blur20','insideout/shot1_layer1blur40','insideout/shot1_layer1blur80','insideout/shot1_layer2blur0','insideout/shot1_layer2blur10','insideout/shot1_layer2blur20','insideout/shot1_layer2blur40','insideout/shot1_layer2blur80','insideout/shot1_layer3blur0','insideout/shot1_layer3blur10','insideout/shot1_layer3blur20','insideout/shot1_layer3blur40','insideout/shot1_layer3blur80','insideout/shot1_layer4blur0','insideout/shot1_layer4blur10','insideout/shot1_layer4blur20','insideout/shot1_layer4blur40','insideout/shot1_layer4blur80','insideout/shot1_layer5blur0','insideout/shot1_layer5blur10','insideout/shot1_layer5blur20','insideout/shot1_layer5blur40','insideout/shot1_layer5blur80','insideout/shot2_layer0blur10','insideout/shot2_layer0blur20','insideout/shot2_layer0blur40','insideout/shot2_layer0blur80','insideout/shot2_layer1blur10','insideout/shot2_layer1blur20','insideout/shot2_layer1blur40','insideout/shot2_layer1blur80','insideout/shot2_layer2blur10','insideout/shot2_layer2blur20','insideout/shot2_layer2blur40','insideout/shot2_layer2blur80','insideout/shot2_layer3blur10','insideout/shot2_layer3blur20','insideout/shot2_layer3blur40','insideout/shot2_layer3blur80','insideout/shot2_layer4blur10','insideout/shot2_layer4blur20','insideout/shot2_layer4blur40','insideout/shot2_layer4blur80','landscapes/beach-in-hawaii','landscapes/beach-waves-at-sunset','landscapes/beach-waves-at-sunset2','landscapes/beach-waves-daytime','landscapes/clouds-from-plane','landscapes/fields-of-grain','landscapes/lake-steam-rising','landscapes/lava','landscapes/mountain_matterhorn','landscapes/mountains-and-lake','landscapes/sand-dunes','misc/tim-berners-lee','pixar/Incredibles_a_fill','pixar/Incredibles_a_fill_wFog','pixar/Incredibles_a_key','pixar/Incredibles_a_key_wFog','pixar/Incredibles_bnc','pixar/Incredibles_fillExt','pixar/Incredibles_fillInt','pixar/Incredibles_fill_wFog','pixar/Incredibles_kck','pixar/Incredibles_key','pixar/Incredibles_key_wFog','pixar/Incredibles_target','pixar/army2','pixar/bing1','pixar/bing2','pixar/cars1','pixar/food1','pixar/lamp','pixar/rat_1','pixar/rat_2','pixar/rat_3','scratchpads/colorpicker_hsb_b','scratchpads/colorpicker_hsb_s','scratchpads/colorpicker_overlay','scratchpads/colorpicker_rgb_g','scratchpads/colorpicker_select','scratchpads/cool-critter','scratchpads/error-buddy','scratchpads/happy-critter','scratchpads/jumping-critter','scratchpads/leaf-green','scratchpads/leaf-orange','scratchpads/leaf-red','scratchpads/leaf-yellow','scratchpads/speech-arrow','scratchpads/topic-drawing','scratchpads/topic-user-interaction','seasonal/father-winston','seasonal/fireworks-in-sky','seasonal/fireworks-scattered','seasonal/gingerbread-house','seasonal/gingerbread-man','seasonal/hannukah-menorah','seasonal/hopper-partying','seasonal/house-with-lights','seasonal/reindeer-with-hat','seasonal/snow-crystal1','seasonal/snow-crystal3','seasonal/snownoes','seasonal/stocking-empty','seasonal/xmas-ornament-boat','seasonal/xmas-ornaments','seasonal/xmas-scene-holly-border','seasonal/xmas-tree','space/0','space/1','space/2','space/3','space/4','space/5','space/6','space/7','space/8','space/9','space/background','space/beetleship','space/collisioncircle','space/girl1','space/girl2','space/girl3','space/girl4','space/girl5','space/healthheart','space/minus','space/octopus','space/planet','space/plus','space/rocketship','space/star','animals/birds_rainbow-lorakeets','animals/komodo-dragon','animals/snake_green-tree-boa','landscapes/beach-sunset','landscapes/beach-with-palm-trees','landscapes/fields-of-wine','landscapes/mountains-in-hawaii','food/bananas','food/cake','food/croissant','food/fruits','food/strawberries','animals/cheetah','animals/butterfly_monarch','animals/crocodiles','animals/dogs_collies','animals/horse','animals/penguins','animals/retriever','animals/spider','landscapes/beach-at-dusk','landscapes/beach','landscapes/crop-circle','landscapes/lake','landscapes/lotus-garden','landscapes/mountains-sunset','landscapes/waterfall_niagara-falls','food/broccoli','food/chocolates','food/dumplings','food/hamburger','food/mushroom','food/pasta','food/potatoes','food/sushi','seasonal/fireworks-2015','seasonal/fireworks-over-harbor','seasonal/gingerbread-family','seasonal/gingerbread-houses','seasonal/hannukah-dreidel','seasonal/hopper-elfer','seasonal/hopper-reindeer','seasonal/reindeer','seasonal/snow-crystal2','seasonal/snowy-slope-with-trees','seasonal/xmas-cookies','seasonal/xmas-ornament-on-tree','seasonal/xmas-presents','seasonal/xmas-tree-with-presents','seasonal/xmas-wreath','pixar/army1','pixar/bedspread','pixar/bopeep','pixar/floorplanes','scratchpads/colorpicker_background','scratchpads/colorpicker_submit','scratchpads/colorpicker_rgb_r','scratchpads/colorpicker_rgb_b','scratchpads/colorpicker_hsb_h','scratchpads/colorpicker_hex','scratchpads/colorpicker_indic','scratchpads/ui-icons_808080_256x240','scratchpads/topic-programming-basics','scratchpads/topic-animation','scratchpads/select','seasonal/disco-ball','misc/boxmodel','seasonal/snowman','seasonal/santa-with-bag','seasonal/penguin-with-presents','animals/boxer-getting-tan','animals/boxer-wagging-tongue','misc/tim-berners-lee-webpage','seasonal/red-nosed-winston','avatars/mystery-1','insideout/shot2_layer0blur0','insideout/shot2_layer1blur0','insideout/shot2_layer2blur0','insideout/shot2_layer4blur0','insideout/shot2_layer3blur0','pixar/rat_2','pixar/luxoball','pixar/buzz','pixar/ham'];\n" +
  "  var expectedGetImagesCaches = 0;\n" +
  "  var loadedGetImagesCaches = 0;\n" +
  "  for (var i = 0; i < getImageImages.length; i++) {\n" +
  "    var s = getImageImages[i];\n" +
  "    if (pjsEnv.code.includes(s)) {\n" +
  "      expectedGetImagesCaches++;\n" +
  "      getImage(s, '', function () {\n" +
  "        loadedGetImagesCaches++;\n" +
  "      });\n" +
  "    }\n" +
  "  };\n" +
  "  processingInstance.draw = function(){/*Draw needs to contain a value at the start of the program for PJS to run it.*/};\n" +
  "  var runStartInterval = setInterval(function () {\n" +
  "    if (loadedGetImagesCaches === expectedGetImagesCaches) {\n" +
  "      with (processingInstance) {\n";
  
  pjsEnv.PJS_end = 
  "\n    }\n" +
  "      if (typeof draw !== 'undefined') {\n" +
  "        processingInstance.draw = draw;\n" +
  "      }\n" +
  "      clearInterval(runStartInterval);\n" +
  "    }\n" +
  "  }, 50);\n" +
  "  \n" +
  "});";
  
  pjsEnv.replaceAll = function(string, oldTxt, newTxt){
    while (string.includes(oldTxt)) {
      string = string.replace(oldTxt, newTxt);
    }
    return string;
  };
  
  // create the script to run the code
  pjsEnv.run = document.createElement("script");
  pjsEnv.run.id = "pjs-runScript";
  pjsEnv.code = pjsEnv.replaceAll(pjsEnv.codeElement.innerHTML, "this.__frameRate", "__frameRate");
  pjsEnv.code = pjsEnv.replaceAll(pjsEnv.code, "this.cursor", "cursor");
  pjsEnv.code = pjsEnv.replaceAll(pjsEnv.code, 'this[["KAInfiniteLoopSetTimeout"]]', "return ");	
  pjsEnv.code = pjsEnv.replaceAll(pjsEnv.code, 'this[["KAInfiniteLoopSetTimeout"][0]]', "return ");	
  pjsEnv.code = pjsEnv.replaceAll(pjsEnv.code, 'this[["KAInfiniteLoopCount"]] = ', "return ");	
  	
  pjsEnv.code = pjsEnv.replaceAll(pjsEnv.code, "this[['KAInfiniteLoopSetTimeout']]", "return ");	
  pjsEnv.code = pjsEnv.replaceAll(pjsEnv.code, "this[['KAInfiniteLoopSetTimeout'][0]]", "return ");	
  pjsEnv.code = pjsEnv.replaceAll(pjsEnv.code, "this[['KAInfiniteLoopCount']] = ", "return ");	
  pjsEnv.code = pjsEnv.replaceAll(pjsEnv.code, '.LoopProtector.prototype.leave = function() {};', "");
  pjsEnv.run.innerHTML = pjsEnv.PJS_start + pjsEnv.code + pjsEnv.PJS_end;
  
  // import KA Processing.js if its not already imported
  if (!document.getElementById("ka_pjs_source")) {
    pjsEnv.lib = document.createElement("script");
    pjsEnv.lib.id = "ka_pjs_source";
    pjsEnv.lib.src = "https://cdn.jsdelivr.net/gh/Khan/processing-js@master/processing.js";
    document.head.appendChild(pjsEnv.lib);
  }
  
  // once Processing.js is initialized, run the code
  pjsEnv.loadLib = setInterval(function(){
    if (typeof Processing !== "undefined") {
      document.body.appendChild(pjsEnv.run);
      console.log("PJS Initialized");
      clearInterval(pjsEnv.loadLib);
    } else {
      console.log("Awaiting PJS Initialization. . .");
    }
  }, 20);

// post an error if there is not code
} else {
  console.log("ERROR: PJS_code not found");
}
