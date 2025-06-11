using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace MiniMessengerMVC.Hubs
{
    public class ChatHub : Hub
    {
        private static ConcurrentDictionary<string, string> _users = new();

        public override async Task OnConnectedAsync()
        {
            var username = Context.GetHttpContext()?.Request.Query["username"];
            if (!string.IsNullOrEmpty(username))
            {
                _users[username] = Context.ConnectionId;
                await Clients.All.SendAsync("UserListUpdate", _users.Keys.ToList());
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var user = _users.FirstOrDefault(x => x.Value == Context.ConnectionId);
            if (!string.IsNullOrEmpty(user.Key))
            {
                _users.TryRemove(user.Key, out _);
                await Clients.All.SendAsync("UserListUpdate", _users.Keys.ToList());
            }

            await base.OnDisconnectedAsync(exception);
        }

        public async Task SendPrivateMessage(string toUser, string message, string fromUser)
        {
            if (_users.TryGetValue(toUser, out var connId))
            {
                await Clients.Client(connId).SendAsync("ReceiveMessage", fromUser, message);
            }

            if (_users.TryGetValue(fromUser, out var senderConn))
            {
                await Clients.Client(senderConn).SendAsync("ReceiveMessage", $"You to {toUser}", message);
            }
        }
    }
}