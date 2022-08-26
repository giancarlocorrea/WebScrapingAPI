const express = require("express");
const cors = require("cors");
const DataService = require("./DataService");
const iniciaScraper = require("./scraper");

var app = express();
const PORT = process.env.PORT || 3000;

app.listen(PORT, (err) => {
  if (err) throw err;
  console.log(`Servidor rodando na porta: ${PORT}`);
});

app.use(express.json());
app.use(cors());

app
  .route("/Oportunidades")
  .get((req, res) => res.send(DataService.Oportunidades()));

app
  .route("/atualizaOportunidades/:id")
  .put((req, res) =>
    res.send(DataService.atualizaOportunidades(req.params.id, req))
  );

iniciaScraper();
