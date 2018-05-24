package org.ifsoft.protocol;

import javax.xml.bind.annotation.XmlElement;

public class NativeRequest {

    @XmlElement(name = "event")
    private String event;

    @XmlElement(name = "key")
    private String key;

    @XmlElement(name = "button")
    private int button;

    @XmlElement(name = "x")
    private double x;

    @XmlElement(name = "y")
    private double y;

    public NativeRequest() {
        super();
    }

    public String getEvent() {
        return event;
    }

    public void setEvent(String event) {
        this.event = event;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public int getButton() {
        return button;
    }

    public void setButton(int button) {
        this.button = button;
    }

    public double getX() {
        return x;
    }

    public void setX(double x) {
        this.x = x;
    }

    public double getY() {
        return y;
    }

    public void setY(double y) {
        this.y = y;
    }
}
