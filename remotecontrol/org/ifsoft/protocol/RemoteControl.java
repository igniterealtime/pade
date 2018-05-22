package org.ifsoft.protocol;

import java.io.IOException;
import java.io.InterruptedIOException;
import java.io.InputStream;

import java.awt.*;
import java.awt.event.*;

import javax.xml.bind.annotation.XmlElement;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Remove Control Host Application for Chrome Native messaging
 */
public class RemoteControl
{
    private static Robot robot;
    private static Dimension capture;

    public static void main(String[] args) throws Exception, IOException
    {
        robot = new Robot();
        capture = Toolkit.getDefaultToolkit().getScreenSize();

        while (true)
        {
            String requestJson = readMessage(System.in);

            ObjectMapper mapper = new ObjectMapper();
            NativeRequest request = mapper.readValue(requestJson, NativeRequest.class);

            if ("ofmeet.remote.keydown".equals(request.getEvent()))
            {
                keyPress(request.getKey());
            }
            else

            if ("ofmeet.remote.keyup".equals(request.getEvent()))
            {
                keyRelease(request.getKey());
            }

            if ("ofmeet.remote.mousedown".equals(request.getEvent()))
            {
                mousePress(request.getButton());
            }
            else

            if ("ofmeet.remote.mouseup".equals(request.getEvent()))
            {
                mouseRelease(request.getButton());
            }

            else

            if ("ofmeet.remote.mousemove".equals(request.getEvent()))
            {
                mouseMove(request.getX(), request.getY(), request.getWidth(), request.getHeight());
            }

            else

            if ("ofmeet.remote.wheel".equals(request.getEvent()))
            {
                mouseWheel(request.getKey());
            }

            else

            if ("ofmeet.remote.hello".equals(request.getEvent()))
            {
                postMessage("hello too");
            }
        }
    }

    private static String readMessage(InputStream in) throws IOException {
        byte[] b = new byte[4];
        in.read(b); // Read the size of message

        int size = getInt(b);

        if (size == 0) {
            throw new InterruptedIOException("Blocked communication");
        }

        b = new byte[size];
        in.read(b);

        return new String(b, "UTF-8");
    }

    private static void postMessage(String message)
    {
        try {
            sendMessage("{\"message\": \"" + message + "\"}");
        } catch (Exception e) {}
    }

    private static void sendMessage(String message) throws IOException {
        System.out.write(getBytes(message.length()));
        System.out.write(message.getBytes("UTF-8"));
        System.out.flush();
    }

    public static int getInt(byte[] bytes) {
        return (bytes[3] << 24) & 0xff000000 | (bytes[2] << 16) & 0x00ff0000 | (bytes[1] << 8) & 0x0000ff00
                | (bytes[0] << 0) & 0x000000ff;
    }

    public static byte[] getBytes(int length) {
        byte[] bytes = new byte[4];
        bytes[0] = (byte) (length & 0xFF);
        bytes[1] = (byte) ((length >> 8) & 0xFF);
        bytes[2] = (byte) ((length >> 16) & 0xFF);
        bytes[3] = (byte) ((length >> 24) & 0xFF);
        return bytes;
    }

    public static void mousePress(int button) throws IOException
    {
        if (robot != null)
        {
            postMessage("mousePress " + button);

            if (button == 1) robot.mousePress(InputEvent.BUTTON1_MASK);
            if (button == 2) robot.mousePress(InputEvent.BUTTON2_MASK);
            if (button == 3) robot.mousePress(InputEvent.BUTTON3_MASK);
        }
    }

    public static void mouseRelease(int button) throws IOException
    {
        if (robot != null)
        {
            postMessage("mouseRelease " + button);

            if (button == 1) robot.mouseRelease(InputEvent.BUTTON1_MASK);
            if (button == 2) robot.mouseRelease(InputEvent.BUTTON2_MASK);
            if (button == 3) robot.mouseRelease(InputEvent.BUTTON3_MASK);
        }
    }

    public static void doubleClick(int x, int y, int width, int height) throws IOException
    {
        if (robot != null)
        {
            postMessage("doubleClick " + x + " " + y + " " + width + " " + height);

            int newX = (int)((x/width*capture.width));
            int newY = (int)((y/height*capture.height));

            robot.mouseMove(newX, newY);
            robot.mousePress(InputEvent.BUTTON1_MASK);
            robot.mouseRelease(InputEvent.BUTTON1_MASK);
            robot.mousePress(InputEvent.BUTTON1_MASK);
            robot.mouseRelease(InputEvent.BUTTON1_MASK);
        }
    }

    public static void keyPress(int key) throws IOException
    {
        int newKey = translateKey(key);

        if (robot != null)
        {
            postMessage("keyPress " + key);
            robot.keyPress(newKey);
        }
    }

    public static void keyRelease(int key) throws IOException
    {
        int newKey = translateKey(key);

        if (robot != null)
        {
            postMessage("keyRelease " + key);
            robot.keyRelease(newKey);
        }
    }

    public static void mouseMove(int x, int y, int width, int height) throws IOException
    {
        if (robot != null)
        {
            postMessage("mouseMove " + x + " " + y + " " + width + " " + height);
            int newX = (int)((x/width*capture.width));
            int newY = (int)((y/height*capture.height));

            robot.mouseMove(newX, newY);
        }
    }

    public static void mouseWheel(int delta) throws IOException
    {
        if (robot != null)
        {
            postMessage("mouseWheel " + delta);
            robot.mouseWheel(delta);
        }
    }

    private static int translateKey(int key)
    {
        if (key == 13)
            return 10;
        else
            return (int) key;
    }
}

