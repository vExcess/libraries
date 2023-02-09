const Touch = new (function() {
    /*
      CREDITS: 
        VEXCESS  @vxs
        Mango  @collisions
        Liam K.  @liamk.ka
        Larry Serflaton  @LarrySerflaten
        Noah H.  @noahcoder11
        Cosmo  @Elisha0White
        Iron Programming  @ncochran2
        MDN  https://developer.mozilla.org
        Stack Overflow  https://stackoverflow.com
        GeeksforGeeks  https://www.geeksforgeeks.org
    */

    this.TWO_PI = Math.PI * 2;

    this.point_point = function(px, py, p2x, p2y) {
        return px === p2x && py === p2y;
    };
    this.point_line = function(x1, y1, x2, y2, px, py) {
        var a, b;
        
        a = x2 - x1;
        b = y2 - y1;
        var total = Math.sqrt(a * a + b * b);
        
        a = px - x1;
        b = py - y1;
        var seg1 = Math.sqrt(a * a + b * b);
        
        a = px - x2;
        b = py - y2;
        var seg2 = Math.sqrt(a * a + b * b);
        
        return Math.abs(total - seg1 - seg2) < 0.05;
    };
    this.point_triangle = function(px, py, x1, y1, x2, y2, x3, y3) {
        var minx = Math.min(x1, x2, x3);
        var maxx = Math.max(x1, x2, x3);
        var miny = Math.min(y1, y2, y3);
        var maxy = Math.max(y1, y2, y3);

        var w1 = (x1 * (y3 - y1) + (py - y1) * (x3 - x1) - px * (y3 - y1)) / ((y2 - y1) * (x3 - x1) - (x2 - x1) * (y3 - y1));
        var w2 = (x1 * (y2 - y1) + (py - y1) * (x2 - x1) - px * (y2 - y1)) / ((y3 - y1) * (x2 - x1) - (x3 - x1) * (y2 - y1));

        return w1 >= 0 && w2 >= 0 && w1 + w2 <= 1;
    };
    this.point_rect = function(px, py, rx, ry, rw, rh) {
        return (px > rx && px < rx + rw && py > ry && py < ry + rh);
    };
    this.point_circle = function(px, py, cx, cy, cs) {
        var r = cs / 2;
        
        var a = px - cx;
        var b = py - cy;
        return a * a + b * b < r * r;
    };
    this.point_ellipse = function(px, py, ex, ey, ew, eh) {
        var dx = px - ex;
        var dy = py - ey;

        ew /= 2;
        eh /= 2;

        return (dx * dx) / (ew * ew) + (dy * dy) / (eh * eh) <= 1;
    };
    this.point_arc = function(px, py, ax, ay, aw, ah, astart, astop) {
        var dx = px - ax;
        var dy = py - ay;

        aw /= 2;
        ah /= 2;

        astart = astart / 180 * Math.PI;
        astop = astop / 180 * Math.PI;

        var ang1 = Math.atan2(ay - py, ax - px) + Math.PI;

        var inverted = false;

        while (astart < 0) {
            astart += this.TWO_PI;
            astop += this.TWO_PI;
        }

        while (astop > this.TWO_PI) {
            astart -= this.TWO_PI;
            astop -= this.TWO_PI;
        }

        if (astop - astart > this.TWO_PI) {
            astart = 0;
            astop = this.TWO_PI;
        }

        if (astart < 0 && astart < astop) {
            var temp = astart;
            astart = astop;
            astop = temp;
            inverted = true;
        }

        var ang2 = Math.atan2(Math.sin(astart) * ah, Math.cos(astart) * aw);
        if (ang2 < 0) {
            ang2 += this.TWO_PI;
        }
        var ang3 = Math.atan2(Math.sin(astop) * ah, Math.cos(astop) * aw);
        if (ang3 < 0) {
            ang3 += this.TWO_PI;
        }

        var out = false;

        if ((dx * dx) / (aw * aw) + (dy * dy) / (ah * ah) <= 1) {
            var withinBounds = ang1 > ang2 && ang1 < ang3;
            out = inverted ? !withinBounds : withinBounds;
        }

        return out;
    };
    this.point_box = function(px, py, pz, bx, by, bz, bw, bh, bl) {
        return (px >= bx && px <= bx + bw) && (py >= by && py <= by + bh) && (pz >= bz && pz <= bz + bl);
    };
    this.point_sphere = function(px, py, pz, sx, sy, sz, sd) {
        var r = sd / 2;
        var a = px - sx;
        var b = py - sy;
        var c = pz - sz;
        
        return a * a + b * b + c * c < r * r;
    };

    this.line_point = function(px, py, x1, y1, x2, y2) {
        return this.point_line(x1, y1, x2, y2, px, py);
    };
    this.line_rect = function(lx1, ly1, lx2, ly2, rx, ry, rw, rh) {
        var lBX = Math.min(lx1, lx2),
            lBY = Math.min(ly1, ly2);

        if (rx + rw < lBX || rx > lBX + Math.abs(lx2 - lx1) || ry + rh < lBY || ry > lBY + Math.abs(ly2 - ly1)) {
            return false;
        } else {
            var sfX, sfy;

            if (ry + rh / 2 < ly1 + (ly2 - ly1) * (((rx + rw / 2) - lx1) / (lx2 - lx1))) {
                sfX = rx - lx1;
                sfy = ry + rh - ly1;
            } else {
                sfX = rx + rw - lx1;
                sfy = ry - ly1;
            }

            var finalX = lx1 + (lx2 - lx1) * (sfy / (ly2 - ly1)),
                finalY = ly1 + (ly2 - ly1) * (sfX / (lx2 - lx1));

            return (ry < finalY && ry + rh > finalY) || (rx < finalX && rx + rw > finalX);
        }
    };

    this.triangle_point = function(x1, y1, x2, y2, x3, y3, px, py) {
        return this.point_triangle(px, py, x1, y1, x2, y2, x3, y3);
    };

    this.rect_point = function(rx, ry, rw, rh, px, py) {
        return (px > rx && px < rx + rw && py > ry && py < ry + rh);
    };
    this.rect_line = function(rx, ry, rw, rh, lx1, ly1, lx2, ly2) {
        var lBX = Math.min(lx1, lx2),
            lBY = Math.min(ly1, ly2);

        if (rx + rw < lBX || rx > lBX + Math.abs(lx2 - lx1) || ry + rh < lBY || ry > lBY + Math.abs(ly2 - ly1)) {
            return false;
        } else {
            var sfX, sfy;

            if (ry + rh / 2 < ly1 + (ly2 - ly1) * (((rx + rw / 2) - lx1) / (lx2 - lx1))) {
                sfX = rx - lx1;
                sfy = ry + rh - ly1;
            } else {
                sfX = rx + rw - lx1;
                sfy = ry - ly1;
            }

            var finalX = lx1 + (lx2 - lx1) * (sfy / (ly2 - ly1)),
                finalY = ly1 + (ly2 - ly1) * (sfX / (lx2 - lx1));

            return (ry < finalY && ry + rh > finalY) || (rx < finalX && rx + rw > finalX);
        }
    };
    this.rect_rect = function(x1, y1, w1, h1, x2, y2, w2, h2) {
        return !(x1 + w1 < x2 || x1 > x2 + w2 || y1 + h1 < y2 || y1 > y2 + h2);
    };
    this.rect_circle = function(rx, ry, rw, rh, cx, cy, cd) {
        var testX = cx;
        var testY = cy;
        if (cx < rx) {
            testX = rx;
        } else if (cx > rx + rw) {
            testX = rx + rw;
        }
        if (cy < ry) {
            testY = ry;
        } else if (cy > ry + rh) {
            testY = ry + rh;
        }
        var d = cd / 2;
        
        var a = cx - testX;
        var b = cy - testY;
        return a * a + b * b <= d * d;
    };

    this.circle_line = function(cx, cy, cr, x1, y1, x2, y2) {
        var a, b;
        a = x2 - x1;
        b = y2 - y1;
        
        var length = Math.sqrt(a * a + b * b);
        var dot = (((cx - x1) * (x2 - x1)) + ((cy - y1) * (y2 - y1))) / Math.pow(length, 2);
        var closestX = x1 + (dot * (x2 - x1));
        var closestY = y1 + (dot * (y2 - y1));
        
        a = cx - x1;
        b = cy - y1;
        if (Math.sqrt(a * a + b * b) < cr) {
            return true;
        }
        
        a = cx - x2;
        b = cy - y2;
        if (Math.sqrt(a * a + b * b) < cr) {
            return true;
        }
        
        a = cx - closestX;
        b = cy - closestY;
        if (Math.sqrt(a * a + b * b) < cr && cy > y1 && cy < y2) {
            return true;
        }
        
        return false;
    };
    this.circle_rect = function(cx, cy, cd, rx, ry, rw, rh) {
        var testX = cx;
        var testY = cy;
        if (cx < rx) {
            testX = rx;
        } else if (cx > rx + rw) {
            testX = rx + rw;
        }
        if (cy < ry) {
            testY = ry;
        } else if (cy > ry + rh) {
            testY = ry + rh;
        }
        var r = cd / 2;
        var a = cx - testX;
        var b = cy - testY;
        return a * a + b * b <= r * r;
    };
    this.circle_circle = function(x1, y1, d1, x2, y2, d2) {
        var r = (d1 / 2 + d2 / 2);
        var a = x1 - x2;
        var b = y1 - y2;
        return a * a + b * b <= r * r;
    };

    this.ellipse_point = function(ex, ey, ew, eh, px, py) {
        var dx = px - ex;
        var dy = py - ey;

        ew /= 2;
        eh /= 2;

        return (dx * dx) / (ew * ew) + (dy * dy) / (eh * eh) <= 1;
    };
    this.ellipse_ellipse = function(x1, y1, w1, h1, x2, y2, w2, h2) {
        return (Math.pow((x1 - x2) / (w1 + w2), 2) + Math.pow((y1 - y2) / (h1 + h2), 2)) * 4 <= 1;
    };

    this.arc_point = function(ax, ay, aw, ah, astart, astop, px, py) {
        var dx = px - ax;
        var dy = py - ay;

        aw /= 2;
        ah /= 2;

        astart = astart / 180 * Math.PI;
        astop = astop / 180 * Math.PI;

        var ang1 = Math.atan2(ay - py, ax - px) + Math.PI;

        var inverted = false;

        while (astart < 0) {
            astart += this.TWO_PI;
            astop += this.TWO_PI;
        }

        while (astop > this.TWO_PI) {
            astart -= this.TWO_PI;
            astop -= this.TWO_PI;
        }

        if (astop - astart > this.TWO_PI) {
            astart = 0;
            astop = this.TWO_PI;
        }

        if (astart < 0 && astart < astop) {
            var temp = astart;
            astart = astop;
            astop = temp;
            inverted = true;
        }

        var ang2 = Math.atan2(Math.sin(astart) * ah, Math.cos(astart) * aw);
        if (ang2 < 0) {
            ang2 += this.TWO_PI;
        }
        var ang3 = Math.atan2(Math.sin(astop) * ah, Math.cos(astop) * aw);
        if (ang3 < 0) {
            ang3 += this.TWO_PI;
        }

        var out = false;

        if ((dx * dx) / (aw * aw) + (dy * dy) / (ah * ah) <= 1) {
            var withinBounds = ang1 > ang2 && ang1 < ang3;
            out = inverted ? !withinBounds : withinBounds;
        }

        return out;
    };

    this.box_point = function(bx, by, bz, bw, bh, bl, px, py, pz) {
        return (px >= bx && px <= bx + bw) && (py >= by && py <= by + bh) && (pz >= bz && pz <= bz + bl);
    };
    this.box_box = function(ax, ay, az, aw, ah, al, bx, by, bz, bw, bh, bl) {
        var a = {
            minX: ax - aw / 2,
            maxX: ax + aw / 2,
            minY: ay - ah / 2,
            maxY: ay + ah / 2,
            minZ: az - al / 2,
            maxZ: az + al / 2
        };

        var b = {
            minX: bx - bw / 2,
            maxX: bx + bw / 2,
            minY: by - bh / 2,
            maxY: by + bh / 2,
            minZ: bz - bl / 2,
            maxZ: bz + bl / 2
        };

        return (a.minX <= b.maxX && a.maxX >= b.minX) &&
            (a.minY <= b.maxY && a.maxY >= b.minY) &&
            (a.minZ <= b.maxZ && a.maxZ >= b.minZ);
    };
    this.box_sphere = function(bX, bY, bZ, bW, bH, bL, sX, sY, sZ, sD) {
        var halfW = bW / 2;
        var halfH = bH / 2;
        var halfL = bL / 2;

        var x = Math.max(bX - halfW, Math.min(sX, bX + halfW));
        var y = Math.max(bY - halfH, Math.min(sY, bY + halfH));
        var z = Math.max(bZ - halfL, Math.min(sZ, bZ + halfL));
        
        var a = x - sX;
        var b = y - sY;
        var c = z - sZ;

        return a * a + b * b + c * c < sD * sD;
    };

    this.sphere_point = function(sx, sy, sz, sd, px, py, pz) {
        var r = sd / 2;
        
        var a = px - sx;
        var b = py - sy;
        var c = pz - sz;

        return a * a + b * b + c * c < r * r;
    };
    this.sphere_box = function(sX, sY, sZ, sD, bX, bY, bZ, bW, bH, bL) {
        var halfW = bW / 2;
        var halfH = bH / 2;
        var halfL = bL / 2;

        var x = Math.max(bX - halfW, Math.min(sX, bX + halfW));
        var y = Math.max(bY - halfH, Math.min(sY, bY + halfH));
        var z = Math.max(bZ - halfL, Math.min(sZ, bZ + halfL));
        
        var a = x - sX;
        var b = y - sY;
        var c = z - sZ;

        return a * a + b * b + c * c < sD * sD;
    };
    this.sphere_sphere = function(s1x, s1y, s1z, s1d, s2x, s2y, s2z, s2d) {
        var r = s1d / 2 + s2d / 2;
        
        var a = s1x - s2x;
        var b = s1y - s2y;
        var c = s1z - s2z;
        
        return a * a + b * b + c * c < r * r;
    };

})();
