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

  let oportunidades = [];

  // Cria uma nova página
  pagina = await browser.newPage();

  await pagina.goto(url);

  // Aguarda a renderização de um seletor específico no DOM
  await pagina.waitForSelector(".licitacoes.lista");

  // Pega todas as licitações
  let urls = await pagina.$$eval(".item-lista > li", (links) => {
    // let titulo = links.map((el) => el.querySelector("h3 > a").textContent);
    // //console.log(existeLicitacao(titulo));
    //
    // Extrai os links baseado no seletor
    links = links.map((el) => el.querySelector("h3 > a").href);
    return links;
  });

  // Faz um loop para cada link, abre uma nova página e pega os dados relevantes
  let paginaPromise = (link) =>
    new Promise(async (resolve, reject) => {
      let dataObj = {};

      // Cria uma nova página para cada url e abre o link
      const novaPagina = await browser.newPage();
      await novaPagina.goto(link);

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

      dataObj["lida"] = "N";

      // Retorna o objeto da promise
      resolve(dataObj);

      await novaPagina.close();
    });

  // Percorre a lista de links e seleciona os valores dos elementos
  for (link in urls) {
    let itemOportunidades = await paginaPromise(urls[link]);
    oportunidades.push(itemOportunidades);
  }

  DataService.gravaArquivo(oportunidades, "oportunidades.json");

  await pagina.close();

  await browser.close();

  return oportunidades;
}

module.exports = iniciaScraper;
