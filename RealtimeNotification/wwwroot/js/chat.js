let connection;
let currentUser = prompt("Nhập tên của bạn:");
const unreadCounts = {};           // user -> số tin chưa đọc
const messageHistory = {};         // user -> [{ sender, content }]
let allUsers = [];
let searchKeyword = "";            // từ khóa tìm kiếm

document.getElementById("username").value = currentUser;

connection = new signalR.HubConnectionBuilder()
    .withUrl(`/chatHub?username=${currentUser}`)
    .build();

// === Nhận tin nhắn ===
connection.on("ReceiveMessage", (fromUser, message) => {
    const toUser = document.getElementById("toUser").value;
    const isMine = fromUser === "You to " + toUser;

    // Hiển thị
    const messageDiv = document.createElement("div");
    messageDiv.className = isMine ? "message-right" : "message-left";
    messageDiv.textContent = `${fromUser}: ${message}`;
    document.getElementById("chatBox").appendChild(messageDiv);
    document.getElementById("chatBox").scrollTop = document.getElementById("chatBox").scrollHeight;

    // Lưu lịch sử RAM
    const key = isMine ? toUser : fromUser;
    if (!messageHistory[key]) messageHistory[key] = [];
    messageHistory[key].push({ sender: fromUser, content: message });

    // Đánh dấu chưa đọc
    if (!isMine && fromUser !== toUser) {
        unreadCounts[fromUser] = (unreadCounts[fromUser] || 0) + 1;
        updateConversationList();
    }

    // Notification ngoài trình duyệt
    if (!isMine && Notification.permission === "granted") {
        new Notification(`💬 Tin nhắn từ ${fromUser}`, { body: message });
    }
});

// === Nhận danh sách người dùng online ===
connection.on("UserListUpdate", (users) => {
    allUsers = users;
    updateConversationList();
});

connection.start().then(() => {
    if (Notification.permission !== "granted") {
        Notification.requestPermission();
    }
});

// === Gửi tin nhắn ===
function sendMessage() {
    const fromUser = document.getElementById("username").value;
    const toUser = document.getElementById("toUser").value;
    const msg = document.getElementById("message").value.trim();

    if (!toUser) {
        alert("Vui lòng chọn người để chat!");
        return;
    }
    if (msg === "") return;

    connection.invoke("SendPrivateMessage", toUser, msg, fromUser);
    document.getElementById("message").value = "";

    // Lưu lịch sử RAM
    if (!messageHistory[toUser]) messageHistory[toUser] = [];
    messageHistory[toUser].push({ sender: `You to ${toUser}`, content: msg });
}

// === Gửi khi nhấn Enter ===
document.getElementById("message").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
    }
});

// === Xử lý tìm kiếm người dùng ===
document.getElementById("searchBox").addEventListener("input", function () {
    searchKeyword = this.value.trim().toLowerCase();
    updateConversationList();
});

// === Hiển thị danh sách người dùng + badge + icon ===
function updateConversationList() {
    const current = document.getElementById("username").value;
    const toUser = document.getElementById("toUser").value;
    const list = document.getElementById("conversationList");
    list.innerHTML = "";

    allUsers.forEach(user => {
        if (user !== current) {
            // Áp dụng tìm kiếm
            if (searchKeyword && !user.toLowerCase().includes(searchKeyword)) return;

            const item = document.createElement("div");
            item.className = "list-group-item user-item d-flex align-items-center justify-content-between";

            const leftPart = document.createElement("div");
            leftPart.className = "d-flex align-items-center";

            const icon = document.createElement("div");
            icon.className = "icon-avatar";
            icon.innerHTML = "<i class='bi bi-person-fill'></i>";

            const name = document.createElement("div");
            name.className = "username";
            name.textContent = user;

            leftPart.appendChild(icon);
            leftPart.appendChild(name);

            const badge = document.createElement("span");
            const count = unreadCounts[user] || 0;
            if (count > 0 && user !== toUser) {
                badge.className = "badge rounded-pill bg-danger me-2";
                badge.textContent = count;
            }

            item.appendChild(leftPart);
            if (count > 0 && user !== toUser) item.appendChild(badge);

            // Khi chọn người chat
            item.onclick = () => {
                document.getElementById("toUser").value = user;
                document.getElementById("chatWith").textContent = user;
                document.getElementById("chatBox").innerHTML = "";

                if (messageHistory[user]) {
                    messageHistory[user].forEach(msg => {
                        const div = document.createElement("div");
                        div.className = msg.sender.startsWith("You to") ? "message-right" : "message-left";
                        div.textContent = `${msg.sender}: ${msg.content}`;
                        document.getElementById("chatBox").appendChild(div);
                    });
                    document.getElementById("chatBox").scrollTop = document.getElementById("chatBox").scrollHeight;
                }

                unreadCounts[user] = 0;
                updateConversationList();
            };

            list.appendChild(item);
        }
    });
}
