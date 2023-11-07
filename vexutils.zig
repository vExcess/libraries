pub const wasmFreestanding: bool = false;

const std = @import("std");

pub var allocatorPtr: *const std.mem.Allocator = undefined;
// pub fn useAllocator(allocator: std.mem.Allocator) void {
//     allocatorPtr = #
// }

pub const Math = struct {
    pub const PI: f64 = 3.141592653589793;

    pub fn abs(x: anytype) @TypeOf(x) {
        switch (@TypeOf(x)) {
            comptime_int, i8, u8, i16, u16, i32, u32, i64, u64, i128, u128, isize, usize => {
                return if (x < 0) -x else x;
            },
            comptime_float, f16, f32, f64, f80, f128 => {
                return if (x < 0.0) -x else x;
            },
            else => unreachable
        }
    }

    pub fn pow(comptime T: type, x: T, y: T) T {
        return std.math.pow(T, x, y);
    }

    pub fn round(x: anytype) @TypeOf(x) {
        return std.math.round(x);
    }

    pub fn floor(x: anytype) @TypeOf(x) {
        return std.math.floor(x);
    }

    pub fn cos(x: anytype) @TypeOf(x) {
        return std.math.cos(x);
    }

    pub fn sin(x: anytype) @TypeOf(x) {
        return std.math.sin(x);
    }
};

pub const fs_write = if (wasmFreestanding)
    (struct {
        pub extern fn fs_write(fid: i32, addr: usize, len: u32) void;
    }).fs_write
else
    (struct {
        fn fs_write(fid: i32, addr: usize, len: u32) void {
            const manyPtr: [*]u8 = @ptrFromInt(addr);
            const slice: []u8 = manyPtr[0..len];

            if (fid == 1) {
                std.debug.print("{s}\n", .{slice});
            }
        }
    }).fs_write;

pub fn print(data: anytype) void {
    if (wasmFreestanding) {
        var outString: String = undefined;
        defer outString.free();
        switch (@typeInfo(@TypeOf(data))) {
            @typeInfo(String) => {
                var temp = data;
                outString = temp.clone();
                fs_write(1, @intFromPtr(outString.bytes.buffer.?.ptr), outString.len);
                return;
            },
            .Array, .Pointer => {
                // handle strings
                if (std.meta.Elem(@TypeOf(data)) == u8) {
                    outString = String.from(data);
                    fs_write(1, @intFromPtr(outString.bytes.buffer.?.ptr), outString.len);
                    return;
                }
            },
            else => {
                switch (@TypeOf(data)) {
                    comptime_int, i8, u8, i16, u16, i32, u32, i64, u64, i128, u128, isize, usize => {
                        outString = Int.toString(@as(i32, @intCast(data)), 10);
                    },
                    comptime_float, f16, f32, f64, f80, f128 => {
                        outString = Float.toString(@as(f64, @intCast(data)), 10);
                    },
                    bool => {
                        if (data) {
                            outString = String.from("true");
                        } else {
                            outString = String.from("false");
                        }
                    },
                    @TypeOf(null) => {
                        outString = String.from("null");
                    },
                    @TypeOf(void) => {
                        outString = String.from("void");
                    },
                    else => {
                        outString = String.from("!!!UNREACHABLE!!!");
                    },
                }
            },
        }
        fs_write(1, @intFromPtr(outString.bytes.buffer.?.ptr), outString.len);
    } else {
        const write = std.debug.print;
        switch (@typeInfo(@TypeOf(data))) {
            @typeInfo(String) => {
                var data_ = data;
                write("{s}", .{data_.toString()});
            },
            .Array, .Pointer => {
                // handle strings
                if (std.meta.Elem(@TypeOf(data)) == u8) {
                    write("{s}", .{data});
                    return;
                }
            },
            else => {
                switch (@TypeOf(data)) {
                    comptime_int, i8, u8, i16, u16, i32, u32, i64, u64, i128, u128, isize, usize => {
                        write("{}", .{data});
                    },
                    comptime_float, f16, f32, f64, f80, f128 => {
                        var temp = Float.toString(data, 10);
                        defer temp.free();
                        print(temp);
                    },
                    bool => {
                        write("{s}", .{if (data) "true" else "false"});
                    },
                    @TypeOf(null) => {
                        write("{s}", .{"null"});
                    },
                    @TypeOf(void) => {
                        write("{s}", .{"void"});
                    },
                    else => {
                        write("{*}", .{"!!!UNREACHABLE!!!"});
                    },
                }
            },
        }
    }
}
pub fn println(data: anytype) void {
    print(data);
    print("\n");
}

