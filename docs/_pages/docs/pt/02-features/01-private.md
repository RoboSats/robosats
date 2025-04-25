---
layout: single
title: Privado por padrão
permalink: /docs/pt/private/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/user-ninja.svg"/>Privado'
  nav: docs
src: "_pages/docs/pt/02-features/01-private.md"
---

<!-- TODO: explain TOR, high entropy avatar, no registration, no identity reuse, lightning onion routing, no logs policy, etc. -->

RoboSats é absolutamente privado por padrão. Os quatro ingredientes principais são:

1. **Sem registro algum.** Com um único clique você gerará um avatar de robô: é tudo o que você precisa. Como nenhum e-mail, telefone, nome de usuário ou qualquer entrada do usuário é necessário, não há como cometer um erro e fazer doxx você mesmo. Seus avatares do Robô não podem ser vinculados a você.
2. **Comunicação criptografada PGP auditável.** Cada robô possui um par de chaves PGP para criptografar a comunicação ponta a ponta. O RoboSats torna muito fácil exportar suas chaves e [<b>verificar por si mesmo</b>](/docs/pt/pgp-encryption/) se a comunicação é privada com qualquer outro aplicativo de terceiros que implemente o Padrão OpenPGP.
3. **Somente na rede Tor.** Sua localização ou endereço IP nunca é conhecido pelo nó ou por seus pares.
4. **Uma identidade -> um trade.** Você pode (e é recomendado) negociar com uma identidade diferente a cada vez. É conveniente e fácil. Nenhuma outra exchange possui esse recurso e **é fundamental para a privacidade!** No RoboSats, os observadores não têm como saber que o mesmo usuário fez múltiplas negociações se usou diferentes avatares de robôs.

A combinação desses recursos torna as negociações no RoboSats o mais privadas possível.

## Geração de avatares de robô

<div align="center">
    <img src="/assets/images/private/usergen-pipeline.png" width="650"/>
</div>

Somente seu peer pode saber coisas sobre você enquanto você conversa. Mantenha o bate-papo curto e conciso e evite fornecer mais informações do que o estritamente necessário para a troca fiduciária.

**Dica Pro** Você pode aumentar sua privacidade usando uma [carteira proxy](/docs/proxy-wallets/) lightning ao comprar Sats no RoboSats.
{: .notice--primary}

{% include wip_pt %}
