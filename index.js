const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const path = require("path");
const { Server } = require("socket.io");
const io = new Server(server);

const ejs = require("ejs");

const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, addDoc, query } = require("firebase/firestore");

const firebaseConfig = {

  apiKey: "AIzaSyDzcCK-ylm93hvBxwjc2h__oxro-HnGY-Y",

  authDomain: "app-libri-leonardo.firebaseapp.com",

  projectId: "app-libri-leonardo",

  storageBucket: "app-libri-leonardo.firebasestorage.app",

  messagingSenderId: "1060097157627",

  appId: "1:1060097157627:web:b9de6635f6f4118d44c35e",

  measurementId: "G-3RWGTXSGKC"

};


const appFirebase = initializeApp(firebaseConfig);
const db = getFirestore(appFirebase);

app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "public"));
app.engine("html", ejs.renderFile);
app.set("view engine", "html");

app.get("/", (req, res) => {
  res.render("index.html");
});

async function obterHistoricoDePosts() {
  try {
    const listaPosts = [];
    const q = query(collection(db, "posts"));
    const querySnapshot = await getDocs(q);
    
    querySnapshot.forEach((doc) => {
      listaPosts.push(doc.data());
    });
    return listaPosts;
  } catch (erro) {
    console.error("Falha ao buscar posts:", erro);
    return [];
  }
}

io.on("connection", async (socket) => {
  console.log(`Usuário conectado: ${socket.id}`);

  const historico = await obterHistoricoDePosts();
  socket.emit("previousMessage", historico);

  socket.on("sendMessage", async (conteudo) => {
    try {
      await addDoc(collection(db, "posts"), conteudo);
      
      console.log(`Post: ${conteudo.usuario}`);

      socket.broadcast.emit("receivedMessage", conteudo);
      
    } catch (err) {
      console.error("Erro ao salvar dados:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log(`Cliente desconectado: ${socket.id}`);
  });
});

const port = 3000;
server.listen(port, () => {
  console.log(`Servidor rodando em: http://localhost:${port}`);
});