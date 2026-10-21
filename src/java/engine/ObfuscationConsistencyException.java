package engine;

/**
 * Thrown when an integrity, scoping, or consistency invariant is violated in the obfuscation pipeline.
 */
public class ObfuscationConsistencyException extends RuntimeException {
    public ObfuscationConsistencyException(String message) {
        super(message);
    }

    public ObfuscationConsistencyException(String message, Throwable cause) {
        super(message, cause);
    }
}
