---
layout: single
title: Carteiras compatíveis com RoboSats
permalink: /docs/pt/wallets/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/wallet.svg"/>Carteiras'
  nav: docs
src: "_pages/docs/pt/03-understand/07-wallets.md"

# Icons
good: "<i style='color:#1976d2' class='fa-solid fa-square-check fa-2xl'></i>"
soso: "<i style='color:#9c27b0' class='fa fa-triangle-exclamation fa-2xl'></i>"
bad: "<i style='color:#ef5350' class='fa-solid fa-xmark fa-3x'></i>"
phone: "<i class='fa-solid fa-mobile-screen fa-xl'></i>"
laptop: "<i class='fa-solid fa-laptop fa-xl'></i>"
cli: "<i class='fa-solid fa-terminal fa-xl'></i>"
laptop_phone: "<i class='fa-solid fa-laptop-mobile fa-xl'></i>"
remote: "<i class='fa-solid fa-house fa-xl'></i>"
thumbsup: "<i style='color:#1976d2' class='fa-solid fa-thumbs-up fa-2xl'></i>"
thumbsdown: "<i style='color:#9c27b0' class='fa-solid fa-thumbs-down fa-2xl'></i>"
unclear: "<i style='color:#ff9800' class='fa-solid fa-question fa-2xl'></i>"
bitcoin: "<i class='fa-solid fa-bitcoin-sign'></i>"
---
Esta é uma compilação não exaustiva baseada na experiência anterior dos usuários. Não testamos todas as carteiras, se você tentar uma carteira que ainda não está coberta, [informe aqui](https://github.com/Robosats/robosats/issues/44).

| Carteira | Versão | Dispositivo | UX<sup>1</sup> | Bonds<sup>2</sup> | Pagamentos<sup>3</sup> | Comp<sup>4</sup> | Total<sup>5</sup> |
|:---|:---|:--:|:--:|:--:|:--:|:--:|:--:|
|[Alby](#alby-extensión-de-navegador)|[v1.14.2](https://github.com/getAlby/lightning-browser-extension)|{{page.laptop}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}} |{{page.thumbsup}}|
|[Blink](#blink-móvil-antiguo-bitcoin-beach-wallet)|[2.2.73](https://www.blink.sv/)|{{page.phone}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}} |{{page.thumbsup}}|
|[Blixt](#blixt-androidios-backend-ligero-lnd-en-el-dispositivo)|[v0.4.1](https://github.com/hsjoberg/blixt-wallet)|{{page.phone}}|{{page.soso}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}|
|[Blue](#bluewallet-móvil)|[1.4.4](https://bluewallet.io/)|{{page.phone}}|{{page.good}}|{{page.unclear}}|{{page.unclear}}|{{page.good}}|{{page.unclear}}|
|[Breez](#breez-móvil)|[0.16](https://breez.technology/mobile/)|{{page.phone}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}|
|[Cash App](#cash-app-móvil)|[4.7](https://cash.app/)|{{page.phone}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}} |{{page.thumbsup}}|
|[Core Lightning](#core-lightning--cln-cli-interface)|[v0.11.1](https://github.com/ElementsProject/lightning)|{{page.cli}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}|
|[Electrum](#electrum-desktop)|[4.1.4](https://github.com/spesmilo/electrum)|{{page.laptop}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}||
|[LND](#lnd-cli-interface)|[v0.14.2](https://github.com/LightningNetwork/lnd)|{{page.cli}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}|
|[Mash](https://app.mash.com/wallet)|[Beta](https://mash.com/consumer-experience/)|{{page.laptop}}{{page.phone}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}} | {{page.thumbsup}}|
|[Muun](#muun-móvil)|[47.3](https://muun.com/)|{{page.phone}}|{{page.good}}|{{page.good}}|{{page.bad}}|{{page.bad}}|{{page.thumbsdown}}|
|[Phoenix](#phoenix-móvil)|[35-1.4.20](https://phoenix.acinq.co/)|{{page.phone}}|{{page.good}}|{{page.soso}}|{{page.soso}}|{{page.soso}}|{{page.unclear}}|
|[SBW](https://github.com/RoboSats/robosats/issues/44#issue-1135544303)|[2.4.27](https://github.com/btcontract/wallet/)|{{page.phone}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}|
|[WoS](https://github.com/RoboSats/robosats/issues/44#issue-1135544303)|[1.15.0](https://www.walletofsatoshi.com/)|{{page.phone}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}|
|[Zeus](#zeus-móvil-lnd-cln-eclair-remote-backend)|[v0.6.0-rc3](https://github.com/ZeusLN/zeus)|{{page.phone}}{{page.remote}}|{{page.soso}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}|

1. **UX:** A carteira transmite claramente que existe um pagamento "em andamento" (fatura hodl)?
2. **Bonds:** A carteira pode bloquear as faturas com prazo de validade longo necessárias para os bonds?
3. **Pagamentos:** A carteira pode receber pagamentos da RoboSats depois que o usuário compra Sats?
4. **Compatível:** A carteira é globalmente compatível de ponta a ponta com a RoboSats?
5. **Total:** A carteira é compatível e estável o suficiente para ser usada consistentemente sem problemas?

### Alby (extensão de navegador)
Alby é uma extensão de navegador compatível com o padrão WebLN. Considerando que a RoboSats suporta WebLN, a experiência com Alby provavelmente é de primeira qualidade: você não precisará escanear os códigos QR ou copiar/colar faturas geradas. Basta clicar no pop-up do Alby para confirmar as ações. Você pode conectar a extensão Alby à maioria dos nós e carteiras populares ou simplesmente permitir que o Alby hospede uma carteira custodial para você.
A configuração padrão da carteira custodial não é adequada para negociações extensas, pois as transações acima de um determinado resumo total serão rejeitadas.

Instruções para instalar o Alby no Navegador Tor:

1. Instale a extensão Alby na [loja de add-ons do Firefox](https://addons.mozilla.org/en-US/firefox/addon/alby/)
2. Clique na extensão Alby e siga as instruções para configurar sua carteira.

### Blink (Mobile, antigo Bitcoin Beach Wallet)
Funciona bem com RoboSats. As faturas hodl (Bonds) aparecem como "Pendentes" no histórico de transações. Os pagamentos para a carteira Blink funcionam conforme o esperado. Carteira custodial da Galoy, originária do projeto Bitcoin Beach em El Salvador (anteriormente conhecida como "Bitcoin Beach Wallet").


### Blixt (Android/iOS, backend leve LND no dispositivo)
A maioria dos testes de desenvolvimento para RoboSats foi feita usando o Blixt. Esta é uma das carteiras Lightning mais completas disponíveis. No entanto, pode levar a mal-entendidos quando faturas hodl estão bloqueadas, pois mostra um spinner com o pagamento em trânsito. O usuário precisa verificar no site para confirmação. Blixt permite múltiplos HTLCs pendentes; isso é necessário como vendedor, pois você precisa bloquear um bond taker/maker e depois um trade escrow (2 HTLCs pendentes concorrentes). Eventualmente, também pode exibir faturas pagas/carregadas que ainda estão pendentes, especialmente se o usuário fechar o Blixt à força e reabri-lo. Ocasionalmente, pode exibir bonds como pagos que na verdade foram devolvidos.

### Bluewallet (Mobile)
Funciona bem. A Bluewallet encerrou seu serviço custodial. Anteriormente, o serviço custodial causava problemas onde as garantias que a RoboSats devolve são cobradas dos usuários e onde bonds cortados são cobrados duas vezes pela Bluewallet! Este era um bug conhecido por muito tempo na Bluewallet, então eles encerraram seu serviço custodial de LN (o que acabou tornando a experiência da RoboSats mais suave para os usuários).


### Breez (Mobile)
Funciona bem com RoboSats. Breez é uma carteira não custodial. Portanto, tenha em mente o gerenciamento de canais e coisas assim. É uma interface versátil e fácil de usar.

### Cash App (Mobile)
Funciona bem com RoboSats. As faturas hodl (Bonds) aparecem como "Pendentes" no histórico de transações. Os pagamentos para a carteira Cash App funcionam conforme o esperado. Carteira custodial da Block, Inc., anteriormente conhecida como Square, Inc., liderada por Jack Dorsey.

### Core Lightning / CLN (Interface de Linha de Comando - CLI)
Funciona conforme o esperado. O comando `lightning-cli pay <invoice>` não é concluído enquanto o pagamento está pendente, mas é possível usar `lightning-cli paystatus <invoice>` para monitorar o estado.

### Electrum (Desktop)
Esta carteira costumava funcionar bem com canais criados para a ACINQ.
As versões recentes não conseguem criar esse canal com sucesso.

### LND (Interface de Linha de Comando - CLI)
Raw; mostra exatamente o que está acontecendo e o que ele sabe "IN_FLIGHT". Não é amigável para o usuário e, portanto, não é recomendado interagir com a RoboSats para iniciantes. No entanto, tudo funciona perfeitamente. Se você estiver usando o LNCLI regularmente, então não encontrará problemas em usá-lo com a RoboSats.

### Mash Wallet App (Mobile PWA e Desktop Web-Wallet)
No geral, a carteira [Mash](https://mash.com/consumer-experience/) funciona end2end com a Robosats tanto na venda quanto na compra por meio do Lightning. A maioria dos detalhes relevantes da fatura na carteira Mash são mostrados e claros para os usuários durante todo o processo. Quando as transações são concluídas, elas são abertas no aplicativo móvel em ambos os lados, remetente e destinatário, para destacar que as transações foram concluídas. O único problema de UX é que a lista de faturas pendentes não mostra explicitamente faturas HOLD e há uma tela "giratória" no primeiro pagamento da fatura HOLD. A equipe tem um bug aberto para corrigir este problema em breve (esta observação é de 21 de agosto de 2023).

### Muun (Mobile)
Carteira autocustodial com uma interface minimalista.
Semelhante ao Blixt ou LND, a Muun funciona bem com faturas de hold. Você pode ser um vendedor no RoboSats usando a Muun e a experiência do usuário será ótima. No entanto, para ser um comprador ao usar a Muun, você precisa enviar um endereço on-chain para o pagamento, pois uma fatura Lightning não funcionará. A Muun está _atacando com siphoning de taxas_ qualquer remetente para a carteira Muun. Há uma passagem obrigatória por um canal privado com uma taxa de +1500ppm. O RoboSats não irá roteirizar um pagamento de comprador para uma perda líquida. Dado que as taxas de negociação do RoboSats são {{site.robosats.total_fee}}% e precisam cobrir as taxas de roteamento, **o RoboSats nunca encontrará uma rota adequada para um usuário da carteira Muun**. No momento, o RoboSats irá escanear sua fatura em busca de dicas de roteamento que podem potencialmente codificar um _ataque de siphoning de taxas_. Se esse truque for encontrado, a fatura será rejeitada: envie um endereço on-chain em vez disso para uma troca instantânea. Consulte [Entender > Pagamentos on-chain](/docs/pt/on-chain-payouts/) para mais informações sobre trocas instantâneas. Importante notar que o Muun tem problemas durante períodos de aumento nas taxas da blockchain. Independentemente disso, a solução alternativa para receber no Muun é: ou fornecer um endereço na blockchain ou escolher um orçamento de roteamento mais alto após habilitar a opção "Opções Avançadas".


### OBW (Mobile)
Um dos mais simples e um dos melhores. A fatura hodl é exibida como "em voo", não é custodial e você pode criar seus próprios canais. Compre um de um provedor de liquidez ou use Canais Hospedados. É mantido pelo incrível Fiatjaf e é um fork do abandonado SBW.
*Atualização 26-10-23: Neste momento, não há desenvolvimento ou suporte.

### Phoenix (Mobile)
O Phoenix funciona muito bem como tomador de ordens. O Phoenix também funcionará bem como criador de ordens, desde que a configuração do pedido `duração pública` + `duração do depósito` seja inferior a 10 horas. Caso contrário, pode haver problemas para bloquear a fiança do criador. Se a duração total das faturas das fianças/depósitos exceder 450 blocos, o Phoenix não permitirá que os usuários bloqueiem a fiança (`Não é possível adicionar HTLC (...) razão = expiração muito grande`).

### SBW (Mobile)
A partir da versão 2.5, não suporta Lightning.

### Zeus (Mobile, LND, CLN, Eclair remote backend)
É uma interface para LND, CLN e Eclair. Funciona como esperado. É extremamente enganador com uma tela vermelha completa "TIME OUT" alguns segundos após o envio do HTLC. No entanto, se o usuário consultar o site, a fatura será bloqueada corretamente.


## <i class="fa-solid fa-code-pull-request"></i> Ajude a manter esta página atualizada
Há muitas carteiras e todas continuam melhorando à velocidade da lightning. Você pode contribuir para o projeto de código aberto RoboSats testando as carteiras, editando [o conteúdo desta página](https://github.com/Robosats/robosats/tree/main/docs/{{page.src}}) e abrindo um [Pull Request](https://github.com/Robosats/robosats/pulls)


## Informações adicionais

Receber Sats via Lightning não é completamente privado. Consulte [Melhores Práticas > Proxy Wallets](/docs/pt/proxy-wallets/) para obter mais informações sobre receber Sats de forma privada.

Se você estiver enfrentando problemas para receber fundos em sua carteira (devido a problemas de gerenciamento de canais, problemas de roteamento, problemas do lado da carteira, etc.), então uma solução rápida para receber um pagamento rápido seria ter uma segunda carteira à mão que esteja bem conectada e com capacidade de canal suficiente. Você poderia receber Sats em sua segunda carteira e, uma vez que os problemas forem resolvidos, então enviar para sua carteira principal.

Não hesite em entrar em contato com o grupo de bate-papo público do RoboSats no [SimpleX](/contribute/code/#communication-channels) para obter conselhos ou ajuda no uso de carteiras!

{% include improve_pt %}
