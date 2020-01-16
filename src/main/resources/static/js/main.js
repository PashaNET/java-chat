// "use strict";

const usernamePage = document.querySelector("#username-page");
const chatPage = document.querySelector("#chat-page");
const usernameForm = document.querySelector("#usernameForm");
const messageForm = document.querySelector("#message-form");
const messageInput = document.querySelector("#message");
const notification = document.querySelector("#notification");
const messageArea = document.querySelector("#message-area");
const connectingElement = document.querySelector(".connecting");

var stompClient = null;
var username = null;

const colors = [
  "#2196F3",
  "#32c787",
  "#00BCD4",
  "#ff5652",
  "#ffc107",
  "#ff85af",
  "#FF9800",
  "#39bbb0"
];

function connect(event) {
  username = document.querySelector("#name").value.trim();

  if (username) {
    usernamePage.classList.add("hidden");
    chatPage.classList.remove("hidden");

    var socket = new SockJS("/ws");
    stompClient = Stomp.over(socket);

    stompClient.connect({}, onConnected, onError);
  }
  event.preventDefault();
}

function onConnected() {
  // Subscribe to the Public Topic
  stompClient.subscribe("/topic/public", onMessageReceived);

  // Tell your username to the server
  stompClient.send(
    "/app/chat.addUser",
    {},
    JSON.stringify({ sender: username, type: "JOIN" })
  );

  connectingElement.classList.add("hidden");
}

function onError(error) {
  connectingElement.textContent =
    "Could not connect to WebSocket server. Please refresh this page to try again!";
  connectingElement.style.color = "red";
}

function sendMessage(event) {
  const messageContent = messageInput.value.trim();
  if (messageContent && stompClient) {
    const chatMessage = {
      sender: username,
      content: messageInput.value,
      type: "CHAT"
    };
    stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
    messageInput.value = "";
  }
  event.preventDefault();
}

function onTypingStart(event) {
  if (stompClient) {
    const chatMessage = {
      sender: username,
      content: username + " is touching keyboard",
      type: "TYPING"
    };

    stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
  }
  //   event.preventDefault();
}

function onTypingStop(event) {
  if (stompClient) {
    const chatMessage = {
      sender: username,
      content: "",
      type: "TYPING_STOP"
    };

    stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
  }
  //   event.preventDefault();
}

function onMessageReceived(payload) {
  var message = JSON.parse(payload.body);

  var messageElement = document.createElement("li");

  if (message.type === "JOIN") {
    messageElement.classList.add("event-message");
    message.content = message.sender + " joined!";
    addMessage(messageElement, message);
  } else if (message.type === "LEAVE") {
    messageElement.classList.add("event-message");
    message.content = message.sender + " left!";
    addMessage(messageElement, message);
  } else if (message.type === "TYPING") {
    notification.innerHTML = message.content;
  } else if (message.type === "TYPING_STOP") {
    setTimeout(() => {
      notification.innerHTML = "";
    }, 500);
  } else {
    messageElement.classList.add("chat-message");

    var avatarElement = document.createElement("i");
    var avatarText = document.createTextNode(message.sender[0]);
    avatarElement.appendChild(avatarText);
    avatarElement.style["background-color"] = getAvatarColor(message.sender);

    messageElement.appendChild(avatarElement);

    var usernameElement = document.createElement("span");
    var usernameText = document.createTextNode(message.sender);
    usernameElement.appendChild(usernameText);
    messageElement.app;
    messageElement.appendChild(usernameElement);
    addMessage(messageElement, message);
  }
}

function addMessage(messageElement, message) {
  var textElement = document.createElement("p");
  var messageText = document.createTextNode(message.content);
  textElement.appendChild(messageText);

  messageElement.appendChild(textElement);

  messageArea.appendChild(messageElement);
  messageArea.scrollTop = messageArea.scrollHeight;
}

function getAvatarColor(messageSender) {
  var hash = 0;
  for (var i = 0; i < messageSender.length; i++) {
    hash = 31 * hash + messageSender.charCodeAt(i);
  }
  var index = Math.abs(hash % colors.length);
  return colors[index];
}

usernameForm.addEventListener("submit", connect, true);
messageInput.addEventListener("keydown", onTypingStart, true);
messageInput.addEventListener("keyup", onTypingStop, true);
messageForm.addEventListener("submit", sendMessage, true);
