---
layout: single
title: Maker and Taker Bonds
permalink: /docs/fr/bonds/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/ticket-simple.svg"/>Bonds'
  nav: docs
src: "_pages/docs/fr/03-understand/04-bonds.md"
---

La caution de fidélité est un petit dépôt que l'utilisateur "bloque" et qui sera débloqué une fois la transaction effectuée ; toutefois, les utilisateurs peuvent perdre leur caution s'ils ne respectent pas les obligations du contrat.

Le processus commercial de RoboSats utilise des cautions pour inciter à la fois le donneur et le preneur d'ordre à respecter les règles et à ne pas tromper leur partenaire robot. Plus précisément, les cautions sont des [factures retenues](https://github.com/lightningnetwork/lnd/pull/2022) utilisant le Lightning Network ; c'est la technologie qui rend RoboSats possible ! Voir [Comprendre > Trade Escrow > Qu'est-ce qu'une facture retenue ?]

Par défaut, la caution est {{site.robosats.default_bond_size}}% du montant total de la transaction. Les donneurs d'ordre peuvent également personnaliser ce montant pour qu'il soit compris entre {{site.robosats.min_bond_size}}% et {{site.robosats.max_bond_size}}%. Des cautions plus importantes signifient plus d'argent qui est nécessaire pour négocier.

La caution ne quitte pas votre portefeuille Lightning, mais sachez que certains portefeuilles sont plus compatibles avec les RoboSats que d'autres en raison de la nature du mécanisme de facturation de la retenue Lightning. Référez-vous à [Comprendre > Portefeuilles](/docs/fr/wallets/) pour plus d'informations.

*Remarque : l'option permettant les "Preneurs sans caution" n'est pas disponible.*

## **Comment verrouiller une caution**

Tout d'abord, reportez-vous à [Comprendre > Portefeuilles](/docs/fr/wallets/) pour connaître les portefeuilles Lightning compatibles qui vous aideront à utiliser RoboSats plus facilement. Selon le portefeuille, la facture peut apparaître comme un paiement en transit, gelé ou même semblant échouer. Vérifiez la liste de compatibilité des portefeuilles !

Les cautions ne sont pas liées aux commandes. Vous pouvez utiliser n'importe quel Sats pour financer la facture de la caution. Il n'y a aucun lien entre la caution et votre commande, ni entre la caution et votre facture de paiement.

Lisez le guide approprié selon que vous crééz ou prenez la commande :
* **Fabricant** : Sélectionnez "Passer un ordre" et modifiez les conditions de l'ordre à votre convenance. L'ordre peut être personnalisé pour exiger une caution autre que la {{site.robosats.default_bond_size}}% du montant total de la transaction, allant de {{site.robosats.min_bond_size}}% à {{site.robosats.max_bond_size}}%. Une fois l'opération terminée, confirmez en cliquant sur "Créer l'ordre", puis utilisez le code QR qui vous est présenté avec votre portefeuille Lightning pour bloquer le montant de Sats indiqué pour votre caution. Vous pouvez toujours annuler l'ordre non pris pendant qu'il est en cours et la caution sera automatiquement débloquée ; cependant, si vous essayez d'annuler l'ordre après qu'il a été pris, vous perdrez votre caution. *Note : Préparez votre portefeuille à l'avance car la boîte d'ordre expire dans dix minutes.
* **Preneur d'ordre** : Parcourez le carnet d'ordres et trouvez l'ordre qui vous convient. Il vous suffit de sélectionner l'option "Prendre l'ordre" et d'utiliser le code QR qui vous est présenté avec votre portefeuille Lightning pour bloquer le montant indiqué de sats pour votre caution. *Remarque : préparez votre portefeuille à l'avance, car la boîte de commande expire dans quatre minutes. Si vous ne procédez pas, l'ordre pris est à nouveau rendu public.*

Une fois que l'opération est terminée et que les deux robots ont respecté leur part du contrat, les cautions du preneur et du donneur d'ordre sont déverrouillées. Techniquement, la caution bloquée n'a jamais quitté votre portefeuille ; mais attention, si vous ne respectez pas les cautions du contrat en essayant de tricher ou en annulant unilatéralement, vous perdrez votre caution.

Votre portefeuille peut prendre un certain temps avant que les fonds apparaissent comme débloqués sur le solde de votre compte. Certains portefeuilles ont des difficultés à reconnaître la facture "Lightning" comme une retenue temporaire sur vos fonds.