pub fn IntArray(comptime T: type) type {
    return struct {
        len: u32 = 0,
        capacity: u32 = 0,
        buffer: ?[]T = null,
        allocatorPtr: *const std.mem.Allocator = undefined,

        const Self = @This();

        pub fn new(capacity: u32) Self {
            var allocator = allocatorPtr.*;
            var buffer = allocator.alloc(T, capacity) catch unreachable;
            return Self{
                .capacity = capacity,
                .buffer = buffer,
                .allocatorPtr = allocatorPtr,
            };
        }

        pub fn free(self: *Self) void {
            var allocator = self.allocatorPtr.*;
            allocator.free(self.buffer.?);
        }

        pub fn get(self: *Self, idx: u32) T {
            return self.buffer.?[idx];
        }

        pub fn set(self: *Self, idx: u32, val: T) void {
            self.buffer.?[idx] = val;
        }

        pub fn fill(self: *Self, val: T, len_: i32) void {
            var len: u32 = if (len_ == -1) @as(u32, @intCast(self.buffer.?.len)) else @as(u32, @intCast(len_));
            var i: u32 = 0;
            while (i < len) : (i += 1) {
                self.buffer.?[i] = val;
            }
            self.len = len;
        }

        pub fn resize(self: *Self, newCapacity: u32) void {
            var allocator = self.allocatorPtr.*;
            var newBuffer = allocator.alloc(T, newCapacity) catch unreachable;

            for (self.buffer.?, 0..) |val, idx| {
                newBuffer[idx] = val;
            }

            allocator.free(self.buffer.?);
            self.capacity = newCapacity;
            self.buffer = newBuffer;
        }

        pub fn push(self: *Self, val: T) void {
            var prevLen = self.len;
            if (prevLen == self.capacity) {
                if (self.capacity == 0) {
                    self.capacity = 1;
                }
                self.resize(self.capacity * 2);
            }
            self.buffer.?[prevLen] = val;
            self.len += 1;
        }

        pub fn toString(self: *Self) String {
            var out = String.new(0);
            var buff = self.buffer.?;

            var i: u32 = 0;
            while (i < self.len) : (i += 1) {
                var temp = Int.toString(buff[i], 10);
                defer temp.free();
                out.concat(temp);
                if (i < self.len - 1) {
                    out.concat(",");
                }
            }

            return out;
        }
    };
}

pub fn FloatArray(comptime T: type) type {
    return struct {
        len: u32 = 0,
        capacity: u32 = 0,
        buffer: ?[]T = null,
        allocatorPtr: *const std.mem.Allocator = undefined,

        const Self = @This();

        pub fn new(capacity: u32) Self {
            var allocator = allocatorPtr.*;
            var buffer = allocator.alloc(T, capacity) catch unreachable;
            return Self{
                .capacity = capacity,
                .buffer = buffer,
                .allocatorPtr = allocatorPtr,
            };
        }

        pub fn free(self: *Self) void {
            var allocator = self.allocatorPtr.*;
            allocator.free(self.buffer.?);
        }

        pub fn get(self: *Self, idx: u32) T {
            return self.buffer.?[idx];
        }

        pub fn set(self: *Self, idx: u32, val: T) void {
            self.buffer.?[idx] = val;
        }

        pub fn fill(self: *Self, val: T, len_: i32) void {
            var len: u32 = if (len_ == -1) @as(u32, @intCast(self.buffer.?.len)) else @as(u32, @intCast(len_));
            var i: u32 = 0;
            while (i < len) : (i += 1) {
                self.buffer.?[i] = val;
            }
            self.len = len;
        }

        pub fn resize(self: *Self, newCapacity: u32) void {
            var allocator = self.allocatorPtr.*;
            var newBuffer = allocator.alloc(T, newCapacity) catch unreachable;

            for (self.buffer.?, 0..) |val, idx| {
                newBuffer[idx] = val;
            }

            allocator.free(self.buffer.?);
            self.capacity = newCapacity;
            self.buffer = newBuffer;
        }

        pub fn push(self: *Self, val: T) void {
            var prevLen = self.len;
            if (prevLen == self.capacity) {
                if (self.capacity == 0) {
                    self.capacity = 1;
                }
                self.resize(self.capacity * 2);
            }
            self.buffer.?[prevLen] = val;
            self.len += 1;
        }

        pub fn toString(self: *Self) String {
            var out = String.new(0);
            var buff = self.buffer.?;

            var i: u32 = 0;
            while (i < self.len) : (i += 1) {
                var temp = Float.toString(buff[i], 10);
                defer temp.free();
                out.concat(temp);
                if (i < self.len - 1) {
                    out.concat(",");
                }
            }

            return out;
        }
    };
}

