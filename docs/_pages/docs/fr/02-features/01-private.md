---
layout: single
title: Privé par défaut
permalink: /docs/fr/private/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/user-ninja.svg"/>Privé'
  nav: docs
src: "_pages/docs/fr/02-features/01-private.md"
---

<!-- TODO: expliquer TOR, avatar à haute entropie, pas d'enregistrement, pas de réutilisation d'identité, routage lightning oignon, politique d'absence de journaux, etc. -->
RoboSats est absolument privé par défaut. Les quatre principaux ingrédients sont :

1. **Vraiment aucune inscription.** Un simple clic suffit pour générer un avatar de robot : c'est tout ce dont vous avez besoin. Étant donné qu'aucune adresse électronique, aucun téléphone, aucun nom d'utilisateur ni aucune donnée de l'utilisateur n'est nécessaire, il n'y a aucun moyen de commettre une erreur et de se faire passer pour un robot. Vos avatars robots ne peuvent pas vous être associés.
2. **Communication chiffrée PGP auditable.** Chaque robot possède une paire de clés PGP pour chiffrer la communication de bout en bout. RoboSats vous permet d'exporter très facilement vos clés et [<b>vérifiez par vous-même</b>](/docs/fr/pgp-encryption) que votre communication est privée avec toute autre application tierce mettant en œuvre la norme OpenPGP.
3. **Réseau Tor Uniquement.** Votre localisation ou votre adresse IP n'est jamais connue du nœud ou de vos correspondants.
4. **Une identité -> un trade.** Vous pouvez (et il vous est conseillé de) négocier avec une identité différente à chaque fois. C'est pratique et facile. Aucune autre bourse ne dispose de cette fonctionnalité et **c'est essentiel pour la confidentialité !** Dans RoboSats, il n'y a aucun moyen pour les observateurs de savoir que plusieurs transactions ont été effectuées par le même utilisateur s'il a utilisé différents avatars de robots.

La combinaison de ces caractéristiques rend les transactions sur RoboSats aussi privées qu'elles peuvent l'être.

## Pipeline de génération d'avatars pour robots
<div align="center">
    <img src="/assets/images/private/usergen-pipeline.png" width="650"/>
</div>

Seul votre correspondant peut apprendre des choses sur vous pendant que vous discutez. Soyez bref et concis et évitez de fournir plus d'informations que ce qui est strictement nécessaire pour l'échange de monnaie fiduciaire.

**Astuce** Vous pouvez améliorer votre confidentialité en utilisant un [proxy wallet](/docs/fr/proxy-wallets/) lorsque vous achetez des Sats dans RoboSats.
{: .notice--primary}


{% include wip %}