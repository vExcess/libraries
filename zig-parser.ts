/*

    Zig Parser
    version: 0.14.0-dev.91+a154d8da8

    if (writing_a_language_parser_by_hand == fun) {
        unreachable;
    } else {
        this = time + carpalTunnel;
    }

    Just an incomplete Zig parser that I will never finish. 
    Do with it what you wish.

*/

const fs = require("fs");

function getFileName(path: string) {
    const temp = path.split("/").reverse()[0].split(".");
    return temp.slice(0, temp.length - 1).join(".");
}

const TOKENS = {
    "&": "AMPERSAND",
    "&=": "AMPERSANDEQUAL",
    "*": "ASTERISK",
    "**": "ASTERISK2",
    "*=": "ASTERISKEQUAL",
    "*%": "ASTERISKPERCENT",
    "*%=": "ASTERISKPERCENTEQUAL",
    "*|": "ASTERISKPIPE",
    "*|=": "ASTERISKPIPEEQUAL",
    "^": "CARET",
    "^=": "CARETEQUAL",
    ":": "COLON",
    ",": "COMMA",
    ".": "DOT",
    "..": "DOT2",
    "...": "DOT3",
    ".*": "DOTASTERISK",
    ".?": "DOTQUESTIONMARK",
    "=": "EQUAL",
    "==": "EQUALEQUAL",
    "=>": "EQUALRARROW",
    "!": "EXCLAMATIONMARK",
    "!=": "EXCLAMATIONMARKEQUAL",
    "<": "LARROW",
    "<<": "LARROW2",
    "<<=": "LARROW2EQUAL",
    "<<|": "LARROW2PIPE",
    "<<|=": "LARROW2PIPEEQUAL",
    "<=": "LARROWEQUAL",
    "{": "LBRACE",
    "[": "LBRACKET",
    "(": "LPAREN",
    "-": "MINUS",
    "-=": "MINUSEQUAL",
    "-%": "MINUSPERCENT",
    "-%=": "MINUSPERCENTEQUAL",
    "-|": "MINUSPIPE",
    "-|=": "MINUSPIPEEQUAL",
    "->": "MINUSRARROW",
    "%": "PERCENT",
    "%=": "PERCENTEQUAL",
    "|": "PIPE",
    "||": "PIPE2",
    "|=": "PIPEEQUAL",
    "+": "PLUS",
    "++": "PLUS2",
    "+=": "PLUSEQUAL",
    "+%": "PLUSPERCENT",
    "+%=": "PLUSPERCENTEQUAL",
    "+|": "PLUSPIPE",
    "+|=": "PLUSPIPEEQUAL",
    "c": "LETTERC",
    "?": "QUESTIONMARK",
    ">": "RARROW",
    ">>": "RARROW2",
    ">>=": "RARROW2EQUAL",
    ">=": "RARROWEQUAL",
    "}": "RBRACE",
    "]": "RBRACKET",
    ")": "RPAREN",
    ";": "SEMICOLON",
    "/": "SLASH",
    "/=": "SLASHEQUAL",
    "~": "TILDE"
};

enum KEYWORDS {
    _addrspace = 'addrspace',
        _align = 'align',
        _allowzero = 'allowzero',
        _and = 'and',
        _anyframe = 'anyframe',
        _anytype = 'anytype',
        _asm = 'asm',
        _async = 'async',
        _await = 'await',
        _break = 'break',
        _callconv = 'callconv',
        _catch = 'catch',
        _comptime = 'comptime',
        _const = 'const',
        _continue = 'continue',
        _defer = 'defer',
        _else = 'else',
        _enum = 'enum',
        _errdefer = 'errdefer',
        _error = 'error',
        _export = 'export',
        _extern = 'extern',
        _fn = 'fn',
        _for = 'for',
        _if = 'if',
        _inline = 'inline',
        _noalias = 'noalias',
        _nosuspend = 'nosuspend',
        _noinline = 'noinline',
        _opaque = 'opaque',
        _or = 'or',
        _orelse = 'orelse',
        _packed = 'packed',
        _pub = 'pub',
        _resume = 'resume',
        _return = 'return',
        _linksection = 'linksection',
        _struct = 'struct',
        _suspend = 'suspend',
        _switch = 'switch',
        _test = 'test',
        _threadlocal = 'threadlocal',
        _try = 'try',
        _union = 'union',
        _unreachable = 'unreachable',
        _usingnamespace = 'usingnamespace',
        _var = 'var',
        _volatile = 'volatile',
        _while = 'while',
}

type MatchResult = {
    pattern: string,
    lexeme: string,
    incr: number,
    children: Array < MatchResult >
} | null;

enum TOP_LEVEL_DECL {
    ContainerMembers,
    ContainerDeclaration,
    TestDecl,
    ComptimeDecl,
    Decl,
    FnProto,
    VarDeclProto,
    GlobalVarDecl,
    ContainerField
}

function isNumeric(byte: number): boolean {
    return byte >= 48 && byte <= 57;
}

function isLowercase(byte: number): boolean {
    return byte >= 97 && byte <= 122;
}

function isUppercase(byte: number): boolean {
    return byte >= 65 && byte <= 90;
}

class ZigParser {
    code: string = "";

    constructor() {}

    match_line_comment(code: string): MatchResult {
        // line_comment <- '//' ![!/][^\n]* / '////' [^\n]*
        let children: Array < MatchResult > = [];
        if (code.startsWith("//")) {
            const ch = code.charAt(2);
            if (ch !== "!" && ch !== "/") {
                let idx = 2;
                while (idx < code.length && code.charAt(idx) !== "\n") {
                    idx++;
                }
                return {
                    pattern: "line_comment",
                    lexeme: code.slice(0, idx),
                    incr: idx,
                    children
                };
            } else {
                return null;
            }
        } else if (code.startsWith("////")) {
            let idx = 4;
            while (idx < code.length && code.charAt(idx) !== "\n") {
                idx++;
            }
            return {
                pattern: "line_comment",
                lexeme: code.slice(0, idx),
                incr: idx,
                children
            };
        }
        return null;
    }

    match_skip(code: string): MatchResult {
        // skip <- ([ \n] / line_comment)*
        let children: Array < MatchResult > = [];
        let idx = 0;
        let ch: string;
        do {
            ch = code.charAt(idx);
            if (ch === " " || ch === "\n") {
                idx++;
            } else {
                const commentMatch = this.match_line_comment(code.slice(idx));
                if (commentMatch) {
                    children.push(commentMatch);
                    idx += commentMatch.incr;
                } else {
                    break;
                }
            }
        } while (true);
        return {
            pattern: "skip",
            lexeme: code.slice(0, idx),
            incr: idx,
            children
        };
    }

    matchSymbol(code: string, sym: string, excludes: string): MatchResult {
        let children: Array < MatchResult > = [];
        if (code.startsWith(sym)) {
            let idx = sym.length;
            const nextCh = code.charAt(idx);

            for (let i = 0; i < excludes.length; i++) {
                if (nextCh === excludes.charAt(i)) {
                    return null;
                }
            }

            const skipMatch = this.match_skip(code.slice(idx));
            if (skipMatch) {
                children.push(skipMatch);
                idx += skipMatch.incr;
                return {
                    pattern: TOKENS[code.slice(0, idx) as keyof typeof TOKENS],
                    lexeme: code.slice(0, idx),
                    incr: idx,
                    children
                };
            }
        }

        return null;
    }

