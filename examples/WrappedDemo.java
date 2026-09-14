public class WrappedDemo {
    private static int computeHash(String data, int salt) {
        int h = salt;
        for (int i = 0; i < data.length(); i++) {
            h = (h * 31) ^ data.charAt(i);
        }
        return h;
    }

    public static void main(String[] args) {
        String payload = "ClassMaskingAndSplitting";
        int salt = 1337;
        int token = computeHash(payload, salt);
        System.out.println("SecureToken: " + token);
    }
}