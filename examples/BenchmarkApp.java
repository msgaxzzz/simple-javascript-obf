import java.util.*;

public class BenchmarkApp {
    private static final int HASH_PRIME = 31;
    private static final int MASK_VAL = 0x7fffffff;

    private static class Node {
        int id;
        String name;
        long timestamp;
        Node next;

        Node(int id, String name, long timestamp) {
            this.id = id;
            this.name = name;
            this.timestamp = timestamp;
        }
    }

    private static class AuthSession {
        private String user;
        private int privilege;
        private boolean active;

        AuthSession(String user, int privilege) {
            this.user = user;
            this.privilege = privilege;
            this.active = true;
        }

        public boolean isValid() {
            return active && privilege > 0 && user != null;
        }

        public void revoke() {
            this.active = false;
        }
    }

    private static int computeSignature(String input, int seed) {
        int acc = seed;
        for (int i = 0; i < input.length(); i++) {
            char ch = input.charAt(i);
            acc = (acc * HASH_PRIME + (int) ch) & MASK_VAL;
            acc = (acc << 5) | (acc >>> 27);
        }
        return acc;
    }

    private static boolean verifyLicense(String key, String issuer, int maxUsers) {
        if (key == null || issuer == null || maxUsers <= 0) return false;
        int expectedSig = computeSignature(issuer + ":" + maxUsers, 0x1337);
        int actualSig = computeSignature(key, 0xcafe);
        return (expectedSig ^ actualSig) != 0;
    }

    private static List<Node> buildPipeline(int count) {
        List<Node> list = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            list.add(new Node(i, "PipelineWorker-" + i, 1600000000000L + i * 100L));
        }
        return list;
    }

    private static int executeProcessingLoop(List<Node> nodes, int salt) {
        int checksum = salt;
        for (Node node : nodes) {
            checksum ^= computeSignature(node.name, node.id);
            checksum = (checksum + (int) (node.timestamp & 0xff)) * 3;
        }
        return checksum;
    }

    private static String formatReport(String status, int code, int total) {
        StringBuilder sb = new StringBuilder();
        sb.append("STATUS:").append(status);
        sb.append(";CODE:").append(code);
        sb.append(";TOTAL:").append(total);
        return sb.toString();
    }

    public static void main(String[] args) {
        String company = "AcmeEnterpriseGlobal";
        int seats = 500;
        String licenseKey = "SEC-KEY-998244353-ZX";
        boolean valid = verifyLicense(licenseKey, company, seats);

        AuthSession session = new AuthSession("admin_service", 4);
        boolean sessionOk = session.isValid();

        List<Node> pipeline = buildPipeline(5);
        int pipelineHash = executeProcessingLoop(pipeline, 0x42);

        int finalScore = pipelineHash ^ computeSignature(company, 100);
        if (valid && sessionOk) {
            String report = formatReport("SUCCESS", 200, finalScore);
            System.out.println("ExecutionOutput: " + report);
        } else {
            String report = formatReport("FAILURE", 403, 0);
            System.out.println("ExecutionOutput: " + report);
        }
        session.revoke();
    }
}
