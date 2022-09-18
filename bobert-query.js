(function () {
    Object.assign(Element.prototype, {
        appendTo: function (a) {
            a.appendChild(this); return this;
        },
        addClass: function (...args) {
            this.classList.add(...args); return this;
        },
        removeClass: function (...args) {
            this.classList.remove(...args); return this;
        },
        html: function (a) {
            this.innerHTML = a; return this;
        },
        text: function (a) {
            this.innerText = a; return this;
        },
        on: function (a, b, c) {
            this.addEventListener(a, b, c); return this;
        },
        css: function (c) {
            if (typeof c === "string") {
                c.split(";").forEach(s => {
                    s = s.split(":");
                    if (s.length > 1) {
                        this.style[s[0].trim()] = s[1].trim();
                    }
                });
            } else {
                for (let p in c) {
                    this.style[p] = c;
                }
            }
            return this;
        },
        attr: function (a, b) {
            if (b === undefined) {
                for (let p in a) {
                    this[p] = a[p];
                }
            } else {
                this[a] = b;
            }
            return this;
        },
    });
    
    function doEl (e, b, c) {
        if (b) {
            e.innerHTML = b;
        }
        if (c) {
            e.css(c);
        }
        return e;
    }
    
    let B = function (a, b, c) {
        let o;
        if (a.charAt(0) === "#") {
            o = doEl(document.getElementById(a.slice(1)), b, c);
        } else if (a.charAt(0) === ".") {
            o = document.getElementsByClassName(a.slice(1), b, c);
            o.forEach(e => doEl(e));
        } else {
            o = doEl(document.createElement(a), b, c);
        }
        return o;
    };
    B.getJSON = function (url, callback) {
        let prom = fetch(url).then(res => res.json());
    
        if (callback === undefined) {
            return prom;
        } else {
            return prom.then(res => {
                callback(res);
                return res;
            });
        }
    };
    B.getJSONLegacy = function (url, callback) {
        let callbackId = Math.random().toString().replace(".", "");
        let script = document.createElement("script");
        B.getJSON["c" + callbackId] = function (json) {
            script.remove();
            callback(json);
        };
        script.src = url + (url.match(/\?/) ? "&" : "?") + "callback=$.getJSON.c" + callbackId;
        document.body.appendChild(script);
    };
    
    window.$ = B;
})();
