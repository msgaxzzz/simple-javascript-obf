package engine;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

public final class WorkerServer {
    public static void runWorker(InputStream in, PrintStream out) {
        BufferedReader reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8));
        while (true) {
            try {
                String line = reader.readLine();
                if (line == null || line.equals("EXIT") || line.equals("QUIT")) break;
                if (line.trim().isEmpty()) continue;
                String[] parts = line.split("\t", -1);
                if (parts.length < 6) {
                    out.println("ERR:Invalid protocol frame");
                    out.flush();
                    continue;
                }
                String flags = parts[0];
                String seed = parts[1];
                String filename = parts[2];
                String classpath = parts[3];
                String release = parts[4];
                String base64Source = parts[5];
                byte[] raw = Base64.getDecoder().decode(base64Source);
                String source = new String(raw, StandardCharsets.UTF_8);
                try {
                    String result = ObveilTransformer.execute(source, flags, seed, filename, classpath, release);
                    String encRes = Base64.getEncoder().encodeToString(result.getBytes(StandardCharsets.UTF_8));
                    out.println("OK\t" + encRes);
                    out.flush();
                } catch (Throwable t) {
                    String msg = t.getMessage() == null ? t.toString() : t.getMessage();
                    String encErr = Base64.getEncoder().encodeToString(msg.getBytes(StandardCharsets.UTF_8));
                    out.println("ERR\t" + encErr);
                    out.flush();
                }
            } catch (Throwable e) {
                break;
            }
        }
    }
}