    match_AMPERSAND(code: string): MatchResult {
        // AMPERSAND <- '&' ![=] skip
        let m = this.matchSymbol(code, "&", "=");
        if (m) return m;
        return null;
    }
    match_AMPERSANDEQUAL(code: string): MatchResult {
        // AMPERSANDEQUAL <- '&=' skip
        let m = this.matchSymbol(code, "&=", "");
        if (m) return m;
        return null;
    }
    match_ASTERISK(code: string): MatchResult {
        // ASTERISK <- '*' ![*%=|] skip
        let m = this.matchSymbol(code, "*", "*%=|");
        if (m) return m;
        return null;
    }
    match_ASTERISK2(code: string): MatchResult {
        // ASTERISK2 <- '**' skip
        let m = this.matchSymbol(code, "**", "");
        if (m) return m;
        return null;
    }
    match_ASTERISKEQUAL(code: string): MatchResult {
        // ASTERISKEQUAL <- '*=' skip
        let m = this.matchSymbol(code, "*=", "");
        if (m) return m;
        return null;
    }
    match_ASTERISKPERCENT(code: string): MatchResult {
        // ASTERISKPERCENT <- '*%' ![=] skip
        let m = this.matchSymbol(code, "*%", "=");
        if (m) return m;
        return null;
    }
    match_ASTERISKPERCENTEQUAL(code: string): MatchResult {
        // ASTERISKPERCENTEQUAL <- '*%=' skip
        let m = this.matchSymbol(code, "*%=", "");
        if (m) return m;
        return null;
    }
    match_ASTERISKPIPE(code: string): MatchResult {
        // ASTERISKPIPE <- '*|' ![=] skip
        let m = this.matchSymbol(code, "*|", "=");
        if (m) return m;
        return null;
    }
    match_ASTERISKPIPEEQUAL(code: string): MatchResult {
        // ASTERISKPIPEEQUAL <- '*|=' skip
        let m = this.matchSymbol(code, "*|=", "");
        if (m) return m;
        return null;
    }
    match_CARET(code: string): MatchResult {
        // CARET <- '^' ![=] skip
        let m = this.matchSymbol(code, "^", "=");
        if (m) return m;
        return null;
    }
    match_CARETEQUAL(code: string): MatchResult {
        // CARETEQUAL <- '^=' skip
        let m = this.matchSymbol(code, "^=", "");
        if (m) return m;
        return null;
    }
    match_COLON(code: string): MatchResult {
        // COLON <- ':' skip
        let m = this.matchSymbol(code, ":", "");
        if (m) return m;
        return null;
    }
    match_COMMA(code: string): MatchResult {
        // COMMA <- ',' skip
        let m = this.matchSymbol(code, ",", "");
        if (m) return m;
        return null;
    }
    match_DOT(code: string): MatchResult {
        // DOT <- '.' ![*.?] skip
        let m = this.matchSymbol(code, ".", "*.?");
        if (m) return m;
        return null;
    }
    match_DOT2(code: string): MatchResult {
        // DOT2 <- '..' ![.] skip
        let m = this.matchSymbol(code, "..", ".");
        if (m) return m;
        return null;
    }
    match_DOT3(code: string): MatchResult {
        // DOT3 <- '...' skip
        let m = this.matchSymbol(code, "...", "");
        if (m) return m;
        return null;
    }
    match_DOTASTERISK(code: string): MatchResult {
        // DOTASTERISK <- '.*' skip
        let m = this.matchSymbol(code, ".*", "");
        if (m) return m;
        return null;
    }
    match_DOTQUESTIONMARK(code: string): MatchResult {
        // DOTQUESTIONMARK <- '.?' skip
        let m = this.matchSymbol(code, ".?", "");
        if (m) return m;
        return null;
    }
    match_EQUAL(code: string): MatchResult {
        // EQUAL <- '=' ![>=] skip
        let m = this.matchSymbol(code, "=", ">=");
        if (m) return m;
        return null;
    }
    match_EQUALEQUAL(code: string): MatchResult {
        // EQUALEQUAL <- '==' skip
        let m = this.matchSymbol(code, "==", "");
        if (m) return m;
        return null;
    }
    match_EQUALRARROW(code: string): MatchResult {
        // EQUALRARROW <- '=>' skip
        let m = this.matchSymbol(code, "=>", "");
        if (m) return m;
        return null;
    }
    match_EXCLAMATIONMARK(code: string): MatchResult {
        // EXCLAMATIONMARK <- '!' ![=] skip
        let m = this.matchSymbol(code, "!", "=");
        if (m) return m;
        return null;
    }
    match_EXCLAMATIONMARKEQUAL(code: string): MatchResult {
        // EXCLAMATIONMARKEQUAL <- '!=' skip
        let m = this.matchSymbol(code, "!=", "");
        if (m) return m;
        return null;
    }
    match_LARROW(code: string): MatchResult {
        // LARROW <- '<' ![<=] skip
        let m = this.matchSymbol(code, "<", "<=");
        if (m) return m;
        return null;
    }
    match_LARROW2(code: string): MatchResult {
        // LARROW2 <- '<<' ![=|] skip
        let m = this.matchSymbol(code, "<<", "=|");
        if (m) return m;
        return null;
    }
    match_LARROW2EQUAL(code: string): MatchResult {
        // LARROW2EQUAL <- '<<=' skip
        let m = this.matchSymbol(code, "<<=", "");
        if (m) return m;
        return null;
    }
    match_LARROW2PIPE(code: string): MatchResult {
        // LARROW2PIPE <- '<<|' ![=] skip
        let m = this.matchSymbol(code, "<<|", "=");
        if (m) return m;
        return null;
    }
    match_LARROW2PIPEEQUAL(code: string): MatchResult {
        // LARROW2PIPEEQUAL <- '<<|=' skip
        let m = this.matchSymbol(code, "<<|=", "");
        if (m) return m;
        return null;
    }
    match_LARROWEQUAL(code: string): MatchResult {
        // LARROWEQUAL <- '<=' skip
        let m = this.matchSymbol(code, "<=", "");
        if (m) return m;
        return null;
    }
    match_LBRACE(code: string): MatchResult {
        // LBRACE <- '{' skip
        let m = this.matchSymbol(code, "{", "");
        if (m) return m;
        return null;
    }
    match_LBRACKET(code: string): MatchResult {
        // LBRACKET <- '[' skip
        let m = this.matchSymbol(code, "[", "");
        if (m) return m;
        return null;
    }
    match_LPAREN(code: string): MatchResult {
        // LPAREN <- '(' skip
        let m = this.matchSymbol(code, "(", "");
        if (m) return m;
        return null;
    }
    match_MINUS(code: string): MatchResult {
        // MINUS <- '-' ![%=>|] skip
        let m = this.matchSymbol(code, "-", "%=>|");
        if (m) return m;
        return null;
    }
    match_MINUSEQUAL(code: string): MatchResult {
        // MINUSEQUAL <- '-=' skip
        let m = this.matchSymbol(code, "-=", "");
        if (m) return m;
        return null;
    }
    match_MINUSPERCENT(code: string): MatchResult {
        // MINUSPERCENT <- '-%' ![=] skip
        let m = this.matchSymbol(code, "-%", "=");
        if (m) return m;
        return null;
    }
    match_MINUSPERCENTEQUAL(code: string): MatchResult {
        // MINUSPERCENTEQUAL <- '-%=' skip
        let m = this.matchSymbol(code, "-%=", "");
        if (m) return m;
        return null;
    }
    match_MINUSPIPE(code: string): MatchResult {
        // MINUSPIPE <- '-|' ![=] skip
        let m = this.matchSymbol(code, "-|", "=");
        if (m) return m;
        return null;
    }
    match_MINUSPIPEEQUAL(code: string): MatchResult {
        // MINUSPIPEEQUAL <- '-|=' skip
        let m = this.matchSymbol(code, "-|=", "");
        if (m) return m;
        return null;
    }
    match_MINUSRARROW(code: string): MatchResult {
        // MINUSRARROW <- '->' skip
        let m = this.matchSymbol(code, "->", "");
        if (m) return m;
        return null;
    }
    match_PERCENT(code: string): MatchResult {
        // PERCENT <- '%' ![=] skip
        let m = this.matchSymbol(code, "%", "=");
        if (m) return m;
        return null;
    }
    match_PERCENTEQUAL(code: string): MatchResult {
        // PERCENTEQUAL <- '%=' skip
        let m = this.matchSymbol(code, "%=", "");
        if (m) return m;
        return null;
    }
    match_PIPE(code: string): MatchResult {
        // PIPE <- '|' ![|=] skip
        let m = this.matchSymbol(code, "|", "|=");
        if (m) return m;
        return null;
    }
    match_PIPE2(code: string): MatchResult {
        // PIPE2 <- '||' skip
        let m = this.matchSymbol(code, "||", "");
        if (m) return m;
        return null;
    }
    match_PIPEEQUAL(code: string): MatchResult {
        // PIPEEQUAL <- '|=' skip
        let m = this.matchSymbol(code, "|=", "");
        if (m) return m;
        return null;
    }
    match_PLUS(code: string): MatchResult {
        // PLUS <- '+' ![%+=|] skip
        let m = this.matchSymbol(code, "+", "%+=|");
        if (m) return m;
        return null;
    }
    match_PLUS2(code: string): MatchResult {
        // PLUS2 <- '++' skip
        let m = this.matchSymbol(code, "++", "");
        if (m) return m;
        return null;
    }
    match_PLUSEQUAL(code: string): MatchResult {
        // PLUSEQUAL <- '+=' skip
        let m = this.matchSymbol(code, "+=", "");
        if (m) return m;
        return null;
    }
    match_PLUSPERCENT(code: string): MatchResult {
        // PLUSPERCENT <- '+%' ![=] skip
        let m = this.matchSymbol(code, "+%", "=");
        if (m) return m;
        return null;
    }
    match_PLUSPERCENTEQUAL(code: string): MatchResult {
        // PLUSPERCENTEQUAL <- '+%=' skip
        let m = this.matchSymbol(code, "+%=", "");
        if (m) return m;
        return null;
    }
    match_PLUSPIPE(code: string): MatchResult {
        // PLUSPIPE <- '+|' ![=] skip
        let m = this.matchSymbol(code, "+|", "=");
        if (m) return m;
        return null;
    }
    match_PLUSPIPEEQUAL(code: string): MatchResult {
        // PLUSPIPEEQUAL <- '+|=' skip
        let m = this.matchSymbol(code, "+|=", "");
        if (m) return m;
        return null;
    }
    match_LETTERC(code: string): MatchResult {
        // LETTERC <- 'c' skip
        let m = this.matchSymbol(code, "c", "");
        if (m) return m;
        return null;
    }
    match_QUESTIONMARK(code: string): MatchResult {
        // QUESTIONMARK <- '?' skip
        let m = this.matchSymbol(code, "?", "");
        if (m) return m;
        return null;
    }
    match_RARROW(code: string): MatchResult {
        // RARROW <- '>' ![>=] skip
        let m = this.matchSymbol(code, ">", ">=");
        if (m) return m;
        return null;
    }
    match_RARROW2(code: string): MatchResult {
        // RARROW2 <- '>>' ![=] skip
        let m = this.matchSymbol(code, ">>", "=");
        if (m) return m;
        return null;
    }
    match_RARROW2EQUAL(code: string): MatchResult {
        // RARROW2EQUAL <- '>>=' skip
        let m = this.matchSymbol(code, ">>=", "");
        if (m) return m;
        return null;
    }
    match_RARROWEQUAL(code: string): MatchResult {
        // RARROWEQUAL <- '>=' skip
        let m = this.matchSymbol(code, ">=", "");
        if (m) return m;
        return null;
    }
    match_RBRACE(code: string): MatchResult {
        // RBRACE <- '}' skip
        let m = this.matchSymbol(code, "}", "");
        if (m) return m;
        return null;
    }
    match_RBRACKET(code: string): MatchResult {
        // RBRACKET <- ']' skip
        let m = this.matchSymbol(code, "]", "");
        if (m) return m;
        return null;
    }
    match_RPAREN(code: string): MatchResult {
        // RPAREN <- ')' skip
        let m = this.matchSymbol(code, ")", "");
        if (m) return m;
        return null;
    }
    match_SEMICOLON(code: string): MatchResult {
        // SEMICOLON <- ';' skip
        let m = this.matchSymbol(code, ";", "");
        if (m) return m;
        return null;
    }
    match_SLASH(code: string): MatchResult {
        // SLASH <- '/' ![=] skip
        let m = this.matchSymbol(code, "/", "=");
        if (m) return m;
        return null;
    }
    match_SLASHEQUAL(code: string): MatchResult {
        // SLASHEQUAL <- '/=' skip
        let m = this.matchSymbol(code, "/=", "");
        if (m) return m;
        return null;
    }
    match_TILDE(code: string): MatchResult {
        // TILDE <- '~' skip
        let m = this.matchSymbol(code, "~", "");
        if (m) return m;
        return null;
    }

