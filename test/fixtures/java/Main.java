import java.io.*;
import java.lang.annotation.*;
import java.util.function.IntUnaryOperator;

@Retention(RetentionPolicy.RUNTIME)
@interface Mark { String value() default "default"; }
@Target(ElementType.TYPE_USE)
@interface Dim { int value(); }

public class Main {
    private int value = 9;
    record Pair(int left, int right) {
        Pair { if (left < 0) throw new IllegalArgumentException("negative"); }
        int sum() { return left + right; }
    }

    int viaReceiver(Main this) {
        int extra = 1;
        return value + extra;
    }

    static int calculate(int value) throws IOException {
        int localSum = 0;
        for (int index = 0; index < value; index++) localSum += index;
        { int index = 4; localSum += index; }
        IntUnaryOperator step = input -> input + 1;
        try (StringReader reader = new StringReader("A")) {
            localSum += reader.read();
        } catch (IOException problem) {
            throw new IOException(problem);
        }
        Object candidate = "xy";
        if (candidate instanceof String word) localSum += word.length();
        int left = 2, right = 3;
        int numbers @Dim(value = 1) [] = { left, right };
        return step.applyAsInt(localSum) + numbers[0] + numbers[1] + new Pair(3, 4).sum();
    }

    @Mark("label")
    static String choose(String choice) {
        return switch (choice) {
            case "yes" -> "ok";
            default -> "no";
        };
    }

    public static void main(String[] args) throws Exception {
        // This comment should disappear, but comment-like literals must survive.
        String block = """
            first
              second "quoted"
            """;
        String unicode = "中文🙂";
        String escapes = "\t\n\r\b\f\"\\\0\377";
        String url = "https://example.invalid/a/*literal*/";
        int 数字 = 5;
        System.out.println(calculate(3) + ":" + new Main().viaReceiver() + ":" + 数字);
        System.out.println(choose("yes") == "ok");
        System.out.println(Main.class.getDeclaredMethod("choose", String.class).getAnnotation(Mark.class).value());
        System.out.println(block.replace("\n", "|") + unicode + ":" + escapes.hashCode() + ":" + url);
    }
}
