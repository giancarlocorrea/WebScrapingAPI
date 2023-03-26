const fs = require("fs");

const DataService = {
  Oportunidades: () => {
    return DataService.lerArquivo("oportunidades.json");
  },

  atualizaOportunidades: (id, req) => {
    let oportunidades = DataService.Oportunidades();
    const id_oportunidade = Number(id);

    const oportunidade = oportunidades.find(
      (oportunidade) => Number(oportunidade.id) === Number(id_oportunidade)
    );

    if (!oportunidade) return "Oportunidade não encontrada";

    const atualizaOportunidade = {
      id,
      licitacao: oportunidade.licitacao,
      status: oportunidade.status,
      objeto: oportunidade.objeto,
      lida: "S",
    };

    oportunidades = oportunidades.map((oportunidade) => {
      if (oportunidade.id === id_oportunidade)
        oportunidade = atualizaOportunidade;
      return oportunidade;
    });

    DataService.gravaArquivo(oportunidades, "oportunidades.json");
  },

  lerArquivo: (arquivo) => {
    return JSON.parse(fs.readFileSync(arquivo));
  },

  // existeLicitacao: (array, id_licitacao) => {
  //   array.find((item) => item.licitacao === id_licitacao);
  // },

  gravaArquivo: (array, arquivo) => {
    fs.writeFile(arquivo, JSON.stringify(array), "utf8", function (err) {
      if (err) {
        return console.log(err);
      }
      console.log(`Os dados foram salvos no arquivo ${arquivo}`);
    });
  },
};

module.exports = DataService;
