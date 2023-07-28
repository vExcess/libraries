var ObjParser = {
    triangulate: function(face) {
        let faces = [];
        for (var prev = 1, i = 2; i < face.length; prev = i++) {
            faces.push([face[0], face[prev], face[i]]);
        }
        return faces;
    },      
    parse: function(fileCode) {
        let objFile = fileCode.split("\n");
    
        let newObj = {
            metadata: [],
            vertices: [],
            faces: []
        };
    
        let vals;
        for (var i = 0; i < objFile.length; i++) {
            var cmd = objFile[i];
            var type = cmd.split(" ")[0];
    
            var valStart = 1;
            while (cmd.charAt(valStart) !== " " && valStart < cmd.length) {
                valStart++;
            }
            while (cmd.charAt(valStart) === " " && valStart < cmd.length) {
                valStart++;
            }
    
            let params, param;
            switch (type) {
                case "#":
                    var comment = cmd.slice(valStart, cmd.length);
                    if (comment.length > 0) {
                        newObj.metadata.push(comment);
                    }
    
                    break;
                case "v":
                    params = cmd.slice(valStart, cmd.length).split(" ");
    
                    for (var p = 0; p < params.length; p++) {
                        param = params[p];
                        if (param.length > 0) {
                            newObj.vertices.push(Number(param));
                        }
                    }

                    break;
                case "f":
                    params = cmd.slice(valStart, cmd.length).split(" ");
                    vals = [];
    
                    for (var p = 0; p < params.length; p++) {
                        param = params[p];
                        if (param.length > 0) {
                            if (param.includes("/")) {
                                param = param.split("/")[0];
                            }
                            vals.push(Number(param) - 1);
                        }
                    }
    
                    newObj.faces.push(vals);
                    break;
            }
    
        }

        return newObj;
    },
    toBabylonMesh: function(objFile, sz=[1, 1, 1], trans=[0, 0, 0], rot=[0, 0, 0]) {
        let BABYLON = window.BABYLON;
        let scene = window.scene;

        let myMesh = new BABYLON.Mesh("custom", scene);
        let vertexData = new BABYLON.VertexData();

        if (typeof sz === "number") {
            sz = [sz, sz, sz];
        }

        if (typeof objFile === "string") {
            objFile = ObjParser.parse(objFile);
        }

        let vertices = objFile.vertices;

        let trigCache = [
            cos(rot[0]), sin(rot[0]),
            cos(rot[1]), sin(rot[1]),
            cos(rot[2]), sin(rot[2]),
        ]

        let vx, vy;
        for (var i = 0; i < vertices.length; i += 3) {
            // rotate x
            if (rot[0] !== 0) {
                vy = vertices[i+1];
                vertices[i+1] = vy * trigCache[0] - vertices[i+2] * trigCache[1];
                vertices[i+2] = vy* trigCache[1] + vertices[i+2] * trigCache[0]
            }
            
            // rotate y
            if (rot[1] !== 0) {
                vx = vertices[i];
                vertices[i] = vx * trigCache[2] + vertices[i+2] * trigCache[3];
                vertices[i+2] = vertices[i+2] * trigCache[2] - vx * trigCache[3];
            }

            // rotate z
            if (rot[2] !== 0) {
                vx = vertices[i];
                vertices[i] = vx * trigCache[4] - vertices[i+1] * trigCache[5];
                vertices[i+1] = vx * trigCache[5] + vertices[i+1] * trigCache[4];
            }

            // translate
            vertices[i] += trans[0];
            vertices[i+1] += trans[1];
            vertices[i+2] += trans[2];
        }

        let newFaces = [], f;
        for (var i = 0; i < objFile.faces.length; i++) {
            f = objFile.faces[i];
            switch (f.length) {
                case 2:
                    newFaces.push(f[0], f[1], f[0]);
                    break;
                case 2:
                    newFaces.push(f[0], f[1], f[2]);
                    break;
                default: {
                    let triangulatedFaces = ObjParser.triangulate(f), face;
                    for (var j = 0; j < triangulatedFaces.length; j++) {
                        face = triangulatedFaces[j];
                        newFaces.push(face[0], face[1], face[2]);
                    }
                    break;
                }
            }
        }

        let faces = newFaces,
            normals = [],
            uvs = [];

        // take uv value relative to bottom left corner of roof (-4, -4) noting length and width of roof is 8; base uv value on the x, z coordinates only
        for (var p = 0, len = vertices.length / 3; p < len; p++) {
            // *0.125 rather than /8 for micro-optimization
            uvs.push((vertices[3 * p] + 4) * 0.125, (vertices[3 * p + 2] + 4) * 0.125);
        }

        // Calculations of normals added
        BABYLON.VertexData.ComputeNormals(vertices, faces, normals);

        vertexData.positions = vertices;
        vertexData.indices = faces;
        vertexData.normals = normals; //Assignment of normal to vertexData added
        vertexData.uvs = uvs;
        vertexData.applyToMesh(myMesh);

        myMesh.convertToFlatShadedMesh();

        // use scaling
        myMesh.scaling.x = sz[0];
        myMesh.scaling.y = sz[1];
        myMesh.scaling.z = sz[2];
    
        return myMesh;
    }
};
