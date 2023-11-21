---
layout: single
title: Premium over the Market
permalink: /docs/fr/premium/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/percent.svg"/>Premium'
  nav: docs
src: "_pages/docs/fr/03-understand/03-premium.md"
---

La prime associée à votre ordre pair-à-pair est la différence de prix qui existe par rapport au taux de change courant du bitcoin-fiat sur les bourses centralisées typiques.

Lorsque vous parcourez la liste des transactions, le prix de la bourse de bitcoins des ordres en cours est automatiquement ajusté pour inclure la prime correspondante de l'ordre.

En bas de l'interface des transactions se trouve la prime de la place de marché au cours des dernières 24 heures, généralement de l'ordre de +5 %, ce qui est normal dans un environnement privé de pair-à-pair.

Choisissez une prime compétitive et incitez vos collègues robots à fournir de la liquidité à la place de marché avec leurs bitcoins et fiats anonymes !

## **Choisir une prime**

Créez un ordre, puis saisissez la "prime par rapport au marché (%)", qui peut être une valeur positive, négative ou nulle. Par défaut, la prime de l'ordre est fixée par rapport au taux du marché du bitcoin-fiat.

Ou, au lieu du réglage par défaut, les créateurs peuvent sélectionner la méthode de tarification explicite (*voir note de bas de page*) en choisissant un montant exact de Sats à échanger contre le montant en fiat donné.

Lorsque vous choisissez une prime, tenez compte de la ou des méthodes de paiement et du montant que vous avez choisi ; ces éléments, ainsi que la prime que vous souhaitez, seront en concurrence avec d'autres ordres en direct pour inciter et attirer les preneurs d'ordres robotisés. Expérimentez différentes primes pour trouver ce qui fonctionne le mieux pour vos ordres spécifiques.

Si vous achetez des bitcoins, une prime plus élevée augmente les chances que l'ordre soit exécuté par un vendeur ; si vous vendez des bitcoins, une prime plus élevée diminue les chances que l'ordre soit exécuté par un acheteur. En tant que donneur d'ordre, vous voyez comment votre prime se classe (se compare) par rapport à des ordres similaires passés en direct dans la même devise.

En résumé :
* Prime **Positive**: négocier des BTC à un prix supérieur au prix moyen des échanges centralisés.
* Prime **Negative** : négocier des BTC avec une décote par rapport au prix moyen sur les bourses centralisées.
* Prime **Zero** : échanger des BTC sans différence de prix par rapport au prix moyen des bourses centralisées.
* Méthode des prix **Relatifs**: laisser la prime de prix évoluer en fonction du taux de marché du bitcoin-fiat.
* Méthode des prix **Explicite** : fixer une prime de prix en utilisant un montant fixe de Sats.
* **Rang Premium**: indique le rang de la prime de votre ordre parmi tous les ordres publics dans la même devise, allant de 0 % (prime la plus faible) à 100 % (prime la plus élevée).

Lors de la passation de l'ordre, vous verrez un résumé textuel décrivant votre ordre sous le bouton "Créer l'ordre". Par exemple, l'achat d'un bitcoin pour 100 USD avec une prime de +5,00 % par rapport au taux du marché se lirait comme suit : "Acheter BTC pour 100 USD avec une prime de 5%"

Si une erreur est commise lors de la sélection de la prime ou si l'ordre n'est pas exécuté dans le temps imparti, il est facile d'annuler l'ordre et d'en créer un nouveau.

Notez que la valeur en pourcentage est limitée à deux décimales. En outre, les valeurs décimales doivent être formatées en utilisant "." (point) et non "," (virgule) comme séparateur de décimales.

Alors... que devez-vous choisir comme prime ? D'une manière générale, la plupart des robots souhaitent que leur commande soit traitée rapidement. Une approche simple pour décider d'une prime compétitive consiste à jeter un coup d'œil au transactions existantes. Examinez les offres existantes et notez les primes associées à la devise et au mode de paiement que vous souhaitez. Rendez votre ordre plus désirable que les autres en choisissant une prime légèrement supérieure (acheteur) ou inférieure (vendeur) à toute prime d'ordre existante associée à la devise et au mode de paiement souhaités.

Par exemple, vous (l'acheteur) constatez que la prime la plus élevée parmi les ordres existants associés à la devise et au mode de paiement souhaités est de 5%. Vous créez un ordre avec les mêmes conditions, mais avec une prime légèrement supérieure à celle de votre concurrent. Les vendeurs qui consultent le carnet d'ordres compareront les ordres et remarqueront que votre ordre leur permet d'obtenir plus de fiats en échange de leurs précieux Sats ; ils seront donc plus tentés d'accepter votre ordre !

Mais vos concurrents pourraient remarquer que leur commande existante n'a plus la prime la plus élevée du carnet de commandes et annuler leur commande pour en créer une nouvelle avec une prime plus élevée que la vôtre... Attention à la guerre des primes !

*Note de bas de page : la méthode de tarification explicite a été supprimée en tant qu'option pour des raisons techniques, mais elle pourrait éventuellement revenir dans de futures mises à jour. Actuellement, la tarification des commandes n'est que relative au taux du marché*.

## **Pourquoi avoir des primes ?**

Naturellement, de nombreux robots veulent acheter des bitcoins, mais très peu veulent en vendre ; par conséquent, la demande d'échange de bitcoins en privé est élevée. Les primes sont simplement le produit de cette relation entre l'offre et la demande sur un marché anonyme de pair à pair.

Les acheteurs doivent donc être réalistes et ajuster leurs primes en conséquence ; en effet, les vendeurs qui échangent des bitcoins contre des devises chercheront généralement à obtenir une prime parce qu'ils fournissent de la liquidité avec leurs bitcoins et leurs devises. Toutefois, en fonction des conditions du marché, la prime peut devenir nulle ou négative.

La confidentialité est précieuse tant pour l'acheteur que pour le vendeur et vaut toujours une prime, que ce soit en raison du temps, de l'effort ou du risque ; à ce titre, les utilisateurs finaux peuvent s'attendre à ce qu'une prime accompagne leurs transactions.

## **Informations complémentaires**

La prime relative fait référence aux taux de change actuels des API publiques, en particulier les prix de blockchain.io et de yadio.io. Le prix médian du bitcoin dans la devise sélectionnée est alors calculé et affiché comme le taux de marché que votre prime suit.

La prime sur 24 heures affichée sur l'interface de la bourse est déterminée par la médiane pondérée, et non par la moyenne, des ordres réussis au cours des dernières 24 heures. Cette méthode de calcul est plus résistante aux valeurs aberrantes et plus représentative du consensus du marché de pair à pair. En d'autres termes, l'utilisateur final doit considérer cette valeur comme la prime qu'il peut approximativement s'attendre à payer pour un ordre.

{% include improve %}
