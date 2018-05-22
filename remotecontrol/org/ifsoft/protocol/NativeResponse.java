package org.ifsoft.protocol;

import javax.xml.bind.annotation.XmlElement;

public class NativeResponse {

    @XmlElement(name = "message")
    private String message;

    public NativeResponse() {
        super();
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
