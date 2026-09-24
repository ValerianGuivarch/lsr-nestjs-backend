# Test rapide — PF2e Val Toolkit 0.36

## 1. Bouton depuis le chat

1. Cible une créature.
2. Poste/lance un sort ou une capacité dont la description contient un lien PF2e vers une **Condition** ou un **Effect**.
3. Un petit bouton 🎯 doit apparaître juste après le lien.
4. Pour une Condition, clique 🎯 et choisis une durée.
5. Pour un Effect, clique 🎯 : l'Effect officiel est appliqué tel quel.

### Cas de référence : Aspersion d'étoiles

- cible l'ennemi ;
- dans la carte du sort, utilise le 🎯 placé à côté de **Ébloui** ;
- choisis 1 round, 3 rounds ou 1 minute selon le degré de réussite ;
- seule la condition officielle doit être visible sur le token ; l'Effect minuteur du Toolkit est volontairement sans icône de token.

## 2. Palette de secours

1. Ouvre une fiche de personnage.
2. Onglet **États & conditions**.
3. Chaque état a maintenant un bouton 🎯.
4. Cible une créature, puis clique 🎯 sur l'état voulu.

## 3. Contexte de cible

Dans le même onglet, cible exactement une créature.
Le bloc **Contexte contre la cible** affiche actuellement, sans lancer de jet :

- la distance ;
- si la cible possède explicitement Dépourvu ;
- si PF2e détecte une prise en tenaille pour une frappe de mêlée prête du personnage ;
- les Token Marks PF2e connus (par exemple Hunt Prey).

Le bloc est volontairement non exhaustif : il ne prétend pas lister tous les modificateurs d'un futur jet.

## 4. Joueur sur une cible non possédée

Si un joueur applique un effet à un PNJ qu'il ne possède pas, le Toolkit passe par Socketlib et le client MJ effectue la création. Socketlib et un MJ connecté sont donc requis dans ce cas.
