package main

import (
	"gosrc.io/xmpp"
	"gosrc.io/xmpp/stanza"
	"log"
	"os"
	"strconv"
	"strings"
)

const (
	serverDomain = iota + 1
	recipient
	jid
	password
	serverPort
	message
	recipientIsRoom
	botAlias

	defaultServerPort = "5222"
	defaultBotAlias   = "/github_bot"
)

func main() {
	// Find server port from action config or use default one
	var port string
	if strings.TrimSpace(os.Args[serverPort]) == "" {
		port = defaultServerPort
	} else {
		port = os.Args[serverPort]
	}

	// Build client and connect to server
	config := xmpp.Config{
		TransportConfiguration: xmpp.TransportConfiguration{
			Address: os.Args[serverDomain] + ":" + port,
		},
		Jid:          os.Args[jid],
		Credential:   xmpp.Password(os.Args[password]),
		StreamLogger: os.Stdout,
		Insecure:     false,
	}
	router := xmpp.NewRouter()
	client, err := xmpp.NewClient(config, router, errorHandler)

	if err != nil {
		log.Fatalf("%+v", err)
	}

	err = client.Connect()
	if err != nil {
		panic(err)
	}

	// Check if we want to send to a chat room or a single user
	// Send presence to connect to chat room, if specified
	// Set the correspondentJid
	var clientJid *stanza.Jid
	isRecipientRoom, err := strconv.ParseBool(os.Args[recipientIsRoom])
	if err != nil {
		panic("failed to determine if sending to a client or chat room : " + err.Error())
	}

	if isRecipientRoom {
		// Building Jid for the room.
		// the "resource". See XEP-0045
		if strings.TrimSpace(os.Args[botAlias]) != "" {
			if os.Args[botAlias][:1] != "/" {
				os.Args[botAlias] = "/" + os.Args[botAlias]
			}
			clientJid, err = stanza.NewJid(os.Args[recipient] + os.Args[botAlias])
		} else {
			clientJid, err = stanza.NewJid(os.Args[recipient] + defaultBotAlias)
		}
		if err != nil {
			panic(err)
		}
		// Sending room presence
		err = joinMUC(client, clientJid)
		if err != nil {
			panic(err)
		}
	} else {
		clientJid, err = stanza.NewJid(os.Args[recipient])
		if err != nil {
			panic(err)
		}
	}

	// Send github message to recipient or chat room
	m := stanza.Message{Attrs: stanza.Attrs{To: clientJid.Bare(), Type: getMessageType(isRecipientRoom)}, Body: os.Args[message]}
	err = client.Send(m)
	if err != nil {
		panic(err)
	}

	// After sending the action message, let's disconnect from the chat room if we were connected to one.
	if isRecipientRoom {
		leaveMUC(client, clientJid)
	}
	// And disconnect from the server
	client.Disconnect()
}

// errorHandler is the client error handler
func errorHandler(err error) {
	panic(err)
}

// joinMUC builds a presence stanza to request joining a chat room
func joinMUC(c xmpp.Sender, toJID *stanza.Jid) error {
	return c.Send(stanza.Presence{Attrs: stanza.Attrs{To: toJID.Full()},
		Extensions: []stanza.PresExtension{
			stanza.MucPresence{
				History: stanza.History{MaxStanzas: stanza.NewNullableInt(0)},
			}},
	})
}

// leaveMUC builds a presence stanza to request leaving a chat room
func leaveMUC(c xmpp.Sender, muc *stanza.Jid) error {
	return c.Send(stanza.Presence{Attrs: stanza.Attrs{
		To:   muc.Full(),
		Type: stanza.PresenceTypeUnavailable,
	}})
}

// getMessageType figures out the right message type for the github message, depending on what recipient is targeted.
// Message type is important since servers are allowed to ignore messages that do not have an appropriate type
func getMessageType(isCorrespRoom bool) stanza.StanzaType {
	if isCorrespRoom {
		return stanza.MessageTypeGroupchat
	}
	return stanza.MessageTypeChat
}
