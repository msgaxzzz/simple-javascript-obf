import engine.ObveilTransformer;
import engine.WorkerServer;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;

public class ObveilJava {
    public static void main(String[] args) {
        try {
            if (args.length == 1 && args[0].equals("--worker")) {
                WorkerServer.runWorker(System.in, System.out);
                return;
            }
            if (args.length != 7) {
                throw new IllegalArgumentException("Expected input, output, flags, seed, filename, classpath and release.");
            }
            String source = Files.readString(Path.of(args[0]), StandardCharsets.UTF_8);
            String output = ObveilTransformer.execute(source, args[2], args[3], args[4], args[5], args[6]);
            Files.writeString(Path.of(args[1]), output + "\n", StandardCharsets.UTF_8);
        } catch (Exception error) {
            System.err.println(error.getMessage());
            System.exit(1);
        }
    }
}
