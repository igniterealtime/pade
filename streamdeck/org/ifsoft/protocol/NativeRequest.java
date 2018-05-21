package org.ifsoft.protocol;

import javax.xml.bind.annotation.XmlElement;

public class NativeRequest {

    @XmlElement(name = "message")
    private String message;

    @XmlElement(name = "key")
    private int key;

    @XmlElement(name = "color")
    private int color;

    @XmlElement(name = "data")
    private String data;

    public NativeRequest() {
        super();
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getData() {
        return data;
    }

    public void setData(String data) {
        this.data = data;
    }

    public int getKey() {
        return key;
    }

    public void setKey(int key) {
        this.key = key;
    }

    public int getColor() {
        return color;
    }

    public void setColor(int color) {
        this.color = color;
    }
}
