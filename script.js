let socket;
let username = "";
let currentRoom = "";

function joinChat() {
    username = document.getElementById("username").value.trim();
    if (!username) return alert("Enter username");

    socket = new WebSocket("ws://localhost:3000");

    socket.onopen = () => {
        document.getElementById("login").classList.add("hidden");
        document.getElementById("chatApp").classList.remove("hidden");
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "rooms") updateRooms(data.rooms);
        if (data.type === "message") displayMessage(data);
    };

    socket.onerror = () => alert("WebSocket failed");
}

function createRoom() {
    const room = document.getElementById("newRoom").value.trim();
    if (!room) return;

    socket.send(JSON.stringify({ type: "create", room }));
    document.getElementById("newRoom").value = "";
}

function updateRooms(rooms) {
    const list = document.getElementById("roomList");
    list.innerHTML = "";
    rooms.forEach(room => {
        const li = document.createElement("li");
        li.textContent = room;
        li.onclick = () => joinRoom(room);
        list.appendChild(li);
    });
}

function joinRoom(room) {
    currentRoom = room;
    document.getElementById("messages").innerHTML = "";

    socket.send(JSON.stringify({
        type: "join",
        room,
        username
    }));
}

function sendMessage() {
    if (!currentRoom) return alert("Join a room first");

    const msg = document.getElementById("message").value.trim();
    if (!msg) return;

    socket.send(JSON.stringify({
        type: "message",
        room: currentRoom,
        text: msg
    }));

    document.getElementById("message").value = "";
}

function displayMessage(data) {
    const div = document.createElement("div");
    div.innerHTML = `<b>${data.username}</b>: ${data.text} <small>${data.time}</small>`;
    document.getElementById("messages").appendChild(div);
}
