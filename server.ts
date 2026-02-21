import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  const PORT = 3000;

  app.use(express.json());

  // Real-time Messaging System
  const messages: any[] = [];
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    
    // Send existing messages to new user
    socket.emit("previous_messages", messages.slice(-50));

    socket.on("send_message", (data) => {
      const newMessage = {
        id: Date.now(),
        user: data.user || "Anónimo",
        avatar: data.avatar || "",
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      messages.push(newMessage);
      if (messages.length > 100) messages.shift(); // Keep last 100
      io.emit("new_message", newMessage);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  // API Route to fetch Roblox User Data
  app.get("/api/roblox/user/:username", async (req, res) => {
    try {
      const { username } = req.params;
      
      // 1. Get User ID from Username
      const userRes = await fetch("https://users.roblox.com/v1/usernames/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: [username], excludeBannedUsers: true })
      });
      
      const userData = await userRes.json();
      if (!userData.data || userData.data.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = userData.data[0];
      const userId = user.id;

      // 2. Get Detailed Profile
      const profileRes = await fetch(`https://users.roblox.com/v1/users/${userId}`);
      const profile = await profileRes.json();

      // 3. Get Avatar Thumbnail
      const thumbRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=420x420&format=Png&isCircular=false`);
      const thumbData = await thumbRes.json();
      const avatarUrl = thumbData.data?.[0]?.imageUrl;

      res.json({
        id: userId,
        username: user.name,
        displayName: user.displayName,
        description: profile.description,
        created: profile.created,
        avatarUrl
      });
    } catch (error) {
      console.error("Roblox API Error:", error);
      res.status(500).json({ error: "Failed to fetch Roblox data" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
