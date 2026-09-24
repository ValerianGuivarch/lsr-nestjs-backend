# Sous-domaines publics sur le NAS

Le tableau de bord est servi par `https://l7r.fr` (port local `3000`). Les outils séparés utilisent des sous-domaines, sans exposer leurs ports dans les liens :

| URL publique | Service local |
| --- | --- |
| `https://admin.l7r.fr` | React Admin JdR, `127.0.0.1:4203` |
| `https://map.l7r.fr/pj` | carte joueurs, `127.0.0.1:4204/pj` |
| `https://map.l7r.fr/mj` | carte MJ, `127.0.0.1:4204/mj` |

## Pré-requis DNS et certificat

Créer les enregistrements DNS `admin.l7r.fr` et `maps.l7r.fr` vers le NAS, puis demander les certificats correspondants dans DSM. Les certificats doivent être affectés aux deux noms de domaine.

## Proxy nginx

Créer deux virtual hosts HTTPS sur le NAS. Les en-têtes WebSocket permettent à Vite de fonctionner aussi en mode développement.

```nginx
server {
    listen 443 ssl;
    server_name admin.l7r.fr;

    # mêmes chemins de certificat que le virtual host l7r.fr, mais certificat admin.l7r.fr
    ssl_certificate     /chemin/vers/admin-cert.pem;
    ssl_certificate_key /chemin/vers/admin-privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:4203;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

server {
    listen 443 ssl;
    server_name map.l7r.fr;

    # certificat map.l7r.fr
    ssl_certificate     /chemin/vers/maps-cert.pem;
    ssl_certificate_key /chemin/vers/maps-privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:4204;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Vérifier puis recharger nginx :

```bash
sudo nginx -t && sudo nginx -s reload
```

## Démarrage indépendant de la carte

La carte n'est volontairement plus lancée par `npm run start`. Son traitement de données est coûteux et ralentissait toutes les autres applications.

Après une installation ou une mise à jour de la carte, construire ses fichiers une seule fois :

```bash
npm run build:golarion-map
```

Ensuite, la lancer dans son propre terminal ou sa propre session `tmux` :

```bash
npm run map
```

Cette commande sert directement le build sur le port `4204` sans démarrer Vite ni recalculer les ressources. Pour modifier activement le code de la carte, utiliser `npm run map:dev` à la place.

## Vérifications locales

Après `npm run start` dans un terminal et `npm run map` dans un autre :

```bash
curl -I http://127.0.0.1:4203
curl -I http://127.0.0.1:4204/mj
curl -k -I --resolve admin.l7r.fr:443:127.0.0.1 https://admin.l7r.fr/
curl -k -I --resolve map.l7r.fr:443:127.0.0.1 https://map.l7r.fr/mj
curl -k -I --resolve map.l7r.fr:443:127.0.0.1 https://map.l7r.fr/pj
```

Si `4204` ne répond pas, vérifier que le dossier des ressources Golarion est disponible et renseigner `GOLARION_MAP_ASSETS_DIR` dans le `.env` du NAS.
