package org.ifsoft.protocol;

import javax.xml.bind.annotation.XmlElement;

public class NativeResponse {

    @XmlElement(name = "message")
    private String message;

    @XmlElement(name = "key")
    private int key;

    public NativeResponse() {
        super();
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public int getKey() {
        return key;
    }

    public void setKey(int key) {
        this.key = key;
    }
}
