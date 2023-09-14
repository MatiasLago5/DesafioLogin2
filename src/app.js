const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const hbs = require("express-handlebars");
const socketIo = require("socket.io");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("./models/user");

const app = express();
const server = http.createServer(app);
const port = 8080;
const wss = new WebSocket.Server({ server });
const io = socketIo(server);
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const sessionsRoutes = require("./routes/sessionsRoutes");

const URI =
  "mongodb+srv://matiaslagoscarro:lFyL3RLNo4tpDowe@cluster0.kglh74l.mongodb.net/PreEntrega2?retryWrites=true&w=majority";

mongoose
  .connect(URI)
  .then(() => console.log("Conectado a la base de datos"))
  .catch((error) => console.log(error));

const sessionStore = MongoStore.create({
  mongoUrl: URI,
  collection: "sessions",
});

app.use(
  session({
    secret: "reallyHardPassword",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.engine(
  "handlebars",
  hbs.engine({
    layoutsDir: path.join(__dirname, "views", "layouts"),
  })
);
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/sessions", sessionsRoutes);

passport.use(
  new GitHubStrategy(
    {
      clientID: "Iv1.97b77c92e11a6ce8",
      clientSecret: "6806c9289f572092281f197077c1413f87b19c6b",
      callbackURL: "http://localhost:8080/api/sessions/githubcallback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ githubId: profile.id });
        if (!user) {
          user = new User({
            githubId: profile.id,
            username: profile.username,
          });
          user.age = 0;
          user.email = "";
          user.last_name = "";
          user.first_name = "";
          await user.save();
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.use(
  new LocalStrategy(async (email, password, done) => {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return done(null, false, { message: "Usuario no encontrado" });
      }
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return done(null, false, { message: "Contraseña incorrecta" });
      }
      req.session.user = user;
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id)
    .then((user) => {
      done(null, user);
    })
    .catch((err) => {
      done(err, null);
    });
});

app.use("/", (req, res, next) => {
  if (req.session.user) {
    return res.redirect("/productos");
  } else {
    return next();
  }
});

app.use(productRoutes);
app.use(cartRoutes);
app.use("/api/products", productRoutes);
app.use("/api/carts", cartRoutes);

app.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect("/api/sessions/profile");
  }
  res.render("login");
});

app.get("/api/github", passport.authenticate("github"));

app.get(
  "/api/github/githubcallback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("/profile");
  }
);

app.get(
  "/api/sessions/githubcallback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("/");
  }
);
wss.on("connection", (ws) => {
  console.log("Nueva conexión");
  ws.on("close", () => {
    console.log("Conexión cerrada");
  });
});

io.on("connection", (socket) => {
  console.log("Cliente Socket.IO conectado");

  socket.on("new_product", async (productData) => {
    try {
      const newProduct = await Product.create(productData);
      io.emit("product_added", newProduct);
    } catch (error) {
      console.error("Error al agregar el producto:", error);
    }
  });

  socket.on("delete_product", async (productId) => {
    try {
      const deletedProduct = await Product.findByIdAndDelete(productId);
      io.emit("product_deleted", deletedProduct);
    } catch (error) {
      console.error("Error al eliminar el producto:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("Cliente Socket.IO desconectado");
  });
});

server.listen(port, () => {
  console.log(`Servidor Express corriendo en http://localhost:${port}`);
});
