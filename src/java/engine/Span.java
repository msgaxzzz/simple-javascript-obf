package engine;

public final class Span {
    public final int start;
    public final int end;
    public final String text;
    public final String kind;
    public Span(int start, int end, String text, String kind) {
        this.start = start;
        this.end = end;
        this.text = text;
        this.kind = kind;
    }
}
