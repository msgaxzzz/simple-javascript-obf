package engine;

import java.util.*;

public final class Lexer {
    public static List<Span> lex(String source) {
        List<Span> tokens = new ArrayList<>();
        int i = 0;
        while (i < source.length()) {
            int start = i;
            char c = source.charAt(i);
            String kind = "punct";
            if (Character.isWhitespace(c)) {
                kind = "space";
                while (i < source.length() && Character.isWhitespace(source.charAt(i))) i++;
            } else if (source.startsWith("//", i)) {
                kind = "comment"; i += 2;
                while (i < source.length() && source.charAt(i) != '\r' && source.charAt(i) != '\n') i++;
            } else if (source.startsWith("/*", i)) {
                kind = "comment";
                int close = source.indexOf("*/", i + 2);
                i = close < 0 ? source.length() : close + 2;
            } else if (c == '"' || c == '\'') {
                kind = "literal";
                boolean block = source.startsWith("\"\"\"", i);
                i += block ? 3 : 1;
                while (i < source.length()) {
                    if (source.charAt(i) == '\\') { i = Math.min(source.length(), i + 2); continue; }
                    if (block && source.startsWith("\"\"\"", i)) { i += 3; break; }
                    if (!block && source.charAt(i) == c) { i++; break; }
                    i++;
                }
            } else if (Character.isJavaIdentifierStart(source.codePointAt(i))) {
                kind = "identifier";
                i += Character.charCount(source.codePointAt(i));
                while (i < source.length() && Character.isJavaIdentifierPart(source.codePointAt(i))) {
                    i += Character.charCount(source.codePointAt(i));
                }
            } else i++;
            tokens.add(new Span(start, i, source.substring(start, i), kind));
        }
        return tokens;
    }

    public static boolean hasUnicodeEscapes(String source) {
        for (int i = 0; i + 1 < source.length(); i++) {
            if (source.charAt(i) == '\\' && source.charAt(i + 1) == 'u') return true;
        }
        return false;
    }

    public static int tokenStart(List<Span> tokens, int offset) {
        int low = 0, high = tokens.size();
        while (low < high) {
            int mid = (low + high) >>> 1;
            if (tokens.get(mid).start < offset) low = mid + 1;
            else high = mid;
        }
        return low;
    }
}