pub const Uint8Array = IntArray(u8);
pub const Int8Array = IntArray(i8);
pub const Uint16Array = IntArray(u16);
pub const Int16Array = IntArray(i16);
pub const Uint32Array = IntArray(u32);
pub const Int32Array = IntArray(i32);
pub const Uint64Array = IntArray(u64);
pub const Int64Array = IntArray(i64);
pub const Float32Array = FloatArray(f32);
pub const Float64Array = FloatArray(f64);

pub const String = struct {
    len: u32 = 0,
    bytes: Uint8Array,

    pub fn new(capacity: u32) String {
        var bytes = Uint8Array.new(capacity);
        return String{ .len = 0, .bytes = bytes };
    }

    pub fn from(data: anytype) String {
        switch (@TypeOf(data)) {
            // char
            comptime_int, i8, u8, i16, u16, i32, u32, i64, u64, i128, u128, isize, usize => {
                var temp = Int.toString(data, 10);
                return temp;
            },
            // String
            String => {
                var temp = data.clone();
                return temp;
            },
            // const string
            else => {
                var len = @as(u32, @intCast(data.len));
                var temp = String.new(len);
                temp.len = len;
                temp.bytes.len = len;

                for (data, 0..) |val, idx| {
                    temp.bytes.buffer.?[idx] = val;
                }

                return temp;
            },
        }
    }

    pub fn free(self: *String) void {
        self.bytes.free();
    }

    pub fn charAt(self: *String, idx: u32) u8 {
        return self.bytes.get(idx);
    }

    pub fn setChar(self: *String, idx: u32, val: u8) void {
        self.bytes.set(idx, val);
    }

    pub fn concat(self: *String, data: anytype) void {
        switch (@TypeOf(data)) {
            // char
            comptime_int, i8, u8, i16, u16, i32, u32, i64, u64, i128, u128, isize, usize => {
                self.bytes.push(data);
                self.len = self.bytes.len;
                return;
            },
            // String
            String => {
                var i: u32 = 0;
                while (i < data.len) : (i += 1) {
                    self.bytes.push(data.bytes.buffer.?[i]);
                    self.len = self.bytes.len;
                }
                return;
            },
            // const string
            else => {
                for (data, 0..) |val, idx| {
                    _ = idx;
                    self.bytes.push(val);
                    self.len = self.bytes.len;
                }
                return;
            },
        }
    }

    pub fn slice(self: *String, start_: u32, end_: u32) String {
        var start = start_;
        var end = end_;

        if (end == 0) {
            end = self.len;
        }
        var bytes = Uint8Array.new(end - start);
        bytes.len = end - start;

        var i: u32 = 0;
        while (i < bytes.len) : (i += 1) {
            bytes.buffer.?[i] = self.bytes.buffer.?[start + i];
        }

        return String{ .len = bytes.len, .bytes = bytes };
    }

    pub fn repeat(self: *String, amt: u32) void {
        var selfClone = self.clone();
        defer selfClone.free();
        var i: u32 = 0;
        while (i < amt - 1) : (i += 1) {
            self.concat(selfClone);
        }
    }

    pub fn padStart(self: *String, width: u32, str: anytype) void {
        var padAmount = width - self.len;
        if (padAmount > 0) {
            var temp = String.new(width);
            temp.concat(str);
            temp.repeat(padAmount / temp.len);
            temp.concat(self.*);

            self.free();
            self.bytes = temp.bytes;
            self.len = temp.len;
        }
    }

    pub fn padEnd(self: *String, width: u32, str: anytype) void {
        var padAmount = width - self.len;
        if (padAmount > 0) {
            var temp = String.new(width);
            defer temp.free();
            temp.concat(str);
            temp.repeat(padAmount / temp.len);
            self.concat(temp);
        }
    }

    pub fn indexOf(self: *String, str: anytype) i32 {
        var temp = String.from(str);
        defer temp.free();
        
        var i: u32 = 0;
        while (i < self.len) : (i += 1) {
            var j: u32 = 0;
            while (j < temp.len) : (j += 1) {
                if (self.charAt(i + j) == temp.charAt(j)) {
                    if (j == temp.len - 1) {
                        return @as(i32, @intCast(i));
                    }
                } else {
                    break;
                }
            }
        }
        return -1;
    }

    pub fn toString(self: *String) []u8 {
        return self.bytes.buffer.?[0..self.len];
    }

    pub fn clone(self: *String) String {
        var buff = self.toString();
        var len = @as(u32, @intCast(buff.len));
        var str = String.new(len);
        str.len = len;

        var i: u32 = 0;
        while (i < len) : (i += 1) {
            str.bytes.buffer.?[i] = self.bytes.buffer.?[i];
        }

        return str;
    }
};

