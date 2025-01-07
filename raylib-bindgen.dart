// downloads, compiles, and generates bindings for raylib

import 'dart:math';
import 'dart:io';

final typeDefs = """
RenderTexture RenderTexture2D
Texture Texture2D
""".trim().split("\n").map((l) => l.trim().split(' ')).toList();

final functionDefs = """
    void InitWindow(int width, int height, const char *title);
    void DrawRectangle(int posX, int posY, int width, int height, Color color);
    void DrawRectangleLines(int posX, int posY, int width, int height, Color color);
    void CloseWindow(void);
    void BeginDrawing(void);
    void EndDrawing(void);
    void PollInputEvents(void);
    void SetWindowState(unsigned int flags);
    void SetExitKey(int key);
    void SwapScreenBuffer(void);
    bool WindowShouldClose(void);
    void rlPushMatrix(void);
    void rlPopMatrix(void);
    void rlTranslatef(float x, float y, float z);
    void rlRotatef(float angle, float x, float y, float z);
    void rlScalef(float x, float y, float z);
    void DrawText(const char *text, int posX, int posY, int fontSize, Color color);
    Font LoadFontEx(const char *fileName, int fontSize, int *codepoints, int codepointCount);
    void DrawTextEx(Font font, const char *text, Vector2 position, float fontSize, float spacing, Color tint);
    void SetTextureFilter(Texture2D texture, int filter);
    Vector2 MeasureTextEx(Font font, const char *text, float fontSize, float spacing);
    RenderTexture2D LoadRenderTexture(int width, int height);
	void BeginTextureMode(RenderTexture2D target);
	void EndTextureMode(void);
	void DrawSplineBezierQuadratic(const Vector2 *points, int pointCount, float thick, Color color);
""".trim().split("\n").map((l) => l.trim()).toList();

final structDefs = [
    """
    Color {
        unsigned char r;
        unsigned char g;
        unsigned char b;
        unsigned char a;
    }""",
    """Font {
        int baseSize;
        int glyphCount;
        int glyphPadding;
        Texture2D texture;
        Rectangle *recs;
        GlyphInfo *glyphs;
    }""",
    """Texture {
        unsigned int id;
        int width;
        int height;
        int mipmaps;
        int format;
    }""",
	"""RenderTexture {
		unsigned int id;
		Texture texture;
		Texture depth;
	}""",
    """Rectangle {
        float x;
        float y;
        float width;
        float height;
    }""",
    """GlyphInfo {
        int value;
        int offsetX;
        int offsetY;
        int advanceX;
        Image image;
    }""",
    """Image {
        void *data;
        int width;
        int height;
        int mipmaps;
        int format;
    }""",
    """Vector2 {
        float x;
        float y;
    }"""
];

final cToFFIMappings = [
    ["void", "ffi.Void"],
    ["bool", "ffi.Bool"],
    ["int", "ffi.Int32"],
    ["float", "ffi.Float"],
    ["double", "ffi.Double"],
    ["unsigned int", "ffi.Uint32"],
    ["unsigned char", "ffi.Uint8"],
    ["const char *", "ffi.Pointer<ffi.Int8>"],
];
String cTypeStrToFFITypeStr(String cTypeStr) {
	if (cTypeStr.startsWith("const ") && cTypeStr != "const char *") {
		cTypeStr = cTypeStr.substring("const ".length);
	}
    for (var i = 0; i < cToFFIMappings.length; i++) {
        final pair = cToFFIMappings[i];
        if (cTypeStr == pair[0]) {
            return pair[1];
        }
    }
    if (cTypeStr.contains('*')) {
        final unArrayed = cTypeStr.replaceFirst('*', '').replaceFirst(' ', '');
        return "ffi.Pointer<${cTypeStrToFFITypeStr(unArrayed)}>";
    }
    return "struct_$cTypeStr";
}