    match_end_of_word(code: string): MatchResult {
        // end_of_word <- ![a-zA-Z0-9_] skip
        let children: Array < MatchResult > = [];
        const ch = code.charAt(0);
        const byte = code.charCodeAt(0);
        if (!isNumeric(byte) && !isLowercase(byte) && !isUppercase(byte) && byte !== 95) {
            const skipMatch = this.match_skip(code.slice(0));
            if (skipMatch) {
                children.push(skipMatch);
                return {
                    pattern: "end_of_word",
                    lexeme: ch,
                    incr: skipMatch.incr,
                    children
                };
            }
        }
        return null;
    }

    match_KEYWORD_addrspace(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "addrspace";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_addrspace",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_align(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "align";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_align",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_allowzero(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "allowzero";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_allowzero",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_and(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "and";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_and",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_anyframe(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "anyframe";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_anyframe",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_anytype(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "anytype";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_anytype",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_asm(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "asm";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_asm",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_async(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "async";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_async",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_await(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "await";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_await",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_break(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "break";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_break",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_callconv(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "callconv";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_callconv",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_catch(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "catch";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_catch",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_comptime(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "comptime";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_comptime",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_const(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "const";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_const",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_continue(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "continue";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_continue",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_defer(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "defer";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_defer",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_else(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "else";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_else",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_enum(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "enum";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_enum",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_errdefer(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "errdefer";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_errdefer",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_error(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "error";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_error",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_export(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "export";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_export",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_extern(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "extern";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_extern",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_fn(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "fn";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_fn",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_for(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "for";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_for",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_if(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "if";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_if",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_inline(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "inline";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_inline",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_noalias(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "noalias";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_noalias",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_nosuspend(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "nosuspend";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_nosuspend",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_noinline(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "noinline";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_noinline",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_opaque(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "opaque";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_opaque",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_or(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "or";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_or",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_orelse(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "orelse";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_orelse",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_packed(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "packed";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_packed",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_pub(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "pub";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_pub",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_resume(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "resume";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_resume",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_return(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "return";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_return",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_linksection(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "linksection";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_linksection",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_struct(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "struct";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_struct",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_suspend(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "suspend";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_suspend",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_switch(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "switch";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_switch",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_test(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "test";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_test",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_threadlocal(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "threadlocal";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_threadlocal",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_try(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "try";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_try",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_union(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "union";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_union",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_unreachable(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "unreachable";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_unreachable",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_usingnamespace(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "usingnamespace";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_usingnamespace",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_var(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "var";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_var",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_volatile(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "volatile";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_volatile",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }
    match_KEYWORD_while(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        const keyword = "while";
        if (code.startsWith(keyword)) {
            const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
            if (endOfWordMatch) {
                children.push(endOfWordMatch);
                return {
                    pattern: "KEYWORD_while",
                    lexeme: keyword,
                    incr: keyword.length + endOfWordMatch.incr,
                    children
                };
            }
        }
        return null;
    }

    match_keyword(code: string): MatchResult {
        let children: Array < MatchResult > = [];
        for (const label in KEYWORDS) {
            const keyword = KEYWORDS[label as keyof typeof KEYWORDS];
            const byteVal = code.charCodeAt(keyword.length);
            // KEYWORDS_keyword <- keyword end_of_word
            if (code.startsWith(keyword)) {
                const endOfWordMatch = this.match_end_of_word(code.slice(keyword.length));
                if (endOfWordMatch) {
                    children.push(endOfWordMatch);
                    return {
                        pattern: "keyword",
                        lexeme: keyword,
                        incr: endOfWordMatch.incr + keyword.length,
                        children
                    };
                }
            }
        }
        return null;
    }

    match_hex(code: string): MatchResult {
        // hex <- [0-9a-fA-F]
        let children: Array < MatchResult > = [];
        const byte = code.charCodeAt(0);
        if (isNumeric(byte) || (byte >= 97 && byte <= 102) || (byte >= 65 && byte <= 70)) {
            return {
                pattern: "hex",
                lexeme: code.charAt(0),
                incr: 1,
                children
            };
        }
        return null;
    }

    match_char_escape(code: string): MatchResult {
        // char_escape <- "\\x" hex hex / "\\u{" hex+ "}" / "\\" [nr\\t'"]
        let children: Array < MatchResult > = [];
        if (code.startsWith("\\x")) {
            let idx = "\\x".length;
            const m = this.match_hex(code.slice(idx));
            if (m) {
                children.push(m);
                idx++;
                const m2 = this.match_hex(code.slice(idx));
                if (m2) {
                    children.push(m2);
                    idx++;
                    return {
                        pattern: "char_escape",
                        lexeme: code.slice(0, idx),
                        incr: idx,
                        children
                    };
                }
            }
        }
        if (code.startsWith("\\u{")) {
            const m = this.match_hex(code.slice("\\u".length));
            if (m) {
                children.push(m);
                let idx = "\\x".length + 1;
                do {
                    const m2 = this.match_hex(code.slice(idx));
                    if (m2) {
                        children.push(m2);
                        idx += m2.incr;
                    } else {
                        break;
                    }
                } while (true);
                if (code.charAt(idx) === "}") {
                    return {
                        pattern: "char_escape",
                        lexeme: code.slice(0, idx),
                        incr: idx,
                        children
                    };
                }
            }
        }
        if (code.startsWith("\\")) {
            const ch = code.charAt(1);
            if ("nr\\t'\"".includes(ch)) {
                return {
                    pattern: "char_escape",
                    lexeme: code.slice(0, 2),
                    incr: 2,
                    children
                };
            }
        }
        return null;
    }

    match_string_char(code: string): MatchResult {
        // string_char <- char_escape / [^\\"\n]
        let children: Array < MatchResult > = [];
        const m = this.match_char_escape(code);
        if (m) {
            children.push(m);
            return {
                pattern: "string_char",
                lexeme: code.slice(0, m.incr),
                incr: m.incr,
                children
            };
        }
        const ch = code.charAt(0);
        if (!"\\\"\n".includes(ch)) {
            return {
                pattern: "string_char",
                lexeme: code.slice(0, 1),
                incr: 1,
                children
            };
        }
        return null;
    }

    match_STRINGLITERALSINGLE(code: string): MatchResult {
        // STRINGLITERALSINGLE <- "\"" string_char* "\"" skip
        let children: Array < MatchResult > = [];
        if (code.charAt(0) === '"') {
            let idx = 1;
            do {
                const m = this.match_string_char(code.slice(idx));
                if (m) {
                    children.push(m);
                    idx += m.incr;
                } else {
                    break;
                }
            } while (true);
            if (code.charAt(idx) === '"') {
                const m = this.match_skip(code.slice(idx + 1));
                if (m) {
                    children.push(m);
                    return {
                        pattern: "STRINGLITERALSINGLE",
                        lexeme: code.slice(idx + 1),
                        incr: idx + 1 + m.incr,
                        children
                    };
                }
            }
        }
        return null;
    }

    match_IDENTIFIER(code: string): MatchResult {
        // IDENTIFIER <- !keyword [A-Za-z_] [A-Za-z0-9_]* skip / "@" STRINGLITERALSINGLE
        let children: Array < MatchResult > = [];
        const m = this.match_keyword(code);
        if (!m) {
            children.push(m);
            let chVal = code.charCodeAt(0);
            if (isLowercase(chVal) || isUppercase(chVal) || chVal === 95) {
                let idx = 1;
                do {
                    chVal = code.charCodeAt(idx);
                    if ((isNumeric(chVal) || isLowercase(chVal) || isUppercase(chVal) || chVal === 95) && idx < code.length) {
                        idx++;
                    } else {
                        break;
                    }
                } while (true);
                const m2 = this.match_skip(code.slice(idx));
                if (m2) {
                    children.push(m2);
                    idx += m2.incr;
                    return {
                        pattern: "IDENTIFIER",
                        lexeme: code.slice(0, idx),
                        incr: idx,
                        children
                    };
                }
            }
        } else {
            if (code.charAt(0) === "@") {
                const m2 = this.match_STRINGLITERALSINGLE(code.slice(1));
                if (m2) {
                    children.push(m2);
                    return {
                        pattern: "IDENTIFIER",
                        lexeme: code.slice(0, 1 + m2.incr),
                        incr: 1 + m2.incr,
                        children
                    };
                }
            }
        }
        return null;
    }

    match_AsmOutput(code: string): MatchResult {
        return null;
    }

    match_AsmExpr(code: string): MatchResult {
        // AsmExpr <- KEYWORD_asm KEYWORD_volatile? LPAREN Expr AsmOutput? RPAREN
        let children: Array < MatchResult > = [];
        const m = this.match_KEYWORD_asm(code);
        if (m) {
            children.push(m);
            let idx = m.incr;
            let m2 = this.match_KEYWORD_volatile(code.slice(idx));
            if (m2) {
                children.push(m2);
                idx += m2.incr;
            }

            m2 = this.match_LPAREN(code.slice(idx));
            if (m2) {
                children.push(m2);
                idx += m2.incr;
                const m3 = this.match_Expr(code.slice(idx));
                if (m3) {
                    children.push(m3);
                    idx += m3.incr;
                    let m4 = this.match_AsmOutput(code.slice(idx));
                    if (m4) {
                        children.push(m4);
                        idx += m4.incr;
                    }

                    m4 = this.match_RPAREN(code.slice(idx));
                    if (m4) {
                        children.push(m4);
                        idx += m4.incr;
                        return {
                            pattern: "AsmExpr",
                            lexeme: code.slice(0, idx),
                            incr: idx,
                            children
                        };
                    }
                }
            }
        }
        return null;
    }

    match_IfExpr(code: string): MatchResult {
        return null;
    }

    match_BreakLabel(code: string): MatchResult {
        return null;
    }

    match_BlockLabel(code: string): MatchResult {
        return null;
    }

    match_LoopExpr(code: string): MatchResult {
        return null;
    }

    match_Block(code: string): MatchResult {
        return null;
    }

    match_FieldInit(code: string): MatchResult {
        // FieldInit <- DOT IDENTIFIER EQUAL Expr
        let children: Array < MatchResult > = [];
        const m = this.match_DOT(code);
        if (m) {
            children.push(m);
            let idx = m.incr;
            const m2 = this.match_IDENTIFIER(code.slice(idx));
            if (m2) {
                children.push(m2);
                idx += m2.incr;
                const m3 = this.match_EQUAL(code.slice(idx));
                if (m3) {
                    children.push(m3);
                    idx += m3.incr;
                    const m4 = this.match_Expr(code.slice(idx));
                    if (m4) {
                        children.push(m4);
                        idx += m4.incr;
                        return {
                            pattern: "FieldInit",
                            lexeme: code.slice(0, idx),
                            incr: idx,
                            children
                        }
                    }
                }
            }
        }
        return null;
    }

    match_InitList(code: string): MatchResult {
        // InitList
        //   <- LBRACE FieldInit (COMMA FieldInit)* COMMA? RBRACE
        //   / LBRACE Expr (COMMA Expr)* COMMA? RBRACE
        //   / LBRACE RBRACE
        let children: Array < MatchResult > = [];
        const m = this.match_LBRACE(code);
        if (m) {
            children.push(m);
            let idx = m.incr;
            const m2 = this.match_FieldInit(code.slice(idx));
            if (m2) {
                children.push(m2);
                idx += m2.incr;
                do {
                    const m3 = this.match_COMMA(code.slice(idx));
                    if (m3) {
                        children.push(m3);
                        const m4 = this.match_FieldInit(code.slice(idx));
                        if (m4) {
                            children.push(m4);
                            idx += m3.incr + m4.incr;
                        } else {
                            break;
                        }
                    } else {
                        break;
                    }
                } while (true);

                let m3 = this.match_COMMA(code.slice(idx));
                if (m3) {
                    children.push(m3);
                    idx += m3.incr;
                }

                m3 = this.match_RBRACE(code.slice(idx));
                if (m3) {
                    children.push(m3);
                    idx += m3.incr;
                    return {
                        pattern: "InitList",
                        lexeme: code.slice(0, idx),
                        incr: idx,
                        children
                    }
                }
            }
        }
        return null;
    }

    match_CurlySuffixExpr(code: string): MatchResult {
        // CurlySuffixExpr <- TypeExpr InitList?
        const m = this.match_TypeExpr(code);
        let children: Array < MatchResult > = [];
        if (m) {
            children.push(m);
            let idx = m.incr;
            const m2 = this.match_InitList(code.slice(idx));
            if (m2) {
                children.push(m2);
                idx += m2.incr;
            }
            return {
                pattern: "CurlySuffixExpr",
                lexeme: code.slice(0, idx),
                incr: idx,
                children
            }
        }
        return null;
    }

    match_MultiplyOp(code: string): MatchResult {
        return null;
    }

    match_AdditionOp(code: string): MatchResult {
        return null;
    }

    match_BitShiftOp(code: string): MatchResult {
        return null;
    }

    match_BitwiseOp(code: string): MatchResult {
        return null;
    }

    match_CompareOp(code: string): MatchResult {
        return null;
    }

    match_PrimaryExpr(code: string): MatchResult {
        // PrimaryExpr
        //   <- AsmExpr
        //   / IfExpr
        //   / KEYWORD_break BreakLabel? Expr?
        //   / KEYWORD_comptime Expr
        //   / KEYWORD_nosuspend Expr
        //   / KEYWORD_continue BreakLabel?
        //   / KEYWORD_resume Expr
        //   / KEYWORD_return Expr?
        //   / BlockLabel? LoopExpr
        //   / Block
        //   / CurlySuffixExpr
        let children: Array < MatchResult > = [];
        let m = this.match_AsmExpr(code);
        if (m) return m;

        m = this.match_IfExpr(code);
        if (m) return m;

        m = this.match_KEYWORD_break(code);
        if (m) {
            children.push(m);
            let idx = m.incr;
            let m2 = this.match_BreakLabel(code.slice(idx));
            if (m2) {
                children.push(m2);
                idx += m2.incr;
            }

            m2 = this.match_Expr(code.slice(idx));
            if (m2) {
                children.push(m2);
                idx += m2.incr;
            }

            return {
                pattern: "PrimaryExpr",
                lexeme: code.slice(0, idx),
                incr: idx,
                children
            };
        }

        m = this.match_KEYWORD_comptime(code);
        if (m) {
            children.push(m);
            let idx = m.incr;
            const m2 = this.match_Expr(code.slice(idx));
            if (m2) {
                children.push(m2);
                idx += m2.incr;
                return {
                    pattern: "PrimaryExpr",
                    lexeme: code.slice(0, idx),
                    incr: idx,
                    children
                };
            }
        }

        m = this.match_KEYWORD_nosuspend(code);
        if (m) {
            children.push(m);
            let idx = m.incr;
            const m2 = this.match_Expr(code.slice(idx));
            if (m2) {
                children.push(m2);
                idx += m2.incr;
                return {
                    pattern: "PrimaryExpr",
                    lexeme: code.slice(0, idx),
                    incr: idx,
                    children
                };
            }
        }

        m = this.match_KEYWORD_continue(code);
        if (m) {
            children.push(m);
            let idx = m.incr;
            const m2 = this.match_BreakLabel(code.slice(idx));
            if (m2) {
                children.push(m2);
                idx += m2.incr;
            }
            return {
                pattern: "PrimaryExpr",
                lexeme: code.slice(0, idx),
                incr: idx,
                children
            };
        }

        m = this.match_KEYWORD_resume(code);
        if (m) {
            children.push(m);
            let idx = m.incr;
            const m2 = this.match_Expr(code.slice(idx));
            if (m2) {
                children.push(m2);
                idx += m2.incr;
                return {
                    pattern: "PrimaryExpr",
                    lexeme: code.slice(0, idx),
                    incr: idx,
                    children
                };
            }
        }

        m = this.match_KEYWORD_return(code);
        if (m) {
            children.push(m);
            let idx = m.incr;
            const m2 = this.match_BreakLabel(code.slice(idx));
            if (m2) {
                children.push(m2);
                idx += m2.incr;
            }
            return {
                pattern: "PrimaryExpr",
                lexeme: code.slice(0, idx),
                incr: idx,
                children
            };
        }

        m = this.match_BlockLabel(code);
        if (m) {
            children.push(m);
            let idx = m.incr;
            const m2 = this.match_LoopExpr(code.slice(idx));
            if (m2) {
                children.push(m2);
                idx += m2.incr;
                return {
                    pattern: "PrimaryExpr",
                    lexeme: code.slice(0, idx),
                    incr: idx,
                    children
                };
            }
        } else {
            let idx = 0;
            const m2 = this.match_LoopExpr(code.slice(idx));
            if (m2) {
                children.push(m2);
                idx += m2.incr;
                return {
                    pattern: "PrimaryExpr",
                    lexeme: code.slice(0, idx),
                    incr: idx,
                    children
                };
            }
        }

        m = this.match_Block(code);
        if (m) return m;

        m = this.match_CurlySuffixExpr(code);
        if (m) return m;

        return null;
    }

    match_PrefixOp(code: string): MatchResult {
        // PrefixOp
        //   <- EXCLAMATIONMARK
        //   / MINUS
        //   / TILDE
        //   / MINUSPERCENT
        //   / AMPERSAND
        //   / KEYWORD_try
        //   / KEYWORD_await
        let m = this.match_EXCLAMATIONMARK(code);
        if (m) return m;

        m = this.match_MINUS(code);
        if (m) return m;

        m = this.match_TILDE(code);
        if (m) return m;

        m = this.match_MINUSPERCENT(code);
        if (m) return m;

        m = this.match_AMPERSAND(code);
        if (m) return m;

        m = this.match_KEYWORD_try(code);
        if (m) return m;

        m = this.match_KEYWORD_await(code);
        if (m) return m;

        return null;
    }

    match_PrefixExpr(code: string): MatchResult {
        // PrefixExpr <- PrefixOp* PrimaryExpr
        let children: Array < MatchResult > = [];
        let idx = 0;
        do {
            const m = this.match_PrefixOp(code);
            if (m) {
                children.push(m);
                idx += m.incr;
            } else {
                break;
            }
        } while (true);

        const m = this.match_PrimaryExpr(code);
        if (m) {
            children.push(m);
            idx += m.incr;
            return {
                pattern: "PrefixExpr",
                lexeme: code.slice(0, idx),
                incr: idx,
                children
            };
        }

        return null;
    }

    match_MultiplyExpr(code: string): MatchResult {
        // MultiplyExpr <- PrefixExpr (MultiplyOp PrefixExpr)*
        let children: Array < MatchResult > = [];
        const m = this.match_PrefixExpr(code);
        let idx = 0;
        if (m) {
            children.push(m);
            idx += m.incr;
            do {
                const m2 = this.match_MultiplyOp(code.slice(idx));
                if (m2) {
                    children.push(m2);
                    const m3 = this.match_PrefixExpr(code.slice(idx + m2.incr));
                    if (m3) {
                        children.push(m3);
                        idx += m2.incr + m3.incr;
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            } while (true);

            return {
                pattern: "MultiplyExpr",
                lexeme: code.slice(0, idx),
                incr: idx,
                children
            };
        }
        return null;
    }

    match_AdditionExpr(code: string): MatchResult {
        // AdditionExpr <- MultiplyExpr (AdditionOp MultiplyExpr)*
        let children: Array < MatchResult > = [];
        const m = this.match_MultiplyExpr(code);
        let idx = 0;
        if (m) {
            children.push(m);
            idx += m.incr;
            do {
                const m2 = this.match_AdditionOp(code.slice(idx));
                if (m2) {
                    children.push(m2);
                    const m3 = this.match_MultiplyExpr(code.slice(idx + m2.incr));
                    if (m3) {
                        children.push(m3);
                        idx += m2.incr + m3.incr;
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            } while (true);

            return {
                pattern: "AdditionExpr",
                lexeme: code.slice(0, idx),
                incr: idx,
                children
            };
        }
        return null;
    }

    match_BitShiftExpr(code: string): MatchResult {
        // BitShiftExpr <- AdditionExpr (BitShiftOp AdditionExpr)*
        let children: Array < MatchResult > = [];
        const m = this.match_AdditionExpr(code);
        let idx = 0;
        if (m) {
            children.push(m);
            idx += m.incr;
            do {
                const m2 = this.match_BitShiftOp(code.slice(idx));
                if (m2) {
                    children.push(m2);
                    const m3 = this.match_AdditionExpr(code.slice(idx + m2.incr));
                    if (m3) {
                        children.push(m3);
                        idx += m2.incr + m3.incr;
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            } while (true);

            return {
                pattern: "BitShiftExpr",
                lexeme: code.slice(0, idx),
                incr: idx,
                children
            };
        }
        return null;
    }

    match_BitwiseExpr(code: string): MatchResult {
        // BitwiseExpr <- BitShiftExpr (BitwiseOp BitShiftExpr)*
        let children: Array < MatchResult > = [];
        const m = this.match_BitShiftExpr(code);
        let idx = 0;
        if (m) {
            children.push(m);
            idx += m.incr;
            do {
                const m2 = this.match_BitwiseOp(code.slice(idx));
                if (m2) {
                    children.push(m2);
                    const m3 = this.match_BitShiftExpr(code.slice(idx + m2.incr));
                    if (m3) {
                        children.push(m3);
                        idx += m2.incr + m3.incr;
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            } while (true);

            return {
                pattern: "BitwiseExpr",
                lexeme: code.slice(0, idx),
                incr: idx,
                children
            };
        }
        return null;
    }

    match_CompareExpr(code: string): MatchResult {
        // CompareExpr <- BitwiseExpr (CompareOp BitwiseExpr)?
        let children: Array < MatchResult > = [];
        const m = this.match_BitwiseExpr(code);
        let idx = 0;
        if (m) {
            children.push(m);
            idx += m.incr;
            const m2 = this.match_CompareOp(code.slice(idx));
            if (m2) {
                children.push(m2);
                const m3 = this.match_BitwiseExpr(code.slice(idx + m2.incr));
                if (m3) {
                    children.push(m3);
                    idx += m2.incr + m3.incr;
                }
            }

            return {
                pattern: "CompareExpr",
                lexeme: code.slice(0, idx),
                incr: idx,
                children
            };
        }
        return null;
    }

    match_BoolAndExpr(code: string): MatchResult {
        // BoolAndExpr <- CompareExpr (KEYWORD_and CompareExpr)*
        let children: Array < MatchResult > = [];
        const m = this.match_CompareExpr(code);
        let idx = 0;
        if (m) {
            children.push(m);
            idx += m.incr;
            do {
                const m2 = this.match_KEYWORD_and(code.slice(idx));
                if (m2) {
                    children.push(m2);
                    const m3 = this.match_CompareExpr(code.slice(idx + m2.incr));
                    if (m3) {
                        children.push(m3);
                        idx += m2.incr + m3.incr;
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            } while (true);

            return {
                pattern: "BoolAndExpr",
                lexeme: code.slice(0, idx),
                incr: idx,
                children
            };
        }
        return null;
    }

    match_BoolOrExpr(code: string): MatchResult {
        // BoolOrExpr <- BoolAndExpr (KEYWORD_or BoolAndExpr)*
        let children: Array < MatchResult > = [];
        const m = this.match_BoolAndExpr(code);
        let idx = 0;
        if (m) {
            children.push(m);
            idx += m.incr;
            do {
                const m2 = this.match_KEYWORD_or(code.slice(idx));
                if (m2) {
                    children.push(m2);
                    const m3 = this.match_BoolAndExpr(code.slice(idx + m2.incr));
                    if (m3) {
                        children.push(m3);
                        idx += m2.incr + m3.incr;
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            } while (true);

            return {
                pattern: "BoolOrExpr",
                lexeme: code.slice(0, idx),
                incr: idx,
                children
            };
        }
        return null;
    }

    match_Expr(code: string): MatchResult {
        // Expr <- BoolOrExpr
        return this.match_BoolOrExpr(code);
    }

    match_SliceTypeStart(code: string): MatchResult {
        // SliceTypeStart <- LBRACKET (COLON Expr)? RBRACKET
        let children: Array < MatchResult > = [];
        const m = this.match_LBRACKET(code);
        if (m) {
            children.push(m);
            let idx = m.incr;
            let m2 = this.match_COLON(code.slice(idx));
            if (m2) {
                children.push(m2);
                const m3 = this.match_Expr(code.slice(idx + m2.incr));
                if (m3) {
                    children.push(m3);
                    idx += m2.incr + m3.incr;
                }
            }

            m2 = this.match_Expr(code.slice(idx));
            if (m2) {
                children.push(m2);
                idx += m2.incr;
                return {
                    pattern: "SliceTypeStart",
                    lexeme: code.slice(0, idx),
                    incr: idx,
                    children
                };
            }
        }
        return null;
    }

    match_SuffixOp(code: string): MatchResult {
        // SuffixOp
        //   <- LBRACKET Expr (DOT2 (Expr? (COLON Expr)?)?)? RBRACKET
        //   / DOT IDENTIFIER
        //   / DOTASTERISK
        //   / DOTQUESTIONMARK
        let children: Array < MatchResult > = [];
        const m = this.match_LBRACKET(code);
        if (m) {
            children.push(m);
            let idx = m.incr;
            const m2 = this.match_Expr(code.slice(idx));
            if (m2) {
                children.push(m2);
                idx += m2.incr;
                let m3 = this.match_DOT2(code.slice(idx));
                if (m3) {
                    children.push(m3);
                    idx += m3.incr;
                    let m4 = this.match_Expr(code.slice(idx));
                    if (m4) {
                        children.push(m4);
                        idx += m4.incr;
                    }

                    m4 = this.match_COLON(code.slice(idx));
                    if (m4) {
                        children.push(m4);
                        const m5 = this.match_COLON(code.slice(idx));
                        if (m5) {
                            children.push(m5);
                            idx += m4.incr + m5.incr;
                        }
                    }

                    return {
                        pattern: "SuffixOp",
                        lexeme: code.slice(0, idx),
                        incr: idx,
                        children
                    };
                }

                m3 = this.match_RBRACKET(code.slice(idx));
                if (m3) {
                    children.push(m3);
                    idx += m3.incr;
                    return {
                        pattern: "SuffixOp",
                        lexeme: code.slice(0, idx),
                        incr: idx,
                        children
                    };
                }
            }
        }
        return null;
    }

    match_SuffixExpr(code: string): MatchResult {
        // SuffixExpr
        //   <- KEYWORD_async PrimaryTypeExpr SuffixOp* FnCallArguments
        //   / PrimaryTypeExpr (SuffixOp / FnCallArguments)*
        let children: Array < MatchResult > = [];
        let m = this.match_KEYWORD_async(code);
        if (m) {
            children.push(m);
            let idx = m.incr;
            const m2 = this.match_PrimaryTypeExpr(code.slice(idx));
            if (m2) {
                children.push(m2);
                idx += m2.incr;
                do {
                    const m3 = this.match_SuffixOp(code.slice(idx));
                    if (m3) {
                        children.push(m3);
                        idx += m3.incr;
                    } else {
                        break;
                    }
                } while (true);

                const m3 = this.match_FnCallArguments(code.slice(idx));
                if (m3) {
                    children.push(m3);
                    idx += m3.incr;
                    return {
                        pattern: "SuffixExpr",
                        lexeme: code.slice(0, idx),
                        incr: idx,
                        children
                    };
                }
            }
        }

        m = this.match_PrimaryTypeExpr(code);
        if (m) {
            children.push(m);
            let idx = m.incr;
            do {
                let m3 = this.match_SuffixOp(code.slice(idx));
                if (!m3) m3 = this.match_FnCallArguments(code.slice(idx));
                if (m3) {
                    children.push(m3);
                    idx = m3.incr;
                } else {
                    break;
                }
            } while (true);
            return {
                pattern: "SuffixExpr",
                lexeme: code.slice(0, idx),
                incr: idx,
                children
            };
        }

        return null;
    }

    match_ErrorUnionExpr(code: string): MatchResult {
        // ErrorUnionExpr <- SuffixExpr (EXCLAMATIONMARK TypeExpr)?
        let children: Array < MatchResult > = [];
        const m = this.match_SuffixExpr(code);
        if (m) {
            children.push(m);
            let idx = m.incr;
            const m2 = this.match_EXCLAMATIONMARK(code.slice(idx));
            if (m2) {
                children.push(m2);
                const m3 = this.match_TypeExpr(code.slice(idx + m2.incr));
                if (m3) {
                    children.push(m3);
                    idx += m2.incr + m3.incr;
                }
            }
            return {
                pattern: "ErrorUnionExpr",
                lexeme: code.slice(0, idx),
                incr: idx,
                children
            };
        }
        return null;
    }

    match_PrefixTypeOp(code: string): MatchResult {
        // PrefixTypeOp
        //   <- QUESTIONMARK
        //   / KEYWORD_anyframe MINUSRARROW
        //   / SliceTypeStart (ByteAlign / AddrSpace / KEYWORD_const / KEYWORD_volatile / KEYWORD_allowzero)*
        //   / PtrTypeStart (AddrSpace / KEYWORD_align LPAREN Expr (COLON Expr COLON Expr)? RPAREN / KEYWORD_const / KEYWORD_volatile / KEYWORD_allowzero)*
        //   / ArrayTypeStart
        let children: Array < MatchResult > = [];
        let m = this.match_QUESTIONMARK(code);
        if (m) return m;

        m = this.match_KEYWORD_anyframe(code);
        if (m) {
            children.push(m);
            const m2 = this.match_MINUSRARROW(code.slice(m.incr));
            if (m2) {
                children.push(m2);
                return {
                    pattern: "PrefixTypeOp",
                    lexeme: code.slice(0, m.incr + m2.incr),
                    incr: m.incr + m2.incr,
                    children
                };
            }
        }

        // m = this.match_KEYWORD_anyframe(code);
        // if (m) {
        //     const m2 = this.match_MINUSRARROW(code.slice(m.incr));
        //     if (m2) {
        //         return {
        //             lexeme: code.slice(0, m.incr + m2.incr),
        //             incr: m.incr + m2.incr
        //         };
        //     }
        // }

        return null;
    }

    match_mb_utf8_literal(code: string): MatchResult {
        return null;
    }

    match_ascii_char_not_nl_slash_squote(code: string): MatchResult {
        // ascii_char_not_nl_slash_squote <- [\000-\011\013-\046\050-\133\135-\177]
        let children: Array < MatchResult > = [];
        let chVal = code.charCodeAt(0);
        if (
            (chVal >= 0 && chVal <= 9) ||
            (chVal >= 11 && chVal <= 38) ||
            (chVal >= 40 && chVal <= 91) ||
            (chVal >= 93 && chVal <= 127)
        ) {
            return {
                pattern: "ascii_char_not_nl_slash_squote",
                lexeme: code.charAt(0),
                incr: 1,
                children
            }
        }
        return null;
    }

    match_char_char(code: string): MatchResult {
        // char_char
        //   <- mb_utf8_literal
        //   / char_escape
        //   / ascii_char_not_nl_slash_squote
        let m = this.match_mb_utf8_literal(code);
        if (m) return m;

        m = this.match_char_escape(code);
        if (m) return m;

        m = this.match_ascii_char_not_nl_slash_squote(code);
        if (m) return m;

        return null;
    }

    match_CHAR_LITERAL(code: string): MatchResult {
        // CHAR_LITERAL <- "'" char_char "'" skip
        let children: Array < MatchResult > = [];
        if (code.charAt(0) === "'") {
            let idx = 1;
            const m = this.match_char_char(code.slice(idx));
            if (m) {
                children.push(m);
                idx += m.incr;
                if (code.charAt(idx) === "'") {
                    idx++;
                    const m2 = this.match_skip(code.slice(idx));
                    if (m2) {
                        children.push(m2);
                        idx += m2.incr;
                        return {
                            pattern: "CHAR_LITERAL",
                            lexeme: code.slice(0, idx),
                            incr: idx,
                            children
                        };
                    }
                }
            }
        }
        return null;
    }

    match_BUILTINIDENTIFIER(code: string): MatchResult {
        // BUILTINIDENTIFIER <- "@"[A-Za-z_][A-Za-z0-9_]* skip
        let children: Array < MatchResult > = [];
        if (code.charAt(0) === "@") {
            let idx = 1;
            let chVal = code.charCodeAt(idx);
            if (isUppercase(chVal) || isLowercase(chVal) || chVal === 95) {
                idx++;
                do {
                    chVal = code.charCodeAt(idx);
                    if (isUppercase(chVal) || isLowercase(chVal) || isNumeric(chVal) || chVal === 95) {
                        idx++;
                    } else {
                        break;
                    }
                } while (true);

                const m = this.match_skip(code.slice(idx));
                if (m) {
                    idx += m.incr;
                    return {
                        pattern: "BUILTINIDENTIFIER",
                        lexeme: code.slice(0, idx),
                        incr: idx,
                        children
                    };
                }
            }
        }
        return null;
    }

    match_ExprList(code: string): MatchResult {
        // ExprList <- (Expr COMMA)* Expr?
        let children: Array < MatchResult > = [];
        let idx = 0;
        do {
            const m = this.match_Expr(code.slice(idx));
            // console.log("ExprList", m)
            if (m) {
                children.push(m);
                const m2 = this.match_COMMA(code.slice(idx + m.incr));
                if (m2) {
                    children.push(m2);
                    idx += m.incr + m2.incr;
                } else {
                    break;
                }
            } else {
                break;
            }
        } while (true);

        const m = this.match_Expr(code.slice(idx));
        if (m) {
            children.push(m);
            idx += m.incr;
        }

        return {
            pattern: "ExprList",
            lexeme: code.slice(0, idx),
            incr: idx,
            children
        };
    }

    match_FnCallArguments(code: string): MatchResult {
        // FnCallArguments <- LPAREN ExprList RPAREN
        let children: Array < MatchResult > = [];
        const m = this.match_LPAREN(code);
        if (m) {
            children.push(m);
            let idx = m.incr;
            // console.log("AAAAA", code.slice(idx))
            const m2 = this.match_ExprList(code.slice(idx));
            if (m2) {
                children.push(m2);
                idx += m2.incr;
                // console.log(m2)
                // console.log("BBBBB", code.slice(idx))
                const m3 = this.match_RPAREN(code.slice(idx));
                // console.log("FnCallArguments", m, m2, m3, code.slice(idx) )
                // console.log("______")
                if (m3) {
                    children.push(m3);
                    idx += m3.incr;
                    return {
                        pattern: "FnCallArguments",
                        lexeme: code.slice(0, idx),
                        incr: idx,
                        children
                    };
                }
            }
        }
        return null;
    }

    match_ContainerDecl(code: string): MatchResult {
        return null;
    }

    match_line_string(code: string): MatchResult {
        // line_string <- ("\\\\" [^\n]* [ \n]*)+
        let children: Array < MatchResult > = [];
        let idx = 0;
        do {
            if (code.slice(idx).startsWith("\\\\")) {
                idx += "\\\\".length;
                while (code.charAt(idx) !== "\n") {
                    idx++;
                }
                while (code.charAt(idx) === " " || code.charAt(idx) === "\n") {
                    idx++;
                }
            } else {
                break;
            }
        } while (true);

        if (idx !== 0) {
            return {
                pattern: "line_string",
                lexeme: code.slice(0, idx),
                incr: idx,
                children
            };
        }

        return null;
    }

    match_STRINGLITERAL(code: string): MatchResult {
        // STRINGLITERAL
        //   <- STRINGLITERALSINGLE
        //   / (line_string                 skip)+
        let children: Array < MatchResult > = [];
        let m = this.match_STRINGLITERALSINGLE(code);
        if (m) return m;

        let idx = 0;
        do {
            m = this.match_line_string(code.slice(idx));
            if (m) {
                children.push(m);
                const m2 = this.match_skip(code.slice(idx + m.incr));
                if (m2) {
                    idx += m.incr + m2.incr;
                    children.push(m2);
                } else {
                    break;
                }
            } else {
                break;
            }
        } while (true);

        if (idx !== 0) {
            return {
                pattern: "STRINGLITERAL",
                lexeme: code.slice(0, idx),
                incr: idx,
                children
            };
        }

        return null;
    }

    match_SwitchExpr(code: string): MatchResult {
        return null;
    }

    match_ErrorSetDecl(code: string): MatchResult {
        return null;
    }

    match_FLOAT(code: string): MatchResult {
        return null;
    }

    match_doc_comment(code: string): MatchResult {
        // ('///' [^\n]* [ \n]* skip)+
        return null;
    }

    match_ParamType(code: string): MatchResult {
        // ParamType <- KEYWORD_anytype / TypeExpr
        let m = this.match_KEYWORD_anytype(code);
        if (m) return m;
        
        m = this.match_TypeExpr(code);
        if (m) return m;

        return null;
    }

    match_ParamDecl(code: string): MatchResult {
        // ParamDecl
        //   <- doc_comment? (KEYWORD_noalias / KEYWORD_comptime)? (IDENTIFIER COLON)? ParamType
        //   / DOT3
        let children: Array < MatchResult > = [];
        const m = this.match_doc_comment(code);
        if (m) {
            children.push(m);
            let idx = m.incr;
            let m2 = this.match_KEYWORD_noalias(code.slice(idx));
            if (!m2) m2 = this.match_KEYWORD_comptime(code.slice(idx));
            if (m2) {
                children.push(m2);
                idx += m2.incr;
            }

            m2 = this.match_IDENTIFIER(code.slice(idx));
            if (m2) {
                children.push(m2);
                const m3 = this.match_COLON(code.slice(idx + m2.incr));
                if (m3) {
                    children.push(m3);
                    idx += m2.incr + m3.incr;
                }
            }
            
            m2 = this.match_ParamType(code.slice(idx));
            if (m2) {
                children.push(m2);
                idx += m2.incr;
                return {
                    pattern: "ParamDecl",
                    lexeme: code.slice(0, idx),
                    incr: idx,
                    children
                };
            }
        }
        return null;
    }

    match_ParamDeclList(code: string): MatchResult {
        // ParamDeclList <- (ParamDecl COMMA)* ParamDecl?
        let children: Array < MatchResult > = [];
        let idx = 0;
        do {
            const m = this.match_ParamDecl(code.slice(idx));
            if (m) {
                children.push(m);
                const m2 = this.match_COMMA(code.slice(idx + m.incr));
                if (m2) {
                    children.push(m2);
                    idx += m.incr + m2.incr;
                } else {
                    break;
                }
            } else {
                break;
            }
        } while (true);

        const m = this.match_ParamDecl(code.slice(idx));
        if (m) {
            children.push(m);
            idx += m.incr;
        }
        
        return {
            pattern: "ParamDeclList",
            lexeme: code.slice(0, idx),
            incr: idx,
            children
        };
    }

    match_CallConv(code: string): MatchResult {
        return null;
    }

    match_FnProto(code: string): MatchResult {
        // FnProto <- KEYWORD_fn IDENTIFIER? LPAREN ParamDeclList RPAREN ByteAlign? AddrSpace? LinkSection? CallConv? EXCLAMATIONMARK? TypeExpr
        let children: Array < MatchResult > = [];
        const m = this.match_KEYWORD_fn(code);
        if (m) {
            children.push(m);
            let idx = m.incr;
            let m2 = this.match_IDENTIFIER(code.slice(idx));
            if (m2) {
                children.push(m2);
                idx += m2.incr;
            }

            m2 = this.match_LPAREN(code.slice(idx));
            
            if (m2) {
                children.push(m2);
                idx += m2.incr;
                const m3 = this.match_ParamDeclList(code.slice(idx));
                if (m3) {
                    children.push(m3);
                    idx += m3.incr;
                    const m4 = this.match_RPAREN(code.slice(idx));
                    if (m4) {
                        children.push(m4);
                        idx += m4.incr;
                        let m5 = this.match_ByteAlign(code.slice(idx));
                        if (m5) {
                            children.push(m5);
                            idx += m5.incr;
                        }
                        
                        m5 = this.match_AddrSpace(code.slice(idx));
                        if (m5) {
                            children.push(m5);
                            idx += m5.incr;
                        }

                        m5 = this.match_LinkSection(code.slice(idx));
                        if (m5) {
                            children.push(m5);
                            idx += m5.incr;
                        }

                        m5 = this.match_CallConv(code.slice(idx));
                        if (m5) {
                            children.push(m5);
                            idx += m5.incr;
                        }

                        m5 = this.match_EXCLAMATIONMARK(code.slice(idx));
                        if (m5) {
                            children.push(m5);
                            idx += m5.incr;
                        }

                        m5 = this.match_TypeExpr(code.slice(idx));
                        if (m5) {
                            children.push(m5);
                            idx += m5.incr;
                            return {
                                pattern: "FnProto",
                                lexeme: code.slice(0, idx),
                                incr: idx,
                                children
                            };
                        }                        
                    }
                }
            }
        }
        return null;
    }

    match_GroupedExpr(code: string): MatchResult {
        return null;
    }

    match_LabeledTypeExpr(code: string): MatchResult {
        return null;
    }

    match_IfTypeExpr(code: string): MatchResult {
        return null;
    }

    match_INTEGER(code: string): MatchResult {
        return null;
    }

    match_PrimaryTypeExpr(code: string): MatchResult {
        // PrimaryTypeExpr
        //   <- BUILTINIDENTIFIER FnCallArguments
        //   / CHAR_LITERAL
        //   / ContainerDecl
        //   / DOT IDENTIFIER
        //   / DOT InitList
        //   / ErrorSetDecl
        //   / FLOAT
        //   / FnProto
        //   / GroupedExpr
        //   / LabeledTypeExpr
        //   / IDENTIFIER
        //   / IfTypeExpr
        //   / INTEGER
        //   / KEYWORD_comptime TypeExpr
        //   / KEYWORD_error DOT IDENTIFIER
        //   / KEYWORD_anyframe
        //   / KEYWORD_unreachable
        //   / STRINGLITERAL
        //   / SwitchExpr
        let children: Array < MatchResult > = [];
        let m = this.match_BUILTINIDENTIFIER(code);
        // console.log("PRIMM1", m)
        if (m) {
            children.push(m);
            let idx = m.incr;
            const m2 = this.match_FnCallArguments(code.slice(idx));
            // console.log("PRIMM222", m, m2)
            if (m2) {
                children.push(m2);
                idx += m2.incr;
                return {
                    pattern: "PrimaryTypeExpr",
                    lexeme: code.slice(0, idx),
                    incr: idx,
                    children
                };
            }
        }

        m = this.match_CHAR_LITERAL(code);
        if (m) return m;

        m = this.match_ContainerDecl(code);
        if (m) return m;

        m = this.match_DOT(code);
        if (m) {
            children.push(m);
            let idx = m.incr;
            const m2 = this.match_IDENTIFIER(code.slice(idx));
            if (m2) {
                children.push(m2);
                idx += m2.incr;
                return {
                    pattern: "PrimaryTypeExpr",
                    lexeme: code.slice(0, idx),
                    incr: idx,
                    children
                };
            }
        }

        m = this.match_DOT(code);
        if (m) {
            children.push(m);
            let idx = m.incr;
            const m2 = this.match_InitList(code.slice(idx));
            if (m2) {
                children.push(m2);
                idx += m2.incr;
                return {
                    pattern: "PrimaryTypeExpr",
                    lexeme: code.slice(0, idx),
                    incr: idx,
                    children
                };
            }
        }

        m = this.match_ErrorSetDecl(code);
        if (m) return m;

        m = this.match_FLOAT(code);
        if (m) return m;

        m = this.match_FnProto(code);
        if (m) return m;

        m = this.match_GroupedExpr(code);
        if (m) return m;

        m = this.match_LabeledTypeExpr(code);
        if (m) return m;

        m = this.match_IDENTIFIER(code);
        if (m) return m;

        m = this.match_IfTypeExpr(code);
        if (m) return m;

        m = this.match_INTEGER(code);
        if (m) return m;

        m = this.match_KEYWORD_comptime(code);
        if (m) {
            children.push(m);
            let idx = m.incr;
            const m2 = this.match_TypeExpr(code.slice(idx));
            if (m2) {
                children.push(m2);
                idx += m2.incr;
                return {
                    pattern: "PrimaryTypeExpr",
                    lexeme: code.slice(0, idx),
                    incr: idx,
                    children
                };
            }
        }

        m = this.match_KEYWORD_error(code);
        if (m) {
            children.push(m);
            let idx = m.incr;
            const m2 = this.match_DOT(code.slice(idx));
            if (m2) {
                children.push(m2);
                idx += m2.incr;
                const m3 = this.match_IDENTIFIER(code.slice(idx));
                if (m3) {
                    children.push(m3);
                    idx += m3.incr;
                    return {
                        pattern: "PrimaryTypeExpr",
                        lexeme: code.slice(0, idx),
                        incr: idx,
                        children
                    };
                }
            }
        }

        m = this.match_KEYWORD_anyframe(code);
        if (m) return m;

        m = this.match_KEYWORD_unreachable(code);
        if (m) return m;

        m = this.match_STRINGLITERAL(code);
        if (m) return m;

        m = this.match_SwitchExpr(code);
        if (m) return m;

        return null;
    }

    match_TypeExpr(code: string): MatchResult {
        // TypeExpr <- PrefixTypeOp* ErrorUnionExpr
        let children: Array < MatchResult > = [];
        let idx = 0;
        do {
            const m = this.match_PrefixTypeOp(code.slice(idx));
            if (m) {
                children.push(m);
                idx += m.incr;
            } else {
                break;
            }
        } while (true);

        const m = this.match_ErrorUnionExpr(code.slice(idx));
        if (m) {
            children.push(m);
            idx += m.incr;
            return {
                pattern: "TypeExpr",
                lexeme: code.slice(0, idx),
                incr: idx,
                children
            };
        }

        return null;
    }

    match_ByteAlign(code: string): MatchResult {
        return null;
    }

    match_AddrSpace(code: string): MatchResult {
        return null;
    }

    match_LinkSection(code: string): MatchResult {
        return null;
    }

    match_VarDeclProto(code: string): MatchResult {
        // VarDeclProto <- (KEYWORD_const / KEYWORD_var) IDENTIFIER (COLON TypeExpr)? ByteAlign? AddrSpace? LinkSection?
        let children: Array < MatchResult > = [];
        let m = this.match_KEYWORD_const(code);
        if (!m) {
            m = this.match_KEYWORD_var(code);
        }
        if (m) {
            children.push(m);
            let idx = m.incr;
            const m2 = this.match_IDENTIFIER(code.slice(idx));
            if (m2) {
                children.push(m2);
                idx += m2.incr;
                let m3 = this.match_COLON(code.slice(idx));
                if (m3) {
                    children.push(m3);
                    const m4 = this.match_TypeExpr(code.slice(idx + m3.incr));
                    if (m4) {
                        idx += m3.incr + m4.incr;
                    }
                }

                m3 = this.match_ByteAlign(code.slice(idx));
                if (m3) {
                    children.push(m3);
                    idx += m3.incr;
                }

                m3 = this.match_AddrSpace(code.slice(idx));
                if (m3) {
                    children.push(m3);
                    idx += m3.incr;
                }

                m3 = this.match_LinkSection(code.slice(idx));
                if (m3) {
                    children.push(m3);
                    idx += m3.incr;
                }

                return {
                    pattern: "VarDeclProto",
                    lexeme: code.slice(0, idx),
                    incr: idx,
                    children
                };
            }
        }
        return null;
    }

    match_GlobalVarDecl(code: string): MatchResult {
        // GlobalVarDecl <- VarDeclProto (EQUAL Expr)? SEMICOLON
        let children: Array < MatchResult > = [];
        const m = this.match_VarDeclProto(code);
        if (m) {
            children.push(m);
            let idx = m.incr;
            let m2 = this.match_EQUAL(code.slice(idx));
            if (m2) {
                children.push(m2);
                const m3 = this.match_Expr(code.slice(idx + m2.incr));
                // console.log(m3)
                if (m3) {
                    idx += m2.incr + m3.incr;
                    children.push(m3);
                }
            }
            m2 = this.match_SEMICOLON(code.slice(idx));
            if (m2) {
                children.push(m2);
                idx += m2.incr;
                return {
                    pattern: "GlobalVarDecl",
                    lexeme: code.slice(0, idx),
                    incr: idx,
                    children
                };
            }
        }
        return null;
    }

    parse(code: string) {
        this.code = code;

        let declarations = [];

        let start = performance.now();

        let idx = 0;
        while (idx < code.length) {
            const fnProtoMatch = this.match_FnProto(code.slice(idx));
            if (fnProtoMatch) {
                declarations.push(fnProtoMatch);
                idx += fnProtoMatch.incr;
                continue;
            } 

            const globalVarDeclMatch = this.match_GlobalVarDecl(code.slice(idx));
            if (globalVarDeclMatch) {
                declarations.push(globalVarDeclMatch);
                idx += globalVarDeclMatch.incr;
                continue;
            } 
            
            console.error("Unexpected Input");
            console.error(code.slice(idx));
            // idx++;
            break;
        }

        console.log(performance.now() - start)
        console.log(declarations.length)

        return declarations;
    }
}

function generateAST(code: string) {
    const tokenizer = new ZigParser();
    const ast = tokenizer.parse(code);

    let newCode = "";
    for (let j = 0; j < ast.length; j++) {
        newCode += ast[j].lexeme;
    }

    console.log(ast);
    console.log(newCode)

    return ast;
}

function transpile(entryPath: string) {
    if (!fs.existsSync("./zigpp-out")) {
        fs.mkdirSync("./zigpp-out");
    }

    const code = fs.readFileSync(entryPath).toString();

    generateAST(code)

    // fs.writeFileSync(`./zigpp-out/${getFileName(entryPath)}.zig`, code);
}

// --------------------

// const BashShell = require("./BashShell.js");

// type BashShellEvent = {
//     process: string,
//     type: string,
//     data: string | null
// };

// async function runOutput(entryPath: string) {
//     const myShell = new BashShell("main");
//     myShell.handler = (e: BashShellEvent) => {
//         if (e.data) {
//             console.log(e.data);
//         }
//     };
//     await myShell.send(`zig run ${entryPath}`);
//     myShell.kill();
// }

transpile("./demo/main.zigpp");
// runOutput("./zigpp-out/main.zig");

// console.log(process);
