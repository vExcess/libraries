const qoi = @import("lib/qoi.zig");
const QOI = qoi.QOI;
const QOI_Color = qoi.Color;
const QOI_Colorspace = qoi.Colorspace;

fn loadImageDataFromQOI(allocator: std.mem.Allocator, name: [:0]const u8) !ImageData {
    // read file
    var file = try std.fs.cwd().openFile(name, .{ });
    const file_size = (try file.stat()).size;
    var fileArr = Uint8Array.new(@as(u32, @intCast(file_size)));
    defer fileArr.free();
    fileArr.fill(0, -1);
    try file.reader().readNoEof(fileArr.buffer.?);

    // decode qoi
    const img = try qoi.decodeBuffer(allocator, fileArr.buffer.?);
    defer allocator.free(img.pixels);

    var imgData = ImageData {
        .colorSpace = "srgb",
        .width = img.width,
        .height = img.height,
        .data = Uint8Array.new(img.width * img.height * 4)
    };

    {
        var idx: u32 = 0;
        while (idx < img.pixels.len) : (idx += 1) {
            const clr = img.pixels[idx];
            imgData.data.push(clr.r);
            imgData.data.push(clr.g);
            imgData.data.push(clr.b);
            imgData.data.push(clr.a);
        }
    }

    return imgData;
}

fn saveImageDataAsQOI(allocator: std.mem.Allocator, name: [:0]const u8, imgData_: ImageData) !void {
    var imgData = imgData_;
    var pixels = try allocator.alloc(QOI_Color, imgData.data.len);
    defer allocator.free(pixels);
    {
        var idx: u32 = 0;
        while (idx < imgData.data.len) : (idx += 4) {
            const i: u32 = idx / 4;
            pixels[i].r = imgData.data.get(idx);
            pixels[i].g = imgData.data.get(idx+1);
            pixels[i].b = imgData.data.get(idx+2);
            pixels[i].a = imgData.data.get(idx+3);
        }
    }

    const img2 = qoi.ConstImage {
        .colorspace = QOI_Colorspace.sRGB,
        .width = imgData.width,
        .height = imgData.height,
        .pixels = pixels
    };
    const newEncoded = try qoi.encodeBuffer(allocator, img2);
    defer allocator.free(newEncoded);

    const fileOut = try std.fs.cwd().createFile(
        name,
        .{ .read = true },
    );
    defer fileOut.close();
    _ = try fileOut.writeAll(newEncoded);
}
