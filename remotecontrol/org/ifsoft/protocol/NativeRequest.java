package org.ifsoft.protocol;

import javax.xml.bind.annotation.XmlElement;

public class NativeRequest {

    @XmlElement(name = "event")
    private String event;

    @XmlElement(name = "key")
    private int key;

    @XmlElement(name = "button")
    private int button;

    @XmlElement(name = "width")
    private int width;

    @XmlElement(name = "height")
    private int height;

    @XmlElement(name = "x")
    private int x;

    @XmlElement(name = "y")
    private int y;

    public NativeRequest() {
        super();
    }

    public String getEvent() {
        return event;
    }

    public void setEvent(String event) {
        this.event = event;
    }

    public int getKey() {
        return key;
    }

    public void setKey(int key) {
        this.key = key;
    }

    public int getButton() {
        return button;
    }

    public void setButton(int button) {
        this.button = button;
    }

    public int getWidth() {
        return width;
    }

    public void setWidth(int width) {
        this.width = width;
    }

    public int getHeight() {
        return height;
    }

    public void setHeight(int height) {
        this.height = height;
    }

    public int getX() {
        return x;
    }

    public void setX(int x) {
        this.x = x;
    }

    public int getY() {
        return y;
    }

    public void setY(int y) {
        this.y = y;
    }
}