final cToDartMappings = [
    ["void", "void"],
    ["bool", "bool"],
    ["int", "int"],
    ["float", "double"],
    ["double", "double"],
    ["unsigned int", "int"],
    ["unsigned char", "int"],
    ["const char *", "ffi.Pointer<ffi.Int8>"],
];
bool typeIsStruct(String paramType) {
    for (var j = 0; j < cToDartMappings.length; j++) {
        if (cToDartMappings[j][0] == paramType) {
            return false;
        }
    }
    if (paramType.startsWith("ffi.Pointer<")) {
        return false;
    }
    return true;
}
bool paramTypesContainStruct(List<String> paramTypes) {
    for (var i = 0; i < paramTypes.length; i++) {
        if (typeIsStruct(paramTypes[i]))
            return true;
    }
    return false;
}
String cTypeStrToDartTypeStr(String cTypeStr) {
	if (cTypeStr.startsWith("const ") && cTypeStr != "const char *") {
		cTypeStr = cTypeStr.substring("const ".length);
	}
    for (var i = 0; i < cToDartMappings.length; i++) {
        final pair = cToDartMappings[i];
        if (cTypeStr == pair[0]) {
            return pair[1];
        }
    }
    if (cTypeStr.contains('*')) {
        final unArrayed = cTypeStr.replaceFirst('*', '').replaceFirst(' ', '');
        return "ffi.Pointer<${cTypeStrToFFITypeStr(unArrayed)}>";
    }
    return "struct_$cTypeStr";
}

