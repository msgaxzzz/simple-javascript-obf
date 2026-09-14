public class SecurityDemo {
    private static int calculateSecret(int seed) {
        int acc = 0;
        for (int i = 0; i < 5; i++) {
            acc += (seed ^ (i * 31));
        }
        return acc;
    }

    public static void main(String[] args) {
        String service = "SecurityEngine";
        int key = 2026;
        int result = calculateSecret(key);
        System.out.println(service + " token: " + result);
    }
}