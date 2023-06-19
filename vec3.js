// VExcess' vec3 library - optimized for performance rather than user friendliness
{
    const sqrt = Math.sqrt; // caching for faster lookup
    window.vec3 = function(x, y, z) {
        return {
            x: x,
            y: y,
            z: z ?? 0
        };
    };
    vec3.fromArr = arr => ({
        x: arr[0],
        y: arr[1],
        z: arr[2]
    });
    vec3.toArr = v => ([v.x, v.y, v.z]);
    vec3.clone = v => ({
        x: v.x,
        y: v.y,
        z: v.z
    });
    vec3.add = (v1, v2) => {
        return typeof v2 === 'number' ? {
            x: v1.x + v2,
            y: v1.y + v2,
            z: v1.z + v2
        } : {
            x: v1.x + v2.x,
            y: v1.y + v2.y,
            z: v1.z + v2.z
        };
    };
    vec3.sub = (v1, v2) => {
        return typeof v2 === 'number' ? {
            x: v1.x - v2,
            y: v1.y - v2,
            z: v1.z - v2
        } : {
            x: v1.x - v2.x,
            y: v1.y - v2.y,
            z: v1.z - v2.z
        };
    };
    vec3.mul = (v1, v2) => {
        return typeof v2 === 'number' ? {
            x: v1.x * v2,
            y: v1.y * v2,
            z: v1.z * v2
        } : {
            x: v1.x * v2.x,
            y: v1.y * v2.y,
            z: v1.z * v2.z
        };
    };
    vec3.div = (v1, v2) => {
        return typeof v2 === 'number' ? {
            x: v1.x / v2,
            y: v1.y / v2,
            z: v1.z / v2
        } : {
            x: v1.x / v2.x,
            y: v1.y / v2.y,
            z: v1.z / v2.z
        };
    };
    vec3.neg = v => ({
        x: -v.x,
        y: -v.y,
        z: -v.z
    });
    vec3.mag = v1 => {
        // benchmarks show that caching the values results in a 0.000008% performance boost
        let x = v1.x, y = v1.y, z = v1.z;
        return sqrt(x * x + y * y + z * z);
    };
    vec3.normalize = v1 => {
        let x = v1.x, y = v1.y, z = v1.z;
        let m = sqrt(x * x + y * y + z * z);
        return m > 0 ? {
            x: v1.x / m,
            y: v1.y / m,
            z: v1.z / m
        } : v1;
    };
    vec3.dot = (v1, v2) => (v1.x * v2.x + v1.y * v2.y + v1.z * v2.z);
    vec3.cross = (v1, v2) => ({
        x: v1.y * v2.z - v1.z * v2.y,
        y: v1.z * v2.x - v1.x * v2.z,
        z: v1.x * v2.y - v1.y * v2.x
    });
}