void generateBindings() {
    // generate function bindings
    List<(String, String)> fnTypeDefs = [];
    List<String> fnPreDefs = [];
    List<String> fnDefs = [];
    List<String> secondaryFnDefs = [];
    for (var i = 0; i < functionDefs.length; i++) {
        final fnDef = functionDefs[i].replaceFirst("(void)", "()");
        final thing = fnDef.split('(');
        var [returnType, fnName] = thing[0].split(' ');
        for (var j = 0; j < typeDefs.length; j++) {
			if (returnType == typeDefs[j][1]) {
				returnType = typeDefs[j][0];
				break;
			}
        }
        final parameters = thing[1].split(')')[0].split(',').map((s) {
            final lastSpace = max(s.lastIndexOf(' '), s.lastIndexOf('*'));
			var paramType = s.substring(0, lastSpace + 1).trim();
			for (var j = 0; j < typeDefs.length; j++) {
				if (paramType == typeDefs[j][1]) {
					paramType = typeDefs[j][0];
					break;
				}
			}
            return [paramType, s.substring(lastSpace + 1)];
        }).where((p) => p[0].length > 0);

        final parameterTypes = parameters.map((p) => p[0]).toList();
        var dartFnName = fnName[0].toLowerCase() + fnName.substring(1);
        final dartReturnTypeStr = cTypeStrToDartTypeStr(returnType);
        if (parameterTypes.contains("const char *") || paramTypesContainStruct(parameterTypes)) {
            var oldDartFnName = dartFnName;
            dartFnName = "unwrapped_$dartFnName";
            final newParametersStr = parameters.map((p) {
                var pType = cTypeStrToDartTypeStr(p[0]);
                if (pType == "ffi.Pointer<ffi.Int8>") {
                    pType = "String";
                } else if (typeIsStruct(pType)) {
                    pType = pType.substring("struct_".length);
                }
                return "$pType ${p[1]}";
            });
            final args = parameters.map((p) {
                var pType = cTypeStrToDartTypeStr(p[0]);
                if (pType == "ffi.Pointer<ffi.Int8>") {
                    return "string.toNative(${p[1]})";
                } else if (typeIsStruct(pType)) {
                    return "${p[1]}.ref";
                }
                return p[1];
            });
            secondaryFnDefs.add("    ${dartReturnTypeStr} ${oldDartFnName}(${newParametersStr.join(", ")}) {\n        return ${dartFnName}(${args.join(", ")});\n    }");
        }

        final cDef = "typedef cDef_${dartFnName} = ${cTypeStrToFFITypeStr(returnType)} Function(${parameterTypes.map((cts) => cTypeStrToFFITypeStr(cts)).join(", ")});";
        final dDef = "typedef dDef_${dartFnName} = ${dartReturnTypeStr} Function(${parameterTypes.map((cts) => cTypeStrToDartTypeStr(cts)).join(", ")});";
        
        fnTypeDefs.add((cDef, dDef));
        fnPreDefs.add("    late final dDef_${dartFnName} ${dartFnName};");
        fnDefs.add("        ${dartFnName} = dylib\n            .lookup<ffi.NativeFunction<cDef_${dartFnName}>>(\"${fnName}\").asFunction();");
    }

    // generate struct bindings
    List<String> newStructDefs = [];
    for (final structDef in structDefs) {
        final thing = structDef.split('{');
        final structName = thing[0].trim();
        final pairs = thing[1].split('}')[0].trim().split('\n').map((l) {
            final line = l.trim();
            final lastSpace = max(line.lastIndexOf(' '), line.lastIndexOf('*'));
			var keyName = line.substring(0, lastSpace + 1).trim();
			for (var j = 0; j < typeDefs.length; j++) {
				if (keyName == typeDefs[j][1]) {
					keyName = typeDefs[j][0];
					break;
				}
			}
			return [keyName, line.substring(lastSpace + 1).replaceFirst(';', '')];
        });
        final generatedPairs = pairs.map((p) {
            final isStruct = typeIsStruct(p[0]);
            if (isStruct) {
                return "    external ${cTypeStrToDartTypeStr(p[0])} ${p[1]};";
            } else {
                return "    @${cTypeStrToFFITypeStr(p[0])}()\n    external ${cTypeStrToDartTypeStr(p[0])} ${p[1]};";
            }
        });

        newStructDefs.add("final class struct_${structName} extends ffi.Struct {\n${generatedPairs.join("\n\n")}\n}");
        newStructDefs.add("""
class ${structName} extends NativeClass<struct_${structName}> {
${pairs.map((p) {
    final dartTypeStr = cTypeStrToDartTypeStr(p[0]);
    return "    $dartTypeStr get ${p[1]} => ref.${p[1]};\n    set ${p[1]}($dartTypeStr val) => ref.${p[1]} = val;";
}).join("\n\n")}

    ${structName}.fromRef(struct_${structName} ref) : super.fromRef(ref);

    ${structName}(${pairs.map((p) {
            return "${cTypeStrToDartTypeStr(p[0])} ${p[1]}";
        }).join(", ")}) {
        final ffi.Pointer<struct_${structName}>? pointer = malloc<struct_${structName}>(ffi.sizeOf<struct_${structName}>());
        ref = pointer!.ref;
${pairs.map((p) {
    return "        this.${p[1]} = ${p[1]};";
}).join("\n")}
    }
}
""");
    }

    // enum bindings
    List<String> enumDefs = [];
    final raylibH = File("./raylib/src/raylib.h").readAsStringSync();
    var idx = 0;
    while (true) {
        final enumHeader = "typedef enum {";
        // find start of enum
        var enumIdx = raylibH.indexOf(enumHeader, idx);
        if (enumIdx == -1)
            break;

        // find end of enum
        idx = raylibH.indexOf(";", enumIdx);
        
        // skip comments
        while (true) {
            var j = idx;
            var isComment = false;
            while (raylibH[j] != '\n') {
                if (raylibH[j] == '/' && raylibH[j-1] == '/') {
                    isComment = true;
                    break;
                }
                j--;
            }
            if (isComment) {
                idx = raylibH.indexOf(";", idx + 1);
            } else {
                break;
            }
        }

        var enumContent = raylibH.substring(enumIdx + enumHeader.length, idx).trim();
        final enumName = enumContent.substring(enumContent.lastIndexOf(' ') + 1);
        enumContent = enumContent.substring(0, enumContent.lastIndexOf('}')).trim();

        var enumBodyLines = enumContent.split('\n').map((l) {
            final commentIdx = l.lastIndexOf("//");
            String out;
            if (commentIdx == -1) {
                out = l;
            } else {
                out = l.substring(0, commentIdx);
            }
            out = out.replaceFirst(',', '').trim();
            final removedPrefixes = ["FLAG_", "KEY_", "TEXTURE_FILTER_", "TEXTURE_WRAP_"];
            for (var i = 0; i < removedPrefixes.length; i++) {
                final prefix = removedPrefixes[i];
                if (out.startsWith(prefix))
                    out = out.substring(prefix.length);
            }
            return out;
        }).where((l) => l.trim().length > 0).toList();

        for (var i = 0; i < enumBodyLines.length; i++) {
            final line = enumBodyLines[i];
            if (!line.contains('=')) {
                final prevLine = enumBodyLines[i-1];
                final value = int.parse(prevLine.substring(prevLine.indexOf('=') + 1));
                enumBodyLines[i] += " = ${value + 1}";
            }
        }

        enumDefs.add("class enumsingleton_${enumName} {\n${enumBodyLines.map((l) => "    int ${l};").join("\n")}\n}\nfinal ${enumName} = enumsingleton_${enumName}();");
    }
    // print(temp.join("\naAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\n"));

    // final bindings code
    final raylibBindings = """
import 'dart:ffi' as ffi;
import 'package:ffi/ffi.dart';
import 'package:raylib/src/utils/string.dart' as string;

abstract class NativeClass<T extends ffi.Struct> {
    NativeClass();
    NativeClass.fromRef(this.ref);
    late final T ref;
}

${newStructDefs.join("\n")}

${enumDefs.join('\n\n')}

${fnTypeDefs.map((cd) => "${cd.$1}\n${cd.$2}\n").join("\n")}

class Raylib {
    late ffi.DynamicLibrary dylib;

${fnPreDefs.join("\n")}    

${secondaryFnDefs.join("\n")}

    Raylib(String libPath) {
        dylib = ffi.DynamicLibrary.open(libPath);

${fnDefs.join("\n")}
    }
}
    """;

    // write bindings to fs
    final bindingsOutPath = "./raylib-bindings.dart";
    File(bindingsOutPath).writeAsStringSync(raylibBindings);
    
    print("Raylib Bindings Generated");
}


