package be.swsb.cqrs.conversation;

public class Participant {

    private String name;

    private boolean victim;

    public Participant(String name, boolean victim) {
        this.name = name;
        this.victim = victim;
    }
}