pub const Int = enum {
    var base10 = "0123456789";
    var base64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var codeKey = "0123456789abcdefghijklmnopqrstuvwxyz";
    pub fn toString(num_: anytype, base: u32) String {
        switch (@TypeOf(num_)) {
            comptime_int, i8, u8, i16, u16, i32, u32, i64, u64, i128, u128, isize, usize => {
                var num = @as(u32, @intCast(num_));
                var negative = num < 0;
                num = Math.abs(num);
                var u32num = @as(u32, @intCast(num));
                var f64num = @as(f64, @floatFromInt(num));
                var key = if (base == 10) Int.base10 else Int.codeKey;

                var placeValues: u32 = 0;

                while (Math.pow(u32, base, placeValues) <= u32num + 1) {
                    placeValues += 1;
                }

                var encoded = if (negative) String.new(placeValues + 1) else String.new(placeValues);
                encoded.bytes.len = placeValues;
                encoded.bytes.buffer.?.len = placeValues;
                encoded.len = placeValues;
                
                var i = placeValues;
                var strIdx: u32 = 0;

                if (negative) {
                    encoded.concat("-");
                    strIdx = 1;
                }

                while (i > 0) {
                    var factor: f64 = Math.pow(f64, @as(f64, @floatFromInt(base)), @as(f64, @floatFromInt(i - 1)));
                    encoded.setChar(strIdx, key[@as(usize, @intFromFloat(Math.floor(f64num / factor)))]);
                    strIdx += 1;
                    f64num -= Math.floor(f64num / factor) * factor;
                    i -= 1;
                }

                return encoded;
            },
            else => unreachable
        }
    }
    // parse: function(num) {
    //     var codeKey;
    //     if (base === 10) {
    //         codeKey = this.base10;
    //     } else {
    //         codeKey = this.codeKey;
    //     }

    //     var decoded = 0;
    //     for (var i = num.length; i > 0; i--) {
    //         var value = Math.pow(codeKey.length, i - 1).toString();
    //         var value2 = codeKey.indexOf(num.charAt(num.length - i));
    //         var value3 = value * value2;
    //         decoded += value3;
    //     }

    //     return decoded;
    // }
};

pub const Float = enum {
    var base10 = "0123456789";
    pub fn toString(num_: anytype, base: u32) String {
        switch (@TypeOf(num_)) {
            comptime_float, f16, f32, f64, f80, f128 => {
                var num: f64 = @as(f64, @floatCast(num_));
                var negative = num < 0;
                num = Math.abs(num);
                var leading = @as(u32, @intFromFloat(num));
                var f64Trailing = (num - @as(f64, @floatFromInt(leading))) * Math.pow(f64, 10, 6);
                var trailing = @as(u32, @intFromFloat(f64Trailing));
                f64Trailing = @as(f64, @floatFromInt(trailing));

                if (trailing > 0) {
                    while ((f64Trailing / 10) - Math.floor(f64Trailing / 10) == 0) {
                        f64Trailing /= 10.0;
                    }
                    trailing = @as(u32, @intFromFloat(f64Trailing));
                }

                var trailStr = Int.toString(trailing, base);
                defer trailStr.free();

                var temp = if (negative) String.from("-") else String.new(0);
                var temp2 = Int.toString(leading, base);
                defer temp2.free();
                temp.concat(temp2);
                temp.concat('.');
                temp.concat(trailStr);
                return temp;
            },
            else => unreachable
        }
    }
    // parse: function(num) {
    //     var codeKey;
    //     if (base === 10) {
    //         codeKey = this.base10;
    //     } else {
    //         codeKey = this.codeKey;
    //     }

    //     var decoded = 0;
    //     for (var i = num.length; i > 0; i--) {
    //         var value = Math.pow(codeKey.length, i - 1).toString();
    //         var value2 = codeKey.indexOf(num.charAt(num.length - i));
    //         var value3 = value * value2;
    //         decoded += value3;
    //     }

    //     return decoded;
    // }
};