// ------------------------------------------------------------------------


bool isDir(String path) {
    return FileStat.statSync(path).type == FileSystemEntityType.directory;
}

bool fileItemNotFound(String path) {
    return FileStat.statSync(path).type == FileSystemEntityType.notFound;
}

void installDependenciesIfNotInstalled(List<String> depNames) async {
    for (var i = 0; i < depNames.length; i++) {
        if (Platform.isLinux) {
            var checkPackageInstalled = await Process.run("dpkg", ["-l", depNames[i]]);
            if (checkPackageInstalled.stderr.toString().contains("no packages found")) {
                print("Installing ${depNames[i]}...");
                await Process.run("sudo", ["apt", "install", depNames[i], "-y"]);
            }
        }
    }
}

void main() async {

    // install dependencies
    if (Platform.isLinux) {
        installDependenciesIfNotInstalled(["build-essential", "git"]);
        installDependenciesIfNotInstalled([
            "libasound2-dev","libx11-dev","libxrandr-dev",
            "libxi-dev","libgl1-mesa-dev","libglu1-mesa-dev",
            "libxcursor-dev","libxinerama-dev","libwayland-dev",
            "libxkbcommon-dev"
        ]);
    }

    // download raylib if not downloaded
    if (fileItemNotFound("./raylib")) {
        print("Downloading Raylib...");
        await Process.run("git", "clone --depth 1 https://github.com/raysan5/raylib.git raylib".split(" "));
        var configFile = File("./raylib/src/config.h");
        var config = configFile.readAsStringSync();
        // enable custom frame control
        config = config.replaceFirst("//#define SUPPORT_CUSTOM_FRAME_CONTROL", "#define SUPPORT_CUSTOM_FRAME_CONTROL");
        configFile.writeAsStringSync(config);
    }

    // compile raylib if binary not found
    final raylibPath = "./libraylib.so";
    if (fileItemNotFound(raylibPath)) {
        print("Compiling Raylib...");
        var compilationDetails = await Process.run(
            "make", "PLATFORM=PLATFORM_DESKTOP RAYLIB_LIBTYPE=SHARED".split(" "),
            workingDirectory: "./raylib/src"
        );
        final compilationErrors = compilationDetails.stderr.toString();
        if (compilationErrors.length > 0) {
            print(compilationErrors);
        }
        final dirFiles = await Directory("./raylib/src").list().toList();
        for (var i = 0; i < dirFiles.length; i++) {
            final file = dirFiles[i];
            // locate compiled raylib
            if (file.path.contains("libraylib.so") && !FileSystemEntity.isLinkSync(file.path)) {
                // remove old raylib
                if (!fileItemNotFound(raylibPath)) {
                    File(raylibPath).deleteSync();
                }
                // copy new raylib to dependencies
                file.rename(raylibPath);
            }
        }
        print("Raylib compiled");
    }

    // generate raylib bindings
    print("Generating Raylib bindings...");
    generateBindings();
}
