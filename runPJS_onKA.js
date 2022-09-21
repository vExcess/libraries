/*
    
    When this script loads it automatically searches for a script that has the id "PJS_code"
    It then replaces that script with a canvas and a script that runs the code in a Processing.js instance
    You can set data-width and data-height for the script. If these are not set then they default to 400.
    The script header should look something like this:
        <script id="PJS_code" type="data" data-width="600" data-height="600">
        
    You can also call createPJS(code, options*) to create a Processing.js instance; its arguments are
        1) a string or function containing PJS code
        2) an object containing options
        
    Using options you can control:
        what canvas to draw to
        where that canvas is located
        the width of the instance
        the height of the instance
        do something when the PJS instance is created
    
    Layout of the options:
        {
            canvas: <HTML_CANVAS_ELEMENT>
            container: <HTML_ELEMENT>
            width: <INTEGER>
            height: <INTEGER>
            callback: <FUNCTION>
        }
        
    Note: The auto-find for a script containing the id "PJS_code" is a legacy feature and is not recommended. It is better to use the createPJS function.
    
*/

console.log("runPJS_onKA.js is deprecated; use runPJS.js instead!!!");
console.log("runPJS_onKA.js is deprecated; use runPJS.js instead!!!");
console.log("runPJS_onKA.js is deprecated; use runPJS.js instead!!!");

