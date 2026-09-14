package engine;

import java.util.*;

public final class IdentifierGenerator {
    private static final char[] CONFUSABLE_CHARS = new char[]{'I', 'l', '1', 'O', '0'};
    private static final String ALPHA_START = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_";
    private static final String ALPHA_REST = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_";

    public static String nextName(SplittableRandom random, Set<String> occupied, String style) {
        String name;
        if ("confusable".equalsIgnoreCase(style)) {
            do {
                StringBuilder sb = new StringBuilder("_");
                sb.append(random.nextBoolean() ? 'I' : 'l');
                int len = 7 + random.nextInt(9);
                for (int i = 0; i < len; i++) {
                    sb.append(CONFUSABLE_CHARS[random.nextInt(CONFUSABLE_CHARS.length)]);
                }
                name = sb.toString();
            } while (!occupied.add(name));
            return name;
        } else if ("random".equalsIgnoreCase(style) || "alpha".equalsIgnoreCase(style)) {
            do {
                int len = 5 + random.nextInt(7);
                StringBuilder sb = new StringBuilder();
                sb.append(ALPHA_START.charAt(random.nextInt(ALPHA_START.length())));
                for (int i = 1; i < len; i++) {
                    sb.append(ALPHA_REST.charAt(random.nextInt(ALPHA_REST.length())));
                }
                name = sb.toString();
            } while (isReserved(name) || !occupied.add(name));
            return name;
        } else if ("short".equalsIgnoreCase(style)) {
            do {
                int len = 2 + random.nextInt(3);
                StringBuilder sb = new StringBuilder();
                sb.append(ALPHA_START.charAt(random.nextInt(ALPHA_START.length())));
                for (int i = 1; i < len; i++) {
                    sb.append(ALPHA_REST.charAt(random.nextInt(ALPHA_REST.length())));
                }
                name = sb.toString();
            } while (isReserved(name) || !occupied.add(name));
            return name;
        } else {
            do {
                name = "_0x" + Long.toUnsignedString(random.nextLong(), 16);
            } while (!occupied.add(name));
            return name;
        }
    }

    private static boolean isReserved(String s) {
        return Arrays.asList("abstract","assert","boolean","break","byte","case","catch","char","class","const",
                "continue","default","do","double","else","enum","extends","final","finally","float","for","goto",
                "if","implements","import","instanceof","int","interface","long","native","new","package","private",
                "protected","public","return","short","static","strictfp","super","switch","synchronized","this",
                "throw","throws","transient","try","void","volatile","while","true","false","null","_").contains(s);
    }
}
