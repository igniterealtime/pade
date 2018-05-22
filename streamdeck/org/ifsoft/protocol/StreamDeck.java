package org.ifsoft.protocol;

import uk.co.cloudhunter.streamdeckjava.IStreamDeck;
import uk.co.cloudhunter.streamdeckjava.StreamDeckJava;

import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.io.ByteArrayInputStream;
import java.io.InterruptedIOException;
import javax.imageio.ImageIO;

import javax.xml.bind.annotation.XmlElement;
import com.fasterxml.jackson.databind.ObjectMapper;

import uk.co.cloudhunter.streamdeckjava.IStreamDeckListener;
import uk.co.cloudhunter.streamdeckjava.IStreamDeck;
import uk.co.cloudhunter.streamdeckjava.StreamDeckJava;
import uk.co.cloudhunter.streamdeckjava.StreamDeckKeyState;

import java.util.Random;

/**
 * Stream Deck Host Application for Chrome Native messaging
 */
public class StreamDeck
{
    public static void main(String[] args) throws Exception, IOException
    {
        final IStreamDeck deck = StreamDeckJava.getFirstStreamDeck();
        final Random random = new Random();

        deck.registerKeyListener(new IStreamDeckListener()
        {
            @Override
            public void keyStateChanged(StreamDeckKeyState state)
            {
                for(int i = 0; i < deck.getNumberOfKeys(); i++)
                {
                    // Get if key is changed, and if it is pressed
                    if (state.keyChanged(i) && state.keyPressed(i))
                    {
                        try {
                            NativeResponse response = new NativeResponse();
                            ObjectMapper mapper = new ObjectMapper();
                            response.setMessage("keypress");
                            response.setKey(i);
                            String responseJson = mapper.writeValueAsString(response);
                            sendMessage(responseJson);

                        } catch (Exception e) {
                           try {sendMessage("{\"message\": \"" + e.toString() + "\"}");} catch (Exception e1) {}
                        }
                    }
                }
            }
        });

        while (true)
        {
            // Read message
            String requestJson = readMessage(System.in);

            ObjectMapper mapper = new ObjectMapper();
            NativeRequest request = mapper.readValue(requestJson, NativeRequest.class);

            if ("setColor".equals(request.getMessage()))
            {
                deck.setKeyColour(request.getKey(), request.getColor());
            }

            if ("setImage".equals(request.getMessage()))
            {
                int key = request.getKey();
                String dataUrl = request.getData();

                final int dataStartIndex = dataUrl.indexOf(",") + 1;

                if (dataStartIndex > 0)
                {
                    try {
                        final String data = dataUrl.substring(dataStartIndex);
                        byte[] decoded = java.util.Base64.getDecoder().decode(data);
                        BufferedImage inputImage = ImageIO.read(new ByteArrayInputStream(decoded));
                        deck.setKeyBitmap(key, inputImage);

                    } catch (Exception e) {
                        try {sendMessage("{\"message\": \"" + e.toString() + "\"}");} catch (Exception e1) {}
                    }
                }
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
}