Si le problème persiste, veuillez contacter le groupe SimpleX de RoboSats ; mais méfiez-vous des escrocs qui pourraient vous contacter directement et se faire passer pour des membres du personnel de RoboSats ! Le personnel de RoboSats ne vous contactera jamais directement en premier. Voir [Contribute > Code > Communication Channels](/contribute/code/#communication-channels) pour le groupe de support public SimpleX.

## **Perdre votre caution**

Il y a essentiellement quatre conditions qui font qu'un utilisateur perd son lien :
* tricher ou tromper son partenaire (et perdre le litige relatif à la commande)
* annuler unilatéralement la commande sans la collaboration de son partenaire pendant la phase de discussion entre partenaires
* Ne pas soumettre la facture de dépôt (vendeur) ou la facture de paiement (acheteur) dans le délai imparti.
* Ne pas confirmer que le vendeur de bitcoins a bien reçu le fiat.

Notez que vous ne perdez pas votre caution en tant que donneur d'ordre si vous annulez votre ordre *avant* qu'il n'ait été pris par un partenaire. Les conditions ci-dessus sont développées plus en détail ci-dessous.

Si le délai de soumission de la facture (acheteur) ou de verrouillage du séquestre (vendeur) est dépassé, l'ordre expirera et le robot qui n'a pas respecté sa part du contrat perdra la caution. La moitié de la caution perdue est reversée au robot honnête en guise de compensation pour le temps perdu.

Par conséquent, n'oubliez pas votre commande car une fois qu'un robot l'a prise et qu'il verrouille son obligation de fidélité, vous risquez de perdre votre obligation car le minuteur peut expirer. Veillez à ne pas oublier votre ordre et à sauvegarder le jeton unique de votre robot ! N'oubliez pas que ce jeton n'est connu que de vous et que, sans lui, votre avatar de robot unique est irrécupérable.

Si vous avez reçu du fiat mais que vous oubliez de cliquer sur "Confirmer le fiat reçu" de votre côté, vous risquez de perdre votre caution car un litige est automatiquement ouvert et l'équipe de RoboSats constatera que vous n'avez pas respecté les règles du contrat.

En raison des délais impliqués dans le processus de commande, il est recommandé d'utiliser des méthodes de paiement fiat instantanées qui aident à réduire les chances de perdre votre caution. Reportez-vous à [Best Practices > Payment Methods](/docs/fr/payment-methods/) pour plus d'informations.

Ouvrir un litige juste pour annuler un ordre n'est pas recommandé car l'un des deux traders perdra sa caution, sauf cas exceptionnel laissé à l'appréciation du personnel de RoboSats.

Pour les ordres qui permettent aux preneurs de choisir dans une fourchette, les pairs ne risquent de perdre qu'une quantité de Sats proportionnelle à la quantité de Sats pris dans l'ordre.

Par ailleurs, si RoboSats disparaissait soudainement ou était fermé, les obligations seraient automatiquement débloquées puisqu'elles n'ont techniquement jamais quitté votre portefeuille.

## **Vous n'avez pas de bitcoin pour la caution ?**

Parce que les obligations requièrent une facture Lightning, que faire si vous n'avez pas de bitcoin pour commencer ? Même si la caution ne représente généralement que {{site.robosats.default_bond_size}}% du montant total de votre transaction, cela représente un véritable obstacle à l'utilisation de RoboSats pour la première fois si vous n'avez pas de Sats.

Actuellement, les preneurs sans obligations ne sont pas disponibles mais sont envisagés pour une future mise à jour. Les preneurs sans obligations présentent un plus grand risque pour le donneur d'ordre puisque le preneur n'a pas d'argent à mettre en gage. Il serait raisonnable de s'attendre à des primes plus élevées sur les ordres qui autorisent les preneurs sans obligations.

Il existe une myriade d'applications et de services disponibles qui permettent de gagner de très petites quantités de bitcoins. RoboSats ne soutient pas d'application spécifique, mais les utilisateurs ont rapporté des succès avec des applications comme [Stacker News](https://stacker.news/), [Fountain](https://www.fountain.fm/), [Bitcoin Magazine App](https://app.bitcoinmagazine.com/), [THNDR](https://www.thndr.games/), etc.

Étant donné que l'obligation n'est qu'un blocage temporaire des fonds, vous pouvez demander à un ami de couvrir l'obligation de fidélité en payant le code QR à votre place. L'obligation est instantanément débloquée à la suite d'une transaction réussie !

{% include improve %}
