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
                mouseMove(request.getX(), request.getY());
            }
            else

            if ("ofmeet.remote.mousedblclick".equals(request.getEvent()))
            {
                doubleClick(request.getX(), request.getY());
            }
            else

            if ("ofmeet.remote.wheel".equals(request.getEvent()))
            {
                mouseWheel(request.getButton());
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
            if (button == 1) robot.mousePress(InputEvent.BUTTON1_MASK);
            if (button == 2) robot.mousePress(InputEvent.BUTTON2_MASK);
            if (button == 3) robot.mousePress(InputEvent.BUTTON3_MASK);
        }
    }

    public static void mouseRelease(int button) throws IOException
    {
        if (robot != null)
        {
            if (button == 1) robot.mouseRelease(InputEvent.BUTTON1_MASK);
            if (button == 2) robot.mouseRelease(InputEvent.BUTTON2_MASK);
            if (button == 3) robot.mouseRelease(InputEvent.BUTTON3_MASK);
        }
    }

    public static void doubleClick(double x, double y) throws IOException
    {
        if (robot != null)
        {
            int newX = (int)((x*capture.width));
            int newY = (int)((y*capture.height));

            robot.mouseMove(newX, newY);
            robot.mousePress(InputEvent.BUTTON1_MASK);
            robot.mouseRelease(InputEvent.BUTTON1_MASK);
            robot.mousePress(InputEvent.BUTTON1_MASK);
            robot.mouseRelease(InputEvent.BUTTON1_MASK);
        }
    }

    public static void keyPress(String key) throws IOException
    {
        if (robot != null)
        {
            if ("shift".equals(key)) robot.keyPress(KeyEvent.VK_SHIFT); else
            if ("command".equals(key)) robot.keyPress(KeyEvent.VK_META); else
            if ("alt".equals(key)) robot.keyPress(KeyEvent.VK_ALT); else
            if ("control".equals(key)) robot.keyPress(KeyEvent.VK_CONTROL);

            else {
                robot.keyPress(getKeyEvent(key));
            }
        }
    }

    public static void keyRelease(String key) throws IOException
    {
        if (robot != null)
        {
            if ("shift".equals(key)) robot.keyRelease(KeyEvent.VK_SHIFT); else
            if ("command".equals(key)) robot.keyRelease(KeyEvent.VK_META); else
            if ("alt".equals(key)) robot.keyRelease(KeyEvent.VK_ALT); else
            if ("control".equals(key)) robot.keyRelease(KeyEvent.VK_CONTROL);

            else {
                robot.keyRelease(getKeyEvent(key));
            }
        }
    }

    public static void mouseMove(double x, double y) throws IOException
    {
        if (robot != null)
        {
            int newX = (int)((x*capture.width));
            int newY = (int)((y*capture.height));

            robot.mouseMove(newX, newY);
        }
    }

    public static void mouseWheel(int delta) throws IOException
    {
        if (robot != null)
        {
            robot.mouseWheel(delta);
        }
    }

    public static int getKeyEvent(String key)
    {
        char character = key.charAt(0);

        try {
            switch (character)
            {
                case 'a': return(KeyEvent.VK_A);
                case 'b': return(KeyEvent.VK_B);
                case 'c': return(KeyEvent.VK_C);
                case 'd': return(KeyEvent.VK_D);
                case 'e': return(KeyEvent.VK_E);
                case 'f': return(KeyEvent.VK_F);
                case 'g': return(KeyEvent.VK_G);
                case 'h': return(KeyEvent.VK_H);
                case 'i': return(KeyEvent.VK_I);
                case 'j': return(KeyEvent.VK_J);
                case 'k': return(KeyEvent.VK_K);
                case 'l': return(KeyEvent.VK_L);
                case 'm': return(KeyEvent.VK_M);
                case 'n': return(KeyEvent.VK_N);
                case 'o': return(KeyEvent.VK_O);
                case 'p': return(KeyEvent.VK_P);
                case 'q': return(KeyEvent.VK_Q);
                case 'r': return(KeyEvent.VK_R);
                case 's': return(KeyEvent.VK_S);
                case 't': return(KeyEvent.VK_T);
                case 'u': return(KeyEvent.VK_U);
                case 'v': return(KeyEvent.VK_V);
                case 'w': return(KeyEvent.VK_W);
                case 'x': return(KeyEvent.VK_X);
                case 'y': return(KeyEvent.VK_Y);
                case 'z': return(KeyEvent.VK_Z);
                case '`': return(KeyEvent.VK_BACK_QUOTE);
                case '0': return(KeyEvent.VK_0);
                case '1': return(KeyEvent.VK_1);
                case '2': return(KeyEvent.VK_2);
                case '3': return(KeyEvent.VK_3);
                case '4': return(KeyEvent.VK_4);
                case '5': return(KeyEvent.VK_5);
                case '6': return(KeyEvent.VK_6);
                case '7': return(KeyEvent.VK_7);
                case '8': return(KeyEvent.VK_8);
                case '9': return(KeyEvent.VK_9);
                case '-': return(KeyEvent.VK_MINUS);
                case '=': return(KeyEvent.VK_EQUALS);
                case '!': return(KeyEvent.VK_EXCLAMATION_MARK);
                case '@': return(KeyEvent.VK_AT);
                case '#': return(KeyEvent.VK_NUMBER_SIGN);
                case '$': return(KeyEvent.VK_DOLLAR);
                case '^': return(KeyEvent.VK_CIRCUMFLEX);
                case '&': return(KeyEvent.VK_AMPERSAND);
                case '*': return(KeyEvent.VK_ASTERISK);
                case '(': return(KeyEvent.VK_LEFT_PARENTHESIS);
                case ')': return(KeyEvent.VK_RIGHT_PARENTHESIS);
                case '_': return(KeyEvent.VK_UNDERSCORE);
                case '+': return(KeyEvent.VK_PLUS);
                case '\t': return(KeyEvent.VK_TAB);
                case '\n': return(KeyEvent.VK_ENTER);
                case '[': return(KeyEvent.VK_OPEN_BRACKET);
                case ']': return(KeyEvent.VK_CLOSE_BRACKET);
                case '\\': return(KeyEvent.VK_BACK_SLASH);
                case ';': return(KeyEvent.VK_SEMICOLON);
                case ':': return(KeyEvent.VK_COLON);
                case '\'': return(KeyEvent.VK_QUOTE);
                case '"': return(KeyEvent.VK_QUOTEDBL);
                case ',': return(KeyEvent.VK_COMMA);
                case '<': return(KeyEvent.VK_LESS);
                case '.': return(KeyEvent.VK_PERIOD);
                case '>': return(KeyEvent.VK_GREATER);
                case '/': return(KeyEvent.VK_SLASH);
                case ' ': return(KeyEvent.VK_SPACE);
                default:
                    return(KeyEvent.VK_SPACE);
            }
        } catch (Exception e) {
            return(KeyEvent.VK_SPACE);
        }
    }
}