function createPJS (code, options) {
    // create environment object
    let pjsEnv = {};
    
    if (!window.pjsEnvironments) {
        window.pjsEnvironments = [];
    }
    window.pjsEnvironments.push(pjsEnv);
    
    function generateCode (filling, canvas, width, height) {
        return `
var pjsEnv = window.pjsEnvironments[${window.pjsEnvironments.length - 1}];
pjsEnv.processing = new Processing(${canvas}, function(processingInstance) {
    processingInstance.size(${width}, ${height});
    processingInstance.background(0, 0, 0, 0);
    processingInstance.angleMode = 'degrees';
    
    pjsEnv.canvas.addEventListener('mousemove', function() {
        processingInstance.mouseY -= document.documentElement.scrollTop; 
    });
    
    function getSound(s) {
        let url = 'sounds/' + s + '.mp3';
        return new Audio(url);
    }
    function playSound(s) {
        s.play();
    }
  
    function getImage(file, callback) {
        file = 'https://cdn.kastatic.org/third_party/javascript-khansrc/live-editor/build/images/' + file + '.png';
        
        let imageCache = processingInstance.externals.sketch.imageCache;
        
        let pimg;
        
        if (imageCache.images[file]) {
            pimg = new processingInstance.PImage(imageCache.images[file]);
            pimg.loaded = true;
        } else {
            let img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = file;
        
            pimg = new processingInstance.PImage();
            pimg.sourceImg = img;
            
            img.onload = function () {
                // change the <img> object into a PImage now that its loaded
                pimg.fromHTMLImageData(img);
                pimg.loaded = true;
                imageCache.add(file, img);
                callback();
            };
        
            img.onerror = function () {
                console.log("Error loading image from " + file);
                callback(true);
            };
        }
        
        return pimg;
    }
  
    let getImageImages = ['animals/boxer-laying-down','animals/butterfly','animals/cat','animals/collies','animals/dog_sleeping-puppy','animals/fox','animals/kangaroos','animals/rabbit','animals/shark','animals/sleeping-puppy','creatures/Hopper-Jumping','avatars/aqualine-sapling','avatars/aqualine-seed','avatars/aqualine-seedling','avatars/aqualine-tree','avatars/aqualine-ultimate','avatars/avatar-team','avatars/cs-hopper-cool','avatars/cs-hopper-happy','avatars/cs-hopper-jumping','avatars/cs-ohnoes','avatars/cs-winston-baby','avatars/cs-winston','avatars/duskpin-sapling','avatars/duskpin-seed','avatars/duskpin-seedling','avatars/duskpin-tree','avatars/duskpin-ultimate','avatars/leaf-blue','avatars/leaf-green','avatars/leaf-grey','avatars/leaf-orange','avatars/leaf-red','avatars/leaf-yellow','avatars/leafers-sapling','avatars/leafers-seed','avatars/leafers-seedling','avatars/leafers-tree','avatars/leafers-ultimate','avatars/marcimus-orange','avatars/marcimus-purple','avatars/marcimus-red','avatars/marcimus','avatars/mr-pants-green','avatars/mr-pants-orange','avatars/mr-pants-pink','avatars/mr-pants-purple','avatars/mr-pants-with-hat','avatars/mr-pants','avatars/mr-pink-green','avatars/mr-pink-orange','avatars/mr-pink','avatars/mystery-2','avatars/old-spice-man-blue','avatars/old-spice-man','avatars/orange-juice-squid','avatars/piceratops-sapling','avatars/piceratops-seed','avatars/piceratops-seedling','avatars/piceratops-tree','avatars/piceratops-ultimate','avatars/primosaur-sapling','avatars/primosaur-seed','avatars/primosaur-seedling','avatars/primosaur-tree','avatars/primosaur-ultimate','avatars/purple-pi-pink','avatars/purple-pi-teal','avatars/purple-pi','avatars/questionmark','avatars/robot_female_1','avatars/robot_female_2','avatars/robot_female_3','avatars/robot_male_1','avatars/robot_male_2','avatars/robot_male_3','avatars/spunky-sam-green','avatars/spunky-sam-orange','avatars/spunky-sam-red','avatars/spunky-sam','avatars/starky-sapling','avatars/starky-seed','avatars/starky-seedling','avatars/starky-tree','avatars/starky-ultimate','creatures/BabyWinston','creatures/Hopper-Cool','creatures/Hopper-Happy','creatures/OhNoes-Happy','creatures/OhNoes-Hmm','creatures/OhNoes','creatures/Winston','cute/Blank','cute/BrownBlock','cute/CharacterBoy','cute/CharacterCatGirl','cute/CharacterHornGirl','cute/CharacterPinkGirl','cute/CharacterPrincessGirl','cute/ChestClosed','cute/ChestLid','cute/ChestOpen','cute/DirtBlock','cute/DoorTallClosed','cute/DoorTallOpen','cute/EnemyBug','cute/GemBlue','cute/GemGreen','cute/GemOrange','cute/GrassBlock','cute/Heart','cute/Key','cute/None','cute/PlainBlock','cute/RampEast','cute/RampNorth','cute/RampSouth','cute/RampWest','cute/Rock','cute/RoofEast','cute/RoofNorth','cute/RoofNorthEast','cute/RoofNorthWest','cute/RoofSouth','cute/RoofSouthEast','cute/RoofSouthWest','cute/RoofWest','cute/Selector','cute/ShadowEast','cute/ShadowNorth','cute/ShadowNorthEast','cute/ShadowNorthWest','cute/ShadowSideWest','cute/ShadowSouth','cute/ShadowSouthEast','cute/ShadowSouthWest','cute/ShadowWest','cute/Star','cute/StoneBlock','cute/StoneBlockTall','cute/TreeShort','cute/TreeTall','cute/TreeUgly','cute/WallBlock','cute/WallBlockTall','cute/WaterBlock','cute/WindowTall','cute/WoodBlock','food/berries','food/brussels-sprouts','food/coffee-beans','food/fish_grilled-snapper','food/grapes','food/ice-cream','food/oysters','food/potato-chips','food/shish-kebab','food/tomatoes','insideout/layer0blur0','insideout/layer0blur10','insideout/layer0blur20','insideout/layer0blur40','insideout/layer0blur80','insideout/layer1blur0','insideout/layer1blur10','insideout/layer1blur20','insideout/layer1blur40','insideout/layer1blur80','insideout/layer2blur0','insideout/layer2blur10','insideout/layer2blur20','insideout/layer2blur40','insideout/layer2blur80','insideout/layer3blur0','insideout/layer3blur10','insideout/layer3blur100','insideout/layer3blur20','insideout/layer3blur40','insideout/layer3blur80','insideout/shot1_layer0blur0','insideout/shot1_layer0blur10','insideout/shot1_layer0blur20','insideout/shot1_layer0blur40','insideout/shot1_layer0blur80','insideout/shot1_layer1blur0','insideout/shot1_layer1blur10','insideout/shot1_layer1blur20','insideout/shot1_layer1blur40','insideout/shot1_layer1blur80','insideout/shot1_layer2blur0','insideout/shot1_layer2blur10','insideout/shot1_layer2blur20','insideout/shot1_layer2blur40','insideout/shot1_layer2blur80','insideout/shot1_layer3blur0','insideout/shot1_layer3blur10','insideout/shot1_layer3blur20','insideout/shot1_layer3blur40','insideout/shot1_layer3blur80','insideout/shot1_layer4blur0','insideout/shot1_layer4blur10','insideout/shot1_layer4blur20','insideout/shot1_layer4blur40','insideout/shot1_layer4blur80','insideout/shot1_layer5blur0','insideout/shot1_layer5blur10','insideout/shot1_layer5blur20','insideout/shot1_layer5blur40','insideout/shot1_layer5blur80','insideout/shot2_layer0blur10','insideout/shot2_layer0blur20','insideout/shot2_layer0blur40','insideout/shot2_layer0blur80','insideout/shot2_layer1blur10','insideout/shot2_layer1blur20','insideout/shot2_layer1blur40','insideout/shot2_layer1blur80','insideout/shot2_layer2blur10','insideout/shot2_layer2blur20','insideout/shot2_layer2blur40','insideout/shot2_layer2blur80','insideout/shot2_layer3blur10','insideout/shot2_layer3blur20','insideout/shot2_layer3blur40','insideout/shot2_layer3blur80','insideout/shot2_layer4blur10','insideout/shot2_layer4blur20','insideout/shot2_layer4blur40','insideout/shot2_layer4blur80','landscapes/beach-in-hawaii','landscapes/beach-waves-at-sunset','landscapes/beach-waves-at-sunset2','landscapes/beach-waves-daytime','landscapes/clouds-from-plane','landscapes/fields-of-grain','landscapes/lake-steam-rising','landscapes/lava','landscapes/mountain_matterhorn','landscapes/mountains-and-lake','landscapes/sand-dunes','misc/tim-berners-lee','pixar/Incredibles_a_fill','pixar/Incredibles_a_fill_wFog','pixar/Incredibles_a_key','pixar/Incredibles_a_key_wFog','pixar/Incredibles_bnc','pixar/Incredibles_fillExt','pixar/Incredibles_fillInt','pixar/Incredibles_fill_wFog','pixar/Incredibles_kck','pixar/Incredibles_key','pixar/Incredibles_key_wFog','pixar/Incredibles_target','pixar/army2','pixar/bing1','pixar/bing2','pixar/cars1','pixar/food1','pixar/lamp','pixar/rat_1','pixar/rat_2','pixar/rat_3','scratchpads/colorpicker_hsb_b','scratchpads/colorpicker_hsb_s','scratchpads/colorpicker_overlay','scratchpads/colorpicker_rgb_g','scratchpads/colorpicker_select','scratchpads/cool-critter','scratchpads/error-buddy','scratchpads/happy-critter','scratchpads/jumping-critter','scratchpads/leaf-green','scratchpads/leaf-orange','scratchpads/leaf-red','scratchpads/leaf-yellow','scratchpads/speech-arrow','scratchpads/topic-drawing','scratchpads/topic-user-interaction','seasonal/father-winston','seasonal/fireworks-in-sky','seasonal/fireworks-scattered','seasonal/gingerbread-house','seasonal/gingerbread-man','seasonal/hannukah-menorah','seasonal/hopper-partying','seasonal/house-with-lights','seasonal/reindeer-with-hat','seasonal/snow-crystal1','seasonal/snow-crystal3','seasonal/snownoes','seasonal/stocking-empty','seasonal/xmas-ornament-boat','seasonal/xmas-ornaments','seasonal/xmas-scene-holly-border','seasonal/xmas-tree','space/0','space/1','space/2','space/3','space/4','space/5','space/6','space/7','space/8','space/9','space/background','space/beetleship','space/collisioncircle','space/girl1','space/girl2','space/girl3','space/girl4','space/girl5','space/healthheart','space/minus','space/octopus','space/planet','space/plus','space/rocketship','space/star','animals/birds_rainbow-lorakeets','animals/komodo-dragon','animals/snake_green-tree-boa','landscapes/beach-sunset','landscapes/beach-with-palm-trees','landscapes/fields-of-wine','landscapes/mountains-in-hawaii','food/bananas','food/cake','food/croissant','food/fruits','food/strawberries','animals/cheetah','animals/butterfly_monarch','animals/crocodiles','animals/dogs_collies','animals/horse','animals/penguins','animals/retriever','animals/spider','landscapes/beach-at-dusk','landscapes/beach','landscapes/crop-circle','landscapes/lake','landscapes/lotus-garden','landscapes/mountains-sunset','landscapes/waterfall_niagara-falls','food/broccoli','food/chocolates','food/dumplings','food/hamburger','food/mushroom','food/pasta','food/potatoes','food/sushi','seasonal/fireworks-2015','seasonal/fireworks-over-harbor','seasonal/gingerbread-family','seasonal/gingerbread-houses','seasonal/hannukah-dreidel','seasonal/hopper-elfer','seasonal/hopper-reindeer','seasonal/reindeer','seasonal/snow-crystal2','seasonal/snowy-slope-with-trees','seasonal/xmas-cookies','seasonal/xmas-ornament-on-tree','seasonal/xmas-presents','seasonal/xmas-tree-with-presents','seasonal/xmas-wreath','pixar/army1','pixar/bedspread','pixar/bopeep','pixar/floorplanes','scratchpads/colorpicker_background','scratchpads/colorpicker_submit','scratchpads/colorpicker_rgb_r','scratchpads/colorpicker_rgb_b','scratchpads/colorpicker_hsb_h','scratchpads/colorpicker_hex','scratchpads/colorpicker_indic','scratchpads/ui-icons_808080_256x240','scratchpads/topic-programming-basics','scratchpads/topic-animation','scratchpads/select','seasonal/disco-ball','misc/boxmodel','seasonal/snowman','seasonal/santa-with-bag','seasonal/penguin-with-presents','animals/boxer-getting-tan','animals/boxer-wagging-tongue','misc/tim-berners-lee-webpage','seasonal/red-nosed-winston','avatars/mystery-1','insideout/shot2_layer0blur0','insideout/shot2_layer1blur0','insideout/shot2_layer2blur0','insideout/shot2_layer4blur0','insideout/shot2_layer3blur0','pixar/rat_2','pixar/luxoball','pixar/buzz','pixar/ham'];
    let expectedGetImagesCaches = 0, loadedGetImagesCaches = 0;
    let instanceSource = ${JSON.stringify(filling)};
    for (var i = 0; i < getImageImages.length; i++) {
        let s = getImageImages[i];
        if (instanceSource.includes(s)) {
            expectedGetImagesCaches++;
            getImage(s, function () {
                loadedGetImagesCaches++;
            });
        }
    }
  
    processingInstance.draw = function(){/* Draw needs to contain a value at the start of the program for PJS to run it. */};

    // ghost data so that programs don't break if they try to access these properties
    processingInstance.KAInfiniteLoopCount = 0;
    processingInstance.KAInfiniteLoopSetTimeout = function(){};
    window.LoopProtector = function(){};

    let runStartInterval = setInterval(function () {
        if (loadedGetImagesCaches === expectedGetImagesCaches) {
            with (processingInstance) {
` + filling + `
            }
            if (typeof draw !== 'undefined') {
                processingInstance.draw = draw;
            }
            clearInterval(runStartInterval);
        }
    }, 50);
});
        `.replaceAll("this.__frameRate", "__frameRate").replaceAll("this.cursor", "cursor");
    }
    
    // if they input code
    if (code) {
        if (typeof code === "function") {
            code = code.toString();
            let functionName = code.slice(code.indexOf("function") + 8, code.indexOf("(")).trim();
            code += "\n" + functionName + "();"
        }
        
        options = options || {};
        
        // create canvas
        pjsEnv.canvas = options.canvas || document.createElement("canvas");
        pjsEnv.canvas.id = pjsEnv.canvas.id || "pjs-canvas";
        if (options.container) {
            options.container.parentNode.replaceChild(pjsEnv.canvas, options.container);
        } else {
            document.body.appendChild(pjsEnv.canvas);
        }
      
        // create the script to run the code
        pjsEnv.runScript = document.createElement("script");
        pjsEnv.runScript.id = "pjs-runScript";
        pjsEnv.runScript.innerHTML = generateCode(
            code, 
            "pjsEnv.canvas", 
            options.width || 400,
            options.height || 400
        );
    } else {
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
            
            // create the script to run the code
            pjsEnv.runScript = document.createElement("script");
            pjsEnv.runScript.id = "pjs-runScript";
            pjsEnv.runScript.innerHTML = generateCode(
                pjsEnv.codeElement.innerHTML, 
                "pjsEnv.canvas", 
                pjsEnv.codeElement.dataset.width || 400,
                pjsEnv.codeElement.dataset.height || 400
            );
        }
    }
    
    // import KA Processing.js if its not already imported
    if (!document.getElementById("ka_pjs_source")) {
        pjsEnv.lib = document.createElement("script");
        pjsEnv.lib.id = "ka_pjs_source";
        pjsEnv.lib.src = "https://cdn.jsdelivr.net/gh/Khan/processing-js@master/processing.js";
        document.head.appendChild(pjsEnv.lib);
    }
  
    // once Processing.js is initialized, run the code
    if (pjsEnv.runScript) {
        let pjsInitTimer = 0;
        pjsEnv.loadLib = setInterval(function(){
            if (typeof Processing !== "undefined") {
                document.body.appendChild(pjsEnv.runScript);
                clearInterval(pjsEnv.loadLib);
                delete pjsEnv.loadLib;
                console.log("PJS Initialized");
                if (options && options.callback) {
                    options.callback(pjsEnv);
                }
            } else if (pjsInitTimer % 50 === 0) {
                console.log("Awaiting PJS Initialization. . .");
            }
            
            pjsInitTimer++;
        }, 20);
    }
    
    return pjsEnv;
}

createPJS();
