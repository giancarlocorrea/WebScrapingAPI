const puppeteer = require("puppeteer");
const DataService = require("./DataService");

let browserPromise = puppeteer.launch({
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--no-first-run",
    "--no-zygote",
    "--deterministic-fetch",
    "--disable-features=IsolateOrigins",
    "--disable-site-isolation-trials",
  ],
});

async function iniciaScraper() {
  const url = "https://www.bombinhas.sc.gov.br/licitacoes/listar/pregao";

  //
  // Inicia uma instância de um novo navegador
  const browser = await browserPromise;

  let oportunidades = DataService.Oportunidades();

  // Cria uma nova página
  pagina = await browser.newPage();

  var startTime = new Date();

  await pagina.goto(url);

  // Aguarda a renderização de um seletor específico no DOM
  await pagina.waitForSelector(".licitacoes.lista");

  // Pega todas as licitações
  let urls = await pagina.$$eval(".item-lista > li", (links) => {
    //
    // Extrai os links baseado no seletor
    return links.map((el) => el.querySelector("h3 > a").href);
  });

  // Faz um loop para cada link, abre uma nova página e pega os dados relevantes
  let paginaPromise = (link) =>
    new Promise(async (resolve, reject) => {
      let dataObj = {};

      // Cria uma nova página para cada url e abre o link
      const novaPagina = await browser.newPage();
      await novaPagina.goto(link);

      let atual = await novaPagina.$eval(
        ".licitacoes.detalhes > h2",
        (licitacao) => licitacao.textContent
      );

      const encontrouLicitacao = oportunidades.find(
        (oportunidade) => oportunidade.licitacao === atual
      );

      if (!encontrouLicitacao) {
        //
        // Atribui valores para cada elemento do objeto
        dataObj["id"] =
          oportunidades.length === 0
            ? 1
            : oportunidades[oportunidades.length - 1].id + 1;

        dataObj["licitacao"] = await novaPagina.$eval(
          ".licitacoes.detalhes > h2",
          (licitacao) => licitacao.textContent
        );
        dataObj["status"] = await novaPagina.$eval(
          ".licitacoes.detalhes > .status",
          (status) => status.textContent
        );

        dataObj["objeto"] = await novaPagina.$eval(
          ".info-basicas > .objeto",
          (objeto) => objeto.textContent
        );

        dataObj["data"] = await novaPagina.$eval(
          ".info-basicas .data",
          (objeto) => {
            let _data = `${objeto.children[1].textContent}/
          ${objeto.children[2].textContent}/
          ${objeto.children[3].textContent}`;
            return _data.replaceAll(/^\s+|\s+|\n+$/gm, "");
          }
        );

        dataObj["lida"] = "N";

        // Retorna o objeto da promise
        resolve(dataObj);
      } else {
        resolve(0);
      }

      await novaPagina.close();
    });

  // Percorre a lista de links e seleciona os valores dos elementos
  for (link in urls) {
    let itemOportunidades = await paginaPromise(urls[link]);
    if (itemOportunidades !== 0) {
      oportunidades.push(itemOportunidades);
    }
  }

  await pagina.close();
  await browser.close();
  var endTime = new Date();
  var seconds = (endTime.getTime() - startTime.getTime()) / 1000;
  console.log("Tempo de execução: " + seconds);
  console.log("Os dados foram extraídos com sucesso");
  DataService.gravaArquivo(oportunidades, "oportunidades.json");

  return oportunidades;
}

module.exports = iniciaScraper;
